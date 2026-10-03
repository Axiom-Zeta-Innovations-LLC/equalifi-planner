/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  calculateFV,
  calculateFVOfContributions,
  calculateRequiredMonthlyContribution,
  calculateRealReturn,
  calculateFIN,
  amortizeDebts,
  calculateInsuranceNeeds,
  scoreRiskQuestionnaire
} from './calculations';
import {
  HouseholdProfile,
  RetirementLifestyle,
  Debt,
  FinancialProtection,
  RiskQuestionnaire
} from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    passed++;
  }
}

function test(name: string, fn: () => void) {
  console.log(`\n🏃 Running Test: ${name}`);
  try {
    fn();
    console.log(`✅ Passed: ${name}`);
  } catch (err: any) {
    console.error(`❌ Failed: ${name}\n`, err.message || err);
  }
}

// 1. Basic Financial Formulas Tests
test('calculateFV - basic compounding', () => {
  // PV = $10,000, 5% annual return, 10 years, monthly compounding
  const fv = calculateFV(10000, 5, 10);
  // FV = 10000 * (1 + 0.05/12)^(12*10) ≈ 16470.09
  assert(Math.abs(fv - 16470.09) < 1.0, `FV should be approx $16,470, got $${fv.toFixed(2)}`);
  
  // Test 0 years
  assert(calculateFV(5000, 7, 0) === 5000, 'FV with 0 years should equal PV');
});

test('calculateFVOfContributions - monthly annuity', () => {
  // $500 monthly, 6% annual return, 5 years, beginning of period (default)
  const fv = calculateFVOfContributions(500, 6, 5, true);
  // Expected standard FV with monthly compounding ≈ $35,059.44
  assert(Math.abs(fv - 35059.44) < 5.0, `FV of contributions should be approx $35,059, got $${fv.toFixed(2)}`);
  
  // Test 0 years
  assert(calculateFVOfContributions(500, 6, 0) === 0, 'FV of contributions with 0 years should be 0');
});

test('calculateRequiredMonthlyContribution - target matching', () => {
  // Reach $100,000 in 10 years with $10,000 starting balance at 7% return
  const req = calculateRequiredMonthlyContribution(100000, 10000, 7, 10);
  // Future value of $10,000 at 7% over 10 years ≈ $20,096.61
  // Gap to fill = $79,903.39
  // Monthly payment required to grow to $79,903.39 at 7% over 10 years ≈ $458.97 (beginning of period)
  assert(Math.abs(req - 458.97) < 2.0, `Required monthly savings should be approx $458.97, got $${req.toFixed(2)}`);
});

test('calculateRealReturn - inflation-adjusted returns', () => {
  const realReturn = calculateRealReturn(8, 3);
  // ((1 + 0.08) / (1 + 0.03)) - 1 ≈ 4.854%
  assert(Math.abs(realReturn - 4.854) < 0.01, `Real return should be approx 4.854%, got ${realReturn.toFixed(3)}%`);
});

// 2. FIN Engine Tests
test('calculateFIN - retirement target estimation', () => {
  const profile: HouseholdProfile = {
    name: 'Taylor Family',
    currentAge: 35,
    hasSpouse: false,
    spouseAge: 0,
    retirementAge: 65,
    spouseRetirementAge: 0,
    lifeExpectancy: 90, // 25 years of retirement
    filingStatus: 'single',
    dependentsCount: 0,
    dependents: [],
    stateOfResidence: 'CA',
    currentIncome: 100000,
    incomeGrowth: 3,
    marginalTaxRate: 22
  };

  const lifestyle: RetirementLifestyle = {
    incomeMethod: 'percentage',
    targetIncomePercentage: 80, // Needs $80,000 today's dollars
    targetIncomeCustom: 0,
    socialSecurity: 20000, // SS offset of $20,000 today's dollars
    pension: 0,
    rentalIncome: 0,
    otherIncome: 0,
    inflation: 2.5, // 30 years inflation
    retirementTax: 15,
    legacyBalance: 100000, // Today's dollars legacy
    healthcareReserve: 50000,
    longTermCareReserve: 0,
    withdrawalRateMethod: 'present_value',
    withdrawalRate: 4.0
  };

  const result = calculateFIN(profile, lifestyle, 30);
  
  // Future Spending = 80000 * 1.025^30 ≈ $167,805.80
  assert(Math.abs(result.desiredAnnualSpendingFuture - 167805.80) < 5.0, 'Incorrect inflation-adjusted future spending');
  
  // Future SS = 20000 * 1.025^30 ≈ $41,951.45
  assert(Math.abs(result.reliableIncomeFuture - 41951.45) < 5.0, 'Incorrect inflation-adjusted future reliable income');
  
  // Portfolio income needed = $167,805.80 - $41,951.45 = $125,854.35
  assert(Math.abs(result.portfolioIncomeNeeded - 125854.35) < 5.0, 'Incorrect portfolio income needed calculation');
});

