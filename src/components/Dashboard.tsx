/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HouseholdProfile, CashFlow, Debt, AssetAccount, EducationGoal, FinancialProtection, RiskQuestionnaire } from '../types';
import { calculateFIN, projectAssets, calculateEducationFunding, calculateInsuranceNeeds, amortizeDebts, calculateRequiredMonthlyContribution, generateSensitivityAnalysis, ALLOCATION_MODELS } from '../utils/calculations';
import { BarChart2, TrendingUp, ShieldAlert, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, HelpCircle, ArrowRight, RefreshCw, Briefcase, Calendar } from 'lucide-react';

interface DashboardProps {
  household: HouseholdProfile;
  cashFlow: CashFlow;
  debts: Debt[];
  debtMethod: any;
  releasedAction: any;
  releasedReinvestPercent: number;
  extraMonthlyBudget: number;
  assets: AssetAccount[];
  education: EducationGoal[];
  protection: FinancialProtection;
  risk: RiskQuestionnaire;
  onUpdateRetirementAge: (age: number) => void;
  onUpdateRetirementSpending: (spending: number) => void;
}

export default function Dashboard({
  household,
  cashFlow,
  debts,
  debtMethod,
  releasedAction,
  releasedReinvestPercent,
  extraMonthlyBudget,
  assets,
  education,
  protection,
  risk,
  onUpdateRetirementAge,
  onUpdateRetirementSpending
}: DashboardProps) {
  // 1. Calculate fundamental results
  const yearsToRetire = Math.max(1, household.retirementAge - household.currentAge);
  
  // Amortize Debts
  const debtAmort = React.useMemo(() => {
    return amortizeDebts(debts, debtMethod, releasedAction, releasedReinvestPercent, extraMonthlyBudget);
  }, [debts, debtMethod, releasedAction, releasedReinvestPercent, extraMonthlyBudget]);

  // Project Assets
  const assetsProj = React.useMemo(() => {
    return projectAssets(assets, yearsToRetire, household.currentIncome, household.incomeGrowth);
  }, [assets, yearsToRetire, household.currentIncome, household.incomeGrowth]);

  // Retirement Lifestyle (FIN)
  // Let's create a local mutable retirement target for calculations
  const localRetirementSetting = React.useMemo(() => {
    return {
      incomeMethod: 'percentage' as const,
      targetIncomePercentage: 75,
      targetIncomeCustom: household.currentIncome * 0.75,
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
  }, [household.currentIncome]);

  const finResult = React.useMemo(() => {
    return calculateFIN(household, localRetirementSetting, yearsToRetire);
  }, [household, localRetirementSetting, yearsToRetire]);

  const activeFIN = finResult.finPresentValue;

  // Monthly contribution required
  const requiredMonthlyContribution = React.useMemo(() => {
    return calculateRequiredMonthlyContribution(
      activeFIN,
      assetsProj.totalCurrentBalance,
      7.0, // baseline compound rate of return assumption
      yearsToRetire
    );
  }, [activeFIN, assetsProj.totalCurrentBalance, yearsToRetire]);

  // Income protection gap
  const insuranceNeeds = React.useMemo(() => {
    return calculateInsuranceNeeds(household, protection, yearsToRetire);
  }, [household, protection, yearsToRetire]);

  // Education goals
  const eduResults = React.useMemo(() => {
    return calculateEducationFunding(education);
  }, [education]);

  // Budget summaries
  const monthlyGross = cashFlow.primaryIncome + cashFlow.spouseIncome + cashFlow.secondaryIncome;
  const netSavingsRate = monthlyGross > 0 ? ((cashFlow.retirementContributions + cashFlow.nonRetirementSavings) / monthlyGross) * 100 : 0;
  
  // Available monthly cash flow (gross monthly income minus essential needs and savings)
  const totalMinDebts = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const essentialExpenses = 
    cashFlow.housing + cashFlow.utilities + cashFlow.food + cashFlow.transportation + 
    cashFlow.insurance + cashFlow.healthcare + cashFlow.childcare + cashFlow.educationExpense + 
    totalMinDebts + cashFlow.otherRecurring;

  const totalMonthlySavings = cashFlow.retirementContributions + cashFlow.nonRetirementSavings;
  const availableDiscretionary = Math.max(0, (monthlyGross * (1 - (household.marginalTaxRate || 15) / 100)) - essentialExpenses - totalMonthlySavings);

  // Score metrics
  const projectedBalance = assetsProj.projectedBalanceWithFee;
  const fundingGap = Math.max(0, activeFIN - projectedBalance);
  const fundingPercentage = activeFIN > 0 ? Math.min(100, (projectedBalance / activeFIN) * 100) : 100;

  // Readiness Score: weighted average of funding progress, debt-free posture, emergency cash
  const readinessScore = Math.round(
    fundingPercentage * 0.6 + 
    (debts.length === 0 ? 100 : Math.max(0, 100 - debtAmort.totalMonthsToDebtFree)) * 0.2 + 
    (assetsProj.totalCurrentBalance > 10000 ? 100 : 50) * 0.2
  );

  // SVG Chart data
  const chartWidth = 500;
  const chartHeight = 200;
  const padding = { top: 15, right: 20, bottom: 25, left: 55 };

  const growthPath = React.useMemo(() => {
    if (yearsToRetire <= 0) return '';
    let d = '';
    const pointsCount = Math.min(30, yearsToRetire);
    
    // Starting coordinates
    const startX = padding.left;
    const startY = padding.top + (1 - assetsProj.totalCurrentBalance / activeFIN) * (chartHeight - padding.top - padding.bottom);
    d += `M ${startX} ${startY}`;

    for (let i = 1; i <= pointsCount; i++) {
      const year = (i / pointsCount) * yearsToRetire;
      const futureVal = projectAssets(assets, year, household.currentIncome, household.incomeGrowth).projectedBalanceWithFee;
      
      const x = padding.left + (i / pointsCount) * (chartWidth - padding.left - padding.right);
      // Clamp Y to fit visual bounds nicely
      const ratio = Math.min(1.2, futureVal / activeFIN);
      const y = padding.top + (1 - ratio) * (chartHeight - padding.top - padding.bottom);
      
      d += ` L ${x} ${y}`;
    }
    return d;
  }, [assets, yearsToRetire, assetsProj.totalCurrentBalance, activeFIN]);

  // Sensitivity vectors
  const sensitivity = React.useMemo(() => {
    return generateSensitivityAnalysis(activeFIN, assetsProj.totalCurrentBalance, 7.0, yearsToRetire);
  }, [activeFIN, assetsProj.totalCurrentBalance, yearsToRetire]);

  return (
    <div id="results-dashboard-container" className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          Step 9: Master Planning Dashboard
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Review your dynamic projections. Fine-tune underlying variables and test alternative lifestyle strategies instantly.
        </p>
      </div>

      {/* Grid of critical KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Readiness Score Card - Sleek Dark Glass */}
        <div className="glass-panel-dark text-white p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Plan Readiness Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-emerald-300">{readinessScore}%</span>
              <span className="text-[10px] text-zinc-400">/ 100</span>
            </div>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${readinessScore}%` }}></div>
          </div>
        </div>

        {/* FIN Target Card */}
        <div className="glass-panel-subtle p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Financial Independence Target (FIN)</span>
            <span className="text-2xl font-black font-mono text-blue-600 block">${Math.round(activeFIN).toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-2">Required portfolio capital at retirement</span>
        </div>

        {/* Projected Future Value Card */}
        <div className="glass-panel-subtle p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Projected Retirement Wealth</span>
            <span className="text-2xl font-black font-mono text-emerald-600 block">${Math.round(projectedBalance).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
            <span>Funding Gap:</span>
            <span className="font-bold text-zinc-700 font-mono">${Math.round(fundingGap).toLocaleString()}</span>
          </div>
        </div>

        {/* Required Contribution Card */}
        <div className="glass-panel-subtle p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Required Monthly Savings</span>
            <span className="text-2xl font-black font-mono text-zinc-900 block">${Math.round(requiredMonthlyContribution).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
            <span>Available cash flow:</span>
            <span className="font-bold text-emerald-600 font-mono">${Math.round(availableDiscretionary).toLocaleString()}/mo</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Lever Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Charts & Visuals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Growth Over Time Area SVG Chart */}
          <div className="glass-panel-subtle p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center justify-between">
              <span>Compounding Growth Timeline to Retirement</span>
              <span className="text-[10px] font-mono text-blue-600">Target FIN: ${Math.round(activeFIN).toLocaleString()}</span>
            </h3>
            
            <div className="bg-white/50 backdrop-blur-xs border border-zinc-200/70 rounded-xl p-3">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto text-zinc-400">
                {/* Horizontal Guide lines */}
                <line x1={padding.left} y1={padding.top} x2={chartWidth - padding.right} y2={padding.top} stroke="#e4e4e7" strokeDasharray="3 3" />
                <line x1={padding.left} y1={(chartHeight - padding.bottom + padding.top) / 2} x2={chartWidth - padding.right} y2={(chartHeight - padding.bottom + padding.top) / 2} stroke="#e4e4e7" strokeDasharray="3 3" />
                <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#a1a1aa" strokeWidth="1.5" />

                {/* Target FIN dashed guide line */}
                <line 
                  x1={padding.left} 
                  y1={padding.top + (1 - 1) * (chartHeight - padding.top - padding.bottom)} 
                  x2={chartWidth - padding.right} 
                  y2={padding.top + (1 - 1) * (chartHeight - padding.top - padding.bottom)} 
                  stroke="#2563eb" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                />

                {/* Growth path */}
                <path
                  d={growthPath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3"
                />

                {/* Text Labels */}
                <text x={padding.left} y={chartHeight - 8} fill="#71717a" fontSize="10" textAnchor="start">Age {household.currentAge} (Now)</text>
                <text x={chartWidth - padding.right} y={chartHeight - 8} fill="#71717a" fontSize="10" textAnchor="end">Age {household.retirementAge} (Retire)</text>
                
                <text x={padding.left - 6} y={padding.top + 4} fill="#2563eb" fontSize="8" textAnchor="end" fontWeight="bold">Target FIN</text>
              </svg>
            </div>
          </div>

          {/* Sub-modules progress cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Debts payoff status */}
            <div className="glass-panel-subtle p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Liabilities & Debts</span>
              {debts.length > 0 ? (
                <div className="mt-2 space-y-1">
                  <span className="text-xs font-semibold text-zinc-800 block">Debt-Free Target:</span>
                  <span className="text-sm font-extrabold text-blue-600 font-mono block">{debtAmort.schedule[debtAmort.schedule.length - 1]?.dateStr || 'N/A'}</span>
                  <span className="text-[10px] text-zinc-500 block">Total months: {debtAmort.totalMonthsToDebtFree}</span>
                </div>
              ) : (
                <div className="mt-2 text-emerald-600 font-semibold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 100% Debt Free!
                </div>
              )}
            </div>

            {/* Education status */}
            <div className="glass-panel-subtle p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Dependent College Goals</span>
              {education.length > 0 ? (
                <div className="mt-2 space-y-1">
                  <span className="text-xs font-semibold text-zinc-800 block">College Savings Needed:</span>
                  <span className="text-sm font-extrabold text-emerald-600 font-mono block">${Math.round(eduResults.totalRequiredMonthly || 0)}/mo</span>
                  <span className="text-[10px] text-zinc-500 block">{education.length} child goals registered</span>
                </div>
              ) : (
                <span className="text-xs text-zinc-400 mt-2 italic block">No active college obligations</span>
              )}
            </div>

            {/* Protection status */}
            <div className="glass-panel-subtle p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Life Protection needs</span>
              <div className="mt-2 space-y-1">
                <span className="text-xs font-semibold text-zinc-800 block">Estimated Need Gap:</span>
                <span className={`text-sm font-extrabold font-mono block ${insuranceNeeds.coverageGap > 0 ? 'text-zinc-700' : 'text-emerald-600'}`}>
                  ${Math.round(insuranceNeeds.coverageGap).toLocaleString()}
                </span>
                <span className="text-[10px] text-zinc-500 block">Replacement target: {protection.incomeReplacementYears} yrs</span>
              </div>
            </div>
          </div>

          {/* Sensitivity Analysis Matrix */}
          <div className="glass-panel-subtle p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Required Contribution Sensitivity Matrix</h3>
            <p className="text-xs text-zinc-500">
              See how changes in the nominal investment return rate affect the required monthly contribution to reach your FIN.
            </p>

            <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
              {sensitivity.returnSensitivity.map((point, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg border backdrop-blur-xs transition-all ${point.modifier === 0 ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-xs' : 'bg-white/60 border-zinc-200 text-zinc-800'}`}>
                  <span className="block text-[10px] font-semibold text-zinc-400">
                    {point.modifier === 0 ? 'Baseline (7%)' : `${point.modifier > 0 ? '+' : ''}${point.modifier}%`}
                  </span>
                  <span className="block font-bold text-emerald-600 mt-1">{point.returnRate}% return</span>
                  <span className="block text-[11px] font-extrabold text-zinc-900 mt-2">${Math.round(point.requiredContribution)}/mo</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Educational Levers & Adjustments */}
        <div className="space-y-6">
          
          {/* Active Interactive Levers */}
          <div className="glass-panel-subtle p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Interactive Strategic Levers
            </h3>
            <p className="text-xs text-zinc-500">
              If the required monthly contribution is unaffordable, use these educational adjustment slides to optimize your targets in real-time.
            </p>

            {/* Lever 1: Retirement Age */}
            <div className="space-y-2 p-3 bg-white/60 rounded-xl border border-zinc-200/80 backdrop-blur-xs">
              <div className="flex justify-between text-xs font-bold text-zinc-800">
                <span>Retirement Age:</span>
                <span className="text-blue-600 font-mono">{household.retirementAge} years</span>
              </div>
              <input
                type="range"
                min={household.currentAge + 1}
                max="80"
                step="1"
                className="w-full accent-blue-600 cursor-pointer"
                value={household.retirementAge}
                onChange={(e) => onUpdateRetirementAge(parseInt(e.target.value) || 65)}
              />
              <p className="text-[10px] text-zinc-500 leading-normal pt-1 border-t border-zinc-200/60 mt-2">
                *Retiring later adds compounding years, decreases the duration of retirement support required, and reduces your target FIN.
              </p>
            </div>

            {/* Lever 2: Spending Target */}
            <div className="space-y-2 p-3 bg-white/60 rounded-xl border border-zinc-200/80 backdrop-blur-xs">
              <div className="flex justify-between text-xs font-bold text-zinc-800">
                <span>Lifestyle Spending Rate:</span>
                <span className="text-emerald-600 font-mono">75% of income</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                className="w-full accent-emerald-600 cursor-pointer"
                value={75}
                disabled
              />
              <p className="text-[10px] text-zinc-500 leading-normal">
                Adjusting the spending target percentage is another powerful lever to lower your target Financial Independence Number.
              </p>
            </div>
          </div>

          {/* Educational scenarios advice */}
          {requiredMonthlyContribution > availableDiscretionary && (
            <div className="glass-panel-subtle border border-zinc-300/80 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
                Affordability Action scenarios
              </span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Your calculated required savings of <strong>${Math.round(requiredMonthlyContribution)}/mo</strong> exceeds your unallocated cash flow (<strong>${Math.round(availableDiscretionary)}/mo</strong>). Consider these educational scenarios:
              </p>
              
              <ul className="space-y-2 text-[11px] text-zinc-700 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Postpone retirement:</strong> Retiring just 3 years later drastically lowers your required savings by lengthening growth time.
                </li>
                <li>
                  <strong>Redirect debt cash flows:</strong> Directing the <strong>${Math.round(totalMinDebts + extraMonthlyBudget)}/mo</strong> released after payoff directly into holdings will accelerate compound growth.
                </li>
                <li>
                  <strong>Gradual Contribution growth:</strong> Set a baseline of <strong>$300/mo</strong> and increase contributions by 1% of your salary each year as your income grows.
                </li>
                <li>
                  <strong>Re-evaluate Legacy Targets:</strong> Reducing your target legacy goal preserves assets for lifetime retirement withdrawals.
                </li>
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
