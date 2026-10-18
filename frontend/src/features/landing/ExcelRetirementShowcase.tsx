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
  desc: string;
  type: 'danger' | 'success';
}

const EXCEL_HAZARDS: CalloutItem[] = [
  {
    id: 'broken-formula',
    title: 'Formula Corruption & #REF! Errors',
    desc: 'Accidental cell overwrites destroy RPN calculations across 50 columns without any audit log or rollback.',
    type: 'danger'
  },
  {
    id: 'flawed-rpn',
    title: 'Flawed RPN Hides Severe Hazards',
    desc: 'Lethal Severity 9–10 defects with low occurrence yield low RPN (e.g. 36) and are dangerously ignored by legacy cutoffs.',
    type: 'danger'
  },
  {
    id: 'orphan-steps',
    title: 'Disconnected PFD & Control Plan',
    desc: 'Process steps added in PFD.xlsx are omitted in PFMEA.xlsx and Control_Plan.xlsx, failing IATF 16949 §8.3.5 audits.',
    type: 'danger'
  },
  {
    id: 'version-chaos',
    title: 'Version Sprawl & Email Attachments',
    desc: 'Multiple CFT members editing local copies lead to Rev4_final_v2_APPROVED_copy.xlsx with zero traceability.',
    type: 'danger'
  }
];

const FMEAPEX_ADVANTAGES: CalloutItem[] = [
  {
    id: 'deterministic-ap',
    title: 'Deterministic AIAG-VDA 2019 AP',
    desc: 'Severity is evaluated first. High severity mandates corrective action regardless of low occurrence, locked in PostgreSQL.',
    type: 'success'
  },
  {
    id: 'golden-thread',
    title: 'Live PFD ↔ PFMEA ↔ Control Plan Sync',
    desc: 'Serializable bidirectional synchronization propagates tolerance changes instantly and prevents orphan steps.',
    type: 'success'
  },
  {
    id: 'part-11',
    title: '21 CFR Part 11 Digital Signatures',
    desc: 'Every approval is cryptographically sealed with SHA-256 hash in an immutable append-only audit partition.',
    type: 'success'
  },
  {
    id: 'one-click-audit',
    title: '1-Click OEM Audit Export',
    desc: 'Generate compliant AIAG-VDA forms, control plans, and linkage trees ready for Tier 1 customer presentation in seconds.',
    type: 'success'
  }
];

