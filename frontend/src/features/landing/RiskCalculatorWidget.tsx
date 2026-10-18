import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateAP } from '../pfmea/utils/apCalculator';
import { useAuth } from '../auth/AuthContext';
import {
  Sparkles,
  RotateCcw,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

const SEVERITY_DESCRIPTIONS: Record<number, { title: string; desc: string }> = {
  10: { title: 'Hazardous without warning', desc: 'Failure affects safe operation without warning; regulatory violation.' },
  9: { title: 'Hazardous with warning', desc: 'Failure affects safe operation with warning; non-compliance with regulations.' },
  8: { title: 'Loss of primary function', desc: 'Vehicle / assembly inoperable; primary function completely lost.' },
  7: { title: 'Degradation of primary function', desc: 'Vehicle / assembly operable but at reduced performance level.' },
  6: { title: 'Loss of secondary function', desc: 'Secondary function lost (e.g., HVAC, wipers, infotainment).' },
  5: { title: 'Degradation of secondary function', desc: 'Secondary function operable but at reduced performance.' },
  4: { title: 'Moderate cosmetic / fit finish', desc: 'Noticeable defect by >75% of customers; customer dissatisfaction.' },
  3: { title: 'Minor cosmetic / fit finish', desc: 'Noticeable defect by 50% of customers; minor rework required.' },
  2: { title: 'Very minor defect', desc: 'Noticeable only by discriminating customers; slight rework.' },
  1: { title: 'No discernible effect', desc: 'No customer impact or manufacturing consequence.' },
};

const OCCURRENCE_DESCRIPTIONS: Record<number, { title: string; desc: string }> = {
  10: { title: 'Extremely High (>100 / 1,000)', desc: 'New technology without historical prevention controls.' },
  9: { title: 'Very High (~50 / 1,000)', desc: 'Similar process has high historical failure frequency.' },
  8: { title: 'High (~20 / 1,000)', desc: 'Prevention controls are minimal or reliant on operator diligence.' },
  7: { title: 'Moderately High (~10 / 1,000)', desc: 'Basic prevention controls exist but occasional failures occur.' },
  6: { title: 'Moderate (~2 / 1,000)', desc: 'Standard industrial prevention controls in active use.' },
  5: { title: 'Low (~0.5 / 1,000)', desc: 'Effective prevention controls proven in identical product lines.' },
  4: { title: 'Very Low (~0.1 / 1,000)', desc: 'Automated error-proofing (Poka-Yoke) prevents root cause.' },
  3: { title: 'Extremely Low (~0.01 / 1,000)', desc: 'Robust prevention controls; isolated failures in extreme conditions.' },
  2: { title: 'Remote (<0.001 / 1,000)', desc: 'Failure nearly impossible due to preventative machine interlocking.' },
  1: { title: 'Physically Eliminated', desc: 'Failure mechanism eliminated by structural design geometry.' },
};

const DETECTION_DESCRIPTIONS: Record<number, { title: string; desc: string }> = {
  10: { title: 'Cannot Detect / No Control', desc: 'No detection controls exist; defect will flow down to end customer.' },
  9: { title: 'Very Remote (Visual Downstream)', desc: 'Undocumented visual or sensory check far downstream in process.' },
  8: { title: 'Remote (Visual at Station)', desc: 'Manual visual inspection by operator at workstation.' },
  7: { title: 'Very Low (Double Manual Check)', desc: 'Manual attribute gauging or secondary visual audit.' },
  6: { title: 'Low (Variable Gauging)', desc: 'Operator uses calibrated variable gauge (caliper/micrometer).' },
  5: { title: 'Moderate (Statistical SPC)', desc: 'Periodic statistical sampling with control chart alert.' },
  4: { title: 'Moderately High (Automated Sensor)', desc: 'Automated optical or proximity detection downstream.' },
  3: { title: 'High (Automated In-Situ Reject)', desc: 'Machine sensor verifies feature at workstation with auto-reject.' },
  2: { title: 'Very High (100% Poka-Yoke)', desc: 'Defective part cannot proceed to next station; line interlocked.' },
  1: { title: 'Detection Not Applicable', desc: 'Defect cannot be produced; detection not required.' },
};

interface PresetScenario {
  name: string;
  category: string;
  s: number;
  o: number;
  d: number;
  failureMode: string;
  cause: string;
  aiSuggestedFix: string;
}

const PRESETS: PresetScenario[] = [
  {
    name: 'Critical Stator Bolt Torque Under-Spec',
    category: 'Powertrain',
    s: 9,
    o: 4,
    d: 4,
    failureMode: 'Bolt clamp load below minimum specification (<45 N·m)',
    cause: 'Nutrunner angle encoder calibration drift during shift',
    aiSuggestedFix: 'Implement dynamic torque-angle derivative window + MES interlock (D reduces from 4 to 2)',
  },
  {
    name: 'EV Battery Busbar Laser Weld Penetration',
    category: 'Battery / HV',
    s: 9,
    o: 3,
    d: 5,
    failureMode: 'Weld penetration depth < 0.45mm causing high joint resistance',
    cause: 'Thermal focal shift on protective cover slide of laser head',
    aiSuggestedFix: 'Inline OCT (Optical Coherence Tomography) real-time seam depth tracking (D reduces to 2)',
  },
  {
    name: 'Hydraulic Press Bearing Depth Runout',
    category: 'Chassis',
    s: 8,
    o: 4,
    d: 3,
    failureMode: 'Bearing seated 0.2mm proud of housing datum plane',
    cause: 'Load cell amplifier temperature drift',
    aiSuggestedFix: 'Closed-loop servo press with force vs displacement signature curve (O reduces to 2)',
  },
  {
    name: 'Cosmetic Surface Scuff on Door Trim',
    category: 'Interior',
    s: 3,
    o: 7,
    d: 6,
    failureMode: 'Micro-scratches on piano-black decorative trim (>2mm)',
    cause: 'Abrasive particulate on operator handling gloves',
    aiSuggestedFix: 'Lint-free silicone handling gloves + protective peeler film (O reduces to 3)',
  },
];

export const RiskCalculatorWidget: React.FC = () => {
  const navigate = useNavigate();
  const { token, guestLogin } = useAuth();
  const [launching, setLaunching] = useState(false);

  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [severity, setSeverity] = useState(9);
  const [occurrence, setOccurrence] = useState(4);
  const [detection, setDetection] = useState(4);
  const [showAiOptimized, setShowAiOptimized] = useState(false);

  const handleLaunch = async () => {
    if (token) {
      navigate('/app/projects');
      return;
    }
    setLaunching(true);
    try {
      await guestLogin();
      navigate('/app/projects');
    } catch (err) {
      console.error('Launch failed:', err);
      navigate('/login');
    } finally {
      setLaunching(false);
    }
  };

  const ap = calculateAP(severity, occurrence, detection) || 'L';
  const rpn = severity * occurrence * detection;

  // Optimized values when engineering controls are applied
  const optO = Math.max(1, Math.min(occurrence, occurrence > 3 ? occurrence - 2 : 1));
  const optD = Math.max(1, Math.min(detection, detection > 2 ? 2 : 1));
  const optAp = calculateAP(severity, optO, optD) || 'L';
  const optRpn = severity * optO * optD;

  const currentAp = showAiOptimized ? optAp : ap;
  const currentRpn = showAiOptimized ? optRpn : rpn;
  const activeO = showAiOptimized ? optO : occurrence;
  const activeD = showAiOptimized ? optD : detection;

  const handleSelectPreset = (idx: number) => {
    const p = PRESETS[idx];
    setActivePresetIndex(idx);
    setSeverity(p.s);
    setOccurrence(p.o);
    setDetection(p.d);
    setShowAiOptimized(false);
  };

  const getApColor = (priority: 'H' | 'M' | 'L') => {
    switch (priority) {
      case 'H':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-300',
          badgeBg: 'bg-rose-600 text-white',
          text: 'text-rose-950',
          highlightText: 'text-rose-700',
          label: 'HIGH AP',
          mandate: 'Mandatory Corrective Action Required',
          actionText: 'Must reduce Occurrence or improve Detection controls before Start of Production (SOP).',
          icon: <ShieldAlert className="w-5 h-5 text-rose-600" />
        };
      case 'M':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          badgeBg: 'bg-amber-600 text-white',
          text: 'text-amber-950',
          highlightText: 'text-amber-700',
          label: 'MEDIUM AP',
          mandate: 'Engineering Review Recommended',
          actionText: 'Review prevention controls to determine cost/benefit feasibility of additional error-proofing.',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
        };
      case 'L':
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-300',
          badgeBg: 'bg-emerald-600 text-white',
          text: 'text-emerald-950',
          highlightText: 'text-emerald-700',
          label: 'LOW AP',
          mandate: 'Controls Adequate · Discretionary Action',
          actionText: 'Existing prevention and detection controls are sufficient. No mandatory rework required.',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />
        };
    }
  };

  const apMeta = getApColor(currentAp);

  // Analyze whether legacy Excel RPN creates an audit failure or false panic
  const isExcelBlindspot = severity >= 8 && currentRpn < 100;
  const isExcelFalsePanic = severity <= 3 && currentRpn >= 100;

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] overflow-hidden font-sans">
      {/* ── 1. Header with Scenario Presets ─────────────────── */}
      <div className="flex flex-wrap items-center justify-between px-5 sm:px-8 py-5 bg-slate-50/80 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 text-[11px] font-mono font-bold uppercase tracking-wider">
              AIAG-VDA 2019 Standard
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 hidden sm:inline font-mono">
              Deterministic AP Decision Matrix vs. Legacy Excel RPN
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            Action Priority (AP) Engine & Risk Simulator
          </h3>
        </div>

        {/* 1-Click Automotive Scenario Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono hidden md:inline">Scenarios:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p, idx) => (
              <button
                key={p.name}
                onClick={() => handleSelectPreset(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePresetIndex === idx
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {p.category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Active Scenario Context Ribbon ───────────────── */}
      <div className="px-5 sm:px-8 py-3 bg-amber-50/60 border-b border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-amber-950">
          <span className="font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 bg-amber-200/60 rounded text-amber-900">
            Active Failure
          </span>
          <strong className="font-bold">{PRESETS[activePresetIndex].name}</strong>
          <span className="text-amber-800/80 hidden md:inline">({PRESETS[activePresetIndex].failureMode})</span>
        </div>
        <button
          onClick={() => {
            setSeverity(PRESETS[activePresetIndex].s);
            setOccurrence(PRESETS[activePresetIndex].o);
            setDetection(PRESETS[activePresetIndex].d);
            setShowAiOptimized(false);
          }}
          className="text-amber-800 hover:text-amber-950 flex items-center gap-1 font-mono text-[11px] self-end sm:self-center font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Preset</span>
        </button>
      </div>

      {/* ── 3. Main Interactive Layout ──────────────────────── */}
      <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3 Precision Sliders (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Slider 1: Severity */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Step 5.1 · Severity (S)
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Customer & Vehicle Safety Impact
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-rose-600 tabular-nums">
                  {severity}
                </span>
                <span className="text-slate-400 text-xs font-mono">/10</span>
              </div>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={severity}
              onChange={(e) => {
                setSeverity(Number(e.target.value));
                setShowAiOptimized(false);
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              aria-label="Severity rating slider"
            />

            <div className="mt-2.5 flex items-start justify-between text-xs text-slate-600">
              <span className="text-slate-900 font-bold">
                {SEVERITY_DESCRIPTIONS[severity].title}
              </span>
              <span className="text-[11.5px] text-slate-500 hidden sm:inline text-right max-w-[280px]">
                {SEVERITY_DESCRIPTIONS[severity].desc}
              </span>
            </div>
          </div>

          {/* Slider 2: Occurrence */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Step 5.2 · Occurrence (O)
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Likelihood of Cause & Prevention Controls
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-amber-600 tabular-nums">
                  {activeO}
                </span>
                <span className="text-slate-400 text-xs font-mono">/10</span>
                {showAiOptimized && (
                  <span className="text-xs text-emerald-600 font-mono font-bold block">
                    ↓ from {occurrence}
                  </span>
                )}
              </div>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={activeO}
              onChange={(e) => {
                setOccurrence(Number(e.target.value));
                setShowAiOptimized(false);
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              aria-label="Occurrence rating slider"
            />

            <div className="mt-2.5 flex items-start justify-between text-xs text-slate-600">
              <span className="text-slate-900 font-bold">
                {OCCURRENCE_DESCRIPTIONS[activeO].title}
              </span>
              <span className="text-[11.5px] text-slate-500 hidden sm:inline text-right max-w-[280px]">
                {OCCURRENCE_DESCRIPTIONS[activeO].desc}
              </span>
            </div>
          </div>

          {/* Slider 3: Detection */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Step 5.3 · Detection (D)
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Ability of Controls to Catch Cause or Mode
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-blue-600 tabular-nums">
                  {activeD}
                </span>
                <span className="text-slate-400 text-xs font-mono">/10</span>
                {showAiOptimized && (
                  <span className="text-xs text-emerald-600 font-mono font-bold block">
                    ↓ from {detection}
                  </span>
                )}
              </div>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={activeD}
              onChange={(e) => {
                setDetection(Number(e.target.value));
                setShowAiOptimized(false);
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              aria-label="Detection rating slider"
            />

            <div className="mt-2.5 flex items-start justify-between text-xs text-slate-600">
              <span className="text-slate-900 font-bold">
                {DETECTION_DESCRIPTIONS[activeD].title}
              </span>
              <span className="text-[11.5px] text-slate-500 hidden sm:inline text-right max-w-[280px]">
                {DETECTION_DESCRIPTIONS[activeD].desc}
              </span>
            </div>
          </div>

          {/* AI Optimization Simulation Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF5500]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5500]">
                  AI Closed-Loop Optimization
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-[420px]">
                {PRESETS[activePresetIndex].aiSuggestedFix}
              </p>
            </div>

            <button
              onClick={() => setShowAiOptimized(!showAiOptimized)}
              className={`shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                showAiOptimized
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                  : 'bg-white text-slate-900 hover:bg-slate-100 shadow-xs'
              }`}
            >
              <span>{showAiOptimized ? '✓ Fix Applied (Low Risk)' : 'Simulate Engineering Fix'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Comparative Split (Excel RPN vs FMEApex AP) (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: FMEApex AIAG-VDA AP Decision */}
          <div className={`p-5 sm:p-6 rounded-2xl border-2 ${apMeta.border} ${apMeta.bg} space-y-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                {apMeta.icon}
                <span>AIAG-VDA 2019 Decision</span>
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-black ${apMeta.badgeBg}`}>
                {apMeta.label}
              </span>
            </div>

            <div>
              <div className={`text-xl sm:text-2xl font-extrabold ${apMeta.text}`}>
                {apMeta.mandate}
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {apMeta.actionText}
              </p>
            </div>

            {/* Score Pill Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-center font-mono">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Severity</div>
                <div className="text-lg font-black text-rose-600">{severity}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Occurrence</div>
                <div className="text-lg font-black text-amber-600">{activeO}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Detection</div>
                <div className="text-lg font-black text-blue-600">{activeD}</div>
              </div>
            </div>
          </div>

          {/* Card 2: The Flawed Legacy Excel RPN Math */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#107c41]" />
                <span>Legacy Excel RPN Math</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                RPN: {currentRpn} / 1000
              </span>
            </div>

            <div className="font-mono text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
              Formula: <span className="text-slate-900 font-bold">= {severity} × {activeO} × {activeD} = {currentRpn}</span>
            </div>

            {/* Dynamic Comparison Callout */}
            {isExcelBlindspot && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1 text-rose-700 text-[11px] uppercase font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Excel Critical Blindspot (Audit Risk)</span>
                </div>
                <p className="text-[11.5px] leading-relaxed">
                  In Excel, using an arbitrary threshold (e.g. RPN &gt; 100), this catastrophic <strong>Severity {severity}</strong> hazard scores <strong>RPN {currentRpn}</strong> and is skipped as &quot;Low Risk&quot;! AIAG-VDA 2019 AP immediately flags it as <strong>HIGH AP</strong>.
                </p>
              </div>
            )}

            {isExcelFalsePanic && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-700 text-[11px] uppercase font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Excel False Panic (Wasted Rework)</span>
                </div>
                <p className="text-[11.5px] leading-relaxed">
                  A minor cosmetic blemish scores <strong>RPN {currentRpn}</strong> due to high frequency, triggering unnecessary engineering redesign. FMEApex correctly categorizes it as <strong>LOW AP</strong>.
                </p>
              </div>
            )}

            {!isExcelBlindspot && !isExcelFalsePanic && (
              <div className="text-[11.5px] text-slate-500 leading-relaxed">
                AIAG-VDA 2019 prioritizes Severity first, then Occurrence, then Detection — ensuring high-consequence failure modes always receive attention regardless of RPN arithmetic.
              </div>
            )}
          </div>

          {/* Launch Action Button */}
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 group"
          >
            <span>{launching ? 'Opening Workspace...' : 'Launch Guest Sandbox to Run Full PFMEA'}</span>
            <ArrowRight className="w-4 h-4 text-[#FF5500] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskCalculatorWidget;
