import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateAP } from '../pfmea/utils/apCalculator';
import { useAuth } from '../auth/AuthContext';
import {
  Sparkles,
  Info,
  RotateCcw
} from 'lucide-react';

const SEVERITY_DESCRIPTIONS: Record<number, { title: string; desc: string }> = {
  10: { title: 'Hazardous without warning', desc: 'Failure affects safe operation without warning; non-compliance with regulations.' },
  9: { title: 'Hazardous with warning', desc: 'Failure affects safe operation with warning; non-compliance with regulations.' },
  8: { title: 'Loss of primary function', desc: 'Vehicle / assembly inoperable; primary function completely lost.' },
  7: { title: 'Degradation of primary function', desc: 'Vehicle / assembly operable but at reduced performance level.' },
  6: { title: 'Loss of secondary function', desc: 'Secondary function lost (e.g., HVAC, wipers, infotainment).' },
  5: { title: 'Degradation of secondary function', desc: 'Secondary function operable but at reduced performance.' },
  4: { title: 'Moderate cosmetic / fit finish', desc: 'Noticeable defect by >75% of customers; causes customer dissatisfaction.' },
  3: { title: 'Minor cosmetic / fit finish', desc: 'Noticeable defect by 50% of customers; minor rework required.' },
  2: { title: 'Very minor defect', desc: 'Noticeable only by discriminating customers; slight rework.' },
  1: { title: 'No discernible effect', desc: 'No customer impact or manufacturing consequence.' },
};

