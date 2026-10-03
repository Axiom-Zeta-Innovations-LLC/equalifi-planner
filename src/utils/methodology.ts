/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculationAuditLog } from '../types';

export const DISCLAIMERS = [
  "This application provides educational financial projections based on user-provided information and selected assumptions. Results are estimates, not guarantees.",
  "This application does not provide individualized investment, tax, legal, insurance, or retirement advice.",
  "Investment returns vary, and loss of principal is possible.",
  "Insurance replacement can create financial, tax, and coverage risks. Do not cancel an existing policy before replacement coverage is approved and active.",
  "Consult appropriately licensed financial, tax, legal, and insurance professionals before making financial decisions."
];

export const PRIVACY_POLICY = {
  title: "Data Privacy Notice & Retention Policy",
  points: [
    "Minimal Data Collection: We collect only the numerical entries necessary to perform financial planning projections. No Social Security Numbers (SSNs), full account numbers, or bank login credentials are ever requested or stored.",
    "Guest Mode & Local Storage: By default, all entered parameters, debts, and asset values are kept purely on your local device via browser storage. Fictional examples and user scenarios do not leave your browser unless you explicitly initiate sync services.",
    "Zero Model Training: None of your inputs, profiles, or financial structures are used for machine learning or AI model training.",
    "Export-and-Delete: You can download your entire profile as a portable CSV or JSON file at any time. You can wipe your entire profile and local storage clean with a single click using the 'Wipe All Data' tool.",
    "Session Expiration: To ensure screen privacy, inactive guest sessions will automatically expire if left unattended.",
    "Administrative Audits: All calculation engine and version changes are logged publicly. No user identity is associated with mathematical formula audits."
  ]
};

export const CALCULATION_METHODOLOGY_DOC = {
  title: "Mathematical Formulas and Methodology Document",
  version: "v1.4.2",
  lastUpdated: "July 2026",
  formulas: [
    {
      name: "Future Value of Existing Assets (FV)",
      formula: "FV = PV * (1 + r / n)^(n * t)",
      variables: "PV = Present Value (Current Balance), r = Net annual expected return, n = Compounding periods per year (12, monthly), t = Years until retirement.",
      explanation: "Accounts are simulated month-by-month. The nominal return is reduced by the account's stated annual fee before compounding. Contributions are assumed at the beginning of each month."
    },
    {
      name: "Future Value of Contributions",
      formula: "FV = PMT * [((1 + r / 12)^(12 * t) - 1) / (r / 12)] * (1 + r / 12)",
      variables: "PMT = Monthly Contribution, r = Net annual return rate, t = Years until retirement.",
      explanation: "Calculates the compounded future value of recurring monthly savings. The additional term (1 + r / 12) adjusts for contributions made at the beginning of each period."
    },
    {
      name: "Financial Independence Number (FIN) - Present Value Method",
      formula: "FIN = PV_Annuity + Future_Legacy + Future_Reserves",
      variables: "PV_Annuity = Present Value of retirement income, Future_Legacy = Legacy target adjusted for inflation, Future_Reserves = Healthcare & Long-Term-Care reserves adjusted for inflation.",
      explanation: "Under the Present Value method, we calculate the exact portfolio size required at age of retirement to yield an inflation-adjusted monthly income over the retirement duration. The formula uses the real rate of return (net of retirement tax) during retirement: g = ((1 + nominal_return) / (1 + inflation)) - 1. If g > 0, PV_Annuity = Portfolio_Income * [1 - (1 + g)^-t] / g. If g = 0, PV_Annuity = Portfolio_Income * t."
    },
    {
      name: "Debt Amortization & Rollover Stack",
      formula: "Interest_Month = Balance * (APR / 12). Principal_Month = Monthly_Payment - Interest_Month.",
      variables: "Balance = Current debt principal, APR = Annual percentage rate, Monthly_Payment = Stated minimum payment + extra budget allocation.",
      explanation: "The engine runs a month-by-month simulation. Minimum payments are applied to all debts. Any surplus budget (including minimum payments from debts fully paid off) is stacked into the target debt based on the selected priority: highest APR (Avalanche), lowest balance (Snowball), or custom order."
    },
    {
      name: "Insurance Needs Analysis (D.I.M.E. Method variation)",
      formula: "Need = Income_Replacement + Debt_Payoff + Funeral_Expenses - Existing_Coverage - Available_Assets",
      variables: "Income_Replacement = Annual Income * Replacement Years, Debt_Payoff = Mortgage + other debts, Funeral_Expenses = Final costs.",
      explanation: "Determines the coverage shortfall. A secondary calculator models the financial potential of investing the 'premium savings' (existing whole life premium minus term premium) at a user-defined growth rate."
    }
  ]
};

export const METHODOLOGY_AUDIT_LOG: CalculationAuditLog[] = [
  {
    version: "v1.4.2",
    date: "2026-07-18",
    change: "Added long-term-care reserve field and custom inflation sensitivity indexes to the FIN calculations.",
    formulaDetails: "FIN Present Value calculations adjusted to compounding healthcare reserves separately from portfolio income withdrawals."
  },
  {
    version: "v1.3.0",
    date: "2026-03-10",
    change: "Improved debt amortization rollover accuracy.",
    formulaDetails: "Rolled over minimum payments from paid off debts are now applied immediately in the same month if principal remains on other debts, avoiding dragging calculations."
  },
  {
    version: "v1.2.0",
    date: "2025-11-05",
    change: "Refined real rate of return formula to use Fisher relation.",
    formulaDetails: "Real return = ((1 + nominal) / (1 + inflation)) - 1 instead of simple subtraction."
  },
  {
    version: "v1.1.0",
    date: "2025-08-20",
    change: "Initial methodology release.",
    formulaDetails: "Baseline compounding, future value of savings, and 4% withdrawal rate calculation rules established."
  }
];
