/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FinancialProtection, HouseholdProfile, Debt, EducationGoal } from '../types';
import { calculateInsuranceNeeds } from '../utils/calculations';
import { ShieldCheck, HelpCircle, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface ProtectionFormProps {
  protection: FinancialProtection;
  household: HouseholdProfile;
  debts: Debt[];
  education: EducationGoal[];
  onChange: (updated: FinancialProtection) => void;
}

export default function ProtectionForm({ protection, household, debts, education, onChange }: ProtectionFormProps) {
  const updateField = (field: keyof FinancialProtection, value: number) => {
    onChange({
      ...protection,
      [field]: Math.max(0, value)
    });
  };

  // Sync liabilities and college needs from other steps
  const totalDebtsFromList = debts.reduce((sum, d) => sum + d.balance, 0);
  const collegeGoalsTotal = education.reduce((sum, g) => {
    const startY = Math.max(0, g.startAge - g.currentAge);
    const presentCost = g.annualTuition + g.roomAndBoard + g.booksAndOther - g.grantsScholarships;
    const futureVal = presentCost * g.years * Math.pow(1 + g.inflationRate / 100, startY);
    return sum + futureVal * (g.fundingPercentage / 100);
  }, 0);

  const yearsToRetire = Math.max(1, household.retirementAge - household.currentAge);

  // Core Needs Calculations
  const results = React.useMemo(() => {
    // Income replacement need
    const incomeReplacementNeeds = household.currentIncome * protection.incomeReplacementYears;

    // Debt payoff needs
    const totalDebtNeeds = totalDebtsFromList + protection.mortgageBalance;

    // Total needs
    const totalNeeds = incomeReplacementNeeds + totalDebtNeeds + collegeGoalsTotal + protection.funeralExpenses;

    // Offsetting coverage/assets
    const totalDeductions = 
      protection.existingLifeInsurance + 
      protection.employerProvidedCoverage + 
      protection.availableSurvivorAssets;

    const coverageGap = Math.max(0, totalNeeds - totalDeductions);

    // Compound difference: Term vs Permanent premiums
    const monthlyPremiumDiff = Math.max(0, protection.currentPremium - protection.hypotheticalPremium) / 12;
    const rDec = (protection.premiumDifferenceReturn || 6.0) / 100 / 12;
    const periods = yearsToRetire * 12;

    let investedDifferenceFV = 0;
    if (rDec === 0) {
      investedDifferenceFV = monthlyPremiumDiff * periods;
    } else {
      investedDifferenceFV = monthlyPremiumDiff * ((Math.pow(1 + rDec, periods) - 1) / rDec) * (1 + rDec);
    }

    return {
      incomeReplacementNeeds,
      totalDebtNeeds,
      totalNeeds,
      totalDeductions,
      coverageGap,
      investedDifferenceFV
    };
  }, [protection, household, totalDebtsFromList, collegeGoalsTotal, yearsToRetire]);

  return (
    <div id="protection-needs-step" className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Step 7: Income Protection needs-analysis
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Perform a diagnostic life insurance needs review. Learn how to protect your dependents and evaluate monthly premium efficiencies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Protection Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Configure Protection Parameters</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1 flex items-center gap-0.5">
                  Income Replacement Years
                  <span className="group relative cursor-pointer text-zinc-400 hover:text-zinc-600">
                    <HelpCircle className="w-3" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-zinc-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md font-normal leading-normal text-center">
                      The number of years of salary replacement desired for your household in the event of premature death. Standard is 7-10 years.
                    </span>
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={protection.incomeReplacementYears || ''}
                  onChange={(e) => updateField('incomeReplacementYears', parseInt(e.target.value) || 10)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Mortgage Balance to Protect ($)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={protection.mortgageBalance || ''}
                  onChange={(e) => updateField('mortgageBalance', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 250000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Funeral & Final Expenses ($)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={protection.funeralExpenses || ''}
                  onChange={(e) => updateField('funeralExpenses', parseFloat(e.target.value) || 15000)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-200/60">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Existing Personal Coverage ($)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={protection.existingLifeInsurance || ''}
                  onChange={(e) => updateField('existingLifeInsurance', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Employer Provided Coverage ($)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={protection.employerProvidedCoverage || ''}
                  onChange={(e) => updateField('employerProvidedCoverage', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 1x salary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Liquid Survivor Assets ($)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={protection.availableSurvivorAssets || ''}
                  onChange={(e) => updateField('availableSurvivorAssets', parseFloat(e.target.value) || 0)}
                  placeholder="Brokerage/savings"
                />
              </div>
            </div>
          </div>

          {/* Premium Arbitrage scenarios (e.g., Whole Life vs Term) */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1">
              Evaluating Premium Allocation Efficiencies
              <span className="group relative cursor-pointer text-zinc-400 hover:text-zinc-600">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-10 font-normal leading-normal">
                  Allows comparing your current premiums (e.g. for Whole/Cash-value life insurance) with lower-cost Term coverage. The difference can be compounded in investments.
                </span>
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Your Current Premiums ($ / Year)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={protection.currentPremium || ''}
                  onChange={(e) => updateField('currentPremium', parseFloat(e.target.value) || 0)}
                  placeholder="Existing premiums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Hypothetical Term Premium ($ / Year)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={protection.hypotheticalPremium || ''}
                  onChange={(e) => updateField('hypotheticalPremium', parseFloat(e.target.value) || 0)}
                  placeholder="Estimated term quote"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Assumed Invest Return (%)</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  className="w-full px-3 py-1.5 border border-zinc-300/80 rounded-lg text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={protection.premiumDifferenceReturn}
                  onChange={(e) => updateField('premiumDifferenceReturn', parseFloat(e.target.value) || 6.0)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Legals */}
        <div className="space-y-6">
          <div className="glass-panel-dark text-white p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-blue-400">Coverage Diagnostic</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-zinc-400">Income Replacement needed:</span>
                <span className="font-bold font-mono text-white">${results.incomeReplacementNeeds.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-zinc-400">Mortgages & Debts:</span>
                <span className="font-bold font-mono text-white">${results.totalDebtNeeds.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-zinc-400">Inflation College Goals:</span>
                <span className="font-bold font-mono text-white">${Math.round(collegeGoalsTotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
                <span className="text-zinc-400">Offsetting Coverage / Assets:</span>
                <span className="font-bold font-mono text-white">-${results.totalDeductions.toLocaleString()}</span>
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-zinc-400">Staged Protection Gap:</span>
                <span className={`text-xl font-black font-mono mt-1 ${results.coverageGap > 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
                  ${Math.round(results.coverageGap).toLocaleString()}
                </span>
                <span className="text-[10px] text-zinc-400 mt-1 font-sans">
                  {results.coverageGap > 0 
                    ? "*This gap represents an estimated coverage deficit, not a product recommendation."
                    : "*Congratulations, your current coverage assets exceed estimated requirements."}
                </span>
              </div>
            </div>
          </div>

          {/* Arbitrage compounding */}
          {protection.currentPremium > protection.hypotheticalPremium && (
            <div className="glass-panel-subtle p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wide flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-blue-600 animate-pulse" />
                Compound Value of Savings Difference
              </h4>
              <p className="text-xs text-zinc-500">
                If you were to redirect the premium difference of <strong>${Math.round(protection.currentPremium - protection.hypotheticalPremium).toLocaleString()}/yr</strong> (${Math.round((protection.currentPremium - protection.hypotheticalPremium)/12)}/mo) into investment holdings:
              </p>
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg text-center font-mono">
                <span className="text-[10px] text-blue-800 block uppercase">Projected Value at Retirement ({yearsToRetire} yrs)</span>
                <span className="text-lg font-black text-blue-700">${Math.round(results.investedDifferenceFV).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Legal Compliance Warning clauses */}
          <div className="glass-panel-subtle border-zinc-300 text-zinc-700 text-[11px] p-4 rounded-xl leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-zinc-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Critical Insurance Disclosures
            </div>
            <p>
              Do not cancel any existing insurance coverage until a replacement policy has been fully approved, underwritten, and activated. Premature cancellation can leave dependents completely unprotected.
            </p>
            <p>
              Replacing cash-value permanent coverage with term policies may involve surrender charges, loss of secondary benefits/riders, tax consequences, or higher premium tiers due to changes in health. <strong>Always consult a licensed insurance professional before making coverage transfers.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
