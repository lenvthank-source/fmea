import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  XCircle,
  GitBranch
} from 'lucide-react';

interface CalloutItem {
  id: string;
  title: string;
  excelProblem: string;
  fmeapexSolution: string;
}

const COMPARISON_ITEMS: CalloutItem[] = [
  {
    id: 'flawed-rpn',
    title: 'Flawed RPN Hides Lethal Hazards',
    excelProblem: 'Severity 9 defect with low occurrence (O=2, D=2) yields RPN 36. An arbitrary <100 cutoff skips it during review.',
    fmeapexSolution: 'AIAG-VDA 2019 prioritizes Severity first. A Severity 9 defect automatically lands in HIGH AP, mandating corrective action.'
  },
  {
    id: 'broken-formula',
    title: 'Formula Corruption & Broken Links',
    excelProblem: 'Accidental cell edits cause #REF! and #VALUE! errors across 50 columns without any change history or rollback.',
    fmeapexSolution: 'Calculations and Action Priority lookups are locked in the PostgreSQL database schema and cannot be corrupted.'
  },
  {
    id: 'orphan-steps',
    title: 'Disconnected PFD & Control Plan',
    excelProblem: 'PFD, PFMEA, and Control Plan live in separate .xlsx files. Edits in one sheet are forgotten in the others.',
    fmeapexSolution: 'Serializable bidirectional synchronization propagates tolerance edits across PFD, PFMEA, and Control Plan instantly.'
  },
  {
    id: 'version-chaos',
    title: 'Version Sprawl & Audit Finding',
    excelProblem: 'Rev4_final_v2_copy.xlsx emailed between engineers leads to out-of-date drawings and major OEM audit citations.',
    fmeapexSolution: '21 CFR Part 11 cryptographic SHA-256 digital signatures lock revisions permanently in an immutable audit ledger.'
  }
];

