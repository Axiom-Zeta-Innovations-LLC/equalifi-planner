/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CashFlow, HouseholdProfile, Debt } from '../types';
import { TrendingUp, HelpCircle, DollarSign, Wallet, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CashFlowFormProps {
  cashFlow: CashFlow;
  household: HouseholdProfile;
  debts: Debt[];
  onChange: (updated: CashFlow) => void;
}

export default function CashFlowForm({ cashFlow, household, debts, onChange }: CashFlowFormProps) {
  const [emergencyMonths, setEmergencyMonths] = React.useState<3 | 6 | 9 | 12>(6);

  const updateField = (field: keyof CashFlow, value: number) => {
    onChange({
      ...cashFlow,
      [field]: Math.max(0, value)
    });
  };

  // Sync debt minimum payments from Debts array
  const totalMinDebtFromList = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const activeDebtPayments = Math.max(totalMinDebtFromList, cashFlow.minDebtPayments);

  // Math calculations
  const grossMonthlyIncome = cashFlow.primaryIncome + cashFlow.spouseIncome + cashFlow.secondaryIncome;
  
  // Tax deduction estimation
  const monthlyTaxRate = (household.marginalTaxRate || 15) / 100;
  const estimatedTaxDeduction = grossMonthlyIncome * monthlyTaxRate;
  const estimatedNetMonthlyIncome = Math.max(0, grossMonthlyIncome - estimatedTaxDeduction);

  const essentialExpenses = 
    cashFlow.housing + 
    cashFlow.utilities + 
    cashFlow.food + 
    cashFlow.transportation + 
    cashFlow.insurance + 
    cashFlow.healthcare + 
    cashFlow.childcare + 
    cashFlow.educationExpense + 
    activeDebtPayments + 
    cashFlow.otherRecurring;

  const discretionaryExpenses = cashFlow.entertainment;
  const totalExpenses = essentialExpenses + discretionaryExpenses;

  const currentMonthlySavings = cashFlow.retirementContributions + cashFlow.nonRetirementSavings;
  const discretionaryCashFlow = Math.max(0, estimatedNetMonthlyIncome - totalExpenses - currentMonthlySavings);

  const savingsRate = estimatedNetMonthlyIncome > 0 ? (currentMonthlySavings / estimatedNetMonthlyIncome) * 100 : 0;
  const debtPaymentRatio = estimatedNetMonthlyIncome > 0 ? (activeDebtPayments / estimatedNetMonthlyIncome) * 100 : 0;
  const housingCostRatio = estimatedNetMonthlyIncome > 0 ? (cashFlow.housing / estimatedNetMonthlyIncome) * 100 : 0;

  // Emergency Fund Targets
  const emergencyTarget = essentialExpenses * emergencyMonths;

  return (
    <div id="cashflow-form-container" className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          Step 2: Cash Flow and Monthly Budget
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Review monthly income streams, recurring living costs, and active savings. All calculations compile instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Budget Inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Income block */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-200/60 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Monthly Cash Inflow
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Primary Monthly Income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.primaryIncome || ''}
                    onChange={(e) => updateField('primaryIncome', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              {household.hasSpouse && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Spouse Monthly Income</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                    <input
                      type="number"
                      className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      value={cashFlow.spouseIncome || ''}
                      onChange={(e) => updateField('spouseIncome', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Secondary Income / Side Hustle</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.secondaryIncome || ''}
                    onChange={(e) => updateField('secondaryIncome', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Essential Expenses block */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-200/60 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Essential Monthly Expenses (Needs)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Housing (Mortgage / Rent)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.housing || ''}
                    onChange={(e) => updateField('housing', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Utilities & Tech</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.utilities || ''}
                    onChange={(e) => updateField('utilities', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Groceries & Food</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.food || ''}
                    onChange={(e) => updateField('food', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Transportation & Gas</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.transportation || ''}
                    onChange={(e) => updateField('transportation', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Insurance Premiums</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.insurance || ''}
                    onChange={(e) => updateField('insurance', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Healthcare & Out-Of-Pocket</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.healthcare || ''}
                    onChange={(e) => updateField('healthcare', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Childcare Costs</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.childcare || ''}
                    onChange={(e) => updateField('childcare', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Active Education Expense</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.educationExpense || ''}
                    onChange={(e) => updateField('educationExpense', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Other Essential Costs</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.otherRecurring || ''}
                    onChange={(e) => updateField('otherRecurring', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
            {totalMinDebtFromList > 0 && (
              <div className="p-3 bg-white/60 backdrop-blur-xs border border-zinc-200/80 rounded-lg text-xs text-zinc-700 flex justify-between items-center">
                <span>Minimum Debt payments synced from Step 3:</span>
                <span className="font-semibold font-mono text-zinc-900">${totalMinDebtFromList.toLocaleString()} / month</span>
              </div>
            )}
          </div>

          {/* Discretionary & Savings */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-200/60 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Discretionary & Active Savings (Wants & Growth)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Entertainment & Dining</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.entertainment || ''}
                    onChange={(e) => updateField('entertainment', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Current Retirement Savings</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.retirementContributions || ''}
                    onChange={(e) => updateField('retirementContributions', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Non-Retirement Savings</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={cashFlow.nonRetirementSavings || ''}
                    onChange={(e) => updateField('nonRetirementSavings', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Analytical Panel */}
        <div className="space-y-6">
          <div className="glass-panel-dark text-white p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-emerald-400">Live Budget Analysis</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Gross Monthly Inflow:</span>
                <span className="text-sm font-bold font-mono text-zinc-100">${grossMonthlyIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Estimated Net Monthly Inflow:</span>
                <span className="text-sm font-bold font-mono text-white">${Math.round(estimatedNetMonthlyIncome).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Total Monthly Expenses:</span>
                <span className="text-sm font-bold font-mono text-zinc-200">${totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Total Active Savings:</span>
                <span className="text-sm font-bold font-mono text-emerald-400">${currentMonthlySavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-zinc-400">Unallocated Cash Flow:</span>
                <span className={`text-base font-bold font-mono ${discretionaryCashFlow > 0 ? 'text-emerald-400' : 'text-blue-400'}`}>
                  ${discretionaryCashFlow.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-xs text-zinc-300 bg-zinc-900/80 p-3 rounded-lg border border-zinc-700/60">
              <p>
                <strong>Unallocated Cash Flow</strong> represents your remaining money after budget expenses and current savings. This cash can be directed to accelerate debt repayment, fund education, or pad emergency savings.
              </p>
            </div>
          </div>

          {/* Ratios & Targets */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Target Health Ratios</h3>
            
            <div className="space-y-3">
              {/* Savings Rate */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">Net Savings Rate (Goal &gt; 15%):</span>
                  <span className={`font-semibold ${savingsRate >= 15 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {savingsRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-200/80 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${savingsRate >= 15 ? 'bg-emerald-600' : 'bg-blue-600'}`} 
                    style={{ width: `${Math.min(100, savingsRate)}%` }}
                  ></div>
                </div>
              </div>

              {/* Housing Cost Ratio */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">Housing ratio (Limit &lt; 28%):</span>
                  <span className={`font-semibold ${housingCostRatio <= 28 ? 'text-emerald-600' : 'text-zinc-700'}`}>
                    {housingCostRatio.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-200/80 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${housingCostRatio <= 28 ? 'bg-emerald-600' : 'bg-zinc-700'}`} 
                    style={{ width: `${Math.min(100, housingCostRatio)}%` }}
                  ></div>
                </div>
              </div>

              {/* Debt to Income */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">Debt to Income ratio (Limit &lt; 36%):</span>
                  <span className={`font-semibold ${debtPaymentRatio <= 36 ? 'text-emerald-600' : 'text-zinc-700'}`}>
                    {debtPaymentRatio.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-200/80 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${debtPaymentRatio <= 36 ? 'bg-emerald-600' : 'bg-zinc-700'}`} 
                    style={{ width: `${Math.min(100, debtPaymentRatio)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Fund targets */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Emergency Fund Estimator</h3>
            <p className="text-xs text-zinc-500">
              Select desired coverage based on income stability and household structure.
            </p>
            <div className="grid grid-cols-4 gap-1">
              {[3, 6, 9, 12].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEmergencyMonths(m as any)}
                  className={`py-1 text-xs font-medium rounded-md border text-center transition-all cursor-pointer ${
                    emergencyMonths === m 
                      ? 'bg-emerald-500/20 border-emerald-600 text-emerald-950 font-bold shadow-xs' 
                      : 'bg-white/60 border-zinc-200 text-zinc-600 hover:bg-white'
                  }`}
                >
                  {m} Mo
                </button>
              ))}
            </div>
            <div className="bg-white/60 backdrop-blur-xs p-2.5 rounded-lg border border-zinc-200/80 flex justify-between items-center">
              <span className="text-xs text-zinc-600">Suggested Target:</span>
              <span className="text-sm font-bold text-zinc-900 font-mono">${Math.round(emergencyTarget).toLocaleString()}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
