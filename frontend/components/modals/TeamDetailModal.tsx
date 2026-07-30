import React from "react";
import { TeamDetail, TabId } from "../../lib/types";

interface Props {
  teamDetailModal: TeamDetail | null;
  setTeamDetailModal: (val: TeamDetail | null) => void;
  teamDetailLoading: boolean;
  setTeamDetailLoading: (val: boolean) => void;
  setActiveTab: (val: TabId) => void;
}

export default function TeamDetailModal({ teamDetailModal, setTeamDetailModal, teamDetailLoading, setTeamDetailLoading, setActiveTab }: Props) {
  return (
    <>
      {/* Team Detail Modal */}
      {(teamDetailModal || teamDetailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => { setTeamDetailModal(null); setTeamDetailLoading(false); }}>
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setTeamDetailModal(null); setTeamDetailLoading(false); }} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-800">
              ✕
            </button>
            {teamDetailLoading ? (
              <div className="py-20 text-center text-zinc-400 font-mono animate-pulse">Loading Club Intelligence...</div>
            ) : teamDetailModal && (
              <div>
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-800">
                  {teamDetailModal.crest ? (
                    <img src={teamDetailModal.crest} alt={teamDetailModal.name} className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-2xl font-black text-emerald-500">
                      {teamDetailModal.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-black text-white">{teamDetailModal.name}</h2>
                    <p className="text-xs text-emerald-400 font-mono font-semibold">⚽ Official Partner Club & Squad Roster</p>
                    {teamDetailModal.venue && <p className="text-[11px] text-zinc-400 mt-1">📍 Venue: {teamDetailModal.venue}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block">Head Coach</span>
                    <span className="text-sm font-bold text-zinc-200">{typeof teamDetailModal.coach === 'object' && teamDetailModal.coach ? (teamDetailModal.coach as any).name : (teamDetailModal.coach || "First Team Manager")}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block">Club Foundation</span>
                    <span className="text-sm font-bold text-zinc-200">Est. {teamDetailModal.founded || "1899"}</span>
                  </div>
                  {teamDetailModal.clubColors ? (
                    <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 sm:col-span-1 col-span-2">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase block">Club Colors</span>
                      <span className="text-sm font-bold text-emerald-400 truncate block">{teamDetailModal.clubColors}</span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 sm:col-span-1 col-span-2">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase block">Status</span>
                      <span className="text-sm font-bold text-emerald-400">Active Roster</span>
                    </div>
                  )}
                </div>
                {teamDetailModal.squad && teamDetailModal.squad.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 font-mono">Active First-Team Squad</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
                      {teamDetailModal.squad.map((player, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-mono">
                              {player.shirtNumber || idx + 1}
                            </span>
                            {player.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{player.position || "Player"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end gap-3">
                  {teamDetailModal.website && (
                    <a href={teamDetailModal.website} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all">
                      🌐 Official Website
                    </a>
                  )}
                  <button onClick={() => { setTeamDetailModal(null); setActiveTab("store"); }} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 cursor-pointer">
                    🛍️ Buy Club Merchandise
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
