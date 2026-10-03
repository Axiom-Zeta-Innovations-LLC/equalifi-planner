/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HouseholdProfile,
  CashFlow,
  Debt,
  DebtPayoffMethod,
  ReleasedDebtAction,
  RetirementLifestyle,
  AssetAccount,
  EducationGoal,
  FinancialProtection,
  RiskQuestionnaire,
  AssetAllocationModel
} from '../types';

// ==========================================
// 1. BASIC FINANCIAL FORMULAS
// ==========================================

/**
 * Calculates the future value of a single present sum
 * FV = PV * (1 + r)^t
 */
export function calculateFV(pv: number, annualRate: number, years: number, compoundingPeriods = 12): number {
  if (years <= 0) return pv;
  const r = annualRate / 100;
  return pv * Math.pow(1 + r / compoundingPeriods, compoundingPeriods * years);
}

/**
 * Calculates the future value of a stream of monthly payments
 * PMT * [((1 + r/12)^(12*t) - 1) / (r/12)]
 */
export function calculateFVOfContributions(
  pmt: number,
  annualRate: number,
  years: number,
  beginningOfPeriod = true
): number {
  if (years <= 0) return 0;
  const r = annualRate / 100;
  const ratePerPeriod = r / 12;
  const totalPeriods = years * 12;

  if (ratePerPeriod === 0) {
    return pmt * totalPeriods;
  }

  const factor = (Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod;
  const fv = pmt * factor;

  return beginningOfPeriod ? fv * (1 + ratePerPeriod) : fv;
}

/**
 * Calculates the required monthly contribution to reach a target
 * PMT = Target * (r/12) / ((1 + r/12)^(12*t) - 1)
 */
export function calculateRequiredMonthlyContribution(
  target: number,
  currentBalance: number,
  annualRate: number,
  years: number,
  beginningOfPeriod = true
): number {
  if (years <= 0) return 0;
  const r = annualRate / 100;
  const ratePerPeriod = r / 12;
  const totalPeriods = years * 12;

  // Subtract future value of current balance first
  const fvCurrent = calculateFV(currentBalance, annualRate, years);
  const gap = Math.max(0, target - fvCurrent);

  if (gap <= 0) return 0;

  if (ratePerPeriod === 0) {
    return gap / totalPeriods;
  }

  let factor = (Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod;
  if (beginningOfPeriod) {
    factor *= (1 + ratePerPeriod);
  }

  return gap / factor;
}

/**
 * Real rate of return adjusted for inflation
 * ((1 + nominal) / (1 + inflation)) - 1
 */
export function calculateRealReturn(nominalRate: number, inflationRate: number): number {
  const n = nominalRate / 100;
  const i = inflationRate / 100;
  if (i === -1) return n; // Avoid division by zero
  return ((1 + n) / (1 + i) - 1) * 100;
}

// ==========================================
// 2. RETIREMENT LIFESTYLE & FIN ENGINE
// ==========================================

export interface FINResult {
  finWithdrawalRate: number;
  finPresentValue: number;
  finScenarioLow: number;
  finScenarioMid: number;
  finScenarioHigh: number;
  portfolioIncomeNeeded: number;
  desiredAnnualSpendingFuture: number;
  reliableIncomeFuture: number;
}

/**
 * Calculates the Financial Independence Number (FIN) and portfolio metrics
 */
export function calculateFIN(
  household: HouseholdProfile,
  lifestyle: RetirementLifestyle,
  yearsToRetire: number
): FINResult {
  const yearsInRet = Math.max(1, household.lifeExpectancy - household.retirementAge);
  const inflationDec = lifestyle.inflation / 100;

  // 1. Calculate future desired annual spending (adjusted for inflation)
  let desiredAnnualSpendingToday = 0;
  if (lifestyle.incomeMethod === 'percentage') {
    desiredAnnualSpendingToday = household.currentIncome * (lifestyle.targetIncomePercentage / 100);
  } else {
    desiredAnnualSpendingToday = lifestyle.targetIncomeCustom;
  }

  // Adjust annual spending to retirement date
  const desiredAnnualSpendingFuture = desiredAnnualSpendingToday * Math.pow(1 + inflationDec, yearsToRetire);

  // 2. Adjust reliable retirement income sources to retirement date (assuming they are in today's dollars)
  const socialSecurityFuture = lifestyle.socialSecurity * Math.pow(1 + inflationDec, yearsToRetire);
  const pensionFuture = lifestyle.pension * Math.pow(1 + inflationDec, yearsToRetire);
  const rentalIncomeFuture = lifestyle.rentalIncome * Math.pow(1 + inflationDec, yearsToRetire);
  const otherIncomeFuture = lifestyle.otherIncome * Math.pow(1 + inflationDec, yearsToRetire);

  const reliableIncomeFuture = socialSecurityFuture + pensionFuture + rentalIncomeFuture + otherIncomeFuture;

  // 3. Portfolio income needed in the first year of retirement
  const portfolioIncomeNeeded = Math.max(0, desiredAnnualSpendingFuture - reliableIncomeFuture);

  // --- METHOD 1: Withdrawal Rate Method ---
  // FIN = First Year Portfolio Income / Withdrawal Rate + Legacy Target + Healthcare Reserve
  const wrDec = (lifestyle.withdrawalRate || 4.0) / 100;
  const legacyFuture = lifestyle.legacyBalance * Math.pow(1 + inflationDec, yearsToRetire);
  const healthcareReserveFuture = lifestyle.healthcareReserve * Math.pow(1 + inflationDec, yearsToRetire);
  const ltcReserveFuture = (lifestyle.longTermCareReserve || 0) * Math.pow(1 + inflationDec, yearsToRetire);

  const finWithdrawalRate = portfolioIncomeNeeded / (wrDec > 0 ? wrDec : 0.04) +
    legacyFuture +
    healthcareReserveFuture +
    ltcReserveFuture;

  // --- METHOD 2: Present Value Retirement-Income Method ---
  // Calculates the present value of an inflation-adjusted stream of withdrawals
  // Real return during retirement = (1 + nominal_return) / (1 + inflation) - 1
  // We assume a balanced retirement portfolio return of e.g. 5% nominal during retirement.
  // Let's use a conservative nominal return during retirement of 6% gross, or adjusted by tax.
  const nominalRetirementReturn = Math.max(0, 6.0 - (lifestyle.retirementTax || 15) * 0.06);
  const realRetirementReturn = calculateRealReturn(nominalRetirementReturn, lifestyle.inflation);
  const g = realRetirementReturn / 100;

  let pvOfAnnuity = 0;
  if (g === 0) {
    pvOfAnnuity = portfolioIncomeNeeded * yearsInRet;
  } else {
    // PV = PMT * [1 - (1+g)^-n] / g
    pvOfAnnuity = portfolioIncomeNeeded * (1 - Math.pow(1 + g, -yearsInRet)) / g;
  }

  const finPresentValue = pvOfAnnuity + legacyFuture + healthcareReserveFuture + ltcReserveFuture;

  // --- METHOD 3: Scenario-Range Method ---
  // Low (Conservative), Mid (Baseline), High (Optimistic)
  // Low assumes poorer return / higher inflation during retirement, Mid is standard, High is optimistic.
  const makeScenarioFIN = (retNomReturn: number, inf: number) => {
    const netRetReturn = Math.max(0, retNomReturn - (lifestyle.retirementTax || 15) * (retNomReturn / 100));
    const rReal = calculateRealReturn(netRetReturn, inf) / 100;
    const portfolioIncFut = Math.max(0, (desiredAnnualSpendingToday * Math.pow(1 + inf / 100, yearsToRetire)) -
      ((lifestyle.socialSecurity + lifestyle.pension + lifestyle.rentalIncome + lifestyle.otherIncome) * Math.pow(1 + inf / 100, yearsToRetire)));

    const legFut = lifestyle.legacyBalance * Math.pow(1 + inf / 100, yearsToRetire);
    const hcFut = (lifestyle.healthcareReserve + (lifestyle.longTermCareReserve || 0)) * Math.pow(1 + inf / 100, yearsToRetire);

    const pvAnn = rReal === 0 ? portfolioIncFut * yearsInRet : portfolioIncFut * (1 - Math.pow(1 + rReal, -yearsInRet)) / rReal;
    return pvAnn + legFut + hcFut;
  };

  const finScenarioLow = makeScenarioFIN(4.5, 3.5);  // High inflation, poor return
  const finScenarioMid = finPresentValue;            // Baseline (6.0% nominal, default inflation)
  const finScenarioHigh = makeScenarioFIN(7.5, 2.0); // Low inflation, strong return

  return {
    finWithdrawalRate,
    finPresentValue,
    finScenarioLow,
    finScenarioMid,
    finScenarioHigh,
    portfolioIncomeNeeded,
    desiredAnnualSpendingFuture,
    reliableIncomeFuture
  };
}

// ==========================================
// 3. DEBT AMORTIZATION ENGINE
// ==========================================

export interface DebtPaymentMonth {
  month: number;
  dateStr: string;
  balances: { [debtId: string]: number };
  payments: { [debtId: string]: number };
  interestPaid: { [debtId: string]: number };
  totalRemaining: number;
  totalPayment: number;
}

export interface DebtPayoffSummary {
  payoffMonths: { [debtId: string]: number };
  payoffDates: { [debtId: string]: string };
  totalInterestPaid: { [debtId: string]: number };
  interestSaved: { [debtId: string]: number };
  totalMonthsToDebtFree: number;
  totalInterestPaidAll: number;
  totalInterestPaidAllMinimums: number;
  timeSavedMonths: number;
  schedule: DebtPaymentMonth[];
  releasedCashFlowSchedule: { month: number; cashReleased: number }[];
}

/**
 * High-precision debt amortization engine
 */
export function amortizeDebts(
  debts: Debt[],
  method: DebtPayoffMethod,
  releasedAction: ReleasedDebtAction,
  releasedReinvestPercent: number,
  extraMonthlyBudget: number,
  startDate = new Date()
): DebtPayoffSummary {
  if (debts.length === 0) {
    return {
      payoffMonths: {},
      payoffDates: {},
      totalInterestPaid: {},
      interestSaved: {},
      totalMonthsToDebtFree: 0,
      totalInterestPaidAll: 0,
      totalInterestPaidAllMinimums: 0,
      timeSavedMonths: 0,
      schedule: [],
      releasedCashFlowSchedule: []
    };
  }

  // --- 1. MINIMUMS ONLY BASELINE ---
  // Let's first calculate how long and how much interest it takes using ONLY minimum payments
  const minPayoffMonths: { [id: string]: number } = {};
  const minTotalInterest: { [id: string]: number } = {};
  let maxMinMonths = 0;
  let totalMinInterestAll = 0;

  for (const d of debts) {
    let bal = d.balance;
    const rate = d.apr / 100 / 12;
    let months = 0;
    let totalInterest = 0;
    const minP = d.minPayment;

    // Check if min payment covers interest
    if (bal > 0 && minP <= bal * rate) {
      // payment cannot amortize debt!
      minPayoffMonths[d.id] = 1200; // Cap at 100 years
      minTotalInterest[d.id] = bal * rate * 1200;
    } else {
      while (bal > 0 && months < 1200) {
        months++;
        const interest = bal * rate;
        totalInterest += interest;
        const pmt = Math.min(bal + interest, minP);
        bal = bal + interest - pmt;
      }
      minPayoffMonths[d.id] = months;
      minTotalInterest[d.id] = totalInterest;
    }
    maxMinMonths = Math.max(maxMinMonths, minPayoffMonths[d.id]);
    totalMinInterestAll += minTotalInterest[d.id];
  }

  // --- 2. ACTIVE AMORTIZATION WITH STACKING ---
  // Order active debts according to payoff strategy
  const getSortedDebts = (): Debt[] => {
    const list = [...debts];
    if (method === 'avalanche') {
      return list.sort((a, b) => b.apr - a.apr);
    } else if (method === 'snowball') {
      return list.sort((a, b) => a.balance - b.balance);
    } else if (method === 'priority') {
      return list.sort((a, b) => a.priority - b.priority);
    }
    // 'minimums' or default
    return list;
  };

  const sortedDebts = getSortedDebts();
  const activeBalances = debts.reduce((acc, d) => ({ ...acc, [d.id]: d.balance }), {} as { [id: string]: number });
  const payoffMonths: { [id: string]: number } = {};
  const totalInterestPaid: { [id: string]: number } = {};
  debts.forEach(d => {
    payoffMonths[d.id] = 0;
    totalInterestPaid[d.id] = 0;
  });

  const schedule: DebtPaymentMonth[] = [];
  let monthCount = 0;
  let accumulatedExtra = extraMonthlyBudget;

  const totalMinPayments = debts.reduce((sum, d) => sum + d.minPayment, 0);

  // Month-by-month loop
  while (monthCount < 1200) {
    const totalRemaining = Object.values(activeBalances).reduce((sum, b) => sum + b, 0);
    if (totalRemaining <= 0) break;

    monthCount++;
    const currentMonthDate = new Date(startDate.getTime());
    currentMonthDate.setMonth(startDate.getMonth() + monthCount - 1);
    const dateStr = currentMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const monthBalances: { [id: string]: number } = {};
    const monthPayments: { [id: string]: number } = {};
    const monthInterests: { [id: string]: number } = {};

    // 1. Calculate monthly interest for each debt first
    for (const d of debts) {
      const balBefore = activeBalances[d.id];
      if (balBefore > 0) {
        const interest = balBefore * (d.apr / 100 / 12);
        activeBalances[d.id] = balBefore + interest;
        monthInterests[d.id] = interest;
        totalInterestPaid[d.id] += interest;
      } else {
        monthInterests[d.id] = 0;
      }
      monthBalances[d.id] = activeBalances[d.id];
      monthPayments[d.id] = 0;
    }

    // 2. Pay minimum payments on all active debts
    let totalPaidThisMonth = 0;
    for (const d of debts) {
      const bal = activeBalances[d.id];
      if (bal > 0) {
        // Pay the minimum or the remaining balance
        const pmt = Math.min(bal, d.minPayment);
        activeBalances[d.id] = bal - pmt;
        monthPayments[d.id] = pmt;
        totalPaidThisMonth += pmt;

        if (activeBalances[d.id] <= 0 && payoffMonths[d.id] === 0) {
          payoffMonths[d.id] = monthCount;
        }
      }
    }

    // 3. Apply snowball stack extra payment to the priority active debt
    if (method !== 'minimums') {
      // Calculate what extra cash is available:
      // Starting extra budget + minimum payments of already paid off debts (released payments)
      let snowballExtra = accumulatedExtra;
      for (const d of debts) {
        if (activeBalances[d.id] <= 0) {
          snowballExtra += d.minPayment; // Released minimum payment
        }
      }

      // Apply extra payment in priority order
      for (const d of sortedDebts) {
        const bal = activeBalances[d.id];
        if (bal > 0 && snowballExtra > 0) {
          const extraPmt = Math.min(bal, snowballExtra);
          activeBalances[d.id] = bal - extraPmt;
          monthPayments[d.id] = (monthPayments[d.id] || 0) + extraPmt;
          totalPaidThisMonth += extraPmt;
          snowballExtra -= extraPmt;

          if (activeBalances[d.id] <= 0 && payoffMonths[d.id] === 0) {
            payoffMonths[d.id] = monthCount;
          }
        }
      }
    }

    schedule.push({
      month: monthCount,
      dateStr,
      balances: monthBalances,
      payments: monthPayments,
      interestPaid: monthInterests,
      totalRemaining: Object.values(activeBalances).reduce((sum, b) => sum + b, 0),
      totalPayment: totalPaidThisMonth
    });
  }

  // Calculate payoff dates and interest saved
  const payoffDates: { [id: string]: string } = {};
  const interestSaved: { [id: string]: number } = {};
  let totalInterestPaidAll = 0;

  debts.forEach(d => {
    const months = payoffMonths[d.id] || monthCount;
    const dDate = new Date(startDate.getTime());
    dDate.setMonth(startDate.getMonth() + months - 1);
    payoffDates[d.id] = dDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    interestSaved[d.id] = Math.max(0, minTotalInterest[d.id] - totalInterestPaid[d.id]);
    totalInterestPaidAll += totalInterestPaid[d.id];
  });

  const totalMonthsToDebtFree = monthCount;
  const timeSavedMonths = Math.max(0, maxMinMonths - totalMonthsToDebtFree);

  // Generate released cash flow timeline
  // When each debt gets paid off, cash is released.
  // We can model how the released cash increases month by month.
  const releasedCashFlowSchedule = Array.from({ length: totalMonthsToDebtFree }, (_, i) => {
    const m = i + 1;
    let cashReleased = 0;
    debts.forEach(d => {
      if (payoffMonths[d.id] && m >= payoffMonths[d.id]) {
        // Cash released is minimum payment + the optional extra we allocated
        cashReleased += d.minPayment;
      }
    });
    return { month: m, cashReleased };
  });

  return {
    payoffMonths,
    payoffDates,
    totalInterestPaid,
    interestSaved,
    totalMonthsToDebtFree,
    totalInterestPaidAll,
    totalInterestPaidAllMinimums: totalMinInterestAll,
    timeSavedMonths,
    schedule,
    releasedCashFlowSchedule
  };
}

// ==========================================
// 4. ASSET AND INVESTMENT GAP ANALYSIS
// ==========================================

export interface AssetProjectionResult {
  totalCurrentBalance: number;
  totalAnnualContribution: number;
  totalEmployerContribution: number;
  projectedBalanceNoFee: number;
  projectedBalanceWithFee: number;
  totalFeesPaid: number;
  fundingGap: number;
  fundingPercentage: number;
}

/**
 * Projects current asset balances and contributions to retirement age
 */
export function projectAssets(
  assets: AssetAccount[],
  yearsToRetire: number,
  householdIncome: number,
  incomeGrowth: number
): AssetProjectionResult {
  let totalCurrentBalance = 0;
  let totalAnnualContribution = 0;
  let totalEmployerContribution = 0;
  let projectedBalanceNoFee = 0;
  let projectedBalanceWithFee = 0;

  assets.forEach(a => {
    totalCurrentBalance += a.balance;
    const userAnnual = a.monthlyContribution * 12;
    totalAnnualContribution += userAnnual;

    // Calculate employer match
    // Employer matches a percentage (employerMatch) up to a limit (employerMatchLimit% of household salary)
    let empAnnual = 0;
    if (a.employerMatch > 0 && a.employerMatchLimit > 0) {
      const matchCap = householdIncome * (a.employerMatchLimit / 100) * (a.employerMatch / 100);
      const possibleMatch = userAnnual * (a.employerMatch / 100);
      empAnnual = Math.min(possibleMatch, matchCap);
    }
    totalEmployerContribution += empAnnual;

    // Project this single account
    let balNoFee = a.balance;
    let balWithFee = a.balance;
    const monthlyReturnNoFee = (a.annualReturn / 100) / 12;
    const monthlyReturnWithFee = ((a.annualReturn - a.annualFee) / 100) / 12;

    const monthlyUserContribution = a.monthlyContribution;
    const monthlyEmpContribution = empAnnual / 12;
    const totalMonthlyInput = monthlyUserContribution + monthlyEmpContribution;

    // Loop through months to simulate compounding and salary growth
    const totalMonths = yearsToRetire * 12;
    for (let m = 1; m <= totalMonths; m++) {
      // Compound existing balance
      balNoFee = balNoFee * (1 + monthlyReturnNoFee) + totalMonthlyInput;
      balWithFee = balWithFee * (1 + monthlyReturnWithFee) + totalMonthlyInput;

      // Adjust contribution for salary growth once a year
      if (m % 12 === 0 && incomeGrowth > 0) {
        // (For simplicity, we keep monthly contributions flat or model them growing with inflation.
        // Let's assume contributions are flat unless the user changes them, keeping the simulation conservative)
      }
    }

    projectedBalanceNoFee += balNoFee;
    projectedBalanceWithFee += balWithFee;
  });

  const totalFeesPaid = Math.max(0, projectedBalanceNoFee - projectedBalanceWithFee);

  return {
    totalCurrentBalance,
    totalAnnualContribution,
    totalEmployerContribution,
    projectedBalanceNoFee,
    projectedBalanceWithFee,
    totalFeesPaid,
    fundingGap: 0, // Calculated downstream relative to FIN
    fundingPercentage: 0 // Calculated downstream
  };
}

// ==========================================
// 5. EDUCATION FUNDING ENGINE
// ==========================================

export interface EducationResult {
  futureCostPerChild: number[];
  totalFutureCostAll: number;
  requiredMonthlyContribution: number;
  fundingGap: number;
  currentFundingLevel: number;
}

/**
 * Calculates future college costs and required savings rate
 */
export function calculateEducationFunding(
  goals: EducationGoal[],
  investmentReturn = 6.0
): { [childId: string]: EducationResult } & { totalRequiredMonthly: number } {
  const results: { [childId: string]: EducationResult } = {};
  let totalRequiredMonthly = 0;

  goals.forEach(g => {
    const yearsUntilStart = Math.max(0, g.startAge - g.currentAge);
    const inflationDec = g.inflationRate / 100;

    // Calculate total cost of college in future dollars
    // Cost is paid over several years starting at collegeStartAge
    let totalFutureCost = 0;
    const costsPerYear: number[] = [];

    const presentAnnualCost = g.annualTuition + g.roomAndBoard + g.booksAndOther - g.grantsScholarships;

    for (let y = 0; y < g.years; y++) {
      const inflationYears = yearsUntilStart + y;
      const costThisYear = presentAnnualCost * Math.pow(1 + inflationDec, inflationYears);
      const fundedCostThisYear = costThisYear * (g.fundingPercentage / 100);
      costsPerYear.push(fundedCostThisYear);
      totalFutureCost += fundedCostThisYear;
    }

    // Current savings future value
    const fvSavings = calculateFV(g.currentSavings, investmentReturn, yearsUntilStart);
    const fvContributions = calculateFVOfContributions(g.monthlyContribution, investmentReturn, yearsUntilStart);
    const fundingGap = Math.max(0, totalFutureCost - fvSavings - fvContributions);

    // Required monthly contribution to hit college start age
    const requiredMonthly = calculateRequiredMonthlyContribution(
      totalFutureCost,
      g.currentSavings,
      investmentReturn,
      yearsUntilStart
    );
    const requiredShortfall = Math.max(0, requiredMonthly - g.monthlyContribution);

    const currentFundingLevel = totalFutureCost > 0 
      ? Math.min(100, ((fvSavings + fvContributions) / totalFutureCost) * 100) 
      : 100;

    results[g.id] = {
      futureCostPerChild: costsPerYear,
      totalFutureCostAll: totalFutureCost,
      requiredMonthlyContribution: requiredShortfall,
      fundingGap,
      currentFundingLevel
    };

    totalRequiredMonthly += requiredShortfall;
  });

  return {
    ...results,
    totalRequiredMonthly
  } as any;
}

// ==========================================
// 6. LIFE INSURANCE NEEDS-ANALYSIS
// ==========================================

export interface InsuranceGapResult {
  incomeReplacementNeeds: number;
  totalNeeds: number;
  coverageGap: number;
  investedDifferenceFV: number;
  totalDeductions: number;
}

/**
 * Calculates estimated life insurance needs and premium investment scenario
 */
export function calculateInsuranceNeeds(
  profile: HouseholdProfile,
  needs: FinancialProtection,
  yearsToRetire: number
): InsuranceGapResult {
  // Income replacement = Annual income * Replacement years
  const incomeReplacementNeeds = profile.currentIncome * needs.incomeReplacementYears;

  // Total Needs = Income replacement + Mortgage + Debts + Education + Funeral
  const totalDebtPayoff = needs.mortgageBalance + needs.funeralExpenses; // Funeral and Mortgage
  const totalNeeds = incomeReplacementNeeds + totalDebtPayoff;

  // Coverage Gap = Total Needs - Existing Coverage - Liquid Assets
  const currentCoverage = needs.existingLifeInsurance + needs.employerProvidedCoverage + needs.availableSurvivorAssets;
  const coverageGap = Math.max(0, totalNeeds - currentCoverage);

  // Future value of investing the premium difference
  // Premium difference = Current (Permanent/high-fee) - Hypothetical Term Premium
  const premiumDiff = Math.max(0, needs.currentPremium - needs.hypotheticalPremium);
  const monthlyDiff = premiumDiff / 12;

  const investedDifferenceFV = calculateFVOfContributions(
    monthlyDiff,
    needs.premiumDifferenceReturn || 6.0,
    yearsToRetire
  );

  return {
    incomeReplacementNeeds,
    totalNeeds,
    coverageGap,
    investedDifferenceFV,
    totalDeductions: currentCoverage
  };
}

// ==========================================
// 7. RISK QUESTIONNAIRE SCORING
// ==========================================

export interface ScoredAllocation {
  score: number;
  model: AssetAllocationModel;
}

export const ALLOCATION_MODELS: { [key: string]: AssetAllocationModel } = {
  preservation: {
    name: 'Capital Preservation',
    description: 'Designed for short horizons or extremely low risk tolerance. Prioritizes principal stability over return.',
    cashEquivalents: 60,
    fixedIncome: 35,
    domesticEquities: 5,
    internationalEquities: 0,
    otherAssets: 0,
    historicalReturn: 2.5,
    historicalVolatility: 1.5
  },
  conservative: {
    name: 'Conservative',
    description: 'Focuses on capital protection with a modest allocation to equities for inflation protection.',
    cashEquivalents: 30,
    fixedIncome: 50,
    domesticEquities: 15,
    internationalEquities: 5,
    otherAssets: 0,
    historicalReturn: 4.5,
    historicalVolatility: 3.5
  },
  mod_conservative: {
    name: 'Moderately Conservative',
    description: 'A balanced blend with a slight income bias. Suitable for mid-term goals or cautious retirement investors.',
    cashEquivalents: 15,
    fixedIncome: 45,
    domesticEquities: 30,
    internationalEquities: 10,
    otherAssets: 0,
    historicalReturn: 5.5,
    historicalVolatility: 5.5
  },
  balanced: {
    name: 'Balanced',
    description: 'The classic 60/40 style allocation. Offers an even balance of growth and risk mitigation.',
    cashEquivalents: 5,
    fixedIncome: 35,
    domesticEquities: 40,
    internationalEquities: 15,
    otherAssets: 5,
    historicalReturn: 6.5,
    historicalVolatility: 7.5
  },
  growth: {
    name: 'Growth',
    description: 'Equity-heavy. Designed for long-term compounding where near-term volatility is highly tolerable.',
    cashEquivalents: 5,
    fixedIncome: 15,
    domesticEquities: 55,
    internationalEquities: 20,
    otherAssets: 5,
    historicalReturn: 7.5,
    historicalVolatility: 10.5
  },
  aggressive: {
    name: 'Aggressive Growth',
    description: 'Maximizes long-term returns. Fully exposed to equity markets with minimal safety brakes.',
    cashEquivalents: 2,
    fixedIncome: 5,
    domesticEquities: 65,
    internationalEquities: 23,
    otherAssets: 5,
    historicalReturn: 8.5,
    historicalVolatility: 14.5
  }
};

/**
 * Calculates risk scores and maps to allocation models
 * Willingness score focuses on psychological reactions
 * Capacity score focuses on time horizon and financials
 */
export function scoreRiskQuestionnaire(q: RiskQuestionnaire): {
  willingnessScore: number;
  capacityScore: number;
  recommendedKey: string;
  recommendedModel: AssetAllocationModel;
} {
  // Willingness components: experience (1-5), reactionToDecline (1-5), maxLossTolerable (1-5)
  const willingnessSum = q.experience + q.reactionToDecline + q.maxLossTolerable;
  const willingnessScore = Math.round((willingnessSum / 15) * 100);

  // Capacity components: timeHorizon (1-5), incomeStability (1-5), emergencyReserves (1-5), shortTermAccess (reversed: 6 - score), portfolioDependence (reversed)
  const capacitySum = q.timeHorizon + q.incomeStability + q.emergencyReserves + (6 - q.shortTermAccess) + (6 - q.portfolioDependence);
  const capacityScore = Math.round((capacitySum / 25) * 100);

  // Average the two for a baseline recommendation, or restrict by the lower of the two (safer)
  const finalScore = (willingnessScore + capacityScore) / 2;

  let recommendedKey = 'balanced';
  if (finalScore <= 20) recommendedKey = 'preservation';
  else if (finalScore <= 40) recommendedKey = 'conservative';
  else if (finalScore <= 60) recommendedKey = 'mod_conservative';
  else if (finalScore <= 75) recommendedKey = 'balanced';
  else if (finalScore <= 90) recommendedKey = 'growth';
  else recommendedKey = 'aggressive';

  return {
    willingnessScore,
    capacityScore,
    recommendedKey,
    recommendedModel: ALLOCATION_MODELS[recommendedKey]
  };
}

// ==========================================
// 8. SENSITIVITY MATRIX & ALTERNATIVES
// ==========================================

export interface SensitivityPoint {
  modifier: number;
  returnRate: number;
  requiredContribution: number;
  contributionGrowth: number;
}

/**
 * Returns a matrix of required contributions under return or retirement age changes
 */
export function generateSensitivityAnalysis(
  targetFIN: number,
  currentAssets: number,
  baseReturn: number,
  yearsToRetire: number
): { returnSensitivity: SensitivityPoint[]; ageSensitivity: { ageDiff: number; years: number; requiredContribution: number }[] } {
  const returnSensitivity: SensitivityPoint[] = [];
  const modifiers = [-2, -1, 0, 1, 2];

  modifiers.forEach(mod => {
    const checkRate = Math.max(0, baseReturn + mod);
    const req = calculateRequiredMonthlyContribution(targetFIN, currentAssets, checkRate, yearsToRetire);
    returnSensitivity.push({
      modifier: mod,
      returnRate: checkRate,
      requiredContribution: req,
      contributionGrowth: checkRate * 12 // illustrative value
    });
  });

  const ageSensitivity: { ageDiff: number; years: number; requiredContribution: number }[] = [];
  const ageDiffs = [-5, -2, 0, 2, 5];

  ageDiffs.forEach(diff => {
    const checkYears = Math.max(1, yearsToRetire + diff);
    const req = calculateRequiredMonthlyContribution(targetFIN, currentAssets, baseReturn, checkYears);
    ageSensitivity.push({
      ageDiff: diff,
      years: checkYears,
      requiredContribution: req
    });
  });

  return { returnSensitivity, ageSensitivity };
}
