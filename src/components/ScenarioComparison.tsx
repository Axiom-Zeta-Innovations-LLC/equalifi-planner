/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SavedPlan, HouseholdProfile, CashFlow, Debt, AssetAccount, EducationGoal, FinancialProtection, RiskQuestionnaire } from '../types';
import { calculateFIN, projectAssets, amortizeDebts, calculateRequiredMonthlyContribution } from '../utils/calculations';
import { Sparkles, Calendar, Trash2, Plus, RefreshCw, FileText } from 'lucide-react';

interface ScenarioComparisonProps {
  currentPlan: Omit<SavedPlan, 'id' | 'name' | 'timestamp'>;
  savedScenarios: SavedPlan[];
  onSaveScenario: (name: string) => void;
  onLoadScenario: (id: string) => void;
  onDeleteScenario: (id: string) => void;
}

export default function ScenarioComparison({
  currentPlan,
  savedScenarios,
  onSaveScenario,
  onLoadScenario,
  onDeleteScenario
}: ScenarioComparisonProps) {
  const [newScenarioName, setNewScenarioName] = React.useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenarioName.trim()) return;
    onSaveScenario(newScenarioName.trim());
    setNewScenarioName('');
  };

  const getPlanMetrics = (plan: Omit<SavedPlan, 'id' | 'name' | 'timestamp'>) => {
    const yearsToRetire = Math.max(1, plan.household.retirementAge - plan.household.currentAge);
    
    // Core engine parameters
    const localRet = {
      incomeMethod: 'percentage' as const,
      targetIncomePercentage: 75,
      targetIncomeCustom: plan.household.currentIncome * 0.75,
      socialSecurity: 28000,
      pension: 0,
      rentalIncome: 0,
      otherIncome: 0,
      inflation: 2.5,
      retirementTax: 15,
      legacyBalance: 100000,
      healthcareReserve: 50000,
      longTermCareReserve: 25000,
      withdrawalRateMethod: 'present_value' as const,
      withdrawalRate: 4.0
    };

    const fin = calculateFIN(plan.household, localRet, yearsToRetire);
    const assetsProj = projectAssets(plan.assets, yearsToRetire, plan.household.currentIncome, plan.household.incomeGrowth);
    const debtsProj = amortizeDebts(plan.debts, plan.debtMethod, plan.releasedAction, plan.releasedReinvestPercent, 0);

    const requiredContrib = calculateRequiredMonthlyContribution(
      fin.finPresentValue,
      assetsProj.totalCurrentBalance,
      7.0,
      yearsToRetire
    );

    return {
      retAge: plan.household.retirementAge,
      finTarget: fin.finPresentValue,
      projAssets: assetsProj.projectedBalanceWithFee,
      reqMonthly: requiredContrib,
      debtFreeDate: debtsProj.schedule[debtsProj.schedule.length - 1]?.dateStr || 'N/A',
      interestPaid: debtsProj.totalInterestPaidAll
    };
  };

  const currentMetrics = React.useMemo(() => {
    return getPlanMetrics(currentPlan);
  }, [currentPlan]);

  return (
    <div id="scenarios-container" className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Step 10: Scenario Comparison Matrix
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Save different versions of your planning rules (e.g., higher savings, postponing retirement) and compare their financial outcomes side-by-side.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: Save current setup */}
        <div className="space-y-4">
          <form onSubmit={handleSave} className="glass-panel-subtle p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1">
              <Plus className="w-4 h-4 text-blue-600" />
              Save Active Setup as Scenario
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Scenario Label</label>
              <input
                type="text"
                required
                className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="e.g. Save $200 more / Retire Later"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer shadow-xs"
            >
              Save Scenario Plan
            </button>
          </form>

          {/* List of saved scenarios */}
          {savedScenarios.length > 0 && (
            <div className="glass-panel-subtle rounded-xl overflow-hidden">
              <div className="p-3 bg-zinc-100/60 border-b border-zinc-200/60">
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Saved Scenarios ({savedScenarios.length})</span>
              </div>
              <div className="divide-y divide-zinc-200/50">
                {savedScenarios.map(s => (
                  <div key={s.id} className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 block">{s.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono block">Saved: {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onLoadScenario(s.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold bg-blue-50/80 hover:bg-blue-100 px-2 py-1 rounded-md transition-all cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteScenario(s.id)}
                        className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Comparison Matrix */}
        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 bg-zinc-100/60 border-b border-zinc-200/60 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Comparative Planning Matrix</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-zinc-100/40 border-b border-zinc-200/60 text-zinc-600 text-[10px] font-bold uppercase">
                <tr>
                  <th className="p-3">Planning Parameters</th>
                  <th className="p-3 bg-blue-50/50 text-blue-900">Active Setup (Now)</th>
                  {savedScenarios.map(s => (
                    <th key={s.id} className="p-3 text-zinc-800 max-w-[120px] truncate">{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 font-medium">
                <tr>
                  <td className="p-3 font-semibold">Target Retirement Age</td>
                  <td className="p-3 bg-blue-50/20 font-mono font-bold text-blue-800">{currentMetrics.retAge} yrs</td>
                  {savedScenarios.map(s => {
                    const m = getPlanMetrics(s);
                    return <td key={s.id} className="p-3 font-mono">{m.retAge} yrs</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Required FIN Target</td>
                  <td className="p-3 bg-blue-50/20 font-mono font-bold text-blue-800">${Math.round(currentMetrics.finTarget).toLocaleString()}</td>
                  {savedScenarios.map(s => {
                    const m = getPlanMetrics(s);
                    return <td key={s.id} className="p-3 font-mono">${Math.round(m.finTarget).toLocaleString()}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Projected Net Balance</td>
                  <td className="p-3 bg-blue-50/20 font-mono font-bold text-blue-800">${Math.round(currentMetrics.projAssets).toLocaleString()}</td>
                  {savedScenarios.map(s => {
                    const m = getPlanMetrics(s);
                    return <td key={s.id} className="p-3 font-mono">${Math.round(m.projAssets).toLocaleString()}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Required Monthly Savings</td>
                  <td className="p-3 bg-blue-50/20 font-mono font-bold text-blue-600">${Math.round(currentMetrics.reqMonthly).toLocaleString()}</td>
                  {savedScenarios.map(s => {
                    const m = getPlanMetrics(s);
                    return <td key={s.id} className="p-3 font-mono text-blue-800">${Math.round(m.reqMonthly).toLocaleString()}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Liability Payoff Date</td>
                  <td className="p-3 bg-blue-50/20 font-mono font-bold text-blue-800">{currentMetrics.debtFreeDate}</td>
                  {savedScenarios.map(s => {
                    const m = getPlanMetrics(s);
                    return <td key={s.id} className="p-3 font-mono">{m.debtFreeDate}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Total Staged Interest</td>
                  <td className="p-3 bg-blue-50/20 font-mono font-bold text-blue-800">${Math.round(currentMetrics.interestPaid).toLocaleString()}</td>
                  {savedScenarios.map(s => {
                    const m = getPlanMetrics(s);
                    return <td key={s.id} className="p-3 font-mono">${Math.round(m.interestPaid).toLocaleString()}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
