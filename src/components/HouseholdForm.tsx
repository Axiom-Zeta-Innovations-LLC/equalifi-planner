/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HouseholdProfile, Dependent } from '../types';
import { Users, User, Calendar, Plus, Trash2, HelpCircle } from 'lucide-react';

interface HouseholdFormProps {
  data: HouseholdProfile;
  onChange: (updated: HouseholdProfile) => void;
}

const STATES_LIST = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", 
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", 
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
  "West Virginia", "Wisconsin", "Wyoming"
];

export default function HouseholdForm({ data, onChange }: HouseholdFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Validate on load / change
    if (data.currentAge <= 0) {
      setError("Current age must be greater than zero.");
    } else if (data.retirementAge <= data.currentAge) {
      setError("Retirement age must be greater than current age.");
    } else if (data.lifeExpectancy <= data.retirementAge) {
      setError("Life expectancy must be greater than retirement age.");
    } else if (data.hasSpouse && data.spouseAge <= 0) {
      setError("Spouse/partner age must be greater than zero.");
    } else if (data.hasSpouse && data.spouseRetirementAge <= data.spouseAge) {
      setError("Spouse/partner retirement age must be greater than their current age.");
    } else {
      setError(null);
    }
  }, [data]);

  const updateField = (field: keyof HouseholdProfile, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleSpouseToggle = (checked: boolean) => {
    onChange({
      ...data,
      hasSpouse: checked,
      spouseAge: checked ? data.currentAge : 0,
      spouseRetirementAge: checked ? data.retirementAge : 0,
      filingStatus: checked ? 'married_joint' : 'single'
    });
  };

  const addDependent = () => {
    const newDeps = [...data.dependents, { id: 'dep-' + Date.now(), age: 5 }];
    onChange({
      ...data,
      dependentsCount: newDeps.length,
      dependents: newDeps
    });
  };

  const removeDependent = (id: string) => {
    const newDeps = data.dependents.filter(d => d.id !== id);
    onChange({
      ...data,
      dependentsCount: newDeps.length,
      dependents: newDeps
    });
  };

  const updateDependentAge = (id: string, age: number) => {
    const newDeps = data.dependents.map(d => d.id === id ? { ...d, age: Math.max(0, age) } : d);
    onChange({
      ...data,
      dependents: newDeps
    });
  };

  return (
    <div id="household-form-container" className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Step 1: Household Profile
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Tell us about your household structure. These parameters set the timeline and tax parameters for your retirement models.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-zinc-100 border border-zinc-300 text-zinc-800 text-sm rounded-lg flex items-center gap-2">
          <span className="font-semibold text-blue-600">Timeline Alert:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Core Identity */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Household or Primary Planner Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 bg-white/70 backdrop-blur-xs"
              value={data.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. The Taylor Family"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Your Current Age
              </label>
              <input
                type="number"
                min="1"
                max="120"
                className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 bg-white/70 backdrop-blur-xs"
                value={data.currentAge || ''}
                onChange={(e) => updateField('currentAge', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Target Retirement Age
              </label>
              <input
                type="number"
                min="1"
                max="120"
                className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 bg-white/70 backdrop-blur-xs"
                value={data.retirementAge || ''}
                onChange={(e) => updateField('retirementAge', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center gap-1">
                Longevity Planning Age
                <span className="group relative cursor-pointer text-zinc-400 hover:text-zinc-600">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-10 font-normal leading-normal">
                    The age to which your assets must support you. Generally recommended to use 90 or 95 to prevent outliving your money.
                  </span>
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 bg-white/70 backdrop-blur-xs"
                value={data.lifeExpectancy || ''}
                onChange={(e) => updateField('lifeExpectancy', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                State of Residence (Optional)
              </label>
              <select
                className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 bg-white/70 backdrop-blur-xs"
                value={data.stateOfResidence}
                onChange={(e) => updateField('stateOfResidence', e.target.value)}
              >
                <option value="">Select State...</option>
                {STATES_LIST.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200/70">
            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-zinc-300 rounded-sm focus:ring-blue-500 accent-blue-600"
                checked={data.hasSpouse}
                onChange={(e) => handleSpouseToggle(e.target.checked)}
              />
              <span className="text-sm font-medium text-zinc-800">Include Spouse / Domestic Partner</span>
            </label>
          </div>

          {data.hasSpouse && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-white/50 backdrop-blur-xs rounded-xl border border-zinc-200/80 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Spouse Current Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 bg-white/70 backdrop-blur-xs"
                  value={data.spouseAge || ''}
                  onChange={(e) => updateField('spouseAge', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Spouse Retirement Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 bg-white/70 backdrop-blur-xs"
                  value={data.spouseRetirementAge || ''}
                  onChange={(e) => updateField('spouseRetirementAge', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Financial Profile & Dependents */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Tax Filing Status
            </label>
            <select
              className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 bg-white/70 backdrop-blur-xs"
              value={data.filingStatus}
              onChange={(e) => updateField('filingStatus', e.target.value as any)}
            >
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_household">Head of Household</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Gross Household Income ($ / Year)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs"
                value={data.currentIncome || ''}
                onChange={(e) => updateField('currentIncome', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Expected Annual Salary Growth (%)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs"
                value={data.incomeGrowth}
                onChange={(e) => updateField('incomeGrowth', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center gap-1">
              Estimated Marginal Tax Rate (%)
              <span className="group relative cursor-pointer text-zinc-400 hover:text-zinc-600">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-10 font-normal leading-normal">
                  Your top tax bracket (Federal + State). Used to estimate net take-home cash flow.
                </span>
              </span>
            </label>
            <input
              type="number"
              min="0"
              max="60"
              className="w-full px-3 py-2 border border-zinc-300/80 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-zinc-900 font-mono bg-white/70 backdrop-blur-xs"
              value={data.marginalTaxRate || ''}
              onChange={(e) => updateField('marginalTaxRate', parseInt(e.target.value) || 0)}
              placeholder="e.g. 22"
            />
          </div>

          {/* Dependents list */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-700">Dependents & Kids ({data.dependentsCount})</span>
              <button
                type="button"
                onClick={addDependent}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Dependent
              </button>
            </div>

            {data.dependents.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No dependents registered.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {data.dependents.map((dep, idx) => (
                  <div key={dep.id} className="flex items-center justify-between p-2 bg-white/50 backdrop-blur-xs border border-zinc-200/80 rounded-lg gap-2">
                    <span className="text-xs text-zinc-600 font-medium">Child #{idx + 1} Age</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="26"
                        className="w-16 px-1.5 py-1 text-center border border-zinc-300/80 rounded-md text-xs text-zinc-900 font-mono bg-white/70"
                        value={dep.age}
                        onChange={(e) => updateDependentAge(dep.id, parseInt(e.target.value) || 0)}
                      />
                      <button
                        type="button"
                        onClick={() => removeDependent(dep.id)}
                        className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
