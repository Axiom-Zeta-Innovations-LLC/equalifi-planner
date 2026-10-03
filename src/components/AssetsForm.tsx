/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AssetAccount, HouseholdProfile } from '../types';
import { projectAssets } from '../utils/calculations';
import { Briefcase, Plus, Trash2, HelpCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface AssetsFormProps {
  assets: AssetAccount[];
  household: HouseholdProfile;
  onUpdateAssets: (updated: AssetAccount[]) => void;
}

export default function AssetsForm({ assets, household, onUpdateAssets }: AssetsFormProps) {
  const [newAsset, setNewAsset] = React.useState<Partial<AssetAccount>>({
    name: '',
    type: '401k',
    balance: 25000,
    monthlyContribution: 400,
    employerMatch: 50,
    employerMatchLimit: 6,
    annualReturn: 7.0,
    annualFee: 0.5,
    taxTreatment: 'tax-deferred',
    purpose: 'retirement'
  });

  const yearsToRetire = Math.max(1, household.retirementAge - household.currentAge);

  const projection = React.useMemo(() => {
    return projectAssets(assets, yearsToRetire, household.currentIncome, household.incomeGrowth);
  }, [assets, yearsToRetire, household.currentIncome, household.incomeGrowth]);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name) return;

    const fullAsset: AssetAccount = {
      id: 'asset-' + Date.now(),
      name: newAsset.name,
      type: newAsset.type || '401k',
      balance: Math.max(0, newAsset.balance || 0),
      monthlyContribution: Math.max(0, newAsset.monthlyContribution || 0),
      employerMatch: Math.max(0, newAsset.employerMatch || 0),
      employerMatchLimit: Math.max(0, newAsset.employerMatchLimit || 0),
      annualReturn: Math.max(0, newAsset.annualReturn || 0),
      annualFee: Math.max(0, newAsset.annualFee || 0),
      taxTreatment: newAsset.taxTreatment || 'tax-deferred',
      purpose: newAsset.purpose || 'retirement'
    };

    onUpdateAssets([...assets, fullAsset]);
    setNewAsset({
      name: '',
      type: '401k',
      balance: 10000,
      monthlyContribution: 300,
      employerMatch: 50,
      employerMatchLimit: 6,
      annualReturn: 7.0,
      annualFee: 0.5,
      taxTreatment: 'tax-deferred',
      purpose: 'retirement'
    });
  };

  const handleDeleteAsset = (id: string) => {
    onUpdateAssets(assets.filter(a => a.id !== id));
  };

  return (
    <div id="assets-step-container" className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          Step 4: Investment Assets & Holdings
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Catalog your active retirement plans, brokerage portfolios, and savings. Define annual management fees to see their compounding impact.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add Asset Account form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleAddAsset} className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Register Investment Account / Asset
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newAsset.name || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="e.g. Fidelity 401(k)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Account Type</label>
                <select
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newAsset.type}
                  onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as any })}
                >
                  <option value="401k">Employer 401(k)</option>
                  <option value="403b">403(b) Non-Profit</option>
                  <option value="traditional_ira">Traditional IRA</option>
                  <option value="roth_ira">Roth IRA</option>
                  <option value="taxable_brokerage">Taxable Brokerage</option>
                  <option value="savings_cd">Savings / CD</option>
                  <option value="hsa">Health Savings Account (HSA)</option>
                  <option value="annuity">Annuity Contract</option>
                  <option value="pension">Pension Balance</option>
                  <option value="other">Other Asset</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Current Balance ($)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newAsset.balance || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, balance: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Your Monthly Savings ($)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newAsset.monthlyContribution || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, monthlyContribution: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Assumed Return (%/yr)</label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  step="0.1"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newAsset.annualReturn || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, annualReturn: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1 flex items-center gap-1">
                  Annual Fee (%)
                  <span className="group relative cursor-pointer text-zinc-400 hover:text-zinc-600">
                    <HelpCircle className="w-3" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-zinc-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md font-normal leading-normal">
                      Includes expense ratios and advisory fees. Heavy fees significantly erode wealth over decades.
                    </span>
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.05"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newAsset.annualFee || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, annualFee: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Tax Status</label>
                <select
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={newAsset.taxTreatment}
                  onChange={(e) => setNewAsset({ ...newAsset, taxTreatment: e.target.value as any })}
                >
                  <option value="tax-deferred">Tax-Deferred (Traditional)</option>
                  <option value="tax-free">Tax-Free (Roth)</option>
                  <option value="taxable">Taxable (Brokerage)</option>
                </select>
              </div>
            </div>

            {/* Employer Matching Block */}
            <div className="p-4 bg-white/50 backdrop-blur-xs border border-zinc-200/80 rounded-xl space-y-3">
              <span className="text-xs font-bold text-zinc-800 block">Employer Match Policy (For 401k/403b only)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Match Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 bg-white/70 backdrop-blur-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={newAsset.employerMatch || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, employerMatch: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 50"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">The percentage they match (e.g., 50% match of your savings).</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Match Limit (% of gross salary)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 bg-white/70 backdrop-blur-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    value={newAsset.employerMatchLimit || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, employerMatchLimit: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 6"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Maximum salary rate matched (e.g., matching up to 6% of salary).</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer shadow-xs"
            >
              Add Asset Account
            </button>
          </form>

          {/* Asset List Grid */}
          {assets.length > 0 && (
            <div className="glass-panel-subtle rounded-xl overflow-hidden">
              <div className="p-3 bg-white/40 border-b border-zinc-200/60">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Cataloged Holdings ({assets.length})</h3>
              </div>
              <div className="divide-y divide-zinc-200/60 max-h-72 overflow-y-auto">
                {assets.map((a) => (
                  <div key={a.id} className="p-3 flex justify-between items-center gap-3">
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-zinc-900">{a.name}</span>
                      <div className="flex flex-wrap gap-x-2 text-xs text-zinc-500">
                        <span>Balance: <strong className="font-mono text-zinc-800">${a.balance.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Savings: <strong className="font-mono text-zinc-800">${a.monthlyContribution}/mo</strong></span>
                        <span>•</span>
                        <span>Fee: <strong className="font-mono text-blue-600">{a.annualFee}%</strong></span>
                        <span>•</span>
                        <span className="capitalize">{a.taxTreatment.replace('-', ' ')}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(a.id)}
                      className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Compounding Summary and Future Projections */}
        <div className="space-y-6">
          <div className="glass-panel-dark text-white p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-emerald-400">Portfolios metrics</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Current Aggregated Assets:</span>
                <span className="text-sm font-bold font-mono text-white">${projection.totalCurrentBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Your Annual Contribution:</span>
                <span className="text-sm font-bold font-mono text-white">${projection.totalAnnualContribution.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-xs text-zinc-400">Employer Match (Annual):</span>
                <span className="text-sm font-bold font-mono text-white">${projection.totalEmployerContribution.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-zinc-400">Years compounding:</span>
                <span className="text-sm font-bold font-mono text-emerald-400">{yearsToRetire} Years</span>
              </div>
            </div>
          </div>

          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Retirement Compound projection
            </h3>
            <p className="text-xs text-zinc-500">
              Future value projection at your chosen retirement age ({household.retirementAge}), applying individual rate and matching rules.
            </p>

            <div className="space-y-3 p-3 bg-white/50 backdrop-blur-xs border border-zinc-200/80 rounded-xl">
              <div>
                <span className="text-[10px] uppercase text-zinc-400 block font-bold">Gross Compound Value (No Fees)</span>
                <span className="text-sm font-bold font-mono text-zinc-800">${Math.round(projection.projectedBalanceNoFee).toLocaleString()}</span>
              </div>
              <div className="border-t border-zinc-200 pt-2">
                <span className="text-[10px] uppercase text-zinc-500 block font-bold">Net Compound Value (After Fees)</span>
                <span className="text-lg font-black font-mono text-emerald-600">${Math.round(projection.projectedBalanceWithFee).toLocaleString()}</span>
              </div>
              <div className="border-t border-zinc-200 pt-2 flex justify-between text-xs text-zinc-600">
                <span>Wealth eroded by fees:</span>
                <span className="font-bold text-blue-600 font-mono">${Math.round(projection.totalFeesPaid).toLocaleString()}</span>
              </div>
            </div>

            {projection.totalFeesPaid > 10000 && (
              <div className="p-3 bg-zinc-100 border border-zinc-300 text-zinc-800 text-[10px] rounded-lg leading-relaxed flex gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Fee Friction Alert:</strong> Over {yearsToRetire} years, investment fees cost you <strong>${Math.round(projection.totalFeesPaid).toLocaleString()}</strong> in compound growth. Even a 0.5% fee difference can significantly impact long-term wealth.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
