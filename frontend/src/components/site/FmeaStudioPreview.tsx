import React, { useState } from 'react';
import {
  Layers,
  GitBranch,
  ShieldAlert,
  FileCheck2,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Cpu,
  Check,
  FileSpreadsheet
} from 'lucide-react';

type StudioView = 'pfmea' | 'pfd' | 'chain' | 'control_plan' | 'audit_trail';

interface RowData {
  id: string;
  stepNo: string;
  stepName: string;
  fourM: 'Machine' | 'Man' | 'Material' | 'Method';
  workElement: string;
  functionDesc: string;
  failureMode: string;
  failureEffect: string;
  severity: number;
  failureCause: string;
  occurrence: number;
  prevControl: string;
  detControl: string;
  detection: number;
  ap: 'H' | 'M' | 'L';
  actionDesc: string;
  actionOwner: string;
  status: 'Open' | 'InProgress' | 'Verified';
}

const PRESETS = {
  edu: {
    title: 'Electric Drive Unit (EDU) Assembly',
    docNo: 'FMEA-2026-EDU-08',
    rev: 'Rev C.2',
    line: 'Station 20 — High-Speed Rotor Insertion',
    rows: [
      {
        id: 'ROW-101',
        stepNo: 'Op 10',
        stepName: 'Bearing Press-Fit',
        fourM: 'Machine',
        workElement: 'Hydraulic Press HP-04 (Force transducer)',
        functionDesc: 'Press needle bearing to 45.2 ± 0.1 mm depth',
        failureMode: 'Bearing seated below minimum press depth (<45.1mm)',
        failureEffect: 'Rotor axial play, bearing race fatigue, motor noise (FE-01)',
        severity: 8,
        failureCause: 'Load cell drift > 2.5% during continuous cycling',
        occurrence: 3,
        prevControl: 'Daily calibration check before shift start (PC-01)',
        detControl: 'In-situ displacement LVDT sensor at stroke end',
        detection: 3,
        ap: 'M',
        actionDesc: 'Integrate dynamic closed-loop servo press with real-time envelope curve',
        actionOwner: 'M. Weber (Tooling)',
        status: 'Verified',
      },
      {
        id: 'ROW-102',
        stepNo: 'Op 20',
        stepName: 'Torque Fastener M10',
        fourM: 'Machine',
        workElement: 'Atlas Copco Multi-Spindle Nutrunner (Station 20)',
        functionDesc: 'Tighten 6x stator bolts to 48.0 ± 2.5 N·m',
        failureMode: 'Fastener under-torqued (<45.5 N·m clamp load)',
        failureEffect: 'Stator housing vibration, loose ground connection, safety loss (FE-02)',
        severity: 9,
        failureCause: 'Angle encoder slip or friction variation on unlubricated bolt threads',
        occurrence: 4,
        prevControl: 'Calibrated transducer tool + automatic bolt feeder (PC-02)',
        detControl: 'Angle-monitoring torque window (Torque + Angle gating)',
        detection: 4,
        ap: 'H',
        actionDesc: 'Mandatory torque-angle signature logging into MES; reject bin interlock',
        actionOwner: 'K. Patel (Quality Lead)',
        status: 'InProgress',
      },
      {
        id: 'ROW-103',
        stepNo: 'Op 30',
        stepName: 'Dispense Thermal Paste',
        fourM: 'Method',
        workElement: 'Nordson Automated Dispensing Robot (Robot Arm 2)',
        functionDesc: 'Apply continuous 2.0 ± 0.2 mm thermal interface bead',
        failureMode: 'Discontinuous paste bead / air bubble entrapment',
        failureEffect: 'Inadequate inverter heat dissipation, thermal derating (FE-03)',
        severity: 7,
        failureCause: 'Dispense nozzle partial crystallization during conveyor stoppage',
        occurrence: 3,
        prevControl: 'Purge cycle automated after 120s idle time (PC-03)',
        detControl: 'Cognex 3D line-laser profilometer for 100% bead height check',
        detection: 2,
        ap: 'L',
        actionDesc: 'Heated fluid circulation nozzle upgrade with viscosity feedback',
        actionOwner: 'S. Tanaka (Process)',
        status: 'Verified',
      },
      {
        id: 'ROW-104',
        stepNo: 'Op 40',
        stepName: 'End-of-Line Vision & Dielectric',
        fourM: 'Machine',
        workElement: 'Chroma Automated Hi-Pot / Dielectric Isolation Tester',
        functionDesc: 'Verify 2.5 kV insulation resistance > 100 MΩ',
        failureMode: 'Dielectric breakdown under 2.5 kV test voltage',
        failureEffect: 'High-voltage leakage to chassis; immediate vehicle shutdown (FE-04)',
        severity: 10,
        failureCause: 'Pin-hole nick in phase wire insulation during stator insertion',
        occurrence: 2,
        prevControl: 'Guide sleeve polymer tooling with radius chamfers (PC-04)',
        detControl: '100% automated dielectric leakage test (Chroma 19052)',
        detection: 2,
        ap: 'M',
        actionDesc: 'Add high-resolution optical inspection before winding insertion',
        actionOwner: 'D. Rossi (Electrical QA)',
        status: 'Open',
      },
    ] as RowData[],
  },
  battery: {
    title: 'EV Battery Module Laser Welding',
    docNo: 'FMEA-2026-BAT-14',
    rev: 'Rev D.1',
    line: 'Station 45 — Busbar Ultrasonic & Fiber Laser Weld',
    rows: [
      {
        id: 'ROW-201',
        stepNo: 'Op 15',
        stepName: 'Cell Terminal Surface Clean',
        fourM: 'Material',
        workElement: 'Pulsed Laser Cleaning Head (50W Fiber)',
        functionDesc: 'Remove surface oxide layer from aluminum cell poles',
        failureMode: 'Residual oxide / oil film remaining on weld surface',
        failureEffect: 'Laser weld spatter, high joint resistance, thermal hot spot (FE-11)',
        severity: 8,
        failureCause: 'Exhaust suction nozzle clogged with ablated particulate',
        occurrence: 3,
        prevControl: 'Differential pressure sensor on exhaust filter (PC-11)',
        detControl: 'Optical emission spectroscopy inline clean check',
        detection: 3,
        ap: 'M',
        actionDesc: 'Install automatic blow-back pulse jet cleaner on exhaust filter',
        actionOwner: 'R. Schmidt (Welding Eng)',
        status: 'Verified',
      },
      {
        id: 'ROW-202',
        stepNo: 'Op 25',
        stepName: 'Laser Busbar Welding',
        fourM: 'Machine',
        workElement: 'Trumpf 4kW Fiber Laser with Wobble Scan Head',
        functionDesc: 'Weld nickel-copper busbar to cell pole (shear force > 1.2 kN)',
        failureMode: 'Insufficient weld penetration depth (< 0.45 mm)',
        failureEffect: 'Busbar separation under vehicle shock, open circuit (FE-12)',
        severity: 9,
        failureCause: 'Focus shift due to thermally induced lens deformation',
        occurrence: 3,
        prevControl: 'Water-cooled optical collimator with temp telemetry (PC-12)',
        detControl: 'Precitec inline weld depth OCT (Optical Coherence Tomography)',
        detection: 2,
        ap: 'M',
        actionDesc: 'Real-time laser power compensation linked directly to OCT depth',
        actionOwner: 'L. Chen (Advanced QA)',
        status: 'InProgress',
      },
    ] as RowData[],
  },
};

