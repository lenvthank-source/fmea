import React, { useState } from 'react';

export const VentrilocDashboard: React.FC<{ compact?: boolean }> = ({ compact: _compact = false }) => {
  const [activeTab, setActiveTab] = useState<'bi' | 'matrix' | 'heatmap' | 'actions'>('bi');
  const [selectedStation, setSelectedStation] = useState<number>(2);

  const stations = [
    { id: 1, name: 'Op 10: Press-Fit', ap: 'Medium', s: 8, o: 3, d: 4, failure: 'Insufficient Press Force', action: 'Auto load-cell monitoring' },
    { id: 2, name: 'Op 20: Torque 12', ap: 'High', s: 9, o: 4, d: 5, failure: 'Fastener Under-Torqued', action: 'Angle-control transducer upgrade' },
    { id: 3, name: 'Op 30: Dispensing', ap: 'Medium', s: 7, o: 3, d: 3, failure: 'Incomplete Bead Coverage', action: 'Inline camera laser profilometer' },
    { id: 4, name: 'Op 40: EOL Vision', ap: 'Low', s: 5, o: 2, d: 2, failure: 'Label Misaligned >1mm', action: 'High-speed edge detector' },
  ];

  const currentStation = stations.find((s) => s.id === selectedStation) || stations[1];

  return (
    <div className="w-full rounded-[24px] bg-[#1E1E22] text-white border border-[#333338] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.65)] overflow-hidden transition-all duration-300">
      {/* Studio Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-[#141416] border-b border-[#2A2A30] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block" />
          </div>
          <div className="h-4 w-[1px] bg-[#333338] mx-1 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#222228] border border-[#33333C] text-[11px] font-mono text-[#A1A1AA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span>fmeapex.cloud / bi / drive-unit-assembly</span>
          </div>
        </div>

        {/* Studio View Selector */}
        <div className="flex items-center bg-[#222228] p-1 rounded-full border border-[#33333C] text-[11px] font-medium">
          <button
            onClick={() => setActiveTab('bi')}
            className={`px-3 py-1 rounded-full transition-all ${activeTab === 'bi' ? 'bg-[#FF682C] text-white shadow-sm font-semibold' : 'text-[#A1A1AA] hover:text-white'}`}
          >
            Executive BI
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1 rounded-full transition-all ${activeTab === 'matrix' ? 'bg-[#FF682C] text-white shadow-sm font-semibold' : 'text-[#A1A1AA] hover:text-white'}`}
          >
            PFD ↔ PFMEA
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1 rounded-full transition-all ${activeTab === 'heatmap' ? 'bg-[#FF682C] text-white shadow-sm font-semibold' : 'text-[#A1A1AA] hover:text-white'}`}
          >
            Risk Heatmap
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3 py-1 rounded-full transition-all ${activeTab === 'actions' ? 'bg-[#FF682C] text-white shadow-sm font-semibold' : 'text-[#A1A1AA] hover:text-white'}`}
          >
            Actions
          </button>
        </div>
      </div>

      {/* Main Studio Canvas */}
      <div className="p-4 sm:p-5 bg-[#18181B]">
        {activeTab === 'bi' && (
          <div className="space-y-4">
            {/* Bento KPI Row */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-[16px] bg-[#222228] border border-[#2E2E36] p-4 relative overflow-hidden group hover:border-[#FF682C]/50 transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF682C]/10 rounded-bl-[32px] pointer-events-none" />
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9CA3AF]">Audit Readiness</span>
                <div className="text-[26px] font-bold text-white mt-1">99.8%</div>
                <div className="flex items-center gap-1 text-[11px] text-[#10B981] font-medium mt-1">
                  <span>↑ 2.4%</span>
                  <span className="text-[#9CA3AF]">AIAG-VDA Gated</span>
                </div>
              </div>

              <div className="rounded-[16px] bg-[#222228] border border-[#2E2E36] p-4 relative overflow-hidden group hover:border-[#EF4444]/50 transition-colors">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9CA3AF]">High-AP Risks</span>
                <div className="text-[26px] font-bold text-[#EF4444] mt-1">3 <span className="text-[14px] text-[#9CA3AF] font-normal">/ 59</span></div>
                <div className="flex items-center gap-1 text-[11px] text-[#EF4444] font-medium mt-1">
                  <span>● 100%</span>
                  <span className="text-[#9CA3AF]">Linked to Actions</span>
                </div>
              </div>

              <div className="rounded-[16px] bg-[#222228] border border-[#2E2E36] p-4 relative overflow-hidden group hover:border-[#816729]/50 transition-colors">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9CA3AF]">Closed-Loop Speed</span>
                <div className="text-[26px] font-bold text-[#EAB308] mt-1">4.2d</div>
                <div className="flex items-center gap-1 text-[11px] text-[#10B981] font-medium mt-1">
                  <span>↓ 62%</span>
                  <span className="text-[#9CA3AF]">vs Manual Excel</span>
                </div>
              </div>

              <div className="rounded-[16px] bg-[#222228] border border-[#2E2E36] p-4 relative overflow-hidden group hover:border-[#38BDF8]/50 transition-colors">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9CA3AF]">Control Plan Sync</span>
                <div className="text-[26px] font-bold text-[#38BDF8] mt-1">100%</div>
                <div className="flex items-center gap-1 text-[11px] text-[#38BDF8] font-medium mt-1">
                  <span>✦ Real-Time</span>
                  <span className="text-[#9CA3AF]">Bidirectional</span>
                </div>
              </div>
            </div>

            {/* Interactive Process Station Visualizer */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-3.5">
              {/* Left Bar Chart */}
              <div className="rounded-[18px] bg-[#222228] border border-[#2E2E36] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-[14px] font-semibold text-white">Risk Distribution by Manufacturing Station</h4>
                    <p className="text-[12px] text-[#9CA3AF]">Select an operation to inspect failure mode & control linkage</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#FF682C]/10 text-[#FF682C] border border-[#FF682C]/30 text-[11px] font-semibold">
                    Live Telemetry
                  </span>
                </div>

                {/* Station Bars */}
                <div className="space-y-3 pt-2">
                  {stations.map((st) => {
                    const isSelected = st.id === selectedStation;
                    const apColor = st.ap === 'High' ? 'bg-[#EF4444]' : st.ap === 'Medium' ? 'bg-[#F59E0B]' : 'bg-[#10B981]';
                    const barWidth = st.s * 10;
                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStation(st.id)}
                        className={`p-3 rounded-[12px] border cursor-pointer transition-all ${
                          isSelected ? 'bg-[#2A2A34] border-[#FF682C]' : 'bg-[#1D1D22] border-[#2A2A32] hover:border-[#44444E]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                          <span className="font-semibold text-white">{st.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#9CA3AF]">S:{st.s} · O:{st.o} · D:{st.d}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${apColor}`}>
                              {st.ap} AP
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#141418] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${apColor}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Station Deep-Dive Tile */}
              <div className="rounded-[18px] bg-[#222228] border border-[#2E2E36] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#2E2E36] pb-3 mb-4">
                    <span className="text-[11px] font-mono text-[#FF682C] uppercase tracking-wider">Station Focus</span>
                    <span className="text-[11px] text-[#9CA3AF]">AIAG-VDA 2019 Rule</span>
                  </div>
                  <h4 className="text-[17px] font-bold text-white mb-2">{currentStation.name}</h4>
                  <div className="space-y-3 text-[12.5px]">
                    <div className="p-3 rounded-[10px] bg-[#18181C] border border-[#2A2A30]">
                      <span className="text-[10.5px] font-semibold text-[#EF4444] uppercase tracking-wider block mb-1">Potential Failure Mode</span>
                      <span className="text-white font-medium">{currentStation.failure}</span>
                    </div>
                    <div className="p-3 rounded-[10px] bg-[#18181C] border border-[#2A2A30]">
                      <span className="text-[10.5px] font-semibold text-[#10B981] uppercase tracking-wider block mb-1">Automated Prevention Action</span>
                      <span className="text-white font-medium">{currentStation.action}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#2E2E36] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span className="text-[11px] text-[#A1A1AA]">21 CFR Part 11 Signed</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#816729] font-bold">SHA-256 Verified</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matrix' && (
          <div className="rounded-[18px] bg-[#222228] border border-[#2E2E36] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2E2E36] pb-3">
              <div>
                <h4 className="text-[14px] font-semibold text-white">PFD ↔ PFMEA Synchronized Structural Tree</h4>
                <p className="text-[11.5px] text-[#9CA3AF]">Automatic orphan process detection and characteristic flow-down</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-[11px] font-semibold border border-[#10B981]/30">
                0 Orphan Steps
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-[12px]">
              <div className="p-4 rounded-[14px] bg-[#1A1A1F] border border-[#2A2A30]">
                <div className="text-[10.5px] font-mono text-[#38BDF8] uppercase mb-2">Step 1: Process Step (PFD)</div>
                <div className="font-semibold text-white">Op 20: Transducer Torque Station</div>
                <p className="text-[#9CA3AF] text-[11px] mt-1">4M: Machine (Nutrunner Atlas Copco Tensor), Man, Method, Material</p>
              </div>
              <div className="p-4 rounded-[14px] bg-[#1A1A1F] border border-[#2A2A30]">
                <div className="text-[10.5px] font-mono text-[#EF4444] uppercase mb-2">Step 2: Failure Mode (PFMEA)</div>
                <div className="font-semibold text-white">Fastener Yield Torque Under-Spec</div>
                <p className="text-[#9CA3AF] text-[11px] mt-1">Cause: Angle encoder drift • Effect: Loss of drive clamp force (S=9)</p>
              </div>
              <div className="p-4 rounded-[14px] bg-[#1A1A1F] border border-[#2A2A30]">
                <div className="text-[10.5px] font-mono text-[#10B981] uppercase mb-2">Step 3: Control Plan (CP)</div>
                <div className="font-semibold text-white">Continuous Angle/Torque Interlock</div>
                <p className="text-[#9CA3AF] text-[11px] mt-1">100% Poka-Yoke lockout before next station release</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="rounded-[18px] bg-[#222228] border border-[#2E2E36] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-[14px] font-semibold text-white">AIAG-VDA 2019 Action Priority Matrix</h4>
                <p className="text-[11.5px] text-[#9CA3AF]">Deterministic lookup based on Severity, Occurrence, Detection ratings</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#EF4444]" /> High (H)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#F59E0B]" /> Medium (M)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#10B981]" /> Low (L)</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-[11px] font-mono">
              <div className="p-2.5 rounded bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] font-bold">S:9-10 • O:5+ → H</div>
              <div className="p-2.5 rounded bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] font-bold">S:7-8 • O:7+ → H</div>
              <div className="p-2.5 rounded bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] font-bold">S:9-10 • O:2-3 → M</div>
              <div className="p-2.5 rounded bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] font-bold">S:5-6 • O:4-6 → M</div>
              <div className="p-2.5 rounded bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] font-bold">S:1-4 • Any → L</div>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="rounded-[18px] bg-[#222228] border border-[#2E2E36] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#2E2E36] pb-2.5">
              <span className="text-[13px] font-semibold text-white">Closed-Loop Mitigation Verification</span>
              <span className="text-[11px] text-[#A1A1AA]">Cloudflare R2 Evidence Attached</span>
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#1A1A1F] border border-[#2A2A30]">
                <div>
                  <span className="text-white font-medium">ACT-102: Dual load cell retrofit for housing press</span>
                  <div className="text-[11px] text-[#9CA3AF]">Owner: Lead Process Engineer • Target: Verified</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#EF4444] line-through">H (S9, O5, D4)</span>
                  <span className="text-[11px] font-mono text-[#10B981] font-bold">→ L (S9, O1, D2)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#10B981]">VERIFIED</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#1A1A1F] border border-[#2A2A30]">
                <div>
                  <span className="text-white font-medium">ACT-103: Poka-Yoke vision interlock on torque nutrunner</span>
                  <div className="text-[11px] text-[#9CA3AF]">Owner: Controls Quality Lead • Status: In Progress</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#F59E0B] font-bold">Target: M → L</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B]/20 text-[#F59E0B]">OPEN</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-5 py-2.5 bg-[#141416] border-t border-[#2A2A30] flex flex-wrap items-center justify-between text-[11px] text-[#9CA3AF]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Cloud Native Postgres pgvector</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Neon Isolated Tenant Context</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[#FF682C]">AIAG-VDA 2019</span>
          <span>•</span>
          <span>21 CFR Part 11</span>
        </div>
      </div>
    </div>
  );
};

export default VentrilocDashboard;
