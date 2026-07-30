import React from "react";
import { PlayerDetail, TabId } from "../../lib/types";

interface Props {
  playerDetailModal: PlayerDetail | null;
  setPlayerDetailModal: (val: PlayerDetail | null) => void;
  playerDetailLoading: boolean;
  setPlayerDetailLoading: (val: boolean) => void;
  setActiveTab: (val: TabId) => void;
}

export default function PlayerDetailModal({ playerDetailModal, setPlayerDetailModal, playerDetailLoading, setPlayerDetailLoading, setActiveTab }: Props) {
  return (
    <>
      {/* Player Detail Modal */}
      {(playerDetailModal || playerDetailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => { setPlayerDetailModal(null); setPlayerDetailLoading(false); }}>
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setPlayerDetailModal(null); setPlayerDetailLoading(false); }} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-800">
              ✕
            </button>
            {playerDetailLoading ? (
              <div className="py-12 text-center text-zinc-400 font-mono animate-pulse">Loading Athlete Stats...</div>
            ) : playerDetailModal && (
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-3xl mx-auto flex items-center justify-center text-3xl font-black text-white shadow-lg mb-4">
                  ⭐
                </div>
                <h2 className="text-xl font-black text-white">{playerDetailModal.name}</h2>
                <span className="inline-block mt-1 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-bold font-mono">
                  🔥 Verified Star Athlete • #{playerDetailModal.shirtNumber || "10"}
                </span>
                <div className="grid grid-cols-2 gap-3 mt-6 mb-6 text-left">
                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block">Position</span>
                    <span className="text-xs font-bold text-white">{playerDetailModal.position || "Forward"}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block">Nationality</span>
                    <span className="text-xs font-bold text-white">{playerDetailModal.nationality || "International"}</span>
                  </div>
                </div>
                <button onClick={() => { setPlayerDetailModal(null); setActiveTab("store"); }} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-lg shadow-violet-600/20 cursor-pointer">
                  🛍️ Shop Authentic {playerDetailModal.name} Kit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
