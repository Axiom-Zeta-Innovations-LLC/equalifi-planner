/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RiskQuestionnaire } from '../types';
import { scoreRiskQuestionnaire, ALLOCATION_MODELS } from '../utils/calculations';
import { Award, Info, HelpCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface RiskFormProps {
  risk: RiskQuestionnaire;
  onChange: (updated: RiskQuestionnaire) => void;
}

export default function RiskForm({ risk, onChange }: RiskFormProps) {
  const [acknowledgedOverride, setAcknowledgedOverride] = React.useState(false);

  const scoreResults = React.useMemo(() => {
    return scoreRiskQuestionnaire(risk);
  }, [risk]);

  const updateQuestion = (questionKey: keyof RiskQuestionnaire, score: number) => {
    const updated = { ...risk, [questionKey]: score };
    const recomputed = scoreRiskQuestionnaire(updated);
    onChange({
      ...updated,
      willingnessScore: recomputed.willingnessScore,
      capacityScore: recomputed.capacityScore
    });
  };

  const handleModelOverrideToggle = (checked: boolean) => {
    onChange({
      ...risk,
      overrideModel: checked,
      selectedModelOverride: checked ? scoreResults.recommendedKey : ''
    });
  };

  const handleOverrideSelection = (modelKey: string) => {
    onChange({
      ...risk,
      selectedModelOverride: modelKey
    });
  };

  const activeModelKey = risk.overrideModel && risk.selectedModelOverride ? risk.selectedModelOverride : scoreResults.recommendedKey;
  const activeModel = ALLOCATION_MODELS[activeModelKey] || scoreResults.recommendedModel;

  // Render SVG Pie/Donut Chart for active model
  const renderDonutChart = () => {
    const m = activeModel;
    const slices = [
      { name: 'Cash', value: m.cashEquivalents, color: '#71717a' },
      { name: 'Fixed Income', value: m.fixedIncome, color: '#3b82f6' },
      { name: 'Domestic Equities', value: m.domesticEquities, color: '#10b981' },
      { name: 'International Equities', value: m.internationalEquities, color: '#059669' },
      { name: 'Other Assets', value: m.otherAssets, color: '#0284c7' }
    ].filter(s => s.value > 0);

    let cumulativePercent = 0;
    const size = 150;
    const radius = 50;
    const cx = size / 2;
    const cy = size / 2;

    const getCoordinatesForPercent = (percent: number) => {
      const x = cx + radius * Math.cos(2 * Math.PI * percent - Math.PI / 2);
      const y = cy + radius * Math.sin(2 * Math.PI * percent - Math.PI / 2);
      return [x, y];
    };

    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40 mx-auto">
        {slices.map((slice, idx) => {
          const startPercent = cumulativePercent;
          cumulativePercent += slice.value / 100;
          const endPercent = cumulativePercent;

          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(endPercent);

          const largeArcFlag = slice.value > 50 ? 1 : 0;

          const pathData = [
            `M ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L ${cx} ${cy}`,
            'Z'
          ].join(' ');

          return (
            <path
              key={idx}
              d={pathData}
              fill={slice.color}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}
        {/* Hollow center for donut effect */}
        <circle cx={cx} cy={cy} r={32} fill="#ffffff" />
        <text cx={cx} cy={cy} x={cx} y={cy + 4} textAnchor="middle" className="text-[9px] font-black fill-zinc-700 font-sans">
          ALLOCATION
        </text>
      </svg>
    );
  };

  return (
    <div id="risk-questionnaire-container" className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          Step 8: Risk-Tolerance Questionnaire
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Evaluate your risk threshold. We mathematically isolate your psychological risk willingness from your structural financial capacity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Questionnaire items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Psychological Willingness (3 questions) */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-blue-600 rounded-xs"></span>
              Psychological Risk Willingness (Mindset)
            </h3>

            {/* Q1: Experience */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-800 block">1. What is your prior level of stock/bond investment experience?</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { s: 1, l: "None / Cash Only" },
                  { s: 2, l: "Very Little" },
                  { s: 3, l: "Moderate (Mutual Funds)" },
                  { s: 4, l: "Experienced" },
                  { s: 5, l: "Active Trader" }
                ].map(opt => (
                  <button
                    key={opt.s}
                    type="button"
                    onClick={() => updateQuestion('experience', opt.s)}
                    className={`p-2 text-center rounded-lg border text-[10px] font-medium leading-tight cursor-pointer transition-all ${
                      risk.experience === opt.s 
                        ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-bold' 
                        : 'bg-white/60 border-zinc-200/80 text-zinc-600 hover:bg-white'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Decline Reaction */}
            <div className="space-y-2 pt-2 border-t border-zinc-200/60">
              <span className="text-xs font-semibold text-zinc-800 block">2. If your portfolio declined by 20% over 3 months, how would you react?</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { s: 1, l: "Sell All Immediately" },
                  { s: 2, l: "Sell Some / Cautious" },
                  { s: 3, l: "Do Nothing / Wait" },
                  { s: 4, l: "Buy More Assets" },
                  { s: 5, l: "Leverage / Double Down" }
                ].map(opt => (
                  <button
                    key={opt.s}
                    type="button"
                    onClick={() => updateQuestion('reactionToDecline', opt.s)}
                    className={`p-2 text-center rounded-lg border text-[10px] font-medium leading-tight cursor-pointer transition-all ${
                      risk.reactionToDecline === opt.s 
                        ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-bold' 
                        : 'bg-white/60 border-zinc-200/80 text-zinc-600 hover:bg-white'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Max Tolerable Loss */}
            <div className="space-y-2 pt-2 border-t border-zinc-200/60">
              <span className="text-xs font-semibold text-zinc-800 block">3. What is the maximum paper loss you could tolerate in a single year?</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { s: 1, l: "No loss tolerable (0%)" },
                  { s: 2, l: "Small decline (-5%)" },
                  { s: 3, l: "Moderate decline (-15%)" },
                  { s: 4, l: "Heavy decline (-25%)" },
                  { s: 5, l: "Unrestricted (-40%+)" }
                ].map(opt => (
                  <button
                    key={opt.s}
                    type="button"
                    onClick={() => updateQuestion('maxLossTolerable', opt.s)}
                    className={`p-2 text-center rounded-lg border text-[10px] font-medium leading-tight cursor-pointer transition-all ${
                      risk.maxLossTolerable === opt.s 
                        ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-bold' 
                        : 'bg-white/60 border-zinc-200/80 text-zinc-600 hover:bg-white'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Structural Capacity (5 questions) */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-blue-600 rounded-xs"></span>
              Structural Risk Capacity (Timeline & Financial Safety)
            </h3>

            {/* Q1: Time horizon */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-800 block">4. What is your investment timeline until retirement?</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { s: 1, l: "Under 2 years" },
                  { s: 2, l: "2 - 5 years" },
                  { s: 3, l: "5 - 10 years" },
                  { s: 4, l: "10 - 15 years" },
                  { s: 5, l: "Over 15 years" }
                ].map(opt => (
                  <button
                    key={opt.s}
                    type="button"
                    onClick={() => updateQuestion('timeHorizon', opt.s)}
                    className={`p-2 text-center rounded-lg border text-[10px] font-medium leading-tight cursor-pointer transition-all ${
                      risk.timeHorizon === opt.s 
                        ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-bold' 
                        : 'bg-white/60 border-zinc-200/80 text-zinc-600 hover:bg-white'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Income stability */}
            <div className="space-y-2 pt-2 border-t border-zinc-200/60">
              <span className="text-xs font-semibold text-zinc-800 block">5. How would you rate the stability of your current household income?</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { s: 1, l: "Highly Unstable" },
                  { s: 2, l: "Commission / Gig based" },
                  { s: 3, l: "Average Stability" },
                  { s: 4, l: "Stable Salaried" },
                  { s: 5, l: "Contractual / Government" }
                ].map(opt => (
                  <button
                    key={opt.s}
                    type="button"
                    onClick={() => updateQuestion('incomeStability', opt.s)}
                    className={`p-2 text-center rounded-lg border text-[10px] font-medium leading-tight cursor-pointer transition-all ${
                      risk.incomeStability === opt.s 
                        ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-bold' 
                        : 'bg-white/60 border-zinc-200/80 text-zinc-600 hover:bg-white'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Emergency Reserves */}
            <div className="space-y-2 pt-2 border-t border-zinc-200/60">
              <span className="text-xs font-semibold text-zinc-800 block">6. Do you possess separate liquid emergency cash reserves?</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { s: 1, l: "No reserves" },
                  { s: 2, l: "Under 1 Month" },
                  { s: 3, l: "1 - 3 Months" },
                  { s: 4, l: "3 - 6 Months" },
                  { s: 5, l: "Over 6 Months Cash" }
                ].map(opt => (
                  <button
                    key={opt.s}
                    type="button"
                    onClick={() => updateQuestion('emergencyReserves', opt.s)}
                    className={`p-2 text-center rounded-lg border text-[10px] font-medium leading-tight cursor-pointer transition-all ${
                      risk.emergencyReserves === opt.s 
                        ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-bold' 
                        : 'bg-white/60 border-zinc-200/80 text-zinc-600 hover:bg-white'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Q4: Short Term Access */}
            <div className="space-y-2 pt-2 border-t border-zinc-200/60">
              <span className="text-xs font-semibold text-zinc-800 block">7. Will you require access to these investment funds before retirement?</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { s: 5, l: "Yes, within 2 years" },
                  { s: 4, l: "Yes, within 5 years" },
                  { s: 3, l: "Unsure / Possibly" },
                  { s: 2, l: "Highly Unlikely" },
                  { s: 1, l: "Strictly Retirement Only" }
                ].map(opt => (
                  <button
                    key={opt.s}
                    type="button"
                    // ShortTermAccess is stored as raw value, calculations reversed it
                    onClick={() => updateQuestion('shortTermAccess', opt.s)}
                    className={`p-2 text-center rounded-lg border text-[10px] font-medium leading-tight cursor-pointer transition-all ${
                      risk.shortTermAccess === opt.s 
                        ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-bold' 
                        : 'bg-white/60 border-zinc-200/80 text-zinc-600 hover:bg-white'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Q5: Portfolio Dependence */}
            <div className="space-y-2 pt-2 border-t border-zinc-200/60">
              <span className="text-xs font-semibold text-zinc-800 block">8. What is your expected dependence on this portfolio for primary living expenses in retirement?</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { s: 5, l: "Complete (100% reliant)" },
                  { s: 4, l: "High (50%+ reliant)" },
                  { s: 3, l: "Moderate (20%-50%)" },
                  { s: 2, l: "Low (supplementary)" },
                  { s: 1, l: "None (legacy only)" }
                ].map(opt => (
                  <button
                    key={opt.s}
                    type="button"
                    onClick={() => updateQuestion('portfolioDependence', opt.s)}
                    className={`p-2 text-center rounded-lg border text-[10px] font-medium leading-tight cursor-pointer transition-all ${
                      risk.portfolioDependence === opt.s 
                        ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-bold' 
                        : 'bg-white/60 border-zinc-200/80 text-zinc-600 hover:bg-white'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scoring Outcomes & Model Pie Chart */}
        <div className="space-y-6">
          <div className="glass-panel-dark text-white p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-blue-400">Diagnostic Scoring</h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Risk Willingness (Mindset):</span>
                  <span className="font-bold font-mono text-blue-400">{scoreResults.willingnessScore}/100</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${scoreResults.willingnessScore}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Risk Capacity (Financials):</span>
                  <span className="font-bold font-mono text-emerald-400">{scoreResults.capacityScore}/100</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${scoreResults.capacityScore}%` }}></div>
                </div>
              </div>

              <div className="border-t border-zinc-700/60 pt-2 text-center">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">Recommended Model Allocation</span>
                <span className="text-base font-black text-blue-400 block mt-1">{scoreResults.recommendedModel.name}</span>
              </div>
            </div>
          </div>

          {/* Asset Allocation Donut Visualizer */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-4 text-center">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wide">Model Asset Layout</h4>
            {renderDonutChart()}
            
            <div className="text-left text-[11px] text-zinc-600 space-y-1 bg-white/50 backdrop-blur-xs p-2.5 rounded-lg border border-zinc-200/80">
              <span className="font-bold text-zinc-800 block">{activeModel.name} description:</span>
              <p className="leading-relaxed">{activeModel.description}</p>
              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-zinc-200 text-[10px] font-mono text-zinc-600 mt-1.5">
                <span>Domestic Equities: <strong>{activeModel.domesticEquities}%</strong></span>
                <span>Fixed Income: <strong>{activeModel.fixedIncome}%</strong></span>
                <span>Int'l Equities: <strong>{activeModel.internationalEquities}%</strong></span>
                <span>Cash/CDs: <strong>{activeModel.cashEquivalents}%</strong></span>
              </div>
            </div>
          </div>

          {/* Model override section */}
          <div className="glass-panel-subtle p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wide">Model Custom Override</h4>
            <p className="text-[11px] text-zinc-500">
              You can override the mathematically recommended model if you prefer a different risk level.
            </p>

            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded-sm mt-0.5"
                checked={risk.overrideModel}
                onChange={(e) => handleModelOverrideToggle(e.target.checked)}
              />
              <span className="text-xs text-zinc-700 leading-tight">I wish to override my recommended model allocation.</span>
            </label>

            {risk.overrideModel && (
              <div className="space-y-3 p-3 bg-zinc-100/70 border border-zinc-200 rounded-xl animate-fadeIn">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded-sm mt-0.5"
                    checked={acknowledgedOverride}
                    onChange={(e) => setAcknowledgedOverride(e.target.checked)}
                  />
                  <span className="text-[10px] text-zinc-700 leading-tight">
                    I acknowledge that risk recommendations are educational guides and override choices are entirely self-directed.
                  </span>
                </label>

                {acknowledgedOverride && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-zinc-600 block font-bold">Select target model:</span>
                    <select
                      className="w-full px-2 py-1 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white/80"
                      value={risk.selectedModelOverride}
                      onChange={(e) => handleOverrideSelection(e.target.value)}
                    >
                      {Object.keys(ALLOCATION_MODELS).map(key => (
                        <option key={key} value={key}>{ALLOCATION_MODELS[key].name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
