/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Debt, DebtPayoffMethod, ReleasedDebtAction } from '../types';
import { amortizeDebts } from '../utils/calculations';
import { TrendingDown, Plus, Trash2, HelpCircle, RefreshCw, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

interface DebtFormProps {
  debts: Debt[];
  method: DebtPayoffMethod;
  releasedAction: ReleasedDebtAction;
  releasedReinvestPercent: number;
  extraMonthlyBudget: number;
  onUpdateDebts: (updated: Debt[]) => void;
  onUpdateMethod: (m: DebtPayoffMethod) => void;
  onUpdateReleasedAction: (a: ReleasedDebtAction) => void;
  onUpdateReleasedPercent: (p: number) => void;
  onUpdateExtraBudget: (b: number) => void;
}

export default function DebtForm({
  debts,
  method,
  releasedAction,
  releasedReinvestPercent,
  extraMonthlyBudget,
  onUpdateDebts,
  onUpdateMethod,
  onUpdateReleasedAction,
  onUpdateReleasedPercent,
  onUpdateExtraBudget
}: DebtFormProps) {
  const [newDebt, setNewDebt] = React.useState<Partial<Debt>>({
    name: '',
    type: 'credit_card',
    balance: 5000,
    apr: 18.9,
    minPayment: 150,
    extraPayment: 0,
    priority: 1
  });

  const [warningMsg, setWarningMsg] = React.useState<string | null>(null);

  // Core Amortization Calculation
  const summary = React.useMemo(() => {
    return amortizeDebts(debts, method, releasedAction, releasedReinvestPercent, extraMonthlyBudget);
  }, [debts, method, releasedAction, releasedReinvestPercent, extraMonthlyBudget]);

  // Check if minimum payments are enough to cover monthly interest
  React.useEffect(() => {
    let badDebt = null;
    for (const d of debts) {
      const monthlyInt = d.balance * (d.apr / 100 / 12);
      if (d.balance > 0 && d.minPayment <= monthlyInt) {
        badDebt = d;
        break;
      }
    }
    if (badDebt) {
      setWarningMsg(
        `Critical: The minimum payment for "${badDebt.name}" ($${badDebt.minPayment}) is less than or equal to its monthly interest ($${Math.round(badDebt.balance * (badDebt.apr / 100 / 12))}). This debt will compound indefinitely and never be paid off under minimum payments. Please allocate additional cash or increase minimum payment.`
      );
    } else {
      setWarningMsg(null);
    }
  }, [debts]);

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebt.name) return;

    const fullDebt: Debt = {
      id: 'debt-' + Date.now(),
      name: newDebt.name,
      type: newDebt.type || 'credit_card',
      balance: Math.max(0, newDebt.balance || 0),
      apr: Math.max(0, newDebt.apr || 0),
      minPayment: Math.max(0, newDebt.minPayment || 0),
      extraPayment: Math.max(0, newDebt.extraPayment || 0),
      priority: Math.max(1, newDebt.priority || 1)
    };

    onUpdateDebts([...debts, fullDebt]);
    setNewDebt({
      name: '',
      type: 'credit_card',
      balance: 5000,
      apr: 18.9,
      minPayment: 150,
      extraPayment: 0,
      priority: debts.length + 1
    });
  };

  const handleDeleteDebt = (id: string) => {
    onUpdateDebts(debts.filter(d => d.id !== id));
  };

  const handleUpdateDebtField = (id: string, field: keyof Debt, value: any) => {
    const updated = debts.map(d => {
      if (d.id === id) {
        return { ...d, [field]: value };
      }
      return d;
    });
    onUpdateDebts(updated);
  };

  // --- SVG Paydown Visualization Amortization Chart ---
  const chartWidth = 600;
  const chartHeight = 220;
  const padding = { top: 15, right: 30, bottom: 25, left: 55 };

  const svgDataPoints = React.useMemo(() => {
    if (!summary.schedule || summary.schedule.length === 0) return [];
    
    // Sample a maximum of 40 points to avoid overloading SVG paths
    const len = summary.schedule.length;
    const step = Math.max(1, Math.ceil(len / 40));
    const points = [];
    
    for (let i = 0; i < len; i += step) {
      points.push(summary.schedule[i]);
    }
    // Always include last month if missing
    if (len > 0 && points[points.length - 1].month !== len) {
      points.push(summary.schedule[len - 1]);
    }
    return points;
  }, [summary.schedule]);

  const maxDebtBalance = React.useMemo(() => {
    if (debts.length === 0) return 10000;
    return debts.reduce((sum, d) => sum + d.balance, 0);
  }, [debts]);

  const maxMonths = React.useMemo(() => {
    return summary.totalMonthsToDebtFree || 12;
  }, [summary.totalMonthsToDebtFree]);

  const getSvgCoordinates = (m: number, bal: number) => {
    const x = padding.left + (m / maxMonths) * (chartWidth - padding.left - padding.right);
    const y = padding.top + (1 - bal / maxDebtBalance) * (chartHeight - padding.top - padding.bottom);
    return { x, y };
  };

  const paydownPath = React.useMemo(() => {
    if (svgDataPoints.length === 0) return '';
    let d = '';
    
    // Starting point (Month 0)
    const startCoord = getSvgCoordinates(0, maxDebtBalance);
    d += `M ${startCoord.x} ${startCoord.y}`;

    svgDataPoints.forEach(pt => {
      const coord = getSvgCoordinates(pt.month, pt.totalRemaining);
      d += ` L ${coord.x} ${coord.y}`;
    });
    return d;
  }, [svgDataPoints, maxDebtBalance, maxMonths]);

  return (
    <div id="debts-step-container" className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          Step 3: Debt Analysis and Rollover Stack
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Eliminate high-interest obligations. Compare standard payments with mathematical roll-up (snowball/avalanche) strategies.
        </p>
      </div>

      {warningMsg && (
        <div className="p-3 bg-zinc-100 border border-zinc-300 text-zinc-800 text-xs rounded-lg flex items-start gap-2 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>{warningMsg}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Register Debts & Repayment Strategy */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Form to Add New Debt */}
          <form onSubmit={handleAddDebt} className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Register Active Liabilities / Debts
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Debt Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newDebt.name || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                  placeholder="e.g. Visa Card"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Debt Type</label>
                <select
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newDebt.type}
                  onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value as any })}
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="student_loan">Student Loan</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="auto_loan">Car Loan</option>
                  <option value="personal_loan">Personal Loan</option>
                  <option value="other">Other Debt</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Current Balance ($)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newDebt.balance || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, balance: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">APR (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newDebt.apr || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, apr: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Minimum Payment ($/mo)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newDebt.minPayment || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, minPayment: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1 flex items-center gap-1">
                  Custom Priority
                  <span className="group relative cursor-pointer text-zinc-400 hover:text-zinc-600">
                    <HelpCircle className="w-3" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-zinc-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md font-normal">
                      Only used if priority method is selected. 1 is highest priority.
                    </span>
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newDebt.priority || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, priority: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  Add Liability
                </button>
              </div>
            </div>
          </form>

          {/* Active Debts Grid */}
          {debts.length > 0 && (
            <div className="glass-panel-subtle rounded-xl overflow-hidden">
              <div className="p-3 bg-white/40 border-b border-zinc-200/60">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Registered Liabilities ({debts.length})</h3>
              </div>
              <div className="divide-y divide-zinc-200/60 max-h-72 overflow-y-auto">
                {debts.map((d) => (
                  <div key={d.id} className="p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-zinc-900">{d.name}</span>
                      <div className="flex gap-2 text-xs text-zinc-500">
                        <span>Balance: <strong className="font-mono text-zinc-800">${d.balance.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>APR: <strong className="font-mono text-blue-600">{d.apr}%</strong></span>
                        <span>•</span>
                        <span>Min: <strong className="font-mono text-zinc-800">${d.minPayment}/mo</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs text-zinc-400 block">Est. Payoff Date</span>
                        <span className="text-xs font-bold font-mono text-zinc-800">{summary.payoffDates[d.id] || 'N/A'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDebt(d.id)}
                        className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stacking Strategies selection */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Repayment Strategy Selection</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { key: 'avalanche', title: 'Debt Avalanche', desc: 'Highest APR first. Minimizes mathematical interest.' },
                { key: 'snowball', title: 'Debt Snowball', desc: 'Lowest balance first. Boosts psychological momentum.' },
                { key: 'priority', title: 'Custom Priority', desc: 'Follows user priority weights precisely.' },
                { key: 'minimums', title: 'Minimums Only', desc: 'Baseline simulation for comparing cost difference.' }
              ].map(strat => (
                <button
                  key={strat.key}
                  type="button"
                  onClick={() => onUpdateMethod(strat.key as any)}
                  className={`p-3 text-left border rounded-xl transition-all cursor-pointer ${
                    method === strat.key 
                      ? 'bg-blue-50/70 border-blue-600 shadow-xs' 
                      : 'bg-white/60 border-zinc-200/80 hover:bg-white'
                  }`}
                >
                  <span className={`text-xs font-bold block ${method === strat.key ? 'text-blue-900' : 'text-zinc-800'}`}>
                    {strat.title}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-1 leading-normal">
                    {strat.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Extra Payment budget slider */}
            <div className="p-4 bg-white/50 backdrop-blur-xs rounded-xl border border-zinc-200/80 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide">
                  Additional Extra Debt Payment Allocation:
                </label>
                <p className="text-[11px] text-zinc-500">
                  Accelerate your path to debt freedom by allocating cash over your minimum payments.
                </p>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  className="w-full accent-blue-600 mt-2 cursor-pointer"
                  value={extraMonthlyBudget}
                  onChange={(e) => onUpdateExtraBudget(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="text-center md:border-l md:border-zinc-200 py-2">
                <span className="text-[10px] uppercase text-zinc-400 block font-bold">Extra Payment Bucket</span>
                <span className="text-2xl font-black font-mono text-blue-600">${extraMonthlyBudget}/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mathematical Impact & Rollover Destination */}
        <div className="space-y-6">
          {/* Amortization results details */}
          <div className="glass-panel-dark text-white p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-emerald-400">Strategy Output</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Months to Debt Free:</span>
                <span className="text-sm font-bold font-mono text-white">{summary.totalMonthsToDebtFree} Mo</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Total Interest Staged:</span>
                <span className="text-sm font-bold font-mono text-zinc-200">${Math.round(summary.totalInterestPaid).toLocaleString()}</span>
              </div>
              {method !== 'minimums' && (
                <>
                  <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                    <span className="text-xs text-zinc-400">Total Interest Saved:</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">${Math.round(summary.interestSaved['debt-cc'] || 0 + (summary.interestSaved['debt-car'] || 0) || summary.totalInterestPaidAllMinimums - summary.totalInterestPaidAll).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Time Accelerated:</span>
                    <span className="text-sm font-bold text-blue-400 font-mono">{summary.timeSavedMonths} Months Faster</span>
                  </div>
                </>
              )}
            </div>

            {/* Custom SVG Chart */}
            {debts.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] text-emerald-400 mb-1 flex justify-between font-bold">
                  <span>Paydown Trend</span>
                  <span>Max: ${maxDebtBalance.toLocaleString()}</span>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-lg p-2">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto text-white">
                    {/* Grid lines */}
                    <line x1={padding.left} y1={padding.top} x2={chartWidth - padding.right} y2={padding.top} stroke="#3f3f46" strokeWidth="1" />
                    <line x1={padding.left} y1={(chartHeight - padding.bottom + padding.top) / 2} x2={chartWidth - padding.right} y2={(chartHeight - padding.bottom + padding.top) / 2} stroke="#3f3f46" strokeWidth="1" />
                    <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#52525b" strokeWidth="1.5" />
                    
                    {/* Path */}
                    <path
                      d={paydownPath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />

                    {/* Labels */}
                    <text x={padding.left} y={chartHeight - 8} fill="#a1a1aa" fontSize="10" textAnchor="start">Month 0</text>
                    <text x={chartWidth - padding.right} y={chartHeight - 8} fill="#a1a1aa" fontSize="10" textAnchor="end">Month {maxMonths}</text>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Rollover Allocation */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Released Cash Rollover Plan
            </h3>
            <p className="text-xs text-zinc-500">
              When debts are wiped, significant monthly cash is released. Decide how to leverage this cash:
            </p>

            <div className="space-y-3">
              {[
                { key: 'reinvest_all', label: '100% Reinvested into Retirement' },
                { key: 'reinvest_percent', label: 'Invest a Specific Percentage' },
                { key: 'discretionary', label: 'Leave as Discretionary Cash' },
                { key: 'split', label: 'Split between Investing & Savings' }
              ].map(action => (
                <label key={action.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="releasedAction"
                    className="accent-blue-600 focus:ring-blue-600"
                    checked={releasedAction === action.key}
                    onChange={() => onUpdateReleasedAction(action.key as any)}
                  />
                  <span className="text-xs text-zinc-700">{action.label}</span>
                </label>
              ))}
            </div>

            {releasedAction === 'reinvest_percent' && (
              <div className="pt-2 space-y-1 bg-white/50 backdrop-blur-xs p-3 rounded-lg border border-zinc-200/80">
                <div className="flex justify-between text-xs font-medium text-zinc-600">
                  <span>Investment allocation:</span>
                  <span className="font-bold font-mono text-emerald-600">{releasedReinvestPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="w-full accent-blue-600"
                  value={releasedReinvestPercent}
                  onChange={(e) => onUpdateReleasedPercent(parseInt(e.target.value) || 0)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
