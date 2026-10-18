import React, { useState } from 'react';
import {
  Layers,
  GitBranch,
  FileSpreadsheet,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Search,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type StudioView = 'pfd' | 'pfmea' | 'control_plan' | 'dashboard';

export const FmeaStudioPreview: React.FC<{ compact?: boolean }> = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<StudioView>('pfmea');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleLaunch = () => {
    navigate('/app/projects');
  };

  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden text-left font-sans text-slate-800">
      {/* ── 1. Top Browser Chrome Bar ──────────────────────── */}
      <div className="px-4 py-3 bg-[#f8fafc] border-b border-slate-200 flex items-center justify-between gap-4">
        {/* Left: Window Controls */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]/80 border border-[#dc2626]" />
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]/80 border border-[#d97706]" />
          <div className="w-3 h-3 rounded-full bg-[#10b981]/80 border border-[#059669]" />
        </div>

        {/* Center: Real App URL Address Bar */}
        <div className="flex-1 max-w-[580px] hidden sm:flex items-center justify-center">
          <div className="w-full h-8 px-3 rounded-lg bg-white border border-slate-200 flex items-center gap-2 text-xs text-slate-500 shadow-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="font-mono text-slate-700 truncate">
              https://app.fmeapex.online/app/
              {activeView === 'pfd'
                ? 'pfd/c439cfbe'
                : activeView === 'pfmea'
                ? 'pfmea/c439cfbe'
                : activeView === 'control_plan'
                ? 'control-plan/c439cfbe'
                : 'projects'}
            </span>
          </div>
        </div>

        {/* Right: Launch App Action */}
        <button
          onClick={handleLaunch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
        >
          <span>Open Live Workspace</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#FF5500]" />
        </button>
      </div>

      {/* ── 2. Real App Shell Header Bar ───────────────────── */}
      <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 tracking-tight text-[13px]">
            <span className="text-slate-400 font-normal">/</span>
            <span className="text-slate-900 font-extrabold tracking-tight">FMEApex</span>
            <span className="hidden md:inline-block ml-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-normal text-[11px]">
              Quality Workspace
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 text-slate-500">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-[11px]">
              <Search className="w-3 h-3 text-slate-400" />
              <span>Search programs, causes...</span>
              <kbd className="ml-2 font-mono text-[9px] bg-slate-200/70 px-1 rounded text-slate-600">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Project Context & User Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>AIAG-VDA 2019 AP Gated</span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center">
              QE
            </div>
            <div className="hidden sm:block text-[11px] font-semibold text-slate-800 leading-tight">
              Quality Lead
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Real Project Document Subheader ──────────────── */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#fafafa] border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-900 text-[13px]">E vacuum pump</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 font-mono text-[11px]">Part No: 861000000</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 text-[11px]">Rev: 1.0</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 text-[11px]">Cust: TML</span>
          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
            PROTOTYPE (SAFE LAUNCH)
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <span>AIAG-VDA 7-Step Verified</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />
        </div>
      </div>

      {/* ── 4. Real App Navigation Tabs ────────────────────── */}
      <div className="px-4 sm:px-6 pt-2 bg-white border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('pfd')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-semibold border-b-2 transition-all ${
              activeView === 'pfd'
                ? 'border-[#FF5500] text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-blue-600" />
            <span>Process Flow Diagram (PFD)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
              12
            </span>
          </button>

          <button
            onClick={() => setActiveView('pfmea')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-semibold border-b-2 transition-all ${
              activeView === 'pfmea'
                ? 'border-[#FF5500] text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>PFMEA 7-Step Grid</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
              AIAG-VDA
            </span>
          </button>

          <button
            onClick={() => setActiveView('control_plan')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-semibold border-b-2 transition-all ${
              activeView === 'control_plan'
                ? 'border-[#FF5500] text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
            <span>Control Plan (CP) Sync</span>
          </button>

          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-semibold border-b-2 transition-all ${
              activeView === 'dashboard'
                ? 'border-[#FF5500] text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" />
            <span>Workspace Overview</span>
          </button>
        </div>

        {/* View Actions */}
        <div className="hidden sm:flex items-center gap-2 pb-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Click tabs to inspect actual internal screens</span>
        </div>
      </div>

      {/* ── 5. Actual Screen Content Views ─────────────────── */}
      <div className="bg-white overflow-x-auto min-h-[380px]">
        {/* VIEW A: Process Flow Diagram (PFD) — Exact match to Image 1 */}
        {activeView === 'pfd' && (
          <div className="min-w-[980px]">
            {/* PFD Table Top Controls */}
            <div className="px-4 py-2 bg-slate-50/60 border-b border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Table View (12 Steps)</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 text-[11px]">Default Collapsed Ergonomic State</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setExpandedSteps({ 'op-10': true, 'op-20': true, 'op-0b': true, 'op-0c': true, 'op-30': true })}
                  className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px]"
                >
                  Expand All
                </button>
                <button
                  onClick={() => setExpandedSteps({})}
                  className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px]"
                >
                  Collapse All
                </button>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 w-16">STEP #</th>
                  <th className="py-2.5 px-3 min-w-[160px]">PROCESS DESCRIPTION</th>
                  <th className="py-2.5 px-3 min-w-[180px]">INCOMING SOURCE OF VARIATION</th>
                  <th className="py-2.5 px-2 w-16 text-center">SPEC. CLASS</th>
                  <th className="py-2.5 px-2 w-24 text-center">FLOW SYMBOLS</th>
                  <th className="py-2.5 px-3 min-w-[200px]">MACHINES / EQUIPMENT / DOCS</th>
                  <th className="py-2.5 px-3 min-w-[190px]">DESIRED OUTCOME</th>
                  <th className="py-2.5 px-3 min-w-[170px]">PROCESS CHARACTERISTICS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* OP10 */}
                <tr
                  onClick={() => toggleStep('op-10')}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 font-bold font-mono text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {expandedSteps['op-10'] ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                      <span>OP10</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">Bush Pressing</td>
                  <td className="py-2 px-3 text-slate-600">
                    {expandedSteps['op-10'] ? (
                      <div className="space-y-0.5">
                        <div>1. Child part variation</div>
                        <div>2. Fixture parameter</div>
                        <div>3. Pokayoke interlock</div>
                      </div>
                    ) : (
                      <span className="text-slate-500 truncate block max-w-[220px]">1. Child part variation, 2. Fixture...</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px]">SC</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded-full border border-slate-300 font-mono font-bold text-[10px] text-slate-700">WIP</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {expandedSteps['op-10'] ? (
                      <div className="space-y-0.5">
                        <div>1. Servo press HP-04</div>
                        <div>2. Part resting fixture</div>
                        <div>3. Vision system calibration</div>
                      </div>
                    ) : (
                      <span className="text-slate-500 truncate block max-w-[220px]">1. Servo press, 2. Part resting fixture...</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="truncate block max-w-[200px]">1. Assembly: All child parts in correct orientation</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="font-mono text-[11px] text-slate-700">1. Air pressure = 5~6 bar</span>
                  </td>
                </tr>

                {/* OP20 */}
                <tr
                  onClick={() => toggleStep('op-20')}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors bg-slate-50/30"
                >
                  <td className="py-2 px-3 font-bold font-mono text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {expandedSteps['op-20'] ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                      <span>OP20</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">Pump Assembly in vacuum pump</td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="text-slate-500 truncate block max-w-[220px]">1. Child part variation, 2. Fixture No-, 3. Machine...</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono font-bold text-[10px]">CC</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="px-1 py-0.2 rounded-full border border-slate-300 text-[9px] font-mono">OPER</span>
                      <span className="px-1 py-0.2 rounded-full border border-slate-300 text-[9px] font-mono">INSP</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="text-slate-500 truncate block max-w-[220px]">1. Pokayoke no, 2. Part resting fixture, 3. Nutrunner...</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="truncate block max-w-[200px]">1. Screw tightening torque = 2.5Nm ~ 4Nm</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="font-mono text-[11px] text-slate-700">1. Air pressure: 4.5~7.2 bar</span>
                  </td>
                </tr>

                {/* OP # 0B */}
                <tr
                  onClick={() => toggleStep('op-0b')}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 font-bold font-mono text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {expandedSteps['op-0b'] ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                      <span>OP # 0B</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">Receiving inspection</td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="text-slate-500 truncate block max-w-[220px]">Non conforming parts from supplier</span>
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400">—</td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-1 py-0.2 rounded-full border border-slate-300 text-[9px] font-mono">INSP</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="text-slate-500 truncate block max-w-[220px]">1. CMM, 2. Digital vernier calliper, 3. Micrometer...</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="truncate block max-w-[200px]">Part should be OK as per respective drawings</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="text-slate-500">1. Supplier processes, 2. Material handling</span>
                  </td>
                </tr>

                {/* OP # 0C */}
                <tr
                  onClick={() => toggleStep('op-0c')}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors bg-slate-50/30"
                >
                  <td className="py-2 px-3 font-bold font-mono text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {expandedSteps['op-0c'] ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                      <span>Op # 0C</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">Storage</td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="text-slate-500 truncate block max-w-[220px]">1. Storage location not available, 2. FIFO not maintained</span>
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400">—</td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-1 py-0.2 rounded-full border border-slate-300 text-[9px] font-mono">STOR</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="text-slate-500 truncate block max-w-[220px]">1. SAP system, 2. Batch sticker printing system</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="truncate block max-w-[200px]">Part should be placed at specified location</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="text-slate-500">1. FIFO maintained per SAP updating system</span>
                  </td>
                </tr>

                {/* OP30 */}
                <tr
                  onClick={() => toggleStep('op-30')}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 font-bold font-mono text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {expandedSteps['op-30'] ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                      <span>OP30</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">Bush pressing & pump assy</td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="text-slate-500 truncate block max-w-[220px]">1. Child parts not as per Drawing, 2. PLC parameter</span>
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400">—</td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-1 py-0.2 rounded-full border border-slate-300 text-[9px] font-mono">OPER</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="text-slate-500 truncate block max-w-[220px]">1. Work Instructions, 2. Pressing fixture, 3. Vision...</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="truncate block max-w-[200px]">Distance from shaft top face = 11.9~12.0 mm</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <span className="font-mono text-[11px] text-slate-700">Final load = 170 ~ 210 kg</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW B: PFMEA 7-Step Grid — Real AIAG-VDA Engineering Analysis */}
        {activeView === 'pfmea' && (
          <div className="min-w-[1040px]">
            {/* Step 2-6 Header Grouping */}
            <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-200 text-[10px] font-bold font-mono text-slate-600 uppercase tracking-wider py-1.5 px-3">
              <div className="col-span-2">STEP 2: STRUCTURE ANALYSIS</div>
              <div className="col-span-4">STEP 4: FAILURE CHAIN (CAUSE → MODE → EFFECT)</div>
              <div className="col-span-3">STEP 5: RISK & ACTION PRIORITY (AP)</div>
              <div className="col-span-3">STEP 6: OPTIMIZATION & ACTIONS</div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 w-16">OP #</th>
                  <th className="py-2.5 px-3 w-44">4M / WORK ELEMENT</th>
                  <th className="py-2.5 px-3 min-w-[170px]">FAILURE MODE (FM)</th>
                  <th className="py-2.5 px-3 min-w-[170px]">FAILURE EFFECT (FE)</th>
                  <th className="py-2.5 px-1.5 w-10 text-center font-mono">S</th>
                  <th className="py-2.5 px-3 min-w-[170px]">FAILURE CAUSE (FC)</th>
                  <th className="py-2.5 px-1.5 w-10 text-center font-mono">O</th>
                  <th className="py-2.5 px-3 min-w-[170px]">DETECTION CONTROL</th>
                  <th className="py-2.5 px-1.5 w-10 text-center font-mono">D</th>
                  <th className="py-2.5 px-2 w-16 text-center">AP</th>
                  <th className="py-2.5 px-3 min-w-[210px]">CORRECTIVE ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Row 1: OP10 */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">OP10</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold mr-1.5">Machine</span>
                    <span className="font-semibold text-slate-900 text-xs">Servo Press HP-04</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-800">Bearing seated below minimum press depth (&lt;45.1mm)</td>
                  <td className="py-2.5 px-3 text-slate-600">Rotor axial play, motor noise (FE-01)</td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-slate-900">8</td>
                  <td className="py-2.5 px-3 text-slate-600">Load cell drift &gt; 2.5% during continuous cycling</td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-slate-900">3</td>
                  <td className="py-2.5 px-3 text-slate-600">In-situ displacement LVDT sensor at stroke end</td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-slate-900">3</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px] font-mono border border-amber-300">
                      MED
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-900 leading-tight">Dynamic closed-loop servo press integration</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Owner: M. Weber • Status: Verified</div>
                  </td>
                </tr>

                {/* Row 2: OP20 */}
                <tr className="hover:bg-slate-50/80 transition-colors bg-red-50/20">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">OP20</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold mr-1.5">Machine</span>
                    <span className="font-semibold text-slate-900 text-xs">Atlas Copco Nutrunner</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 font-medium">Fastener under-torqued (&lt;2.5 Nm clamp load)</td>
                  <td className="py-2.5 px-3 text-slate-600">Stator housing vibration, loose ground connection (FE-02)</td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-rose-700">9</td>
                  <td className="py-2.5 px-3 text-slate-600">Angle encoder slip or friction variation on bolt threads</td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-slate-900">4</td>
                  <td className="py-2.5 px-3 text-slate-600">Angle-monitoring torque window (Torque + Angle)</td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-slate-900">4</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[11px] font-mono border border-rose-300">
                      HIGH
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-900 leading-tight">Mandatory torque-angle signature logging in MES</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Owner: K. Patel • Status: InProgress</div>
                  </td>
                </tr>

                {/* Row 3: OP30 */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">OP30</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold mr-1.5">Method</span>
                    <span className="font-semibold text-slate-900 text-xs">Pressing & Pump Assy</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-800">Rotor shaft misaligned during bush insertion</td>
                  <td className="py-2.5 px-3 text-slate-600">Increased current draw, premature pump bearing wear</td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-slate-900">7</td>
                  <td className="py-2.5 px-3 text-slate-600">Manual positioning fixture wear / operator variation</td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-slate-900">3</td>
                  <td className="py-2.5 px-3 text-slate-600">Poka-yoke guide pin + optical sensor confirmation</td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-slate-900">2</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] font-mono border border-emerald-300">
                      LOW
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-900 leading-tight">Hardened guide pin installation with automated interlock</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Owner: S. Tanaka • Status: Verified</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW C: Control Plan (CP) Sync */}
        {activeView === 'control_plan' && (
          <div className="min-w-[980px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 w-16">STEP #</th>
                  <th className="py-2.5 px-3 min-w-[150px]">OPERATION NAME</th>
                  <th className="py-2.5 px-3 min-w-[170px]">CHARACTERISTIC</th>
                  <th className="py-2.5 px-2 w-16 text-center">CLASS</th>
                  <th className="py-2.5 px-3 min-w-[180px]">SPECIFICATION / TOLERANCE</th>
                  <th className="py-2.5 px-3 min-w-[170px]">EVALUATION TECHNIQUE</th>
                  <th className="py-2.5 px-3 min-w-[140px]">SAMPLE SIZE / FREQ</th>
                  <th className="py-2.5 px-3 min-w-[180px]">REACTION PLAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">OP10</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Bush Pressing</td>
                  <td className="py-2.5 px-3 text-slate-700">Bush insertion depth</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px]">SC</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">45.2 ± 0.1 mm</td>
                  <td className="py-2.5 px-3 text-slate-600">Linear Variable Displacement Transducer (LVDT)</td>
                  <td className="py-2.5 px-3 text-slate-600">100% in-line automated</td>
                  <td className="py-2.5 px-3 text-slate-600">Auto-reject to locked bin; alert line supervisor</td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">OP20</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Pump Assembly</td>
                  <td className="py-2.5 px-3 text-slate-700">Fastener tightening torque</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono font-bold text-[10px]">CC</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">2.5 Nm ~ 4.0 Nm</td>
                  <td className="py-2.5 px-3 text-slate-600">Calibrated Multi-Spindle Nutrunner Transducer</td>
                  <td className="py-2.5 px-3 text-slate-600">100% continuous cycle logging</td>
                  <td className="py-2.5 px-3 text-slate-600">Interlock stops conveyor; manual inspection required</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW D: Quality Workspace Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="p-4 sm:p-6 bg-slate-50/60 min-w-[760px]">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Active Programs</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">1</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% tenant-isolated</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Production Phase</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">Safe Launch</div>
                <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Prototypes & Launches</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Audit Readiness</div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">99.8%</div>
                <div className="text-[11px] text-slate-500 mt-0.5">21 CFR Part 11 compliant</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">AIAG-VDA Gating</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">Enforced</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Zero skipped phases</div>
              </div>
            </div>

            {/* Recent Activity List preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-slate-900 text-xs">Recent Quality Engineering Activity</div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Live Audit Trail</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center">G</div>
                    <div>
                      <span className="font-semibold text-slate-900">PFMEA Revision v1.0 Created</span>
                      <span className="text-slate-500 ml-2">Program: E vacuum pump • AIAG-VDA 2019 AP Gated</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">Just now</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">LT</div>
                    <div>
                      <span className="font-semibold text-slate-900">Control Plan Synchronized</span>
                      <span className="text-slate-500 ml-2">Program: E vacuum pump • Inspection frequency verified</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">1h ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 6. Bottom Status Footer ────────────────────────── */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#f8fafc] border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            AIAG-VDA 2019 7-Step Gating: <strong className="text-slate-900">100% Enforced</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-[11px] text-slate-500">PostgreSQL 15 RLS Isolated • 21 CFR Part 11</span>
        </div>

        <button
          onClick={handleLaunch}
          className="font-semibold text-[#FF5500] hover:text-[#e04b00] flex items-center gap-1 text-xs"
        >
          <span>Try with live interactive demo data</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default FmeaStudioPreview;