const OCCURRENCE_DESCRIPTIONS: Record<number, { title: string; desc: string }> = {
  10: { title: 'Extremely High (>100 / 1,000)', desc: 'New technology or design without historical prevention controls.' },
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

  const [severity, setSeverity] = useState<number>(9);
  const [occurrence, setOccurrence] = useState<number>(4);
  const [detection, setDetection] = useState<number>(4);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [showAiOptimized, setShowAiOptimized] = useState<boolean>(false);

  const handleLaunch = async () => {
    if (token) {
      navigate('/app/projects');
      return;
    }
    setLaunching(true);
    try {
      sessionStorage.removeItem('logged_out');
      await guestLogin();
      navigate('/app/projects');
    } catch {
      navigate('/app/projects');
    } finally {
      setLaunching(false);
    }
  };

  const ap = calculateAP(severity, occurrence, detection) || 'L';
  const rpn = severity * occurrence * detection;

  // Optimized values (e.g., when quality controls are applied)
  const optO = Math.max(1, Math.min(occurrence, occurrence > 3 ? occurrence - 2 : 1));
  const optD = Math.max(1, Math.min(detection, detection > 2 ? 2 : 1));
  const optAp = calculateAP(severity, optO, optD) || 'L';
  const optRpn = severity * optO * optD;

  const currentAp = showAiOptimized ? optAp : ap;
  const currentRpn = showAiOptimized ? optRpn : rpn;

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
          bg: 'bg-rose-500/15',
          border: 'border-rose-500/40',
          text: 'text-rose-400',
          badge: 'bg-rose-500 text-white',
          label: 'HIGH AP',
          mandate: 'Mandatory Corrective Action Required',
          actionText: 'Must reduce Occurrence or improve Detection before SOP.',
        };
      case 'M':
        return {
          bg: 'bg-amber-500/15',
          border: 'border-amber-500/40',
          text: 'text-amber-300',
          badge: 'bg-amber-500 text-slate-950',
          label: 'MEDIUM AP',
          mandate: 'Engineering Review & Optimization Recommended',
          actionText: 'Review prevention controls to determine cost/benefit feasibility.',
        };
      case 'L':
      default:
        return {
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/40',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500 text-white',
          label: 'LOW AP',
          mandate: 'Controls Adequate / Discretionary Action',
          actionText: 'Existing prevention and detection controls are sufficient.',
        };
    }
  };

  const apMeta = getApColor(currentAp);

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-[#0B0F19] border border-slate-800 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden font-sans">
      {/* ── Console Header ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between px-5 sm:px-8 py-4 bg-[#0D1322] border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 text-[11px] font-mono font-bold uppercase tracking-wider">
              AIAG-VDA 2019 Standard (1st Edition)
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400 hidden sm:inline font-mono">
              Deterministic AP Decision Matrix
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-100 mt-1">
            Action Priority (AP) Engine & Risk Simulator
          </h3>
        </div>

        {/* 1-Click Failure Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden md:inline">Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p, idx) => (
              <button
                key={p.name}
                onClick={() => handleSelectPreset(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activePresetIndex === idx
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {p.category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active Preset Description Card ─────────────── */}
      <div className="px-5 sm:px-8 py-3.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="text-slate-400">Simulating scenario: </span>
          <strong className="text-slate-200">{PRESETS[activePresetIndex].name}</strong>
          <span className="text-slate-500 ml-2">({PRESETS[activePresetIndex].failureMode})</span>
        </div>
        <button
          onClick={() => {
            setSeverity(PRESETS[activePresetIndex].s);
            setOccurrence(PRESETS[activePresetIndex].o);
            setDetection(PRESETS[activePresetIndex].d);
            setShowAiOptimized(false);
          }}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono text-[11px] self-end sm:self-center"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Preset</span>
        </button>
      </div>

      {/* ── Main Interactive Grid ───────────────────────── */}
      <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3 Precision Sliders (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Slider 1: Severity */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                  Step 5.1 · Severity (S)
                </span>
                <h4 className="text-sm font-bold text-slate-100">
                  Impact on System, Regulatory & End User
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-rose-400 tabular-nums">
                  {severity}
                </span>
                <span className="text-slate-500 text-xs font-mono">/10</span>
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
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              aria-label="Severity rating slider"
            />

            <div className="mt-2 flex items-start justify-between text-xs text-slate-400">
              <span className="text-slate-200 font-medium">
                {SEVERITY_DESCRIPTIONS[severity].title}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline text-right max-w-[280px]">
                {SEVERITY_DESCRIPTIONS[severity].desc}
              </span>
            </div>
          </div>

          {/* Slider 2: Occurrence */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Step 5.2 · Occurrence (O)
                </span>
                <h4 className="text-sm font-bold text-slate-100">
                  Likelihood of Cause & Prevention Controls
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-amber-400 tabular-nums">
                  {showAiOptimized ? optO : occurrence}
                </span>
                <span className="text-slate-500 text-xs font-mono">/10</span>
                {showAiOptimized && (
                  <span className="text-xs text-emerald-400 font-mono block">
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
              value={showAiOptimized ? optO : occurrence}
              onChange={(e) => {
                setOccurrence(Number(e.target.value));
                setShowAiOptimized(false);
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              aria-label="Occurrence rating slider"
            />

            <div className="mt-2 flex items-start justify-between text-xs text-slate-400">
              <span className="text-slate-200 font-medium">
                {OCCURRENCE_DESCRIPTIONS[showAiOptimized ? optO : occurrence].title}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline text-right max-w-[280px]">
                {OCCURRENCE_DESCRIPTIONS[showAiOptimized ? optO : occurrence].desc}
              </span>
            </div>
          </div>

          {/* Slider 3: Detection */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Step 5.3 · Detection (D)
                </span>
                <h4 className="text-sm font-bold text-slate-100">
                  Ability of Controls to Catch Cause or Mode
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-cyan-400 tabular-nums">
                  {showAiOptimized ? optD : detection}
                </span>
                <span className="text-slate-500 text-xs font-mono">/10</span>
                {showAiOptimized && (
                  <span className="text-xs text-emerald-400 font-mono block">
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
              value={showAiOptimized ? optD : detection}
              onChange={(e) => {
                setDetection(Number(e.target.value));
                setShowAiOptimized(false);
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              aria-label="Detection rating slider"
            />

            <div className="mt-2 flex items-start justify-between text-xs text-slate-400">
              <span className="text-slate-200 font-medium">
                {DETECTION_DESCRIPTIONS[showAiOptimized ? optD : detection].title}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline text-right max-w-[280px]">
                {DETECTION_DESCRIPTIONS[showAiOptimized ? optD : detection].desc}
              </span>
            </div>
          </div>

          {/* AI Optimization Toggle Card */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase text-cyan-300">
                  AI Closed-Loop Quality Optimization
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {PRESETS[activePresetIndex].aiSuggestedFix}
              </p>
            </div>

            <button
              onClick={() => setShowAiOptimized(!showAiOptimized)}
              className={`shrink-0 px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
                showAiOptimized
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-700/50'
              }`}
            >
              {showAiOptimized ? '✓ Applied Optimization' : 'Simulate AI Fix'}
            </button>
          </div>
        </div>

        {/* Right Column: AP Decision & RPN Comparison Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Action Priority Decision Result Box */}
          <div className={`p-6 rounded-2xl border-2 ${apMeta.border} ${apMeta.bg} shadow-lg space-y-4`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                AIAG-VDA 2019 Rating
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-black ${apMeta.badge}`}>
                {apMeta.label}
              </span>
            </div>

            <div>
              <div className={`text-2xl font-extrabold ${apMeta.text}`}>
                {apMeta.mandate}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {apMeta.actionText}
              </p>
            </div>

            {/* Score Pill Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-center font-mono">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Severity</div>
                <div className="text-lg font-bold text-rose-400">{severity}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Occurrence</div>
                <div className="text-lg font-bold text-amber-400">
                  {showAiOptimized ? optO : occurrence}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Detection</div>
                <div className="text-lg font-bold text-cyan-400">
                  {showAiOptimized ? optD : detection}
                </div>
              </div>
            </div>
          </div>

          {/* Why AIAG-VDA AP Replaced Legacy RPN */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Action Priority (AP) vs Legacy RPN</span>
              </h5>
              <span className="text-xs font-mono text-slate-400">
                Legacy RPN: <strong className="text-slate-100">{currentRpn}</strong> / 1000
              </span>
            </div>

            <p className="text-[11.5px] text-slate-400 leading-relaxed">
              In traditional FMEA, teams used an arbitrary threshold (e.g. RPN &gt; 100). A lethal hazard (S=10, O=2, D=2) yielded RPN 40 and was ignored. Conversely, a minor cosmetic defect (S=2, O=8, D=8) yielded RPN 128 and triggered unnecessary engineering rework.
            </p>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-cyan-300">
              ✓ AIAG-VDA 2019 prioritizes Severity first, then Occurrence, then Detection — guaranteeing critical hazards receive mandatory High AP attention.
            </div>
          </div>

          {/* Launch CTA */}
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="w-full py-3 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-[0_4px_20px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2"
          >
            <span>{launching ? 'Launching Sandbox...' : 'Launch Guest Sandbox to Run Full PFMEA →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskCalculatorWidget;