export const FmeaStudioPreview: React.FC = () => {
  const [activePreset, setActivePreset] = useState<'edu' | 'battery'>('edu');
  const [activeView, setActiveView] = useState<StudioView>('pfmea');
  const [selectedRowId, setSelectedRowId] = useState<string>('ROW-102');
  const [showAiModal, setShowAiModal] = useState(false);
  const [filterAp, setFilterAp] = useState<'ALL' | 'H' | 'M' | 'L'>('ALL');

  const preset = PRESETS[activePreset];
  const selectedRow = preset.rows.find((r) => r.id === selectedRowId) || preset.rows[0];

  const filteredRows = preset.rows.filter((r) => {
    if (filterAp === 'ALL') return true;
    return r.ap === filterAp;
  });

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-[#090D16] border border-slate-800 text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.55)] overflow-hidden font-sans">
      {/* ── Precision Application Chrome ─────────────────── */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-[#0D1322] border-b border-slate-800 gap-3">
        {/* Left: Window Controls + Project Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs font-mono">
            <span className="text-slate-400">Project:</span>
            <select
              value={activePreset}
              aria-label="Active Project"
              onChange={(e) => setActivePreset(e.target.value as 'edu' | 'battery')}
              className="bg-transparent text-cyan-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="edu" className="bg-slate-900 text-slate-200">EDU Stator Assembly</option>
              <option value="battery" className="bg-slate-900 text-slate-200">Battery Module Laser</option>
            </select>
          </div>

          {/* Document Metadata Badges */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
              {preset.docNo}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {preset.rev} Locked
            </span>
            <span className="text-slate-500">•</span>
            <span>AIAG-VDA 2019 (1st Ed)</span>
          </div>
        </div>

        {/* Right: AI Copilot Status & Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(!showAiModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 text-xs font-medium transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI Copilot Suggestions</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
              3 new
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Postgres RLS Locked</span>
          </div>
        </div>
      </div>

      {/* ── Studio Navigation Tabs ──────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-[#090D16] border-b border-slate-800/80 overflow-x-auto text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('pfmea')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeView === 'pfmea'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>PFMEA 7-Step Grid</span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded">
              {preset.rows.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('pfd')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeView === 'pfd'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            <span>PFD ↔ PFMEA Sync</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
              Synced
            </span>
          </button>

          <button
            onClick={() => setActiveView('chain')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeView === 'chain'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Failure Chain Graph</span>
          </button>

          <button
            onClick={() => setActiveView('control_plan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeView === 'control_plan'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Control Plan (CP) Sync</span>
          </button>

          <button
            onClick={() => setActiveView('audit_trail')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeView === 'audit_trail'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-rose-400" />
            <span>21 CFR Part 11 Audit</span>
          </button>
        </div>

        {/* Filter AP Pill Options */}
        {activeView === 'pfmea' && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-500" />
              AP:
            </span>
            {(['ALL', 'H', 'M', 'L'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilterAp(level)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  filterAp === level
                    ? level === 'H'
                      ? 'bg-rose-500 text-white'
                      : level === 'M'
                      ? 'bg-amber-500 text-slate-950'
                      : level === 'L'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── AI Suggestion Toast Drawer (Collapsible) ───── */}
      {showAiModal && (
        <div className="p-4 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-950 border-b border-cyan-800/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-900/40 border border-cyan-700/50 text-cyan-300">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Tenant-Isolated Vector RAG Suggestion
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    Cos-Sim: 0.941
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-100 mt-0.5">
                  Suggested Detection Control for Row 102: "Automated torque-angle gradient derivative check (dM/dα)"
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Referenced from historical FMEA-2024-POWERTRAIN approved by Lead QA. Never committed without engineer review.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept Suggestion</span>
              </button>
              <button
                onClick={() => setShowAiModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Canvas Viewport ────────────────────────── */}
      <div className="p-4 sm:p-6 bg-[#0B0F19] min-h-[460px]">
        {/* VIEW 1: PFMEA GRID (AIAG-VDA Multi-Column Standard) */}
        {activeView === 'pfmea' && (
          <div className="space-y-4">
            {/* AIAG-VDA Grouped Hierarchy Banner */}
            <div className="hidden lg:grid grid-cols-12 gap-1 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 text-center">
              <div className="col-span-2 text-left pl-2 text-cyan-400">Step 2: Structure Analysis</div>
              <div className="col-span-2 text-left text-slate-300">Step 3: Function</div>
              <div className="col-span-3 text-left text-amber-400">Step 4: Failure Chain (FE ← FM ← FC)</div>
              <div className="col-span-3 text-center text-rose-400">Step 5: Risk & Action Priority</div>
              <div className="col-span-2 text-right pr-2 text-emerald-400">Step 6: Optimization</div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Op #</th>
                    <th className="py-2.5 px-3">4M / Work Element</th>
                    <th className="py-2.5 px-3">Failure Mode (FM)</th>
                    <th className="py-2.5 px-3">Failure Effect (FE)</th>
                    <th className="py-2.5 px-2 text-center text-rose-300 font-bold">S</th>
                    <th className="py-2.5 px-3">Failure Cause (FC)</th>
                    <th className="py-2.5 px-2 text-center text-amber-300 font-bold">O</th>
                    <th className="py-2.5 px-3">Detection Control</th>
                    <th className="py-2.5 px-2 text-center text-cyan-300 font-bold">D</th>
                    <th className="py-2.5 px-3 text-center">AP</th>
                    <th className="py-2.5 px-3 text-right">Corrective Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredRows.map((row) => {
                    const isSelected = row.id === selectedRowId;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRowId(row.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-slate-800/80 border-l-2 border-l-cyan-400'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-300 whitespace-nowrap">
                          {row.stepNo}
                        </td>
                        <td className="py-3 px-3 max-w-[150px]">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700/60 mb-1">
                            {row.fourM}
                          </span>
                          <div className="font-medium text-slate-200 truncate">{row.workElement}</div>
                        </td>
                        <td className="py-3 px-3 max-w-[180px] font-medium text-slate-100">
                          {row.failureMode}
                        </td>
                        <td className="py-3 px-3 max-w-[170px] text-slate-300">
                          {row.failureEffect}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-black text-rose-400">
                          {row.severity}
                        </td>
                        <td className="py-3 px-3 max-w-[170px] text-slate-300">
                          {row.failureCause}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-black text-amber-400">
                          {row.occurrence}
                        </td>
                        <td className="py-3 px-3 max-w-[160px] text-slate-300">
                          {row.detControl}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-black text-cyan-400">
                          {row.detection}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-mono font-black ${
                              row.ap === 'H'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : row.ap === 'M'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            {row.ap === 'H' ? 'HIGH' : row.ap === 'M' ? 'MED' : 'LOW'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right max-w-[160px]">
                          <div className="text-slate-200 font-medium truncate">{row.actionDesc}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {row.actionOwner} ·{' '}
                            <span
                              className={
                                row.status === 'Verified'
                                  ? 'text-emerald-400'
                                  : row.status === 'InProgress'
                                  ? 'text-cyan-400'
                                  : 'text-amber-400'
                              }
                            >
                              {row.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Row Deep-Inspection Card */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                    Row Selected: {selectedRow.id} ({selectedRow.stepNo} — {selectedRow.stepName})
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    AIAG-VDA AP Table Evaluated: S={selectedRow.severity}, O={selectedRow.occurrence}, D={selectedRow.detection}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-slate-100">Root Cause Linkage:</strong> {selectedRow.failureCause} →{' '}
                  <span className="text-cyan-400 font-medium">Auto-propagates to Control Plan & Reaction Instructions</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors">
                  View 4M Ishikawa
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
                  <span>Open Optimization Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PFD ↔ PFMEA SYNCHRONIZATION ENGINE */}
        {activeView === 'pfd' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Process Flow Diagram (PFD) ↔ PFMEA Synchronization Status
                </h4>
                <p className="text-xs text-slate-400">
                  Every PFD manufacturing station must link to corresponding PFMEA operations with zero orphan steps.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  Orphans: 0 Detected
                </span>
                <span className="px-2 py-1 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  Sync Latency: &lt; 40ms
                </span>
              </div>
            </div>

            {/* Interactive Process Sequence Flow */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { op: 'Op 10', name: 'Bearing Press', type: 'Operation', sync: true, cc: 'Depth Ø45.2', rows: 2 },
                { op: 'Op 20', name: 'Stator Bolt Torque', type: 'Fastening', sync: true, cc: 'Torque 48 N·m', rows: 3 },
                { op: 'Op 30', name: 'Dispense Thermal', type: 'Dispensing', sync: true, cc: 'Bead Width 2.0', rows: 1 },
                { op: 'Op 40', name: 'EOL Vision & Hi-Pot', type: 'Inspection', sync: true, cc: 'Dielectric 2.5kV', rows: 2 },
              ].map((step, idx) => (
                <div
                  key={step.op}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-cyan-400 text-xs">{step.op}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      PFMEA Linked
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-200 mb-1">{step.name}</div>
                  <div className="text-[11px] text-slate-400">Category: {step.type}</div>
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-400">CC: {step.cc}</span>
                    <span className="text-slate-400">{step.rows} FMEA Rows</span>
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-600">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Special Characteristics Flow-Down Verified (IATF 16949 Section 8.3.5.2)</span>
              </div>
              <p className="text-slate-400 text-[11.5px] leading-relaxed">
                Critical Characteristics (CC) and Significant Characteristics (SC) identified in the engineering drawings flow automatically from the DFMEA into the PFD process steps, then bind as mandatory coverage targets in the PFMEA and shop-floor Control Plan.
              </p>
            </div>
          </div>
        )}

        {/* VIEW 3: FAILURE CHAIN NETWORK (FE ← FM ← FC) */}
        {activeView === 'chain' && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-100">
                AIAG-VDA 2019 Step 4: Failure Chain Structural Network
              </h4>
              <p className="text-xs text-slate-400">
                Visualize the deterministic failure propagation: Cause (Work Element) → Mode (Process Step) → Effect (System & End User).
              </p>
            </div>

            {/* Visual 3-Node Failure Chain */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch py-4">
              {/* Node 1: Failure Cause */}
              <div className="p-4 rounded-xl bg-slate-900 border-2 border-amber-500/40 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    Failure Cause (FC) · 4M Machine
                  </span>
                  <h5 className="text-sm font-bold text-slate-100 mt-2 mb-1">
                    Angle encoder slip / friction coefficient drift
                  </h5>
                  <p className="text-xs text-slate-400">
                    Work Element Level: Nutrunner motor transducer loses calibration under heat cycles.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-800 text-xs font-mono text-amber-300">
                  Occurrence Rating: <strong>O = 4</strong>
                </div>
              </div>

              {/* Node 2: Failure Mode */}
              <div className="p-4 rounded-xl bg-slate-900 border-2 border-cyan-500/40 flex flex-col justify-between relative">
                <div className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-lg">
                  →
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    Failure Mode (FM) · Process Step
                  </span>
                  <h5 className="text-sm font-bold text-slate-100 mt-2 mb-1">
                    Fastener Under-Torqued (&lt;45.5 N·m)
                  </h5>
                  <p className="text-xs text-slate-400">
                    Process Step Level: Bolt clamp load insufficient to maintain joint integrity.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-800 text-xs font-mono text-cyan-300">
                  Detection Rating: <strong>D = 4</strong>
                </div>
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-lg">
                  →
                </div>
              </div>

              {/* Node 3: Failure Effect */}
              <div className="p-4 rounded-xl bg-slate-900 border-2 border-rose-500/40 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                    Failure Effect (FE) · End User Hazard
                  </span>
                  <h5 className="text-sm font-bold text-slate-100 mt-2 mb-1">
                    Stator Housing Vibration & Loss of Ground
                  </h5>
                  <p className="text-xs text-slate-400">
                    System Level: Electromagnetic interference, vehicle stall on roadway.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-800 text-xs font-mono text-rose-400 font-bold">
                  Inherited Severity: <strong>S = 9 (Critical Hazard)</strong>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>AIAG-VDA Action Priority Rule Triggered:</strong> S=9, O=4, D=4 generates mandatory <strong>HIGH AP</strong>.
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-rose-500 text-white font-mono font-bold text-xs">
                Corrective Action Required
              </span>
            </div>
          </div>
        )}

        {/* VIEW 4: CONTROL PLAN (CP) DYNAMIC SYNC */}
        {activeView === 'control_plan' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Dynamic Control Plan (CP) Bidirectional Mapping
                </h4>
                <p className="text-xs text-slate-400">
                  Control methods and tolerances are generated from PFMEA prevention and detection controls in real time.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/40">
                CP-2026-EDU-A Active
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900 text-[10.5px] font-mono uppercase text-slate-400">
                    <th className="py-2.5 px-3">Part/Process Step</th>
                    <th className="py-2.5 px-3">Machine / Tool</th>
                    <th className="py-2.5 px-3">Characteristic</th>
                    <th className="py-2.5 px-3">Specification / Tolerance</th>
                    <th className="py-2.5 px-3">Evaluation / Measurement Method</th>
                    <th className="py-2.5 px-3">Sample Size & Freq</th>
                    <th className="py-2.5 px-3">Reaction Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300 font-mono text-[11.5px]">
                  <tr>
                    <td className="py-3 px-3 text-slate-100 font-bold">10 — Bearing Press</td>
                    <td className="py-3 px-3">HP-04 Hydraulic</td>
                    <td className="py-3 px-3 text-cyan-400">Press Depth (CC)</td>
                    <td className="py-3 px-3">45.2 ± 0.1 mm</td>
                    <td className="py-3 px-3">Inline LVDT sensor</td>
                    <td className="py-3 px-3">100% continuous</td>
                    <td className="py-3 px-3 text-amber-400">Auto reject to quarantine bin</td>
                  </tr>
                  <tr className="bg-slate-850/50">
                    <td className="py-3 px-3 text-slate-100 font-bold">20 — Bolt Torque</td>
                    <td className="py-3 px-3">Atlas Multi-Spindle</td>
                    <td className="py-3 px-3 text-rose-400 font-bold">Clamp Torque (CC)</td>
                    <td className="py-3 px-3">48.0 ± 2.5 N·m</td>
                    <td className="py-3 px-3">Torque + Angle transducer</td>
                    <td className="py-3 px-3">100% per fastener</td>
                    <td className="py-3 px-3 text-rose-400 font-bold">Lock line + alert supervisor</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-slate-100 font-bold">30 — Thermal Paste</td>
                    <td className="py-3 px-3">Nordson Robot Arm</td>
                    <td className="py-3 px-3 text-cyan-400">Bead Width (SC)</td>
                    <td className="py-3 px-3">2.0 ± 0.2 mm</td>
                    <td className="py-3 px-3">Cognex 3D line-laser</td>
                    <td className="py-3 px-3">100% optical</td>
                    <td className="py-3 px-3 text-amber-400">Repurge nozzle + manual re-inspect</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-xs text-slate-400 font-mono flex items-center gap-2 pt-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Bidirectional propagation: Editing a tolerance in the Control Plan immediately updates PFMEA Row 102.</span>
            </div>
          </div>
        )}

        {/* VIEW 5: 21 CFR PART 11 CRYPTOGRAPHIC AUDIT TRAIL */}
        {activeView === 'audit_trail' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  21 CFR Part 11 Immutable Audit Partition & Digital Signatures
                </h4>
                <p className="text-xs text-slate-400">
                  PostgreSQL database-level constraints permanently reject UPDATE and DELETE queries on the audit partition.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/40 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>SHA-256 Verified</span>
              </span>
            </div>

            {/* Audit Log Entries */}
            <div className="space-y-2.5 font-mono text-xs">
              {[
                {
                  ts: '2026-10-17T08:14:22Z',
                  actor: 'Dr. Michael Vance (QA Director)',
                  action: 'SIGN_AND_LOCK_REVISION',
                  detail: 'Approved Rev C.2 for high-volume production release. Reviewer segregation validated.',
                  hash: 'a7f9c812d45e8901cb67b34e12fa',
                  status: 'VERIFIED',
                },
                {
                  ts: '2026-10-17T07:42:05Z',
                  actor: 'Kavita Patel (Quality Lead)',
                  action: 'CORRECTIVE_ACTION_EVIDENCE_ATTACHED',
                  detail: 'Cloudflare R2 evidence file uploaded: "Torque_Angle_Telemetry_Run_04.csv" (12.4 MB).',
                  hash: '3e81b290ac947118fd0923e59b6c',
                  status: 'VERIFIED',
                },
                {
                  ts: '2026-10-16T18:30:11Z',
                  actor: 'System / RAG Worker',
                  action: 'AI_SUGGESTION_ACCEPTED',
                  detail: 'User accepted detection control suggestion for Row 101: "LVDT sensor at stroke end".',
                  hash: '901cf48201a93284bd8912e03a1f',
                  status: 'VERIFIED',
                },
              ].map((entry) => (
                <div
                  key={entry.hash}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">{entry.ts}</span>
                      <span className="text-cyan-400 font-bold">{entry.actor}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {entry.action}
                      </span>
                    </div>
                    <div className="text-slate-200 text-xs font-sans">{entry.detail}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400">
                      Hash: <span className="text-emerald-400 font-bold">{entry.hash}</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                      <Check className="w-3 h-3" />
                      <span>Cryptographic Lock Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Studio Bottom Telemetry Bar ─────────────────── */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2.5 bg-[#0D1322] border-t border-slate-800 text-xs font-mono text-slate-400 gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>AIAG-VDA 2019 AP Gating: 100% Enforced</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">Active Tenant: automotive-tier1.fmeapex.cloud</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500">PostgreSQL 15 Serverless RLS</span>
          <span className="text-cyan-400 font-bold">21 CFR Part 11 Certified</span>
        </div>
      </div>
    </div>
  );
};

export default FmeaStudioPreview;
