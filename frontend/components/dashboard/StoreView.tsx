import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FloatingSettings from "../../components/FloatingSettings";
import { getCurrentUser, logoutUser } from "../../lib/auth";
import { UserProfile, MatchDocument, TicketDocument, StoreProduct, ChatMessage, AIPlanningStage, TeamDetail, PlayerDetail, MongoTeam, TabId } from "../../lib/types";
import { BACKEND, TEAM_CRESTS, MCP_SERVICES, DEFAULT_AI_PLANNING_STAGES, NAV_ITEMS } from "../../lib/constants";
import { getTeamCrest, formatMatchDate, formatShortDateRange, statusChipClass, statusLabel, renderMd } from "../../lib/utils";
import TeamDetailModal from "../../components/modals/TeamDetailModal";
import PlayerDetailModal from "../../components/modals/PlayerDetailModal";
import { useDashboard } from "../../context/DashboardContext";
import { useStore } from "../../context/StoreContext";

export default function StoreView() {
  const { email } = useDashboard();
  const { storeProducts, storeLoading, storeSearch, storeCategory, isListingModalOpen, listingForm, listingSubmitting, setStoreProducts, setStoreLoading, setStoreSearch, setStoreCategory, setIsListingModalOpen, setListingForm, setListingSubmitting, fetchStoreProducts, handleListProduct, handleBuyProduct } = useStore();




  useEffect(() => {
    fetchStoreProducts();
  }, []);






    const filteredProducts = storeProducts.filter((p: any) => {
      const matchesSearch = p.title.toLowerCase().includes(storeSearch.toLowerCase()) || p.description.toLowerCase().includes(storeSearch.toLowerCase());
      const matchesCat = storeCategory === "All" || p.category === storeCategory;
      return matchesSearch && matchesCat && p.status === "available";
    });
    
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Fans Store</h2>
            <p className="text-sm text-zinc-400 mt-1">Peer-to-peer marketplace for fans to buy and sell gear</p>
          </div>
          <button onClick={() => setIsListingModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer">
            + List Item
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Search jerseys, tickets, memorabilia..." 
            value={storeSearch}
            onChange={e => setStoreSearch(e.target.value)}
            className="flex-1 bg-zinc-900/50 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
          />
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {["All", "Jerseys", "Accessories", "Tickets", "Memorabilia"].map(cat => (
              <button
                key={cat}
                onClick={() => setStoreCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  storeCategory === cat 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                    : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {storeLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card h-64 border border-zinc-800 bg-zinc-900/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-zinc-800">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-3xl">≡ƒ¢ì∩╕Å</div>
            <h3 className="text-lg font-bold text-white mb-2">No items found</h3>
            <p className="text-zinc-500 text-sm max-w-sm">No items match your filters or the store is empty. Be the first to list something!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product: any) => (
              <div key={product.product_id} className="glass-card flex flex-col border border-zinc-800 bg-zinc-900/40 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all shadow-lg group">
                <div className="h-40 w-full overflow-hidden relative bg-zinc-950">
                  <img 
                    src={product.image_url} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1518605368461-1ee7c532066d?w=500&q=80" }}
                  />
                  <div className="absolute top-2 right-2 bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 px-2 py-1 rounded text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    {product.category}
                  </div>
                </div>
                
                <div className="p-4 flex flex-col flex-grow justify-between text-left">
                  <div>
                    <h4 className="font-black text-sm text-zinc-100 line-clamp-1">{product.title}</h4>
                    <p className="text-[10px] text-zinc-400 mt-1.5 leading-snug line-clamp-2">{product.description}</p>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-black text-emerald-400 font-mono">${product.price.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-zinc-800/50 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                        {product.seller_email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[9px] text-zinc-500 truncate" title={product.seller_email}>
                        Seller: {product.seller_email === email ? "You" : product.seller_email.split('@')[0]}
                      </span>
                    </div>
                    
                    {product.seller_email !== email ? (
                      <button 
                        onClick={() => handleBuyProduct(product.product_id)}
                        className="w-full bg-zinc-800 hover:bg-emerald-600 text-white font-bold text-[10px] py-2 rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1"
                      >
                        ≡ƒ¢ì∩╕Å Buy Now
                      </button>
                    ) : (
                      <div className="w-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-[10px] py-2 rounded-lg text-center">
                        Your Listing
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  



}
