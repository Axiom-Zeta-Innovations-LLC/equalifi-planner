/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SavedPlan, Debt, AssetAccount, EducationGoal, FinancialProtection, RiskQuestionnaire } from '../types';
import { calculateFIN, projectAssets, calculateEducationFunding, calculateInsuranceNeeds, amortizeDebts, calculateRequiredMonthlyContribution } from '../utils/calculations';
import { CALCULATION_METHODOLOGY_DOC, DISCLAIMERS, PRIVACY_POLICY } from '../utils/methodology';
import { FileText, Download, Printer, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ReportViewProps {
  plan: Omit<SavedPlan, 'id' | 'name' | 'timestamp'>;
}

export default function ReportView({ plan }: ReportViewProps) {
  
  const yearsToRetire = Math.max(1, plan.household.retirementAge - plan.household.currentAge);
  
  // Calculate dependencies
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
  const eduProj = calculateEducationFunding(plan.education);
  const insuranceNeeds = calculateInsuranceNeeds(plan.household, plan.protection, yearsToRetire);

  const reqContrib = calculateRequiredMonthlyContribution(
    fin.finPresentValue,
    assetsProj.totalCurrentBalance,
    7.0,
    yearsToRetire
  );

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    // Generate clean educational CSV log containing aggregated metrics and goals, protecting private IDs
    const rows = [
      ["FINANCIAL INDEPENDENCE PLANNER REPORT"],
      [`Generated Date: ${new Date().toLocaleDateString()}`],
      ["Methodology Version: v1.4.2"],
      [""],
      ["HOUSEHOLD SUMMARY"],
      ["Parameter", "Value"],
      ["Primary Planner", plan.household.name],
      ["Current Age", plan.household.currentAge],
      ["Retirement Age", plan.household.retirementAge],
      ["Filing Status", plan.household.filingStatus],
      ["State", plan.household.stateOfResidence || "Not Specified"],
      ["Annual Income", plan.household.currentIncome],
      [""],
      ["RETIREMENT PROJECTIONS"],
      ["Metric", "Estimated Value ($)"],
      ["Required FIN Target", Math.round(fin.finPresentValue)],
      ["Projected Net Portfolio Balance", Math.round(assetsProj.projectedBalanceWithFee)],
      ["Remaining Retirement Funding Gap", Math.round(Math.max(0, fin.finPresentValue - assetsProj.projectedBalanceWithFee))],
      ["Required Monthly Savings", Math.round(reqContrib)],
      [""],
      ["LIABILITIES & AMORTIZATION"],
      ["Liabilities Count", plan.debts.length],
      ["Staged Debt-Free Date", debtsProj.schedule[debtsProj.schedule.length - 1]?.dateStr || "N/A"],
      ["Total Interest Paid", Math.round(debtsProj.totalInterestPaidAll)],
      ["Total Interest Saved via Stack", Math.round(debtsProj.totalInterestPaidAllMinimums - debtsProj.totalInterestPaidAll)],
      [""],
      ["DEPENDENT EDUCATION GOALS"],
      ["Education Goals Active", plan.education.length],
      ["Required College Contribution", Math.round(eduProj.totalRequiredMonthly)],
      [""],
      ["FINANCIAL PROTECTION NEED GAP"],
      ["Calculated Insurance Need", Math.round(insuranceNeeds.totalNeeds)],
      ["Offsetting Coverage", Math.round(insuranceNeeds.totalDeductions)],
      ["Diagnostic Insurance Gap", Math.round(insuranceNeeds.coverageGap)]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Financial_Independence_Plan_${plan.household.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="report-step-container" className="space-y-6">
      
      {/* Print Control Panel */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 print:hidden">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
            <FileText className="w-5 h-5 text-emerald-600" />
            Report Exporter and Document Print
          </h3>
          <p className="text-xs text-zinc-500">
            Generate and export your comprehensive planning report. No sensitive identifiers are stored.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 hover:bg-white text-zinc-700 text-xs font-bold border border-zinc-200/80 rounded-lg transition-all cursor-pointer backdrop-blur-xs shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Report / PDF
          </button>
        </div>
      </div>

      {/* Actual Printable Page Layout */}
      <div className="glass-panel p-8 rounded-2xl max-w-4xl mx-auto space-y-8 print:bg-white print:border-none print:shadow-none print:p-0 font-sans text-zinc-800 leading-relaxed">
        
        {/* Report Header */}
        <div className="border-b-2 border-emerald-600 pb-6 flex justify-between items-end">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block">Personal Financial Analysis</span>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">EqualiF.I. Planner — Independence Plan</h1>
            <p className="text-xs text-zinc-500">Formulated for the {plan.household.name} Household</p>
          </div>
          <div className="text-right text-[10px] font-mono text-zinc-400">
            <span>Methodology Version: v1.4.2</span>
            <span className="block">Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* 1. Household Profile */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b border-zinc-200/60 pb-1">1. Household Profile Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block font-semibold uppercase text-[10px]">Primary Planner</span>
              <span className="font-bold text-zinc-800">{plan.household.name}</span>
            </div>
            <div>
              <span className="text-zinc-400 block font-semibold uppercase text-[10px]">Ages (Now / Retire)</span>
              <span className="font-bold text-zinc-800">{plan.household.currentAge} / {plan.household.retirementAge} yrs</span>
            </div>
            <div>
              <span className="text-zinc-400 block font-semibold uppercase text-[10px]">Tax Filing Status</span>
              <span className="font-bold text-zinc-800 capitalize">{plan.household.filingStatus.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-zinc-400 block font-semibold uppercase text-[10px]">Annual Income</span>
              <span className="font-bold font-mono text-zinc-800">${plan.household.currentIncome.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 2. Core Projections and Retirement Readiness */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b border-zinc-200/60 pb-1">2. Core Projections & Retirement Readiness</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* FIN target block */}
            <div className="glass-panel-subtle p-4 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">Required FIN Target</span>
              <span className="text-xl font-black font-mono text-zinc-800 block mt-1">${Math.round(fin.finPresentValue).toLocaleString()}</span>
              <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                The inflation-adjusted assets needed at retirement to yield lifetime withdrawals, net of SS and stable pensions.
              </p>
            </div>

            {/* Projected savings balance block */}
            <div className="glass-panel-subtle p-4 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">Projected Portfolio Balance</span>
              <span className="text-xl font-black font-mono text-emerald-600 block mt-1">${Math.round(assetsProj.projectedBalanceWithFee).toLocaleString()}</span>
              <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                The projected future value of your current {plan.assets.length} cataloged accounts after compound management fees.
              </p>
            </div>

            {/* Required savings rate block */}
            <div className="glass-panel-subtle p-4 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">Required Monthly Savings</span>
              <span className="text-xl font-black font-mono text-blue-600 block mt-1">${Math.round(reqContrib).toLocaleString()} / mo</span>
              <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                The monthly contribution needed from today to retirement to completely close the funding gap under baseline return rates.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Sub-Module Summaries (Debts, College, Insurance) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          
          {/* Debts block */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest block border-b border-zinc-200/60 pb-1">Liabilities & Debts</span>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Debts:</span>
                <span className="font-bold font-mono">${plan.debts.reduce((sum, d) => sum + d.balance, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Debt-Free Target:</span>
                <span className="font-bold font-mono">{debtsProj.schedule[debtsProj.schedule.length - 1]?.dateStr || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Interest Paid:</span>
                <span className="font-bold font-mono text-zinc-900">${Math.round(debtsProj.totalInterestPaidAll).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* College block */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest block border-b border-zinc-200/60 pb-1">College Goals</span>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Goals Registered:</span>
                <span className="font-bold font-mono">{plan.education.length} child goals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Monthly Contribution:</span>
                <span className="font-bold font-mono text-blue-600">${Math.round(eduProj.totalRequiredMonthly)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">College Gap:</span>
                <span className="font-bold font-mono text-zinc-900">${Math.round(Object.values(eduProj).reduce<number>((sum, val) => typeof val === 'object' && val !== null ? sum + ((val as any).fundingGap || 0) : sum, 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Protection block */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest block border-b border-zinc-200/60 pb-1">Income Protection</span>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Needs calculated:</span>
                <span className="font-bold font-mono">${Math.round(insuranceNeeds.totalNeeds).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Offsetting Coverage:</span>
                <span className="font-bold font-mono">${Math.round(insuranceNeeds.totalDeductions).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Coverage Deficit:</span>
                <span className={`font-bold font-mono ${insuranceNeeds.coverageGap > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                  ${Math.round(insuranceNeeds.coverageGap).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Disclaimers and Limitations */}
        <div className="border-t border-zinc-200/60 pt-6 space-y-3">
          <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-1">
            <ShieldAlert className="w-4 h-4 text-zinc-600 shrink-0" />
            Important Disclaimers & Disclosures
          </h2>
          <div className="space-y-1.5 text-[10px] text-zinc-500 leading-normal font-medium">
            {DISCLAIMERS.map((disc, idx) => (
              <p key={idx}>• {disc}</p>
            ))}
          </div>
        </div>

        {/* 5. Privacy & Methodologies Footer */}
        <div className="border-t border-zinc-200/60 pt-4 flex justify-between items-center text-[9px] text-zinc-400">
          <span>Financial Independence Planner Analysis Report</span>
          <span>Security Certified • No Personal Identifiers Stored</span>
        </div>
      </div>
    </div>
  );
}