// 3. Debt Amortization Tests
test('amortizeDebts - stack rollover payoff comparison', () => {
  const debts: Debt[] = [
    {
      id: 'cc-1',
      name: 'Credit Card 1',
      type: 'credit_card',
      balance: 5000,
      apr: 18,
      minPayment: 150,
      extraPayment: 0,
      priority: 1
    },
    {
      id: 'car-1',
      name: 'Car Loan',
      type: 'auto_loan',
      balance: 10000,
      apr: 6,
      minPayment: 250,
      extraPayment: 0,
      priority: 2
    }
  ];

  // Amortize under minimums only
  const minOnly = amortizeDebts(debts, 'minimums', 'discretionary', 0, 0);
  // Amortize with Avalanche + $200 extra budget
  const avalancheResult = amortizeDebts(debts, 'avalanche', 'reinvest_all', 100, 200);

  assert(avalancheResult.totalMonthsToDebtFree < minOnly.totalMonthsToDebtFree, 'Rollover stack should speed up payoff timeline');
  assert(avalancheResult.totalInterestPaidAll < minOnly.totalInterestPaidAll, 'Rollover stack should reduce interest costs');
});

// 4. Financial Protection Tests
test('calculateInsuranceNeeds - coverage gap identification', () => {
  const profile: HouseholdProfile = {
    name: 'Taylor',
    currentAge: 30,
    hasSpouse: false,
    spouseAge: 0,
    retirementAge: 65,
    spouseRetirementAge: 0,
    lifeExpectancy: 85,
    filingStatus: 'single',
    dependentsCount: 2,
    dependents: [{ id: '1', age: 2 }, { id: '2', age: 4 }],
    stateOfResidence: 'TX',
    currentIncome: 80000,
    incomeGrowth: 3,
    marginalTaxRate: 15
  };

  const protection: FinancialProtection = {
    incomeReplacementYears: 10, // $800,000 need
    mortgageBalance: 200000, // Total $1,000,000
    funeralExpenses: 15000, // Total $1,015,000
    existingLifeInsurance: 150000,
    availableSurvivorAssets: 50000,
    employerProvidedCoverage: 80000, // Total coverage = 280,000
    currentPremium: 1200,
    hypotheticalPremium: 400,
    premiumDifferenceReturn: 7.0
  };

  const result = calculateInsuranceNeeds(profile, protection, 35);
  
  // Total Needs = 800,000 + 200,000 + 15,000 = 1,015,000
  assert(result.totalNeeds === 1015000, `Total needs should be $1,015,000, got $${result.totalNeeds}`);
  
  // Coverage Gap = 1,015,000 - 280,000 = 735,000
  assert(result.coverageGap === 735000, `Coverage gap should be $735,000, got $${result.coverageGap}`);
  
  // Premium difference of $800 annual ($66.67 monthly) over 35 years at 7% ≈ $118,500+
  assert(result.investedDifferenceFV > 100000, `Invested premium diff future value should compound, got $${result.investedDifferenceFV.toFixed(2)}`);
});

// 5. Risk Scoring Tests
test('scoreRiskQuestionnaire - asset allocation mapping', () => {
  const risk: RiskQuestionnaire = {
    timeHorizon: 5,
    experience: 4,
    incomeStability: 5,
    emergencyReserves: 5,
    reactionToDecline: 4,
    maxLossTolerable: 4,
    shortTermAccess: 1, // High capacity
    portfolioDependence: 1, // High capacity
    willingnessScore: 0,
    capacityScore: 0,
    overrideModel: false,
    selectedModelOverride: ''
  };

  const scored = scoreRiskQuestionnaire(risk);
  
  assert(scored.willingnessScore >= 70, `Willingness score should be high, got ${scored.willingnessScore}`);
  assert(scored.capacityScore >= 80, `Capacity score should be high, got ${scored.capacityScore}`);
  assert(scored.recommendedKey === 'aggressive' || scored.recommendedKey === 'growth', `Recommended key should be growth oriented, got ${scored.recommendedKey}`);
});

console.log('\n--- UNIT TEST SUMMARY ---');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All calculations formulas are mathematically verified & unit tests are GREEN!');
  process.exit(0);
}
