import React from 'react';

/**
 * Stylized replica of the FMEApex workspace — used in hero + feature sections.
 * Purely presentational; renders a fake PFMEA grid.
 */
export const MockupDashboard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const rows = [
    { item: 'Bearing seat press-fit', fn: 'Retain shaft position', fm: 'Insufficient press force', s: 8, o: 4, d: 5, ap: 'Medium' },
    { item: 'Torque station 12', fn: 'Fasten housing to spec', fm: 'Fastener under-torqued', s: 9, o: 3, d: 4, ap: 'High' },
    { item: 'Seal adhesive apply', fn: 'Seal against moisture', fm: 'Incomplete bead coverage', s: 7, o: 5, d: 4, ap: 'Medium' },
    { item: 'EOL vision check', fn: 'Verify label placement', fm: 'Label misaligned >2mm', s: 5, o: 4, d: 3, ap: 'Low' },
    { item: 'Laser weld panel', fn: 'Join bracket assembly', fm: 'Porosity in weld seam', s: 9, o: 2, d: 5, ap: 'Medium' },
  ];

  return (
    <div className="w-full rounded-[20px] bg-white border border-[#E6E1D8] shadow-[0_24px_60px_-20px_rgba(15,23,42,0.22)] overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 h-[42px] bg-[#FAF9F6] border-b border-[#EFECE5]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <div className="ml-3 flex-1 max-w-[300px] h-6 rounded-md bg-[#EFECE5] flex items-center px-3">
          <span className="text-[11px] text-[#8A8F98] font-[500]">app.fmeapex.com/pfmea</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col gap-1.5 w-[52px] py-4 items-center border-r border-[#F1EEE8] bg-[#FCFBF8]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 1 ? 'bg-[#0D9488]/10' : ''}`}>
              <div className={`w-4 h-4 rounded-[4px] ${i === 1 ? 'bg-[#0D9488]' : 'bg-[#D6D3CC]'}`} />
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[13px] font-[650] text-[#0F172A]">PFMEA — Drive Unit Assembly</div>
              <div className="text-[11px] text-[#8A8F98]">Rev C · AIAG-VDA 2019 · 5 process steps linked</div>
            </div>
            <div className="px-2.5 h-7 rounded-md bg-[#0D9488]/10 text-[#0D9488] text-[11px] font-[600] flex items-center">AI Copilot ●</div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_repeat(4,0.5fr)] gap-x-2 px-2 py-2 rounded-md bg-[#F6F4EF] text-[10px] font-[650] text-[#8A8F98] uppercase tracking-wide">
            <span>Failure Mode</span><span>Function</span><span className="text-center">S</span><span className="text-center">O</span><span className="text-center">D</span><span className="text-center">AP</span>
          </div>

          {/* Rows */}
          <div className="space-y-1 mt-1">
            {(compact ? rows.slice(0, 3) : rows).map((r) => (
              <div key={r.fm} className="grid grid-cols-[2fr_1fr_repeat(4,0.5fr)] gap-x-2 px-2 py-2 rounded-md border border-[#F1EEE8] bg-white items-center">
                <span className="text-[11px] font-[550] text-[#334155] truncate">{r.fm}</span>
                <span className="text-[11px] text-[#64748B] truncate">{r.fn}</span>
                <span className={`text-[11px] font-[650] text-center ${r.s >= 8 ? 'text-[#DC2626]' : 'text-[#334155]'}`}>{r.s}</span>
                <span className="text-[11px] text-center text-[#334155]">{r.o}</span>
                <span className="text-[11px] text-center text-[#334155]">{r.d}</span>
                <span className={`mx-auto px-1.5 py-0.5 rounded text-[10px] font-[650] ${r.ap === 'High' ? 'bg-[#FEE2E2] text-[#DC2626]' : r.ap === 'Medium' ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#D1FAE5] text-[#047857]'}`}>{r.ap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupDashboard;
