/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EducationGoal } from '../types';
import { calculateEducationFunding } from '../utils/calculations';
import { GraduationCap, Plus, Trash2, HelpCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface EducationFormProps {
  goals: EducationGoal[];
  onUpdateGoals: (updated: EducationGoal[]) => void;
}

export default function EducationForm({ goals, onUpdateGoals }: EducationFormProps) {
  const [newGoal, setNewGoal] = React.useState<Partial<EducationGoal>>({
    childName: '',
    currentAge: 5,
    startAge: 18,
    years: 4,
    annualTuition: 15000,
    roomAndBoard: 10000,
    booksAndOther: 1500,
    inflationRate: 4.5,
    currentSavings: 2000,
    monthlyContribution: 100,
    grantsScholarships: 2000,
    fundingPercentage: 75
  });

  const results = React.useMemo(() => {
    return calculateEducationFunding(goals);
  }, [goals]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.childName) return;

    const fullGoal: EducationGoal = {
      id: 'edu-' + Date.now(),
      childName: newGoal.childName,
      currentAge: Math.max(0, newGoal.currentAge || 0),
      startAge: Math.max(0, newGoal.startAge || 0),
      years: Math.max(1, newGoal.years || 4),
      annualTuition: Math.max(0, newGoal.annualTuition || 0),
      roomAndBoard: Math.max(0, newGoal.roomAndBoard || 0),
      booksAndOther: Math.max(0, newGoal.booksAndOther || 0),
      inflationRate: Math.max(0, newGoal.inflationRate || 0),
      currentSavings: Math.max(0, newGoal.currentSavings || 0),
      monthlyContribution: Math.max(0, newGoal.monthlyContribution || 0),
      grantsScholarships: Math.max(0, newGoal.grantsScholarships || 0),
      fundingPercentage: Math.max(0, newGoal.fundingPercentage || 0)
    };

    onUpdateGoals([...goals, fullGoal]);
    setNewGoal({
      childName: '',
      currentAge: 6,
      startAge: 18,
      years: 4,
      annualTuition: 15000,
      roomAndBoard: 10000,
      booksAndOther: 1500,
      inflationRate: 4.5,
      currentSavings: 2000,
      monthlyContribution: 100,
      grantsScholarships: 2000,
      fundingPercentage: 75
    });
  };

  const handleDeleteGoal = (id: string) => {
    onUpdateGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div id="education-funding-container" className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          Step 6: Education Funding Goals
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Plan for college or technical tuition costs. Understand the direct cash flow impact of education savings on your overall retirement readiness.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Register Goals */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleAddGoal} className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Add Dependent Education Goal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Dependent Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newGoal.childName || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, childName: e.target.value })}
                  placeholder="e.g. Leo"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Current Age</label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    className="w-full px-2 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono text-center bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={newGoal.currentAge || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, currentAge: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Start Age</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="w-full px-2 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono text-center bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={newGoal.startAge || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, startAge: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">College Years</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newGoal.years || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, years: parseInt(e.target.value) || 4 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-200/60">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Annual Tuition ($/yr today)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newGoal.annualTuition || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, annualTuition: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Room & Board ($/yr today)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newGoal.roomAndBoard || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, roomAndBoard: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Books & Supplies ($/yr today)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newGoal.booksAndOther || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, booksAndOther: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-zinc-200/60">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Expected Grants ($/yr)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newGoal.grantsScholarships || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, grantsScholarships: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Current Savings ($)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newGoal.currentSavings || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, currentSavings: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Tuition Inflation (%)</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  step="0.1"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newGoal.inflationRate}
                  onChange={(e) => setNewGoal({ ...newGoal, inflationRate: parseFloat(e.target.value) || 4.5 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1 flex items-center gap-0.5">
                  % You Want to Fund
                  <span className="group relative cursor-pointer text-zinc-400 hover:text-zinc-600">
                    <HelpCircle className="w-3" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-zinc-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md font-normal text-center leading-normal">
                      The percentage of total future college expenses your household intends to fund.
                    </span>
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newGoal.fundingPercentage}
                  onChange={(e) => setNewGoal({ ...newGoal, fundingPercentage: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer shadow-xs"
            >
              Register Education Goal
            </button>
          </form>

          {/* Goals catalog list */}
          {goals.length > 0 && (
            <div className="glass-panel-subtle rounded-xl overflow-hidden">
              <div className="p-3 bg-white/40 border-b border-zinc-200/60">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Education Goals ({goals.length})</h3>
              </div>
              <div className="divide-y divide-zinc-200/60 max-h-72 overflow-y-auto">
                {goals.map((g) => {
                  const r = results[g.id];
                  return (
                    <div key={g.id} className="p-3 flex justify-between items-center gap-3">
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-zinc-900">{g.childName}'s Education Planning</span>
                        <div className="flex flex-wrap gap-x-2 text-xs text-zinc-500">
                          <span>Tuition goal: <strong className="font-mono text-zinc-800">${Math.round(r?.totalFutureCostAll || 0).toLocaleString()}</strong></span>
                          <span>•</span>
                          <span>Required Contribution: <strong className="font-mono text-blue-600">${Math.round(r?.requiredMonthlyContribution || 0)}/mo</strong></span>
                          <span>•</span>
                          <span>Years until start: <strong className="font-mono text-zinc-800">{Math.max(0, g.startAge - g.currentAge)} yr</strong></span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(g.id)}
                        className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Educational Guidelines & Savings Impact */}
        <div className="space-y-6">
          <div className="glass-panel-dark text-white p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-blue-400 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-blue-400" />
              Retirement Primacy Warning
            </h3>
            
            <p className="text-xs text-zinc-200 leading-relaxed">
              <strong>College has financial alternatives, retirement does not.</strong>
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              When education goals compete for cash flow, you must prioritize retirement readiness. Your dependents can leverage low-cost federal student loans, scholarships, work-study programs, or community college alternatives. No bank will ever write a loan to fund your retirement years.
            </p>
            <div className="text-[10px] bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/60 text-zinc-300">
              *Never sacrifice tax-deferred retirement employer matches to fund 100% of education savings.
            </div>
          </div>

          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Educational Funding Status</h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-white/50 backdrop-blur-xs border border-zinc-200/80 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs text-zinc-600">
                  <span>Aggregated Tuition Required (Future):</span>
                  <span className="font-bold font-mono text-zinc-800">
                    ${Math.round(goals.reduce((sum, g) => sum + (results[g.id]?.totalFutureCostAll || 0), 0)).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-zinc-200 pt-2 flex justify-between items-center text-xs font-medium text-zinc-800">
                  <span>Total Savings Required:</span>
                  <span className="font-extrabold font-mono text-emerald-600">
                    ${Math.round(results.totalRequiredMonthly || 0)}/mo
                  </span>
                </div>
              </div>

              {results.totalRequiredMonthly > 0 && (
                <div className="text-xs text-zinc-500 leading-normal">
                  Allocating <strong>${Math.round(results.totalRequiredMonthly)}/mo</strong> directly reduces your monthly cash flow available for discretionary expenses and retirement assets. If this creates a monthly deficit, consider reducing the tuition funding target percentage.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
