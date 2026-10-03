/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RetirementLifestyle, HouseholdProfile } from '../types';
import { calculateFIN } from '../utils/calculations';
import { Award, Info, HelpCircle, RefreshCw, Calculator, DollarSign, Calendar } from 'lucide-react';

interface RetirementFormProps {
  retirement: RetirementLifestyle;
  household: HouseholdProfile;
  onChange: (updated: RetirementLifestyle) => void;
}

export default function RetirementForm({ retirement, household, onChange }: RetirementFormProps) {
  const yearsToRetire = Math.max(1, household.retirementAge - household.currentAge);
  const yearsInRetirement = Math.max(1, household.lifeExpectancy - household.retirementAge);

  const finData = React.useMemo(() => {
    return calculateFIN(household, retirement, yearsToRetire);
  }, [household, retirement, yearsToRetire]);

  const updateField = (field: keyof RetirementLifestyle, value: any) => {
    onChange({
      ...retirement,
      [field]: value
    });
  };

  const desiredAnnualToday = retirement.incomeMethod === 'percentage'
    ? household.currentIncome * (retirement.targetIncomePercentage / 100)
    : retirement.targetIncomeCustom;

  return (
    <div id="retirement-lifestyle-step" className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          Step 5: Retirement Lifestyle & FIN Target
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Define your target retirement lifestyle income, map stable social pensions, and estimate your target Financial Independence Number.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Spending & Income Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Retirement Income Method */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Desired Retirement Spending in Today's Dollars</h3>
            
            <div className="flex gap-2">
              {[
                { key: 'percentage', label: 'Income Percentage' },
                { key: 'custom', label: 'Custom Spending' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => updateField('incomeMethod', opt.key as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    retirement.incomeMethod === opt.key 
                      ? 'bg-blue-50/70 border-blue-600 text-blue-900 font-bold' 
                      : 'bg-white/60 border-zinc-200/80 text-zinc-600 hover:bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {retirement.incomeMethod === 'percentage' ? (
              <div className="space-y-2 p-3 bg-white/50 backdrop-blur-xs border border-zinc-200/80 rounded-lg">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Desired income rate:</span>
                  <span className="font-bold font-mono text-emerald-600">{retirement.targetIncomePercentage}% of gross income</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="120"
                  step="5"
                  className="w-full accent-blue-600 cursor-pointer"
                  value={retirement.targetIncomePercentage}
                  onChange={(e) => updateField('targetIncomePercentage', parseInt(e.target.value) || 70)}
                />
                <div className="flex justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-200 mt-2">
                  <span>Annual retirement spending today:</span>
                  <span className="font-bold font-mono text-zinc-800">${Math.round(desiredAnnualToday).toLocaleString()}/yr</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-600">Custom Desired Annual Spending ($ / Yr in Today's Dollars)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.targetIncomeCustom || ''}
                  onChange={(e) => updateField('targetIncomeCustom', parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>

          {/* Social Security & Non-Portfolio Incomes */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1">
              Stable Retirement Non-Portfolio Income Sources
              <span className="group relative cursor-pointer text-zinc-400 hover:text-zinc-600">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-10 font-normal leading-normal">
                  Incomes like Social Security, pensions, and rental real estate reduce the portfolio withdrawals required to support your lifestyle.
                </span>
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Social Security (Annual Total, Today's $)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.socialSecurity || ''}
                  onChange={(e) => updateField('socialSecurity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Pension Income (Annual, Today's $)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.pension || ''}
                  onChange={(e) => updateField('pension', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Rental Income (Annual Net, Today's $)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.rentalIncome || ''}
                  onChange={(e) => updateField('rentalIncome', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Other Recurring Income (Annual, Today's $)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.otherIncome || ''}
                  onChange={(e) => updateField('otherIncome', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Assumptions & Reserves */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Modeling Assumptions & Inflation Reserves</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Inflation Assumption (% / Year)</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  step="0.1"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.inflation}
                  onChange={(e) => updateField('inflation', parseFloat(e.target.value) || 2.5)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Est. Retirement Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.retirementTax}
                  onChange={(e) => updateField('retirementTax', parseInt(e.target.value) || 15)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Withdrawal Rate Method Selection</label>
                <select
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.withdrawalRateMethod}
                  onChange={(e) => updateField('withdrawalRateMethod', e.target.value as any)}
                >
                  <option value="fixed_rate">Fixed Withdrawal Rate</option>
                  <option value="present_value">Annuity Present Value Method</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-zinc-200/60">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Desired Legacy Balance (Today's $)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.legacyBalance || ''}
                  onChange={(e) => updateField('legacyBalance', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 100000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Healthcare Reserve ($)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.healthcareReserve || ''}
                  onChange={(e) => updateField('healthcareReserve', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 50000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1 flex items-center gap-0.5">
                  LTC Reserve ($)
                  <span className="group relative cursor-pointer text-zinc-400 hover:text-zinc-600">
                    <HelpCircle className="w-3" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-zinc-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md font-normal leading-normal">
                      Optional long-term care medical reserve fund dedicated for nursing or home care.
                    </span>
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={retirement.longTermCareReserve || ''}
                  onChange={(e) => updateField('longTermCareReserve', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 25000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Dashboard */}
        <div className="space-y-6">
          <div className="glass-panel-dark text-white p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-emerald-400">Target FIN Results</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Retirement Duration:</span>
                <span className="text-sm font-bold font-mono text-white">{yearsInRetirement} Years</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Desired Spending (Future $):</span>
                <span className="text-sm font-bold font-mono text-white">${Math.round(finData.desiredAnnualSpendingFuture).toLocaleString()} / yr</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Pensions & SS (Future $):</span>
                <span className="text-sm font-bold font-mono text-white">${Math.round(finData.reliableIncomeFuture).toLocaleString()} / yr</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">First-Year Portfolio Draft:</span>
                <span className="text-sm font-bold font-mono text-blue-400">${Math.round(finData.portfolioIncomeNeeded).toLocaleString()} / yr</span>
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-xs text-zinc-400">Financial Independence Number (FIN):</span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1">
                  ${Math.round(retirement.withdrawalRateMethod === 'fixed_rate' ? finData.finWithdrawalRate : finData.finPresentValue).toLocaleString()}
                </span>
                <span className="text-[10px] text-zinc-400 italic mt-0.5 font-sans">
                  *This result is an educational estimate based on your assumptions.
                </span>
              </div>
            </div>
          </div>

          {/* Three methodologies breakdown */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-600" />
              Methodologies Comparison
            </h3>

            <div className="space-y-3">
              {/* Method 1 */}
              <div className="p-2.5 bg-white/50 backdrop-blur-xs border border-zinc-200/80 rounded-lg">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-800">1. Withdrawal Rate Method:</span>
                  <span className="font-bold font-mono text-zinc-900">${Math.round(finData.finWithdrawalRate).toLocaleString()}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">Withdrawal Rate:</span>
                  <select
                    className="px-1 py-0.5 border border-zinc-200 rounded-sm text-[10px] bg-white/70 font-mono text-zinc-700"
                    value={retirement.withdrawalRate}
                    onChange={(e) => updateField('withdrawalRate', parseFloat(e.target.value) || 4.0)}
                  >
                    <option value="3.0">3.0% (Ultra Conservative)</option>
                    <option value="3.5">3.5% (Conservative)</option>
                    <option value="4.0">4.0% (Classic 4% Rule)</option>
                    <option value="4.5">4.5% (Aggressive)</option>
                  </select>
                </div>
              </div>

              {/* Method 2 */}
              <div className="p-2.5 bg-emerald-50/50 border border-emerald-300/80 rounded-lg">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-emerald-900">2. Annuity Present Value Method:</span>
                  <span className="font-bold font-mono text-emerald-800">${Math.round(finData.finPresentValue).toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  Solves for the present value of an inflation-adjusted stream during retirement. Assumes a conservative 6% retirement portfolio return.
                </p>
              </div>

              {/* Method 3 */}
              <div className="p-2.5 bg-white/50 backdrop-blur-xs border border-zinc-200/80 rounded-lg space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-800 block">3. Scenario-Range (Retirement Stress Test)</span>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="bg-zinc-100 p-1.5 rounded border border-zinc-200">
                    <span className="text-zinc-800 block font-bold">Stressed</span>
                    <span className="font-mono text-zinc-950 block mt-0.5">${Math.round(finData.finScenarioLow).toLocaleString()}</span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded border border-zinc-200">
                    <span className="text-zinc-700 block font-bold">Baseline</span>
                    <span className="font-mono text-zinc-900 block mt-0.5">${Math.round(finData.finScenarioMid).toLocaleString()}</span>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded border border-emerald-200">
                    <span className="text-emerald-800 block font-bold">Optimistic</span>
                    <span className="font-mono text-emerald-950 block mt-0.5">${Math.round(finData.finScenarioHigh).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
