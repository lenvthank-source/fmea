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
    <div className="w-full rounded-[24px] bg-white border border-[#E6E1D8] shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] p-6 sm:p-10">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-[12px] bg-[#0D9488]/10 flex items-center justify-center">
          <div className="w-4 h-4 rounded-[4px] bg-[#0D9488]" />
        </div>
        <div>
          <h3 className="text-[18px] font-[650] text-[#0F172A] tracking-[-0.01em]">Interactive risk simulator</h3>
          <p className="text-[13px] text-[#64748B]">AIAG-VDA Action Priority — live calculation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-8">
        {/* Sliders */}
        <div className="space-y-7">
          {sliders.map((s) => (
            <div key={s.label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <div>
                  <span className="text-[14px] font-[650] text-[#0F172A]">{s.label}</span>
                  <span className="text-[12px] text-[#8A8F98] ml-2 hidden sm:inline">{s.sub}</span>
                </div>
                <span className="text-[15px] font-[650] text-[#0F172A] tabular-nums">{s.value}<span className="text-[#8A8F98] font-[500]">/10</span></span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={s.value}
                onChange={(e) => s.set(Number(e.target.value))}
                className="fmea-range"
                aria-label={`${s.label} slider`}
              />
              <p className="text-[12px] text-[#8A8F98] mt-1.5">{s.hint}</p>
            </div>
          ))}
        </div>

        {/* Result cards */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[16px] border border-[#E6E1D8] bg-[#FAF9F6] p-5 text-center">
              <span className="text-[11px] font-[650] uppercase tracking-[0.1em] text-[#8A8F98]">Current state</span>
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-[650] ${before.cls}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: before.dot }} />
                  {before.ap} AP
                </span>
              </div>
              <div className="mt-3 text-[38px] font-[650] text-[#0F172A] leading-none tabular-nums">{rpnBefore}</div>
              <div className="text-[12px] text-[#8A8F98] mt-1">RPN (S×O×D)</div>
            </div>

            <div className="rounded-[16px] border border-[#99E5DA] bg-[#F0FDF9] p-5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-[10px] bg-[#0D9488] text-white text-[10px] font-[650] uppercase tracking-wide">AI</div>
              <span className="text-[11px] font-[650] uppercase tracking-[0.1em] text-[#0F766E]">After AI Copilot</span>
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-[650] ${after.cls}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: after.dot }} />
                  {after.ap} AP
                </span>
              </div>
              <div className="mt-3 text-[38px] font-[650] text-[#0D9488] leading-none tabular-nums">{rpnAfter}</div>
              <div className="text-[12px] text-[#0F766E] font-[600] mt-1">−{reduction}% risk reduction</div>
            </div>
          </div>

          <p className="text-[12.5px] leading-[1.6] text-[#64748B]">
            FMEApex suggests corrective actions from a tenant-isolated RAG knowledge base, then recalculates S/O/D and AP automatically after each action closes.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full btn-ventriloc-dark h-[52px] text-[15px] flex items-center justify-center gap-2"
          >
            Try live in the quality workspace
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskCalculatorWidget;
