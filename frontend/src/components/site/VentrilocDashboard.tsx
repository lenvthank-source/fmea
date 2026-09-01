import React, { useState, useRef, useCallback } from 'react';

export const VentrilocDashboard: React.FC<{ compact?: boolean }> = ({ compact: _compact = false }) => {
  const [activeTab, setActiveTab] = useState<'bi' | 'matrix' | 'heatmap' | 'actions'>('bi');
  const [selectedStation, setSelectedStation] = useState<number>(2);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    // Subtle 3D tilt: ±3 degrees max
    setTilt({ x: (y - 0.5) * -6, y: (x - 0.5) * 6 });
    // Glow position as percentages
    setGlowPos({ x: x * 100, y: y * 100 });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  const stations = [
    { id: 1, name: 'Op 10: Press-Fit', ap: 'Medium' as const, s: 8, o: 3, d: 4, failure: 'Insufficient Press Force', action: 'Auto load-cell monitoring', progress: 78 },
    { id: 2, name: 'Op 20: Torque 12', ap: 'High' as const, s: 9, o: 4, d: 5, failure: 'Fastener Under-Torqued', action: 'Angle-control transducer upgrade', progress: 92 },
    { id: 3, name: 'Op 30: Dispensing', ap: 'Medium' as const, s: 7, o: 3, d: 3, failure: 'Incomplete Bead Coverage', action: 'Inline camera laser profilometer', progress: 65 },
    { id: 4, name: 'Op 40: EOL Vision', ap: 'Low' as const, s: 5, o: 2, d: 2, failure: 'Label Misaligned >1mm', action: 'High-speed edge detector', progress: 45 },
  ];

  const currentStation = stations.find((s) => s.id === selectedStation) || stations[1];

  const apColor = (ap: string) =>
    ap === 'High' ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', bar: 'bg-red-500', badge: 'bg-red-500 text-white' }
    : ap === 'Medium' ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', bar: 'bg-amber-500', badge: 'bg-amber-500 text-white' }
    : { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500', badge: 'bg-emerald-500 text-white' };

  const tabs = [
    { key: 'bi' as const, label: 'Executive BI' },
    { key: 'matrix' as const, label: 'PFD ↔ PFMEA' },
    { key: 'heatmap' as const, label: 'Risk Heatmap' },
    { key: 'actions' as const, label: 'Actions' },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-[24px] bg-white border border-[#E5E0D8] overflow-hidden transition-all duration-300 ease-out"
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 3D Tilt Container */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Cursor Glow Effect */}
        {isHovering && (
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-40 transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,104,44,0.08), transparent 50%)`,
            }}
          />
        )}

        {/* ── Browser Chrome Header ── */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-[#FAFAF8] border-b border-[#E5E0D8] gap-3">
          <div className="flex items-center gap-3">
            {/* Traffic light dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block shadow-[inset_0_-1px_2px_rgba(0,0,0,0.1)]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block shadow-[inset_0_-1px_2px_rgba(0,0,0,0.1)]" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block shadow-[inset_0_-1px_2px_rgba(0,0,0,0.1)]" />
            </div>
            <div className="h-4 w-px bg-[#E5E0D8] hidden sm:block" />
            {/* URL bar */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-[#E5E0D8] text-[11px] font-mono text-[#71717A] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>fmeapex.cloud / bi / drive-unit-assembly</span>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-0.5 bg-[#F0EDE8] p-1 rounded-xl border border-[#E5E0D8] text-[11px] font-semibold">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === t.key
                    ? 'bg-white text-[#18181B] shadow-sm border border-[#E5E0D8]'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Canvas ── */}
        <div className="p-4 sm:p-5 bg-[#FDFCFB]">
          {activeTab === 'bi' && (
            <div className="space-y-4">
              {/* KPI Row */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  { label: 'Audit Readiness', value: '99.8%', sub: '↑ 2.4% AIAG-VDA Gated', color: 'text-[#18181B]', accent: 'text-emerald-600', ring: 'ring-emerald-100' },
                  { label: 'High-AP Risks', value: '3', extra: '/ 59', sub: '● 100% Linked to Actions', color: 'text-red-600', accent: 'text-red-500', ring: 'ring-red-100' },
                  { label: 'Closed-Loop Speed', value: '4.2d', sub: '↓ 62% vs Manual Excel', color: 'text-amber-600', accent: 'text-emerald-600', ring: 'ring-amber-100' },
                  { label: 'Control Plan Sync', value: '100%', sub: '✦ Real-Time Bidirectional', color: 'text-sky-600', accent: 'text-sky-500', ring: 'ring-sky-100' },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className={`group relative rounded-2xl bg-white border border-[#E5E0D8] p-4 shadow-xs hover:shadow-md hover:border-[#D4CFC4] hover:-translate-y-0.5 transition-all duration-200 cursor-default overflow-hidden`}
                  >
                    {/* Hover shine */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-[#FF682C]/[0.02] group-hover:via-transparent group-hover:to-transparent transition-all duration-500" />
                    <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#71717A] font-bold relative z-[1]">{kpi.label}</span>
                    <div className={`text-[28px] font-extrabold ${kpi.color} mt-1 font-mono tabular-nums relative z-[1]`}>
                      {kpi.value}
                      {kpi.extra && <span className="text-[14px] text-[#A1A1AA] font-normal ml-1">{kpi.extra}</span>}
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] ${kpi.accent} font-semibold mt-1 relative z-[1]`}>
                      <span>{kpi.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Station Visualizer */}
              <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-3.5">
                {/* Left: Station bars */}
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#18181B]">Risk Distribution by Manufacturing Station</h4>
                      <p className="text-[12px] text-[#71717A]">Select an operation to inspect failure mode & control linkage</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold font-mono">
                      Live Telemetry
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {stations.map((st) => {
                      const isSelected = st.id === selectedStation;
                      const c = apColor(st.ap);
                      return (
                        <div
                          key={st.id}
                          onClick={() => setSelectedStation(st.id)}
                          className={`group/row p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? `${c.bg} ${c.border} shadow-sm`
                              : 'bg-[#FAFAF8] border-[#E5E0D8] hover:bg-white hover:border-[#D4CFC4] hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[12.5px] mb-2">
                            <span className={`font-bold ${isSelected ? 'text-[#18181B]' : 'text-[#52525B]'}`}>{st.name}</span>
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] font-mono text-[#71717A]">S:{st.s} · O:{st.o} · D:{st.d}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.badge}`}>
                                {st.ap} AP
                              </span>
                            </div>
                          </div>
                          {/* Animated progress bar */}
                          <div className="w-full h-2 rounded-full bg-[#F0EDE8] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${c.bar}`}
                              style={{ width: isHovering || isSelected ? `${st.progress}%` : '0%' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Station deep-dive */}
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3 mb-4">
                      <span className="text-[11px] font-mono text-[#FF682C] uppercase tracking-wider font-bold">Station Focus</span>
                      <span className="text-[11px] font-mono text-[#71717A]">AIAG-VDA 2019 Rule</span>
                    </div>
                    <h4 className="text-[18px] font-extrabold text-[#18181B] mb-3">{currentStation.name}</h4>
                    <div className="space-y-3 text-[12.5px]">
                      <div className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        apColor(currentStation.ap).bg
                      } ${apColor(currentStation.ap).border}`}>
                        <span className="text-[10.5px] font-bold text-red-500 uppercase tracking-wider block mb-1">Potential Failure Mode</span>
                        <span className="text-[#18181B] font-semibold">{currentStation.failure}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Automated Prevention Action</span>
                        <span className="text-[#18181B] font-semibold">{currentStation.action}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E5E0D8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] text-[#71717A] font-medium">21 CFR Part 11 Signed</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#816729] font-bold">SHA-256 Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                <div>
                  <h4 className="text-[14px] font-bold text-[#18181B]">PFD ↔ PFMEA Synchronized Structural Tree</h4>
                  <p className="text-[11.5px] text-[#71717A]">Automatic orphan process detection and characteristic flow-down</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  0 Orphan Steps
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-[12px]">
                {[
                  { step: 'Step 1: Process Step (PFD)', color: 'text-sky-600 bg-sky-50 border-sky-200', title: 'Op 20: Transducer Torque Station', sub: '4M: Machine (Nutrunner Atlas Copco Tensor), Man, Method, Material' },
                  { step: 'Step 2: Failure Mode (PFMEA)', color: 'text-red-600 bg-red-50 border-red-200', title: 'Fastener Yield Torque Under-Spec', sub: 'Cause: Angle encoder drift • Effect: Loss of drive clamp force (S=9)' },
                  { step: 'Step 3: Control Plan (CP)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', title: 'Continuous Angle/Torque Interlock', sub: '100% Poka-Yoke lockout before next station release' },
                ].map((card) => (
                  <div key={card.step} className={`p-4 rounded-xl border ${card.color.split(' ').slice(1).join(' ')} hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200`}>
                    <div className={`text-[10.5px] font-mono uppercase mb-2 font-bold ${card.color.split(' ')[0]}`}>{card.step}</div>
                    <div className="font-bold text-[#18181B]">{card.title}</div>
                    <p className="text-[#71717A] text-[11px] mt-1">{card.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-[14px] font-bold text-[#18181B]">AIAG-VDA 2019 Action Priority Matrix</h4>
                  <p className="text-[11.5px] text-[#71717A]">Deterministic lookup based on Severity, Occurrence, Detection ratings</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500" /> High (H)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Medium (M)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Low (L)</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-[11px] font-mono">
                {[
                  { label: 'S:9-10 • O:5+ → H', cls: 'bg-red-50 border-red-200 text-red-600' },
                  { label: 'S:7-8 • O:7+ → H', cls: 'bg-red-50 border-red-200 text-red-600' },
                  { label: 'S:9-10 • O:2-3 → M', cls: 'bg-amber-50 border-amber-200 text-amber-600' },
                  { label: 'S:5-6 • O:4-6 → M', cls: 'bg-amber-50 border-amber-200 text-amber-600' },
                  { label: 'S:1-4 • Any → L', cls: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
                ].map((cell) => (
                  <div key={cell.label} className={`p-2.5 rounded-xl border font-bold ${cell.cls} hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 cursor-default`}>
                    {cell.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-2.5">
                <span className="text-[13px] font-bold text-[#18181B]">Closed-Loop Mitigation Verification</span>
                <span className="text-[11px] text-[#71717A] font-mono">Cloudflare R2 Evidence Attached</span>
              </div>
              <div className="space-y-2 text-[12px]">
                {[
                  { id: 'ACT-102', title: 'Dual load cell retrofit for housing press', owner: 'Lead Process Engineer', before: 'H (S9, O5, D4)', after: '→ L (S9, O1, D2)', status: 'VERIFIED', statusCls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { id: 'ACT-103', title: 'Poka-Yoke vision interlock on torque nutrunner', owner: 'Controls Quality Lead', before: '', after: 'Target: M → L', status: 'OPEN', statusCls: 'bg-amber-50 text-amber-700 border-amber-200' },
                ].map((act) => (
                  <div key={act.id} className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF8] border border-[#E5E0D8] hover:bg-white hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                    <div>
                      <span className="text-[#18181B] font-semibold">{act.id}: {act.title}</span>
                      <div className="text-[11px] text-[#71717A]">Owner: {act.owner}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {act.before && <span className="text-[11px] font-mono text-[#71717A] line-through">{act.before}</span>}
                      <span className="text-[11px] font-mono text-emerald-600 font-bold">{act.after}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${act.statusCls}`}>{act.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Status Bar ── */}
        <div className="px-5 py-2.5 bg-[#FAFAF8] border-t border-[#E5E0D8] flex flex-wrap items-center justify-between text-[11px] text-[#71717A] font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Cloud Native Postgres pgvector</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Neon Isolated Tenant Context</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#FF682C] font-bold">AIAG-VDA 2019</span>
            <span>•</span>
            <span>21 CFR Part 11</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentrilocDashboard;
