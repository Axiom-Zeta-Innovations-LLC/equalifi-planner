/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Dependent {
  id: string;
  age: number;
}

export interface HouseholdProfile {
  name: string;
  currentAge: number;
  hasSpouse: boolean;
  spouseAge: number;
  retirementAge: number;
  spouseRetirementAge: number;
  lifeExpectancy: number;
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_household';
  dependentsCount: number;
  dependents: Dependent[];
  stateOfResidence: string;
  currentIncome: number; // annual
  incomeGrowth: number; // % annual (e.g. 3)
  marginalTaxRate: number; // % annual optional
}

export interface CashFlow {
  // Income
  primaryIncome: number;
  spouseIncome: number;
  secondaryIncome: number;

  // Essential Expenses
  housing: number;
  utilities: number;
  food: number;
  transportation: number;
  insurance: number;
  healthcare: number;
  childcare: number;
  educationExpense: number;
  minDebtPayments: number;
  otherRecurring: number;

  // Discretionary Expenses
  entertainment: number;

  // Savings
  retirementContributions: number;
  nonRetirementSavings: number;
}

export interface Debt {
  id: string;
  name: string;
  type: 'credit_card' | 'student_loan' | 'mortgage' | 'auto_loan' | 'personal_loan' | 'other';
  balance: number;
  apr: number; // % annual
  minPayment: number;
  extraPayment: number;
  priority: number; // User-defined priority
}

export type DebtPayoffMethod = 'avalanche' | 'snowball' | 'priority' | 'minimums';
export type ReleasedDebtAction = 'reinvest_all' | 'reinvest_percent' | 'discretionary' | 'split';

export interface RetirementLifestyle {
  incomeMethod: 'percentage' | 'custom' | 'budget';
  targetIncomePercentage: number; // % of final gross income (e.g. 70)
  targetIncomeCustom: number; // annual in today's dollars
  socialSecurity: number; // annual in today's dollars
  pension: number; // annual
  rentalIncome: number; // annual
  otherIncome: number; // annual
  inflation: number; // % annual (e.g. 2.5)
  retirementTax: number; // % estimated average tax in retirement (e.g. 15)
  legacyBalance: number; // desired legacy balance in today's dollars
  healthcareReserve: number; // one-time healthcare reserve in retirement
  longTermCareReserve: number; // one-time long-term care reserve (optional)
  withdrawalRateMethod: 'fixed_rate' | 'present_value' | 'scenario_range';
  withdrawalRate: number; // % (e.g. 4.0)
}

export interface AssetAccount {
  id: string;
  name: string;
  type: '401k' | '403b' | 'traditional_ira' | 'roth_ira' | 'pension' | 'taxable_brokerage' | 'savings_cd' | 'hsa' | 'annuity' | 'other';
  balance: number;
  monthlyContribution: number;
  employerMatch: number; // % of user contribution (e.g. 50% match of up to X) or flat amount
  employerMatchLimit: number; // % of salary limit (e.g. 6% of salary, or flat monthly amount)
  annualReturn: number; // % expected annual return
  annualFee: number; // % annual fee (e.g. 0.5)
  taxTreatment: 'tax-deferred' | 'tax-free' | 'taxable';
  purpose: 'retirement' | 'education' | 'emergency' | 'other';
}

export interface EducationGoal {
  id: string;
  childName: string;
  currentAge: number;
  startAge: number;
  years: number;
  annualTuition: number;
  roomAndBoard: number;
  booksAndOther: number;
  inflationRate: number;
  currentSavings: number;
  monthlyContribution: number;
  grantsScholarships: number;
  fundingPercentage: number; // % they want to cover (e.g. 50% or 100%)
}

export interface FinancialProtection {
  incomeReplacementYears: number;
  mortgageBalance: number;
  funeralExpenses: number;
  existingLifeInsurance: number;
  availableSurvivorAssets: number;
  employerProvidedCoverage: number;
  currentPremium: number; // annual existing premium
  hypotheticalPremium: number; // annual term estimate
  premiumDifferenceReturn: number; // expected return on difference
}

export interface RiskQuestionnaire {
  timeHorizon: number; // 1-5 score
  experience: number; // 1-5 score
  incomeStability: number; // 1-5 score
  emergencyReserves: number; // 1-5 score
  reactionToDecline: number; // 1-5 score
  maxLossTolerable: number; // 1-5 score
  shortTermAccess: number; // 1-5 score
  portfolioDependence: number; // 1-5 score
  willingnessScore: number; // Computed score
  capacityScore: number; // Computed score
  overrideModel: boolean;
  selectedModelOverride: string;
}

export interface AssetAllocationModel {
  name: string;
  description: string;
  cashEquivalents: number; // %
  fixedIncome: number; // %
  domesticEquities: number; // %
  internationalEquities: number; // %
  otherAssets: number; // %
  historicalReturn: number; // % illustrative
  historicalVolatility: number; // % illustrative
}

export interface ScenarioAssumption {
  id: string;
  name: string;
  annualReturn: number; // %
  volatility: number; // %
  inflation: number; // %
  fees: number; // %
  retirementTax: number; // %
  contributionGrowth: number; // %
  withdrawalRate: number; // %
}

export interface SavedPlan {
  id: string;
  name: string;
  timestamp: string;
  household: HouseholdProfile;
  cashFlow: CashFlow;
  debts: Debt[];
  debtMethod: DebtPayoffMethod;
  releasedAction: ReleasedDebtAction;
  releasedReinvestPercent: number;
  retirement: RetirementLifestyle;
  assets: AssetAccount[];
  education: EducationGoal[];
  protection: FinancialProtection;
  risk: RiskQuestionnaire;
}

export interface CalculationAuditLog {
  version: string;
  date: string;
  change: string;
  formulaDetails: string;
}
