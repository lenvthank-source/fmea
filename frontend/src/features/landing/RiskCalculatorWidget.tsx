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

// Illustrative labels only. Actual ratings must use the applicable approved scale.
const SEVERITY_DESCRIPTIONS = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, {
  title: `Severity ${i + 1}`,
  desc: 'Evaluate the most serious applicable effect using your approved severity scale.',
}])) as Record<number, { title: string; desc: string }>;
const OCCURRENCE_DESCRIPTIONS = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, {
  title: `Occurrence ${i + 1}`,
  desc: 'Assess the cause and evidence for prevention using your approved occurrence scale.',
}])) as Record<number, { title: string; desc: string }>;
const DETECTION_DESCRIPTIONS = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, {
  title: `Detection ${i + 1}`,
  desc: 'Assess the actual detection control and its effectiveness using your approved detection scale.',
}])) as Record<number, { title: string; desc: string }>;

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

  // Hypothetical values for exploration only; no engineering records are changed.
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
          mandate: 'Priority for team review',
          actionText: 'Document review and appropriate actions or justification under your applicable customer and company policy.',
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
          mandate: 'Lower action priority',
          actionText: 'A lower AP result does not establish safety, control effectiveness, or acceptance. Review the engineering evidence.',
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
              Illustrative risk comparison
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 hidden sm:inline font-mono">
              Configured AP profile and RPN
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Illustrative examples, not rating tables. Use your approved scales and verified evidence for actual analysis.</p>
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
                  Hypothetical control scenario
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-[420px]">
                {PRESETS[activePresetIndex].aiSuggestedFix.replace(/ \(.*\)$/, "")}. Ratings shown after the toggle are illustrative assumptions, not verified improvements.
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
              <span>{showAiOptimized ? 'Restore original scenario' : 'Explore assumed ratings'}</span>
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
                <span>Configured AP result</span>
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
                  <span>Threshold-only prioritization</span>
                </div>
                <p className="text-[11.5px] leading-relaxed">
                  A threshold of RPN &gt; 100 would exclude this example with <strong>Severity {severity}</strong> and <strong>RPN {currentRpn}</strong>. Review individual ratings and the configured AP result of <strong>{currentAp}</strong> alongside engineering evidence.
                </p>
              </div>
            )}

            {isExcelFalsePanic && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-700 text-[11px] uppercase font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Different prioritization outcomes</span>
                </div>
                <p className="text-[11.5px] leading-relaxed">
                  This example has <strong>RPN {currentRpn}</strong> and configured AP <strong>{currentAp}</strong>. Different prioritization methods can produce different outcomes; neither result alone determines the required action.
                </p>
              </div>
            )}

            {!isExcelBlindspot && !isExcelFalsePanic && (
              <div className="text-[11.5px] text-slate-500 leading-relaxed">
                Use S/O/D, the configured AP profile, and engineering judgment together. Numerical handbook conformity of this profile is pending independent verification.
              </div>
            )}
          </div>

          {/* Launch Action Button */}
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 group"
          >
            <span>{launching ? 'Opening Workspace...' : 'Try FMEApex'}</span>
            <ArrowRight className="w-4 h-4 text-[#FF5500] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskCalculatorWidget;
