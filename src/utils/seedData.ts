/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedPlan } from '../types';

export const FICTIONAL_SEED_PLAN: SavedPlan = {
  id: 'fictional-seed-taylor',
  name: 'Taylor Family Baseline',
  timestamp: '2026-07-18T07:42:00-07:00',
  household: {
    name: 'Taylor Family',
    currentAge: 35,
    hasSpouse: true,
    spouseAge: 34,
    retirementAge: 65,
    spouseRetirementAge: 65,
    lifeExpectancy: 90,
    filingStatus: 'married_joint',
    dependentsCount: 2,
    dependents: [
      { id: 'dep-1', age: 8 },
      { id: 'dep-2', age: 5 }
    ],
    stateOfResidence: 'Georgia',
    currentIncome: 110000,
    incomeGrowth: 3.0,
    marginalTaxRate: 22
  },
  cashFlow: {
    primaryIncome: 6000,
    spouseIncome: 3166,
    secondaryIncome: 0,
    housing: 2200,
    utilities: 350,
    food: 800,
    transportation: 600,
    insurance: 250,
    healthcare: 200,
    childcare: 400,
    educationExpense: 100,
    minDebtPayments: 500,
    otherRecurring: 300,
    entertainment: 500,
    retirementContributions: 800,
    nonRetirementSavings: 200
  },
  debts: [
    {
      id: 'debt-cc',
      name: 'Freedom Credit Card',
      type: 'credit_card',
      balance: 5500,
      apr: 19.9,
      minPayment: 150,
      extraPayment: 100,
      priority: 1
    },
    {
      id: 'debt-car',
      name: 'Family SUV Loan',
      type: 'auto_loan',
      balance: 14500,
      apr: 5.9,
      minPayment: 350,
      extraPayment: 0,
      priority: 2
    }
  ],
  debtMethod: 'avalanche',
  releasedAction: 'reinvest_percent',
  releasedReinvestPercent: 75,
  retirement: {
    incomeMethod: 'percentage',
    targetIncomePercentage: 75,
    targetIncomeCustom: 0,
    socialSecurity: 28000, // in today's dollars
    pension: 0,
    rentalIncome: 0,
    otherIncome: 0,
    inflation: 2.5,
    retirementTax: 15,
    legacyBalance: 100000,
    healthcareReserve: 50000,
    longTermCareReserve: 25000,
    withdrawalRateMethod: 'present_value',
    withdrawalRate: 4.0
  },
  assets: [
    {
      id: 'asset-401k',
      name: 'Primary Employer 401(k)',
      type: '401k',
      balance: 85000,
      monthlyContribution: 500,
      employerMatch: 50,
      employerMatchLimit: 6,
      annualReturn: 7.5,
      annualFee: 0.55,
      taxTreatment: 'tax-deferred',
      purpose: 'retirement'
    },
    {
      id: 'asset-roth',
      name: 'Spouse Roth IRA',
      type: 'roth_ira',
      balance: 22000,
      monthlyContribution: 300,
      employerMatch: 0,
      employerMatchLimit: 0,
      annualReturn: 8.0,
      annualFee: 0.25,
      taxTreatment: 'tax-free',
      purpose: 'retirement'
    },
    {
      id: 'asset-ef',
      name: 'High-Yield emergency Fund',
      type: 'savings_cd',
      balance: 12000,
      monthlyContribution: 200,
      employerMatch: 0,
      employerMatchLimit: 0,
      annualReturn: 2.0,
      annualFee: 0.0,
      taxTreatment: 'taxable',
      purpose: 'emergency'
    }
  ],
  education: [
    {
      id: 'edu-child-1',
      childName: 'Leo',
      currentAge: 8,
      startAge: 18,
      years: 4,
      annualTuition: 15000,
      roomAndBoard: 11000,
      booksAndOther: 2000,
      inflationRate: 4.0,
      currentSavings: 5000,
      monthlyContribution: 100,
      grantsScholarships: 4000,
      fundingPercentage: 75
    }
  ],
  protection: {
    incomeReplacementYears: 10,
    mortgageBalance: 245000,
    funeralExpenses: 15000,
    existingLifeInsurance: 250000,
    availableSurvivorAssets: 12000,
    employerProvidedCoverage: 110000,
    currentPremium: 1440, // standard whole-life product
    hypotheticalPremium: 420, // term premium
    premiumDifferenceReturn: 7.0
  },
  risk: {
    timeHorizon: 5, // long term
    experience: 3, // moderate
    incomeStability: 4, // stable
    emergencyReserves: 3, // average
    reactionToDecline: 2, // slightly worried
    maxLossTolerable: 3, // average loss
    shortTermAccess: 1, // no access needed
    portfolioDependence: 2, // low dependence
    willingnessScore: 53,
    capacityScore: 84,
    overrideModel: false,
    selectedModelOverride: 'growth'
  }
};
