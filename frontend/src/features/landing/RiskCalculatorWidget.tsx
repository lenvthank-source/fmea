import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const RiskCalculatorWidget: React.FC = () => {
  const navigate = useNavigate();
  const [severity, setSeverity] = useState<number>(9);
  const [occurrence, setOccurrence] = useState<number>(7);
  const [detection, setDetection] = useState<number>(6);

  const calculateAP = (s: number, o: number, d: number): { ap: 'High' | 'Medium' | 'Low'; color: string; bg: string } => {
    if (s >= 8 && (o >= 6 || d >= 6)) return { ap: 'High', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
    if (s >= 6 && o >= 4 && d >= 4) return { ap: 'Medium', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    return { ap: 'Low', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
  };

  const currentRisk = calculateAP(severity, occurrence, detection);
  const rpnBefore = severity * occurrence * detection;

  const aiOccurrence = Math.max(1, Math.floor(occurrence * 0.3));
  const aiDetection = Math.max(1, Math.floor(detection * 0.3));
  const aiRisk = calculateAP(severity, aiOccurrence, aiDetection);
  const rpnAfter = severity * aiOccurrence * aiDetection;
  const reductionPercent = Math.round(((rpnBefore - rpnAfter) / rpnBefore) * 100);

  const severityLabel = severity >= 8 ? 'Critical Hazard' : severity >= 5 ? 'Moderate Impact' : 'Minor Impact';
  const occurrenceLabel = occurrence >= 7 ? 'Frequent Failure' : occurrence >= 4 ? 'Occasional' : 'Remote';
  const detectionLabel = detection >= 7 ? 'Poor Control' : detection >= 4 ? 'Moderate Control' : 'High Control';

  return (
    <div className="w-full rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.6)] backdrop-blur-[24px] border border-white/[0.09] p-6 sm:p-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-[36px] h-[36px] rounded-[16px] bg-[#0D9488]/15 flex items-center justify-center">
          <span className="text-[#0D9488] text-[18px] font-[600]">R</span>
        </div>
        <h3 className="text-white text-[18px] sm:text-[20px] font-[450]">
          Interactive AIAG-VDA Risk Reduction Simulator
        </h3>
      </div>
      <p className="text-white/50 text-[13px] sm:text-[14px] font-[450] leading-[1.5] mb-8">
        Adjust the Severity (S), Occurrence (O), and Detection (D) sliders to test live Action Priority (AP) calculation and AI copilot risk mitigation.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Sliders Column */}
        <div className="space-y-6">
          {/* Severity Slider */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-white font-[450] text-[14px] sm:text-[15px]">
                Severity (S): {severity}/10
              </span>
              <span className="text-[12px] sm:text-[13px] font-[450]" style={{ color: severity >= 8 ? '#EF4444' : '#F59E0B' }}>
                {severityLabel}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full h-[4px] bg-white/10 rounded-full appearance-none cursor-pointer accent-[#EF4444] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[20px] [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          {/* Occurrence Slider */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-white font-[450] text-[14px] sm:text-[15px]">
                Occurrence (O): {occurrence}/10
              </span>
              <span className="text-[12px] sm:text-[13px] font-[450]" style={{ color: '#F59E0B' }}>
                {occurrenceLabel}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={occurrence}
              onChange={(e) => setOccurrence(Number(e.target.value))}
              className="w-full h-[4px] bg-white/10 rounded-full appearance-none cursor-pointer accent-[#F59E0B] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[20px] [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          {/* Detection Slider */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-white font-[450] text-[14px] sm:text-[15px]">
                Detection (D): {detection}/10
              </span>
              <span className="text-[12px] sm:text-[13px] font-[450]" style={{ color: '#0D9488' }}>
                {detectionLabel}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={detection}
              onChange={(e) => setDetection(Number(e.target.value))}
              className="w-full h-[4px] bg-white/10 rounded-full appearance-none cursor-pointer accent-[#0D9488] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[20px] [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>
        </div>

        {/* Results Column */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Before Action */}
            <div className="p-5 rounded-[16px] bg-white/[0.03] border border-white/[0.08] text-center">
              <span className="text-white/40 text-[11px] sm:text-[12px] font-[450] uppercase tracking-[0.08em] block mb-2">
                Before Action
              </span>
              <div className="mb-3">
                <span className="inline-block px-3 py-1.5 rounded-[8px] font-[450] text-[13px]"
                  style={{ backgroundColor: currentRisk.bg, color: currentRisk.color }}>
                  {currentRisk.ap} AP
                </span>
              </div>
              <div className="text-white text-[28px] sm:text-[36px] font-[450] leading-[1]">
                {rpnBefore}
              </div>
              <span className="text-white/40 text-[12px] font-[450]">
                RPN (S×O×D)
              </span>
            </div>

            {/* After AI Copilot */}
            <div className="p-5 rounded-[16px] bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <span className="text-[#0D9488] text-[14px]">◆</span>
                <span className="text-[#0D9488] text-[11px] sm:text-[12px] font-[450] uppercase tracking-[0.08em]">
                  With AI Copilot
                </span>
              </div>
              <div className="mb-3">
                <span className="inline-block px-3 py-1.5 rounded-[8px] font-[450] text-[13px]"
                  style={{ backgroundColor: aiRisk.bg, color: aiRisk.color }}>
                  {aiRisk.ap} AP
                </span>
              </div>
              <div className="text-[#0D9488] text-[28px] sm:text-[36px] font-[450] leading-[1]">
                {rpnAfter}
              </div>
              <span className="text-[#0D9488]/70 text-[12px] font-[450]">
                -{reductionPercent}% Risk Reduction
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full h-[52px] bg-[#E9E9E9] text-[#0A0707] font-[450] text-[15px] rounded-[14px] transition-colors hover:bg-white flex items-center justify-center gap-2"
          >
            Start Mitigating Risk Free
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};