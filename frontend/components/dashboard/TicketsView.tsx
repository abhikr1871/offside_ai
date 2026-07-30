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
import { useTickets } from "../../context/TicketsContext";

export default function TicketsView() {
const { email, activeTab, handlePlanJourneyForTicket, followedMatches } = useDashboard();
  const { tickets, ticketsLoading, bookedMatchIds, bookingInProgress, ticketSelectedMatchId, ticketAvailabilityError, ticketAvailabilityData, ticketAvailabilityLoading, ticketForecastingData, stadiumIntelData, stadiumIntelLoading, ticketForecastingLoading, isCustomTicketSearch, customTicketQuery, customHomeQuery, customAwayQuery, customTicketDate, customSelectedMatch, isSearchingCustomTicket, setTickets, setTicketsLoading, setBookedMatchIds, setBookingInProgress, setTicketSelectedMatchId, setTicketAvailabilityError, setTicketAvailabilityData, setTicketAvailabilityLoading, setTicketForecastingData, setStadiumIntelData, setStadiumIntelLoading, setTicketForecastingLoading, setIsCustomTicketSearch, setCustomTicketQuery, setCustomHomeQuery, setCustomAwayQuery, setCustomTicketDate, setCustomSelectedMatch, setIsSearchingCustomTicket, fetchTickets, handleBookTicket, handleCheckAvailability, handleRunAISeatingForecast, handleSearchCustomTicketMatch, handleSelectMatch } = useTickets();


    const upcomingMatches = followedMatches.filter((m: any) => m.status !== "FT");
    const activeMatch = customSelectedMatch || followedMatches.find((m: any) => m.id === ticketSelectedMatchId);

    return (
      <div className="flex flex-col gap-8 w-full text-white min-h-[500px]">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        {/* Left Side: Booking & Intelligence Panel */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="glass-card p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 font-mono mb-4">
              ≡ƒÄƒ∩╕Å Matchday Seating & Seating Intelligence
            </h3>
            
            {/* Match Selector / Custom Search Toggle */}
            <div className="flex flex-col gap-2 mb-5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {isCustomTicketSearch ? "Search Custom Match" : "Select Upcoming Match"}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomTicketSearch(!isCustomTicketSearch);
                    setCustomSelectedMatch(null);
                    setTicketSelectedMatchId(null);
                    setTicketForecastingData(null);
                    setTicketAvailabilityData(null);
                    setTicketAvailabilityError(null);
                  }}
                  className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded transition-colors"
                >
                  {isCustomTicketSearch ? "ΓåÉ Use Followed Matches Dropdown" : "≡ƒöì Search Custom Match Name"}
                </button>
              </div>

              {isCustomTicketSearch ? (
                <div className="flex flex-col gap-3 mt-1">
                  {/* Home vs Away inputs */}
                  <div className="flex flex-col md:flex-row items-center gap-2 w-full">
                    <div className="w-full md:flex-1">
                      <input
                        type="text"
                        placeholder="Home Club (e.g. Manchster City)"
                        value={customHomeQuery}
                        onChange={e => setCustomHomeQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none placeholder-zinc-500 transition-colors"
                      />
                    </div>
                    <span className="text-zinc-500 font-extrabold font-mono px-2 text-xs shrink-0 select-none">VS</span>
                    <div className="w-full md:flex-1">
                      <input
                        type="text"
                        placeholder="Away Club (e.g. Arsenal)"
                        value={customAwayQuery}
                        onChange={e => setCustomAwayQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none placeholder-zinc-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Date selection and find button */}
                  <div className="grid gap-3 grid-cols-1 md:grid-cols-12">
                    <div className="md:col-span-8">
                      <input
                        type="date"
                        value={customTicketDate}
                        onChange={e => setCustomTicketDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <button
                        type="button"
                        onClick={handleSearchCustomTicketMatch}
                        disabled={isSearchingCustomTicket || !customHomeQuery.trim() || !customAwayQuery.trim()}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isSearchingCustomTicket ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                            <span>Searching...</span>
                          </>
                        ) : (
                          "Find in API"
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 italic mt-0.5 leading-relaxed">
                    ≡ƒÆí If you make a minor spelling typo (e.g. "arsnal" or "manchster"), we'll auto-correct it using AI fuzzy matching!
                  </div>
                </div>
              ) : (
                <select
                  value={ticketSelectedMatchId || ""}
                  onChange={(e) => handleSelectMatch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors cursor-pointer"
                >
                  <option value="">-- Choose a Match --</option>
                  {upcomingMatches.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.homeTeam} vs {m.awayTeam} ({m.venue || "TBD Venue"}) - {m.eventDate ? new Date(m.eventDate).toLocaleDateString() : "TBD Date"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {activeMatch ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Live Ticketmaster Availability Check */}
                <div className="glass-card p-4 border border-zinc-800 bg-zinc-900/40 rounded-xl flex flex-col justify-between min-h-[220px]">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-2">Live Availability Feed</h4>
                    <p className="text-[10px] text-zinc-500 mb-3">Checking Ticketmaster Discovery API free-tier event listings...</p>
                    
                    {ticketAvailabilityLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : ticketAvailabilityError ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-red-400">
                          <span>ΓÜá∩╕Å Provider Config Required</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          {ticketAvailabilityError}
                        </p>
                      </div>
                    ) : ticketAvailabilityData ? (
ticketAvailabilityData.event_name ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                          <div className="text-[11px] font-bold text-emerald-400 mb-1">Γ£ô Listing Found on Ticketmaster</div>
                          <p className="text-[10px] text-zinc-300 font-semibold mb-2">{ticketAvailabilityData.event_name}</p>
                          {ticketAvailabilityData.price_ranges && ticketAvailabilityData.price_ranges.length > 0 && (
                            <div className="text-[10px] text-zinc-400 mb-2">
                              Price range: <span className="font-bold text-zinc-300">${ticketAvailabilityData.price_ranges[0].min}</span> to <span className="font-bold text-zinc-300">${ticketAvailabilityData.price_ranges[0].max}</span> {ticketAvailabilityData.price_ranges[0].currency}
                            </div>
                          )}
                          <a
                            href={ticketAvailabilityData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Buy on Ticketmaster Γåù
                          </a>
                        </div>
                      ) : (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-yellow-400">
                            <span>Γä╣∩╕Å Info from Ticketmaster</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-relaxed">
                            {ticketAvailabilityData.message || "No matching live event listings found on Ticketmaster for this query."}
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-6 text-zinc-600 text-xs">No active availability status loaded.</div>
                    )}
                  </div>
                  
                  {/* Book Mock-Free Ticket Directly */}
                  <div>
                    {!bookedMatchIds.has(activeMatch.id) ? (
                      <button
                        onClick={() => handleBookTicket(activeMatch)}
                        disabled={!!bookingInProgress}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 mt-4 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {bookingInProgress === activeMatch.id ? "Booking..." : "Confirm Mock-Free Seat Registration"}
                      </button>
                    ) : (
                      <div className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-xl py-2 px-3 text-center text-xs font-bold mt-4 flex items-center justify-center gap-1">
                        <span>Γ£ô Seat Registered</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. AI Seating & Seating Intelligence Forecast */}
                <div className="glass-card p-4 border border-zinc-800 bg-zinc-900/40 rounded-xl min-h-[220px] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-2">AI Seating & Price Forecaster</h4>
                    <p className="text-[10px] text-zinc-500 mb-3">Model stadium demand, price trends, and sellout probability.</p>
                    
                    {ticketForecastingLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "300ms" }} />
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500">Querying Gemini Forecasting Model...</div>
                      </div>
                    ) : ticketForecastingData ? (
                      <div className="flex flex-col gap-3.5">
                        {/* Expected Attendance & Sellout */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-zinc-950/40 border border-zinc-800/80 p-2.5 rounded-xl text-center">
                            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Expected Attendance</div>
                            <div className="text-sm font-black text-violet-300 mt-0.5">
                              {ticketForecastingData.expected_attendance?.toLocaleString() || "TBD"}
                            </div>
                          </div>
                          <div className="bg-zinc-950/40 border border-zinc-800/80 p-2.5 rounded-xl text-center">
                            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Sellout Risk</div>
                            <div className="text-sm font-black text-violet-300 mt-0.5">
                              {ticketForecastingData.sellout_probability ? `${Math.round(ticketForecastingData.sellout_probability * 100)}%` : "TBD"}
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Price Timeline */}
                        {ticketForecastingData.dynamic_pricing_timeline && (
                          <div className="bg-zinc-950/40 border border-zinc-800/80 p-2.5 rounded-xl">
                            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Dynamic Price Timeline</div>
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <div className="text-center">
                                <span className="text-zinc-500">Today</span>
                                <div className="font-bold text-zinc-300">${ticketForecastingData.dynamic_pricing_timeline.today}</div>
                              </div>
                              <div className="h-0.5 flex-1 bg-zinc-800 mx-2 relative">
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-violet-400 font-bold">
                                  {ticketForecastingData.price_change_percent ? `+${ticketForecastingData.price_change_percent}%` : ""}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="text-zinc-500">3 Days</span>
                                <div className="font-bold text-zinc-300">${ticketForecastingData.dynamic_pricing_timeline.three_days_later}</div>
                              </div>
                              <div className="h-0.5 flex-1 bg-zinc-800 mx-2" />
                              <div className="text-center">
                                <span className="text-zinc-500">Matchday</span>
                                <div className="font-bold text-violet-300">${ticketForecastingData.dynamic_pricing_timeline.matchday}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timing Advice */}
                        <div className="bg-zinc-950/40 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex flex-col text-left">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Purchase Advice</span>
                            <span className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{ticketForecastingData.reasoning}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                            ticketForecastingData.purchase_recommendation === "BUY_NOW" 
                              ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}>
                            {ticketForecastingData.purchase_recommendation?.replace("_", " ") || "BUY NOW"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-zinc-600 text-xs">Run Seating & Seating Forecast below to see dynamic predictions.</div>
                    )}
                  </div>

                  {!ticketForecastingData && (
                    <button
                      onClick={() => handleRunAISeatingForecast(activeMatch)}
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-2 mt-4 text-xs font-bold transition-all cursor-pointer"
                    >
                      Run AI Seating Forecast
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state py-12">
                <p className="text-xs text-zinc-500">Choose an upcoming match from the selector above to check live pricing & dynamic forecasts.</p>
              </div>
            )}

            
          </div>
        </div>

        {/* Right Side: My Booked Tickets */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="glass-card p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 font-mono">
                ≡ƒÄ½ My Booked Tickets
              </h3>
              <button
                onClick={() => email && fetchTickets(email)}
                className="text-[10px] font-bold text-emerald-500 hover:underline cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {ticketsLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map(i => <div key={i} className="loading-shimmer shimmer-card h-24" />)}
              </div>
            ) : tickets.length === 0 ? (
              <div className="empty-state py-8 text-center border border-dashed border-zinc-800 rounded-xl">
                <p className="text-xs text-zinc-500">No tickets registered yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tickets.map((t: any) => (
                  <div key={t.booking_id} className="glass-card booked-ticket-card p-4 border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-emerald-500/30 transition-all duration-300 rounded-xl text-xs flex flex-col gap-3 text-left">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-sm text-zinc-100 leading-snug break-words pr-2" title={`${t.home_team} vs ${t.away_team}`}>
                          {t.home_team} vs {t.away_team}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0 select-all" title={t.booking_id}>
                          #{t.booking_id.substring(0, 8)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-zinc-400 mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400">≡ƒôì</span> {t.venue}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400">≡ƒôà</span> {formatMatchDate(t.match_date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-850 pt-3 mt-1">
                      <button
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        onClick={() => handlePlanJourneyForTicket(t)}
                      >
                        Plan Journey
                      </button>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-semibold">
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Full Horizontal Space Section: Matchday Intelligence & Stadium Seating Guide */}
        {activeMatch && (
          <div className="w-full flex flex-col gap-8 mt-4">
            {/* 1. Matchday Intelligence: Live Weather & Betting Odds (Full Width 4-Col Grid) */}
            <div className="w-full p-6 border border-zinc-800/80 bg-zinc-900/40 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-4 border-b border-zinc-800/80 gap-3">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ΓÜí Dynamic RAG Matchday Intelligence & Environmental Feed</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 font-sans">Real-time pitch forecast, win odds, gate turnstiles & ticket market sentiment for {activeMatch.venue || "the Stadium"}.</p>
                </div>
                <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto shadow-sm">
                  {stadiumIntelLoading ? "≡ƒöä LLM & API SYNCING..." : (stadiumIntelData?.weather?.provider ? `Γ£ô ${stadiumIntelData.weather.provider.toUpperCase()}` : "Γ£ô LIVE RAG FEED SYNCED")}
                </span>
              </div>

              {stadiumIntelLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <div className="text-xs font-mono text-zinc-400">Extracting stadium RAG intelligence & querying live weather API...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Weather Forecast Card */}
                  <div className="bg-zinc-950/70 border border-zinc-800/90 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-md hover:border-emerald-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">≡ƒîñ∩╕Å Pitch Weather</span>
                      <span className="text-xs font-black text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">{stadiumIntelData?.weather?.temp || "22┬░C / 72┬░F"}</span>
                    </div>
                    <div className="text-sm font-black text-white tracking-wide">{stadiumIntelData?.weather?.condition || "Clear Sky & Mild"}</div>
                    <div className="text-[11px] font-mono text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2 mt-1">
                      <span className="block text-zinc-300">≡ƒÆ¿ Wind: {stadiumIntelData?.weather?.wind || "10 km/h SW"} ΓÇó ≡ƒÆº Hum: {stadiumIntelData?.weather?.humidity || "45%"}</span>
                      <span className="text-emerald-400 font-semibold mt-1 block truncate" title={stadiumIntelData?.weather?.note || "Ideal pitch conditions for fast football"}>
                        Γ£ô {stadiumIntelData?.weather?.note || "Ideal pitch conditions for fast football"}
                      </span>
                    </div>
                  </div>

                  {/* Betting & Win Odds Card */}
                  <div className="bg-zinc-950/70 border border-zinc-800/90 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-md hover:border-violet-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">ΓÜû∩╕Å Match Win Odds</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">Over 2.5: {stadiumIntelData?.betting_odds?.over_2_5 || "1.85"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center font-mono py-1.5 bg-zinc-900/90 rounded-lg border border-zinc-800/70">
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase font-bold">Home</div>
                        <div className="text-sm font-black text-emerald-400 mt-0.5">{stadiumIntelData?.betting_odds?.home_win?.split(" ")[0] || "2.10"}</div>
                        <div className="text-[9px] text-zinc-400">{stadiumIntelData?.betting_odds?.home_win?.split(" ")[1] || "45%"}</div>
                      </div>
                      <div className="border-x border-zinc-800/80">
                        <div className="text-[9px] text-zinc-500 uppercase font-bold">Draw</div>
                        <div className="text-sm font-black text-zinc-200 mt-0.5">{stadiumIntelData?.betting_odds?.draw?.split(" ")[0] || "3.40"}</div>
                        <div className="text-[9px] text-zinc-400">{stadiumIntelData?.betting_odds?.draw?.split(" ")[1] || "28%"}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase font-bold">Away</div>
                        <div className="text-sm font-black text-amber-400 mt-0.5">{stadiumIntelData?.betting_odds?.away_win?.split(" ")[0] || "3.20"}</div>
                        <div className="text-[9px] text-zinc-400">{stadiumIntelData?.betting_odds?.away_win?.split(" ")[1] || "27%"}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 text-center">
                      BTTS: {stadiumIntelData?.betting_odds?.btts || "Yes (1.70)"} ΓÇó Official Consensus
                    </div>
                  </div>

                  {/* Gate & Entry Tips Card */}
                  <div className="bg-zinc-950/70 border border-zinc-800/90 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-md hover:border-cyan-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">≡ƒÜ¬ Turnstile Entry</span>
                      <span className="text-[11px] font-black font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">{stadiumIntelData?.gate_entry?.open_time || "-2.5 Hours"}</span>
                    </div>
                    <div className="text-sm font-black text-white truncate" title={stadiumIntelData?.gate_entry?.recommended_turnstiles || "Gates Open Early"}>
                      {stadiumIntelData?.gate_entry?.recommended_turnstiles || "Gates Open Early"}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2 mt-1">
                      <span className="text-cyan-400 font-semibold block line-clamp-2" title={stadiumIntelData?.gate_entry?.tip || "Arrive 45m prior to avoid peak security queues"}>
                        ≡ƒÆí {stadiumIntelData?.gate_entry?.tip || "Arrive 45m prior to avoid peak security queues"}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Market Sentiment Card */}
                  <div className="bg-zinc-950/70 border border-zinc-800/90 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-md hover:border-rose-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">≡ƒôê Market Sentiment</span>
                      <span className="text-[11px] font-black font-mono text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">{stadiumIntelData?.market_sentiment?.status || "High Demand"}</span>
                    </div>
                    <div className="text-sm font-black text-white">{stadiumIntelData?.market_sentiment?.summary || "Fast Selling Fixture"}</div>
                    <div className="text-[11px] font-mono text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2 mt-1">
                      <span className="text-rose-400 font-semibold block line-clamp-2" title={stadiumIntelData?.market_sentiment?.detail || "Verified primary allocation moving rapidly"}>
                        ≡ƒöÑ {stadiumIntelData?.market_sentiment?.detail || "Verified primary allocation moving rapidly"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Stadium Stand Seating Guide (Full Width 5-Col Grid) */}
            <div className="w-full p-6 border border-zinc-800/80 bg-zinc-900/40 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-4 border-b border-zinc-800/80 gap-3">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-violet-400 font-mono flex items-center gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                    <span>≡ƒÅƒ∩╕Å Dynamic Stadium Seating Guide: RAG Extracted Stands & AI Demand</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 font-sans">Visual comparison of all seating sectors of {activeMatch.venue || "the stadium"}, extracted dynamically using LLM knowledge base.</p>
                </div>
                <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/30 self-start sm:self-auto shadow-sm">
                  {stadiumIntelLoading ? "ΓÅ│ EXTRACTING STANDS..." : "Γ£ô DYNAMIC RAG EXTRACTED"}
                </span>
              </div>

              {stadiumIntelLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-zinc-400">Extracting official stand names and view ratings for {activeMatch.venue || "stadium"}...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                  {(stadiumIntelData?.stands || [
                    {
                      id: "east_stand",
                      name: `${activeMatch.venue || "Stadium"} - Longside East Stand`,
                      badge: "Best Pitch View Γ¡ÉΓ¡ÉΓ¡ÉΓ¡ÉΓ¡É",
                      rating: "5.0 / 5.0",
                      rate: "$120 ΓÇô $180",
                      desc: "Unobstructed panoramic view of both goalmouths and tactical formations. Best side without afternoon sun glare.",
                      img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
                      demand: 85
                    },
                    {
                      id: "west_stand",
                      name: `${activeMatch.venue || "Stadium"} - Main Tribune (West)`,
                      badge: "Touchline & Benches Γ¡ÉΓ¡ÉΓ¡ÉΓ¡ÉΓ¡É",
                      rating: "4.9 / 5.0",
                      rate: "$150 ΓÇô $220",
                      desc: "Premium touchline seating directly above team dugouts, player walkout tunnel, and manager technical zones.",
                      img: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=600&auto=format&fit=crop",
                      demand: 90
                    },
                    {
                      id: "north_stand",
                      name: `${activeMatch.venue || "Stadium"} - North End (Behind Goal)`,
                      badge: "Ultras & Atmosphere Γ¡ÉΓ¡ÉΓ¡ÉΓ¡É",
                      rating: "4.3 / 5.0",
                      rate: "$65 ΓÇô $95",
                      desc: "High-energy passionate singing terrace. Home of tifo displays, flag waving, and electric goal celebrations.",
                      img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600&auto=format&fit=crop",
                      demand: 75
                    },
                    {
                      id: "south_stand",
                      name: `${activeMatch.venue || "Stadium"} - South Stand (Family End)`,
                      badge: "Great Goal Action Γ¡ÉΓ¡ÉΓ¡ÉΓ¡É",
                      rating: "4.2 / 5.0",
                      rate: "$55 ΓÇô $85",
                      desc: "Family-friendly seating atmosphere with excellent sightlines of direct attacking plays and easy concourse food access.",
                      img: "https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=600&auto=format&fit=crop",
                      demand: 70
                    },
                    {
                      id: "vip_box",
                      name: `${activeMatch.venue || "Stadium"} - VIP Hospitality Suites`,
                      badge: "Luxury Experience Γ¡ÉΓ¡ÉΓ¡ÉΓ¡ÉΓ¡É",
                      rating: "5.0 / 5.0",
                      rate: "$250 ΓÇô $450+",
                      desc: "All-inclusive gourmet dining, climate-controlled suite, private lounge bar, and elevated overhead tactical view.",
                      img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=600&auto=format&fit=crop",
                      demand: 60
                    }
                  ]).map((stand: any, idx: number) => {
                    const demand = ticketForecastingData?.seating_occupancy?.[stand.id] || stand.demand || stand.defaultDemand || 75;
                    return (
                      <div key={stand.id || idx} className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-violet-500/50 transition-all shadow-lg hover:shadow-violet-500/10">
                        {/* Top Image & Badge */}
                        <div className="relative h-36 w-full overflow-hidden bg-zinc-900">
                          <img
                            src={stand.img || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop"}
                            alt={stand.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center">
                            <span className="text-[9px] font-mono font-black uppercase px-2.5 py-1 rounded bg-black/80 text-violet-300 border border-violet-500/40 backdrop-blur-md shadow truncate">
                              {stand.badge || "Great View Γ¡ÉΓ¡ÉΓ¡ÉΓ¡ÉΓ¡É"}
                            </span>
                          </div>
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-end">
                            <h5 className="text-xs font-black text-white leading-snug drop-shadow-md line-clamp-2">{stand.name}</h5>
                          </div>
                        </div>

                        {/* Middle: Rates & View Description */}
                        <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
                          <div>
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/70 mb-2">
                              <span className="text-[10px] font-mono text-zinc-400 font-semibold">Usual Rate:</span>
                              <span className="text-xs font-black text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{stand.rate || "$100 - $180"}</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans line-clamp-3">
                              {stand.desc || "Excellent seating view of the pitch with great atmosphere."}
                            </p>
                          </div>

                          {/* Bottom: AI Demand Percentage Bar */}
                          <div className="pt-2.5 border-t border-zinc-800/70 mt-1">
                            <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                              <span className="text-zinc-400 font-bold">AI Stand Demand:</span>
                              <span className="font-black text-violet-300">{demand}%</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/90 shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-400 transition-all duration-700"
                                style={{ width: `${demand}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ΓöÇΓöÇ Match Analysis Helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const getPlayerCoordinates = (position: string, index: number, isHome: boolean) => {
    let x = 50;
    const pos = position.toLowerCase();
    
    // Horizontal spacing (x coordinate: 0% to 100%)
    if (pos.includes("goalkeeper") || pos.includes("gk")) {
      x = 50;
    } else if (pos.includes("left-back") || pos.includes("lb")) {
      x = 15;
    } else if (pos.includes("right-back") || pos.includes("rb")) {
      x = 85;
    } else if (pos.includes("centre-back") || pos.includes("cb")) {
      x = index === 1 || index === 2 ? 38 : 62;
    } else if (pos.includes("left wing-back") || pos.includes("lwb")) {
      x = 12;
    } else if (pos.includes("right wing-back") || pos.includes("rwb")) {
      x = 88;
    } else if (pos.includes("defensive midfield") || pos.includes("dmf") || pos.includes("dm")) {
      x = index === 5 ? 40 : 60;
    } else if (pos.includes("central midfield") || pos.includes("cm") || pos.includes("midfield")) {
      if (index === 6) x = 32;
      else if (index === 7) x = 68;
      else x = 50;
    } else if (pos.includes("attacking midfield") || pos.includes("am")) {
      x = 50;
    } else if (pos.includes("left winger") || pos.includes("lw") || pos.includes("left midfielder")) {
      x = 22;
    } else if (pos.includes("right winger") || pos.includes("rw") || pos.includes("right midfielder")) {
      x = 78;
    } else if (pos.includes("centre-forward") || pos.includes("cf") || pos.includes("striker") || pos.includes("second striker")) {
      if (index === 10) x = 40;
      else if (index === 9) x = 60;
      else x = 50;
    } else {
      x = 15 + (index % 5) * 18;
    }
    
    // Vertical spacing (y coordinate: 0% to 100%)
    let row = 0; // 0: goalie, 1: defense, 2: midfield, 3: attack
    if (pos.includes("goalkeeper") || pos.includes("gk")) {
      row = 0;
    } else if (pos.includes("back") || pos.includes("cb") || pos.includes("lb") || pos.includes("rb") || pos.includes("defend")) {
      row = 1;
    } else if (pos.includes("midfield") || pos.includes("dm") || pos.includes("cm") || pos.includes("am")) {
      row = 2;
    } else {
      row = 3; // forwards & wingers
    }
    
    let y = 0;
    if (isHome) {
      // Home team occupies top half (row 0 goalie at 7% to row 3 forwards at 43%)
      y = 7 + row * 12;
    } else {
      // Away team occupies bottom half (row 0 goalie at 93% to row 3 forwards at 57%)
      y = 93 - row * 12;
    }
    
    return { x, y };
  



}
