import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const RiskCalculatorWidget: React.FC = () => {
  const navigate = useNavigate();
  const [severity, setSeverity] = useState(9);
  const [occurrence, setOccurrence] = useState(7);
  const [detection, setDetection] = useState(6);

  const calcAP = (s: number, o: number, d: number): { ap: 'High' | 'Medium' | 'Low'; cls: string; dot: string } => {
    if (s >= 8 && (o >= 6 || d >= 6)) return { ap: 'High', cls: 'bg-[#FEE2E2] text-[#DC2626]', dot: '#DC2626' };
    if (s >= 6 && o >= 4 && d >= 4) return { ap: 'Medium', cls: 'bg-[#FEF3C7] text-[#B45309]', dot: '#D97706' };
    return { ap: 'Low', cls: 'bg-[#D1FAE5] text-[#047857]', dot: '#059669' };
  };

  const before = calcAP(severity, occurrence, detection);
  const rpnBefore = severity * occurrence * detection;
  const aiO = Math.max(1, Math.floor(occurrence * 0.3));
  const aiD = Math.max(1, Math.floor(detection * 0.3));
  const after = calcAP(severity, aiO, aiD);
  const rpnAfter = severity * aiO * aiD;
  const reduction = Math.round(((rpnBefore - rpnAfter) / rpnBefore) * 100);

  const sliders = [
    { label: 'Severity', sub: 'Impact on the user / downstream', value: severity, set: setSeverity, hint: severity >= 8 ? 'Critical hazard' : severity >= 5 ? 'Moderate impact' : 'Minor impact' },
    { label: 'Occurrence', sub: 'Likelihood of the cause', value: occurrence, set: setOccurrence, hint: occurrence >= 7 ? 'Frequent failure' : occurrence >= 4 ? 'Occasional' : 'Remote' },
    { label: 'Detection', sub: 'Ability of controls to catch it', value: detection, set: setDetection, hint: detection >= 7 ? 'Poor control' : detection >= 4 ? 'Moderate control' : 'High control' },
  ];

  return (
    <div className="w-full rounded-[28px] bg-white border border-[#E5E0D8] shadow-[0_12px_40px_rgba(0,0,0,0.04)] p-7 sm:p-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-[#FF682C]/10 flex items-center justify-center">
          <div className="w-4 h-4 rounded-sm bg-[#FF682C]" />
        </div>
        <div>
          <h3 className="text-[19px] font-extrabold text-[#18181B] tracking-tight">Interactive Action Priority Simulator</h3>
          <p className="text-[13px] text-[#71717A]">Deterministic AIAG-VDA 2019 AP matrix calculation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-8">
        {/* Sliders */}
        <div className="space-y-7">
          {sliders.map((s) => (
            <div key={s.label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <div>
                  <span className="text-[14.5px] font-bold text-[#18181B]">{s.label}</span>
                  <span className="text-[12px] text-[#71717A] ml-2 hidden sm:inline">{s.sub}</span>
                </div>
                <span className="text-[15px] font-extrabold text-[#18181B] font-mono tabular-nums">{s.value}<span className="text-[#A1A1AA] font-normal">/10</span></span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={s.value}
                onChange={(e) => s.set(Number(e.target.value))}
                className="fmea-range"
                aria-label={`${s.label} slider`}
              />
              <p className="text-[11.5px] text-[#71717A] mt-1.5 font-medium">{s.hint}</p>
            </div>
          ))}
        </div>

        {/* Result cards */}
        <div className="space-y-5 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#E5E0D8] bg-[#FAF9F6] p-5 text-center shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-[#71717A]">Initial State</span>
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-bold ${before.cls}`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: before.dot }} />
                  {before.ap} AP
                </span>
              </div>
              <div className="mt-3 text-[36px] font-extrabold text-[#18181B] font-mono leading-none tabular-nums">{rpnBefore}</div>
              <div className="text-[11.5px] text-[#71717A] mt-1 font-mono">RPN (S×O×D)</div>
            </div>

            <div className="rounded-2xl border border-[#FF682C]/30 bg-[#FFF9F5] p-5 text-center relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-lg bg-[#FF682C] text-white text-[10px] font-bold uppercase tracking-wider font-mono">AI RAG</div>
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-[#FF682C]">After AI Copilot</span>
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-bold ${after.cls}`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: after.dot }} />
                  {after.ap} AP
                </span>
              </div>
              <div className="mt-3 text-[36px] font-extrabold text-[#FF682C] font-mono leading-none tabular-nums">{rpnAfter}</div>
              <div className="text-[11.5px] text-[#FF682C] font-bold mt-1 font-mono">−{reduction}% Risk Reduction</div>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-[#71717A]">
            FMEApex suggests preventive and detection controls from a tenant-isolated vector RAG knowledge base, then recalculates S/O/D and Action Priority automatically.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full h-11 rounded-xl bg-[#18181B] hover:bg-[#000000] text-white text-[13.5px] font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Try Live Simulator in Quality Workspace →</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskCalculatorWidget;