export const ExcelRetirementShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'excel' | 'fmeapex' | 'split'>('split');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedCallout, setSelectedCallout] = useState<string>('flawed-rpn');

  // Auto-cycle through views if isPlaying is true
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === 'split') return 'excel';
        if (prev === 'excel') return 'fmeapex';
        return 'split';
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] overflow-hidden font-sans">
      {/* ── 1. Control Toolbar ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between px-5 sm:px-8 py-4 bg-slate-50 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/20 flex items-center justify-center text-[#FF5500]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF5500]">
              The Quality Transformation
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
              Ditch the Fragile FMEA Excel Sheet
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
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
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
                setActiveTab('split');
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'split'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Interactive Split</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('fmeapex');
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
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

      {/* ── 2. Visual Interactive Comparison Stage ──────────── */}
      <div className="relative bg-slate-950 p-4 sm:p-6 lg:p-8 min-h-[440px] flex items-center justify-center overflow-hidden">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* ── A. FULL EXCEL VIEW ────────────────────────────── */}
        {activeTab === 'excel' && (
          <div className="w-full max-w-[1100px] animate-fadeIn transition-all">
            <ExcelWindowMockup selectedCallout={selectedCallout} onSelectCallout={setSelectedCallout} />
          </div>
        )}

        {/* ── B. FULL FMEAPEX VIEW ──────────────────────────── */}
        {activeTab === 'fmeapex' && (
          <div className="w-full max-w-[1100px] animate-fadeIn transition-all">
            <FmeapexWindowMockup selectedCallout={selectedCallout} onSelectCallout={setSelectedCallout} />
          </div>
        )}

        {/* ── C. INTERACTIVE SPLIT COMPARISON ───────────────── */}
        {activeTab === 'split' && (
          <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
            {/* Left: The Old Excel Sheet */}
            <div className="relative group">
              <div className="absolute -top-3 left-4 z-20 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold tracking-wider uppercase shadow-sm flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                <span>The Fragile Past · Legacy Excel</span>
              </div>
              <div className="rounded-xl border border-rose-900/50 overflow-hidden shadow-md">
                <ExcelWindowMockup isSplit selectedCallout={selectedCallout} onSelectCallout={setSelectedCallout} />
              </div>
            </div>

            {/* Right: The FMEApex Platform */}
            <div className="relative group">
              <div className="absolute -top-3 left-4 z-20 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold tracking-wider uppercase shadow-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>The Deterministic Future · FMEApex</span>
              </div>
              <div className="rounded-xl border border-emerald-900/50 overflow-hidden shadow-md">
                <FmeapexWindowMockup isSplit selectedCallout={selectedCallout} onSelectCallout={setSelectedCallout} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Interactive Callout Strip (Why Ditch Excel) ──── */}
      <div className="p-5 sm:p-8 bg-white border-t border-slate-200">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center justify-between">
          <span>Click any vulnerability below to inspect why spreadsheet quality fails:</span>
          <span className="text-[#FF5500]">4 Fatal Excel Flaws vs. 4 Deterministic Defenses</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {EXCEL_HAZARDS.map((h, i) => {
            const adv = FMEAPEX_ADVANTAGES[i];
            const isSelected = selectedCallout === h.id || selectedCallout === adv.id;

            return (
              <button
                key={h.id}
                onClick={() => {
                  setSelectedCallout(h.id);
                  setIsPlaying(false);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-[#FF5500] bg-[#FF5500]/5 shadow-sm ring-1 ring-[#FF5500]/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Excel Risk 0{i + 1}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600">
                    FMEApex 0{i + 1} ✓
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-snug mb-1">
                  {h.title}
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {h.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── SUB-COMPONENT: Realistic Old Excel Window Mockup ─────── */
interface WindowMockupProps {
  isSplit?: boolean;
  selectedCallout?: string;
  onSelectCallout?: (id: string) => void;
}

const ExcelWindowMockup: React.FC<WindowMockupProps> = ({ isSplit }) => {
  return (
    <div className="bg-[#107C41] rounded-lg overflow-hidden border border-slate-700 shadow-2xl font-sans text-slate-800">
      {/* Title Bar */}
      <div className="bg-[#107c41] px-3 py-1.5 flex items-center justify-between text-white text-xs select-none">
        <div className="flex items-center gap-2 truncate">
          <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
          <span className="font-semibold text-[11px] truncate">
            PFMEA_Vacuum_Pump_Assembly_2023_v4_FINAL_reviewed_copy(2).xlsx - Excel
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-white/80 text-[10px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-rose-700 text-white font-bold text-[9px] animate-pulse">
            ⚠️ 3 BROKEN REFS
          </span>
          <span>AutoSave OFF</span>
        </div>
      </div>

      {/* Menu / Ribbon Bar */}
      <div className="bg-[#f3f2f1] border-b border-slate-300 px-3 py-1 flex items-center gap-3 text-[11px] text-slate-700 font-medium">
        <span className="text-[#107c41] font-bold">File</span>
        <span className="font-semibold text-slate-900 border-b-2 border-[#107c41] pb-0.5">Home</span>
        <span>Insert</span>
        <span>Page Layout</span>
        <span>Formulas</span>
        <span>Data</span>
        <span>Review</span>
        <span>View</span>
      </div>

      {/* Formula Bar */}
      <div className="bg-white border-b border-slate-200 px-3 py-1 flex items-center gap-2 text-xs font-mono">
        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 text-slate-600 rounded text-[10px] font-bold">
          M4
        </span>
        <span className="text-slate-400 font-bold">fx</span>
        <span className="text-rose-600 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex-1 truncate">
          =PRODUCT(J4, K4, #REF!) <span className="text-rose-500 font-normal">/* Broken Linkage Error */</span>
        </span>
      </div>

      {/* Spreadsheet Grid Mockup */}
      <div className="bg-white overflow-x-auto text-[10px] leading-tight select-none">
        <table className="w-full border-collapse">
          <thead>
            {/* Column Letter Row */}
            <tr className="bg-[#e1dfdd] text-slate-600 font-mono text-[9px] text-center border-b border-slate-300">
              <th className="w-6 p-1 border-r border-slate-300 font-bold"></th>
              <th className="p-1 border-r border-slate-300">A</th>
              <th className="p-1 border-r border-slate-300">B</th>
              <th className="p-1 border-r border-slate-300">C</th>
              <th className="p-1 border-r border-slate-300">J (SEV)</th>
              <th className="p-1 border-r border-slate-300">K (OCC)</th>
              <th className="p-1 border-r border-slate-300">L (DET)</th>
              <th className="p-1 border-r border-slate-300">M (RPN)</th>
              {!isSplit && <th className="p-1 border-r border-slate-300">N (ACTION)</th>}
            </tr>
            {/* FMEA Header Row */}
            <tr className="bg-[#d2e0d4] text-slate-900 font-bold text-center border-b border-slate-300 text-[10px]">
              <td className="bg-[#e1dfdd] text-slate-600 font-mono text-[9px] p-1 border-r border-slate-300">1</td>
              <td className="p-1.5 border-r border-slate-300 text-left">Process Step</td>
              <td className="p-1.5 border-r border-slate-300 text-left">Failure Mode</td>
              <td className="p-1.5 border-r border-slate-300 text-left">Potential Effect</td>
              <td className="p-1.5 border-r border-slate-300 bg-rose-100 text-rose-900">S</td>
              <td className="p-1.5 border-r border-slate-300 bg-amber-100 text-amber-900">O</td>
              <td className="p-1.5 border-r border-slate-300 bg-blue-100 text-blue-900">D</td>
              <td className="p-1.5 border-r border-slate-300 bg-slate-200">RPN</td>
              {!isSplit && <td className="p-1.5 border-r border-slate-300 text-left">Action Assigned</td>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {/* Row 1: High Severity hidden by RPN */}
            <tr className="hover:bg-amber-50/50">
              <td className="bg-[#e1dfdd] text-slate-600 font-mono text-[9px] text-center p-1 border-r border-slate-300">2</td>
              <td className="p-1.5 border-r border-slate-200 font-medium">OP10 Bush Press</td>
              <td className="p-1.5 border-r border-slate-200">Bush under-depth</td>
              <td className="p-1.5 border-r border-slate-200 text-rose-700 font-bold">Total brake assist loss</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-bold text-rose-600 bg-rose-50">9</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">2</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-bold text-blue-600">2</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-mono font-bold bg-emerald-100 text-emerald-800">
                36
                <span className="block text-[8px] text-emerald-600 font-normal">(&lt;100 IGNORED)</span>
              </td>
              {!isSplit && (
                <td className="p-1.5 border-r border-slate-200 text-slate-400 italic">
                  [None - RPN &lt; 100 threshold]
                </td>
              )}
            </tr>

            {/* Row 2: Broken formula error */}
            <tr className="bg-rose-50/40 hover:bg-rose-50">
              <td className="bg-[#e1dfdd] text-slate-600 font-mono text-[9px] text-center p-1 border-r border-slate-300">3</td>
              <td className="p-1.5 border-r border-slate-200 font-medium">OP20 Assembly</td>
              <td className="p-1.5 border-r border-slate-200">Fastener under-torque</td>
              <td className="p-1.5 border-r border-slate-200">Housing separation</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-bold text-rose-600">9</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">4</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-bold bg-rose-200 text-rose-900 font-mono">
                #REF!
              </td>
              <td className="p-1.5 border-r border-slate-200 text-center font-mono font-bold bg-rose-200 text-rose-900">
                #VALUE!
              </td>
              {!isSplit && (
                <td className="p-1.5 border-r border-slate-200 text-rose-600 font-semibold">
                  ⚠️ Formula link destroyed
                </td>
              )}
            </tr>

            {/* Row 3: Minor cosmetic defect with high RPN */}
            <tr className="hover:bg-amber-50/50">
              <td className="bg-[#e1dfdd] text-slate-600 font-mono text-[9px] text-center p-1 border-r border-slate-300">4</td>
              <td className="p-1.5 border-r border-slate-200 font-medium">OP30 Final Clean</td>
              <td className="p-1.5 border-r border-slate-200">Slight surface scuff</td>
              <td className="p-1.5 border-r border-slate-200">Cosmetic defect</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-600">2</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-bold text-amber-600">8</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-bold text-blue-600">8</td>
              <td className="p-1.5 border-r border-slate-200 text-center font-mono font-bold bg-rose-100 text-rose-800">
                128
                <span className="block text-[8px] text-rose-600 font-normal">(&gt;100 FALSE PANIC)</span>
              </td>
              {!isSplit && (
                <td className="p-1.5 border-r border-slate-200 text-amber-800 font-semibold">
                  Mandatory rework assigned
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Excel Status Bar with Callout Banner */}
      <div className="bg-[#f3f2f1] border-t border-slate-300 px-3 py-1 flex items-center justify-between text-[10px] text-slate-600 font-mono">
        <span className="text-rose-700 font-bold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>Audit Risk: Lethal Hazard (Row 2) unaddressed because RPN is 36</span>
        </span>
        <span className="hidden sm:inline">Sheet 1 of 12 (Disconnected)</span>
      </div>
    </div>
  );
};

/* ── SUB-COMPONENT: Clean FMEApex Window Mockup ───────────── */
const FmeapexWindowMockup: React.FC<WindowMockupProps> = ({ isSplit }) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-2xl font-sans text-slate-900">
      {/* Title Bar */}
      <div className="bg-[#0F172A] px-3 py-1.5 flex items-center justify-between text-white text-xs select-none">
        <div className="flex items-center gap-2 truncate">
          <span className="font-extrabold text-[#FF5500] text-sm">/</span>
          <span className="font-bold text-[11px] truncate">
            FMEApex Quality OS · E vacuum pump (861000000)
          </span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-mono font-bold">
            AIAG-VDA 2019
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-[10px] font-mono">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>21 CFR PART 11 LOCKED</span>
          </span>
        </div>
      </div>

      {/* Navigation Ribbon / Breadcrumbs */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-700 font-medium">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200 flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            <span>GOLDEN THREAD ACTIVE</span>
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 text-[11px]">PFD ↔ PFMEA ↔ Control Plan 100% Synced</span>
        </div>
        <span className="text-emerald-700 font-mono text-[10px] font-bold">0 ORPHAN ROWS</span>
      </div>

      {/* Table Mockup */}
      <div className="bg-white overflow-x-auto text-[10px] leading-tight select-none">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[10px]">
              <th className="p-1.5 text-left border-r border-slate-200">OP #</th>
              <th className="p-1.5 text-left border-r border-slate-200">Failure Mode</th>
              <th className="p-1.5 text-left border-r border-slate-200">Worst Effect</th>
              <th className="p-1.5 text-center border-r border-slate-200 bg-rose-50 text-rose-900">S</th>
              <th className="p-1.5 text-center border-r border-slate-200 bg-amber-50 text-amber-900">O</th>
              <th className="p-1.5 text-center border-r border-slate-200 bg-blue-50 text-blue-900">D</th>
              <th className="p-1.5 text-center border-r border-slate-200 bg-slate-900 text-white">AP</th>
              {!isSplit && <th className="p-1.5 text-left border-r border-slate-200">Mandatory Action Workflow</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {/* Row 1: High AP properly triggered */}
            <tr className="bg-rose-50/20 hover:bg-rose-50/40">
              <td className="p-1.5 border-r border-slate-100 font-mono font-bold text-slate-900">OP10</td>
              <td className="p-1.5 border-r border-slate-100 font-medium">Bush under-depth</td>
              <td className="p-1.5 border-r border-slate-100 text-rose-700 font-bold">Total brake assist loss</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-bold text-rose-600 bg-rose-50">9</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-bold text-amber-600">2</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-bold text-blue-600">2</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-mono font-black">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px]">
                  HIGH AP
                </span>
              </td>
              {!isSplit && (
                <td className="p-1.5 border-r border-slate-100 font-medium text-slate-800">
                  <span className="text-rose-600 font-bold">Mandatory:</span> Servo press dynamic envelope
                </td>
              )}
            </tr>

            {/* Row 2: Synchronized Control Plan item */}
            <tr className="hover:bg-slate-50">
              <td className="p-1.5 border-r border-slate-100 font-mono font-bold text-slate-900">OP20</td>
              <td className="p-1.5 border-r border-slate-100 font-medium">Fastener under-torque</td>
              <td className="p-1.5 border-r border-slate-100 text-rose-700 font-bold">Housing separation</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-bold text-rose-600">9</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-bold text-amber-600">4</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-bold text-blue-600">4</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-mono font-black">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px]">
                  HIGH AP
                </span>
              </td>
              {!isSplit && (
                <td className="p-1.5 border-r border-slate-100 font-medium text-slate-800">
                  <span className="text-rose-600 font-bold">Mandatory:</span> Angle-monitoring transducer + MES interlock
                </td>
              )}
            </tr>

            {/* Row 3: Cosmetic defect properly evaluated to LOW AP */}
            <tr className="hover:bg-slate-50">
              <td className="p-1.5 border-r border-slate-100 font-mono font-bold text-slate-900">OP30</td>
              <td className="p-1.5 border-r border-slate-100 font-medium">Slight surface scuff</td>
              <td className="p-1.5 border-r border-slate-100 text-slate-500">Cosmetic defect</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-bold text-slate-500">2</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-bold text-amber-600">8</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-bold text-blue-600">8</td>
              <td className="p-1.5 border-r border-slate-100 text-center font-mono font-black">
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px]">
                  LOW AP
                </span>
              </td>
              {!isSplit && (
                <td className="p-1.5 border-r border-slate-100 text-slate-500 italic">
                  Adequate · Discretionary action
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* FMEApex Status Bar with Audit Hash */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-1 flex items-center justify-between text-[10px] text-slate-600 font-mono">
        <span className="text-emerald-700 font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Compliant: AIAG-VDA 2019 Table 5-4 AP Matrix Validated</span>
        </span>
        <span className="hidden sm:inline text-slate-400">SHA-256: 8f4a...92b1 (Signed)</span>
      </div>
    </div>
  );
};

export default ExcelRetirementShowcase;