export const ExcelRetirementShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'excel' | 'fmeapex' | 'compare'>('compare');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeCallout, setActiveCallout] = useState<string>('flawed-rpn');

  // Auto-cycle through views if isPlaying is true
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === 'compare') return 'excel';
        if (prev === 'excel') return 'fmeapex';
        return 'compare';
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden font-sans">
      {/* ── 1. Clean Minimalist Header ──────────────────────── */}
      <div className="flex flex-wrap items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-200/80 bg-slate-50/60 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/20 flex items-center justify-center text-[#FF5500]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF5500]">
              The Quality Transformation
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
              Retiring Fragile FMEA Excel Sheets
            </h3>
          </div>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-200/70 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('excel');
                setIsPlaying(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'excel'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Old Excel Sheet</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('compare');
                setIsPlaying(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'compare'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('fmeapex');
                setIsPlaying(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'fmeapex'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>FMEApex Engine</span>
            </button>
          </div>

          {/* Autoplay / Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause auto-cycle' : 'Play auto-cycle'}
            className={`p-2 rounded-xl border transition-colors ${
              isPlaying
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── 2. Clean Light Canvas (Full Width) ──────────────── */}
      <div className="p-4 sm:p-6 lg:p-8 bg-slate-50/40">
        {/* ── VIEW A: OLD EXCEL SHEET (Clean Full-Width Mockup) */}
        {activeTab === 'excel' && (
          <div className="rounded-xl border border-rose-200 bg-white overflow-hidden shadow-xs transition-all">
            <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white text-xs select-none">
              <div className="flex items-center gap-2 truncate">
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span className="font-semibold text-xs truncate">
                  PFMEA_Vacuum_Pump_Assembly_2023_v4_FINAL_reviewed_copy(2).xlsx - Excel
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/90 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-rose-700 text-white font-bold text-[10px]">
                  ⚠️ 3 BROKEN REFS
                </span>
                <span className="hidden sm:inline">AutoSave: OFF</span>
              </div>
            </div>

            {/* Formula Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex items-center gap-2 text-xs font-mono">
              <span className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-700 rounded text-[11px] font-bold">
                M4
              </span>
              <span className="text-slate-400 font-bold">fx</span>
              <span className="text-rose-600 font-bold bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 flex-1 truncate">
                =PRODUCT(J4, K4, #REF!) <span className="text-rose-500 font-normal">/* Broken Linkage Error */</span>
              </span>
            </div>

            {/* Excel Table */}
            <div className="overflow-x-auto text-xs select-none">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                    <th className="p-2 border-r border-slate-300 text-left w-12">Row</th>
                    <th className="p-2 border-r border-slate-300 text-left">Process Step</th>
                    <th className="p-2 border-r border-slate-300 text-left">Failure Mode</th>
                    <th className="p-2 border-r border-slate-300 text-left">Potential Effect</th>
                    <th className="p-2 border-r border-slate-300 text-center bg-rose-50 text-rose-900 w-16">SEV</th>
                    <th className="p-2 border-r border-slate-300 text-center bg-amber-50 text-amber-900 w-16">OCC</th>
                    <th className="p-2 border-r border-slate-300 text-center bg-blue-50 text-blue-900 w-16">DET</th>
                    <th className="p-2 border-r border-slate-300 text-center bg-slate-200 w-24">RPN</th>
                    <th className="p-2 border-r border-slate-300 text-left">Action Tracking (Excel)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-sans text-xs">
                  <tr className="bg-amber-50/30">
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-400">01</td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">OP10 Bush Press</td>
                    <td className="p-2 border-r border-slate-200">Bush under-depth</td>
                    <td className="p-2 border-r border-slate-200 text-rose-700 font-bold">Total brake assist loss</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-rose-600 bg-rose-50">9</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-amber-600">2</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-600">2</td>
                    <td className="p-2 border-r border-slate-200 text-center font-mono font-bold bg-emerald-100 text-emerald-800">
                      36
                      <span className="block text-[10px] text-emerald-700 font-normal">(&lt;100 IGNORED)</span>
                    </td>
                    <td className="p-2 border-r border-slate-200 text-rose-600 font-medium">
                      ⚠️ Skipped: RPN &lt; 100 threshold (Audit Non-Conformance!)
                    </td>
                  </tr>

                  <tr className="bg-rose-50/30">
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-400">02</td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">OP20 Assembly</td>
                    <td className="p-2 border-r border-slate-200">Fastener under-torque</td>
                    <td className="p-2 border-r border-slate-200">Housing separation</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-rose-600">9</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-amber-600">4</td>
                    <td className="p-2 border-r border-slate-200 text-center font-mono font-bold bg-rose-200 text-rose-900">
                      #REF!
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center font-mono font-bold bg-rose-200 text-rose-900">
                      #VALUE!
                    </td>
                    <td className="p-2 border-r border-slate-200 text-rose-700 font-medium">
                      ⚠️ Broken formula cell: Controls not calculated
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-400">03</td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">OP30 Final Clean</td>
                    <td className="p-2 border-r border-slate-200">Slight surface scuff</td>
                    <td className="p-2 border-r border-slate-200 text-slate-500">Minor cosmetic blemish</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-500">2</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-amber-600">8</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-600">8</td>
                    <td className="p-2 border-r border-slate-200 text-center font-mono font-bold bg-rose-100 text-rose-800">
                      128
                      <span className="block text-[10px] text-rose-700 font-normal">(&gt;100 FALSE PANIC)</span>
                    </td>
                    <td className="p-2 border-r border-slate-200 text-amber-800 font-medium">
                      ⚠️ False rework: Engineer assigned 3-day cosmetic investigation
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-rose-50 border-t border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-950 font-mono">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>OEM Audit Finding: Lethal brake assist failure ignored because RPN multiplication gave 36</span>
              </span>
              <span className="text-rose-700 font-medium hidden sm:inline">IATF 16949 §8.3.5 Non-Conformance</span>
            </div>
          </div>
        )}

        {/* ── VIEW B: FMEAPEX QUALITY OS (Clean Full-Width Mockup) */}
        {activeTab === 'fmeapex' && (
          <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden shadow-xs transition-all">
            <div className="bg-[#0F172A] px-4 py-2.5 flex items-center justify-between text-white text-xs select-none">
              <div className="flex items-center gap-2 truncate">
                <span className="font-extrabold text-[#FF5500] text-sm">/</span>
                <span className="font-bold text-xs truncate">
                  FMEApex Quality OS · E vacuum pump (861000000)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                  AIAG-VDA 2019
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>21 CFR PART 11 LOCKED</span>
                </span>
              </div>
            </div>

            {/* Navigation Ribbon / Breadcrumbs */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  <span>GOLDEN THREAD ACTIVE</span>
                </span>
                <span className="text-slate-400 hidden sm:inline">·</span>
                <span className="text-slate-600 text-xs hidden sm:inline">PFD ↔ PFMEA ↔ Control Plan 100% Synced</span>
              </div>
              <span className="text-emerald-700 font-mono text-xs font-bold">0 ORPHAN ROWS</span>
            </div>

            {/* FMEApex Table */}
            <div className="overflow-x-auto text-xs select-none">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                    <th className="p-2 border-r border-slate-200 text-left w-16">OP #</th>
                    <th className="p-2 border-r border-slate-200 text-left">Failure Mode</th>
                    <th className="p-2 border-r border-slate-200 text-left">Worst Effect</th>
                    <th className="p-2 border-r border-slate-200 text-center bg-rose-50 text-rose-900 w-16">S</th>
                    <th className="p-2 border-r border-slate-200 text-center bg-amber-50 text-amber-900 w-16">O</th>
                    <th className="p-2 border-r border-slate-200 text-center bg-blue-50 text-blue-900 w-16">D</th>
                    <th className="p-2 border-r border-slate-200 text-center bg-slate-900 text-white w-24">AP</th>
                    <th className="p-2 border-r border-slate-200 text-left">Mandatory Action Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-sans text-xs">
                  <tr className="bg-rose-50/20 hover:bg-rose-50/40">
                    <td className="p-2 border-r border-slate-100 font-mono font-bold text-slate-900">OP10</td>
                    <td className="p-2 border-r border-slate-100 font-semibold text-slate-900">Bush under-depth</td>
                    <td className="p-2 border-r border-slate-100 text-rose-700 font-bold">Total brake assist loss</td>
                    <td className="p-2 border-r border-slate-100 text-center font-bold text-rose-600 bg-rose-50">9</td>
                    <td className="p-2 border-r border-slate-100 text-center font-bold text-amber-600">2</td>
                    <td className="p-2 border-r border-slate-100 text-center font-bold text-blue-600">2</td>
                    <td className="p-2 border-r border-slate-100 text-center font-mono font-black">
                      <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[10px]">
                        HIGH AP
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-100 font-medium text-slate-800">
                      <span className="text-rose-600 font-bold">Mandatory:</span> Servo press dynamic displacement window
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-100 font-mono font-bold text-slate-900">OP20</td>
                    <td className="p-2 border-r border-slate-100 font-semibold text-slate-900">Fastener under-torque</td>
                    <td className="p-2 border-r border-slate-100 text-rose-700 font-bold">Housing separation</td>
                    <td className="p-2 border-r border-slate-100 text-center font-bold text-rose-600">9</td>
                    <td className="p-2 border-r border-slate-100 text-center font-bold text-amber-600">4</td>
                    <td className="p-2 border-r border-slate-100 text-center font-bold text-blue-600">4</td>
                    <td className="p-2 border-r border-slate-100 text-center font-mono font-black">
                      <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[10px]">
                        HIGH AP
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-100 font-medium text-slate-800">
                      <span className="text-rose-600 font-bold">Mandatory:</span> Angle-monitoring transducer + MES interlock
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-100 font-mono font-bold text-slate-900">OP30</td>
                    <td className="p-2 border-r border-slate-100 font-semibold text-slate-900">Slight surface scuff</td>
                    <td className="p-2 border-r border-slate-100 text-slate-500">Minor cosmetic blemish</td>
                    <td className="p-2 border-r border-slate-100 text-center font-bold text-slate-500">2</td>
                    <td className="p-2 border-r border-slate-100 text-center font-bold text-amber-600">8</td>
                    <td className="p-2 border-r border-slate-100 text-center font-bold text-blue-600">8</td>
                    <td className="p-2 border-r border-slate-100 text-center font-mono font-black">
                      <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]">
                        LOW AP
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-100 text-slate-500 italic">
                      Adequate · Discretionary action
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2 flex items-center justify-between text-xs text-emerald-950 font-mono">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Compliant: AIAG-VDA 2019 Table 5-4 AP Matrix Validated (Deterministic)</span>
              </span>
              <span className="text-emerald-700 font-medium hidden sm:inline">SHA-256: 8f4a...92b1 (Signed)</span>
            </div>
          </div>
        )}

        {/* ── VIEW C: SIDE-BY-SIDE SUMMARY (Clear Comparison) ── */}
        {activeTab === 'compare' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all">
            {/* Left Card: The Old Excel Way */}
            <div className="rounded-xl border border-rose-200 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  <span>The Fragile Past · Legacy Excel</span>
                </span>
                <span className="text-xs font-mono text-rose-600 font-bold">Unreliable Quality</span>
              </div>

              <h4 className="text-base font-bold text-slate-900">
                Spreadsheet Math Hides Critical OEM Recalls
              </h4>

              <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-200/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-900 font-bold">
                  <span>OP10 Total Brake Assist Loss</span>
                  <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">RPN: 36 (GREEN)</span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Formula: S(9) × O(2) × D(2) = 36. An arbitrary RPN cutoff of 100 marks this life-threatening defect &quot;safe&quot;.
                </div>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>#REF! Errors:</strong> Cell shifts destroy formula chains without notice.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Orphan Steps:</strong> PFD and Control Plan spreadsheets drift out of sync.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Zero Immutability:</strong> Change logs and dates are easily altered.</span>
                </li>
              </ul>
            </div>

            {/* Right Card: The FMEApex Way */}
            <div className="rounded-xl border border-emerald-200 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>The Deterministic Future · FMEApex</span>
                </span>
                <span className="text-xs font-mono text-emerald-600 font-bold">Audit-Proof Guarantee</span>
              </div>

              <h4 className="text-base font-bold text-slate-900">
                AIAG-VDA 2019 Deterministic Action Priority
              </h4>

              <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-900 font-bold">
                  <span>OP10 Total Brake Assist Loss</span>
                  <span className="text-white bg-rose-600 px-1.5 py-0.5 rounded text-[10px] font-bold">HIGH AP (RED)</span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Severity 9 is evaluated first. Mandatory corrective actions and post-action evidence are enforced before SOP.
                </div>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Database-Locked:</strong> Formulas cannot be overwritten or broken.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Golden Thread Sync:</strong> PFD ↔ PFMEA ↔ Control Plan sync bidirectionally.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>21 CFR Part 11:</strong> SHA-256 digital signatures lock approved revisions.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Interactive Callout Strip (4 Concrete Reasons) ─ */}
      <div className="p-5 sm:p-8 bg-white border-t border-slate-200">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <span>Click any vulnerability to review the architectural solution:</span>
          <span className="text-[#FF5500]">4 Fatal Spreadsheet Risks vs. 4 FMEApex Solutions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {COMPARISON_ITEMS.map((item, i) => {
            const isSelected = activeCallout === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveCallout(item.id);
                  setIsPlaying(false);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#FF5500] bg-[#FF5500]/5 shadow-xs ring-1 ring-[#FF5500]/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Excel Risk 0{i + 1}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600">
                    Solution 0{i + 1} ✓
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-snug mb-1">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {item.excelProblem}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExcelRetirementShowcase;
