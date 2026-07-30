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

export default function DashboardHomeView() {
  const { email, userProfile, setUserProfile, activeTab, setActiveTab, handleLogout, setEmail, profileLoading, setProfileLoading, teamDetailModal, setTeamDetailModal, teamDetailLoading, setTeamDetailLoading, playerDetailModal, setPlayerDetailModal, playerDetailLoading, setPlayerDetailLoading, isEditingHomeBase, setIsEditingHomeBase, editStreet, setEditStreet, editCity, setEditCity, editCountry, setEditCountry, editStadium, setEditStadium, savingHomeBase, setSavingHomeBase, editHomeSearchQuery, setEditHomeSearchQuery, editStadiumSearchQuery, setEditStadiumSearchQuery, editHomeSuggestions, setEditHomeSuggestions, editStadiumSuggestions, setEditStadiumSuggestions, isSearchingHomeBase, setIsSearchingHomeBase, isSearchingStadiumBase, setIsSearchingStadiumBase, followedMatches, setFollowedMatches, matchesLoading, setMatchesLoading, bookedMatchIds, setBookedMatchIds, bookingInProgress, setBookingInProgress, tickets, setTickets, ticketsLoading, setTicketsLoading, storeProducts, setStoreProducts, storeLoading, setStoreLoading, storeSearch, setStoreSearch, storeCategory, setStoreCategory, isListingModalOpen, setIsListingModalOpen, listingForm, setListingForm, listingSubmitting, setListingSubmitting, ticketSelectedMatchId, setTicketSelectedMatchId, ticketAvailabilityError, setTicketAvailabilityError, ticketAvailabilityData, setTicketAvailabilityData, ticketAvailabilityLoading, setTicketAvailabilityLoading, ticketForecastingData, setTicketForecastingData, stadiumIntelData, setStadiumIntelData, stadiumIntelLoading, setStadiumIntelLoading, ticketForecastingLoading, setTicketForecastingLoading, isCustomTicketSearch, setIsCustomTicketSearch, customTicketQuery, setCustomTicketQuery, customHomeQuery, setCustomHomeQuery, customAwayQuery, setCustomAwayQuery, customTicketDate, setCustomTicketDate, customSelectedMatch, setCustomSelectedMatch, isSearchingCustomTicket, setIsSearchingCustomTicket, analysisSelectedMatchId, setAnalysisSelectedMatchId, analysisMatchDetail, setAnalysisMatchDetail, analysisLoading, setAnalysisLoading, analysisAILoading, setAnalysisAILoading, analysisAIData, setAnalysisAIData, analysisAIError, setAnalysisAIError, isCustomAnalysisPrompt, setIsCustomAnalysisPrompt, customAnalysisPromptQuery, setCustomAnalysisPromptQuery, messages, setMessages, inputVal, setInputVal, sending, setSending, activeMcpTools, setActiveMcpTools, selectedArchStep, setSelectedArchStep, selectedService, setSelectedService, assistantSelectedMapPlace, setAssistantSelectedMapPlace, assistantSelectedStay, setAssistantSelectedStay, journeyStep, setJourneyStep, journeyMatchName, setJourneyMatchName, journeyMatchDate, setJourneyMatchDate, journeyStadium, setJourneyStadium, stadiumSearchQuery, setStadiumSearchQuery, stadiumSuggestions, setStadiumSuggestions, isSearchingStadiums, setIsSearchingStadiums, showStadiumDropdown, setShowStadiumDropdown, journeyMaxPrice, setJourneyMaxPrice, journeyAccommodationType, setJourneyAccommodationType, journeyAmenities, setJourneyAmenities, journeyStays, setJourneyStays, journeyLoading, setJourneyLoading, journeyError, setJourneyError, journeySelectedStay, setJourneySelectedStay, journeyCheckIn, setJourneyCheckIn, journeyCheckOut, setJourneyCheckOut, journeyMaxDistance, setJourneyMaxDistance, showMoreFilters, setShowMoreFilters, planningMode, setPlanningMode, aiPrompt, setAiPrompt, journeyOrigin, setJourneyOrigin, journeyRouteMode, setJourneyRouteMode, journeyRoutes, setJourneyRoutes, journeyRouteLoading, setJourneyRouteLoading, journeyRouteError, setJourneyRouteError, journeyAILoading, setJourneyAILoading, loadingLogs, setLoadingLogs, currentLogMsg, setCurrentLogMsg, aiPlanningStages, setAiPlanningStages, activeAIStageIndex, setActiveAIStageIndex, completedAIStageCount, setCompletedAIStageCount, selectedRouteIdx, setSelectedRouteIdx, journeySelectedRoute, setJourneySelectedRoute, journeySafetyBriefing, setJourneySafetyBriefing, activePlacesTab, setActivePlacesTab, journeyRecommendations, setJourneyRecommendations, journeyTotalFare, setJourneyTotalFare, journeySummary, setJourneySummary, journeySelectedStayReason, setJourneySelectedStayReason, journeySelectedRouteReason, setJourneySelectedRouteReason, journeySafetySources, setJourneySafetySources, journeyValidationChecks, setJourneyValidationChecks, journeyDataWarnings, setJourneyDataWarnings, showStayOptions, setShowStayOptions, showRouteOptions, setShowRouteOptions, activeStep5Section, setActiveStep5Section, settingsTab, setSettingsTab, profileForm, setProfileForm, notifPreferences, setNotifPreferences, settingsSaved, setSettingsSaved, handleOpenTeamDetails, handleOpenPlayerDetails, handleOpenEditHomeBase, handleSaveHomeBase, handlePlanJourneyForMatch, handlePlanJourneyForTicket, handleBookTicket, handleCheckAvailability, handleRunAISeatingForecast, handleSearchCustomTicketMatch, handleSelectMatch, handleSelectAnalysisMatch, handleGenerateTacticalBreakdownForMatch, handleGenerateTacticalBreakdown, handleSearchAnalysisMatchByPrompt, handleSendMessage, handleSendDirectQuery, handleAIPlan, fetchFollowedMatches, fetchTickets, contactForm, setContactForm, contactSubmitting, setContactSubmitting, contactSubmitted, setContactSubmitted, openFaq, setOpenFaq } = useDashboard();

  return (
    <>
            {/* Profile widgets row */}
      {/* Profile widgets row - Side by Side (Box 1: Fan Deck, Box 2: Home Base) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* Left Column (Box 1): Personalised Fan Deck (col-span-6) */}
        <div className="lg:col-span-6 glass-card profile-widget p-6 sm:p-7 border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-wider text-zinc-900 dark:text-white m-0">Personalised Fan Deck</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">VIP ACCESS</span>
            </div>

            {profileLoading ? (
              <div className="loading-shimmer" style={{ height: 200, borderRadius: 16 }} />
            ) : userProfile ? (
              <div className="space-y-6">
                {/* Followed Teams (List Layout) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Followed Clubs</span>
                    <span className="text-[9px] text-zinc-400 font-mono font-bold">{userProfile.followed_teams.length} Synced</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {userProfile.followed_teams.map((team: any) => (
                      <div key={team} className="group flex items-center justify-between py-2.5 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 rounded-xl px-3 -mx-3 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 flex items-center justify-center">
                            {getTeamCrest(team) ? (
                              <img src={getTeamCrest(team)} alt={team} className="w-9 h-9 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                            ) : (
                              <span className="font-black text-emerald-500 text-xl">{team.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <h4 className="font-black text-sm text-zinc-900 dark:text-white leading-tight">{team}</h4>
                            <span className="text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">≡ƒîÉ Official Partner</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenTeamDetails(team)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs transition-colors"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("store")}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-sm"
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Favourite Players (List Layout) */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Favourite Athletes</span>
                    <span className="text-[9px] text-zinc-400 font-mono font-bold">Live Tracking</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {userProfile.favorite_players.map((p: any) => (
                      <div key={p} className="group flex items-center justify-between py-2.5 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 rounded-xl px-3 -mx-3 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 flex items-center justify-center text-violet-500 text-2xl group-hover:scale-110 transition-transform drop-shadow-sm">
                            Γ¡É
                          </div>
                          <div className="flex flex-col">
                            <h4 className="font-black text-sm text-zinc-900 dark:text-white leading-tight">{p}</h4>
                            <span className="text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">≡ƒöÑ Star Athlete</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPlayerDetails(p)}
                            className="px-3.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-400 font-bold text-xs transition-colors"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("store")}
                            className="px-3.5 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs transition-colors shadow-sm"
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Could not load profile.</p>
            )}
          </div>
        </div>

        {/* Right Column (Box 2): Home Base Coordinates (col-span-6) */}
        <div className="lg:col-span-6 glass-card profile-widget p-6 sm:p-7 border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-wider text-zinc-900 dark:text-white m-0">Home Base Coordinates & Live Tracking</h3>
              </div>
              {!isEditingHomeBase && userProfile && (
                <button 
                  onClick={handleOpenEditHomeBase}
                  className="px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.013a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                  Edit Coordinates
                </button>
              )}
            </div>

            {profileLoading ? (
              <div className="loading-shimmer" style={{ height: 240, borderRadius: 16 }} />
            ) : isEditingHomeBase ? (
              /* EDIT FORM WITH NOMINATIM AUTOCOMPLETE */
              <div className="space-y-5 text-left animate-fade-in">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                  ≡ƒÆí Type any global city, street address, or stadium name below. Live Nominatim OpenStreetMap autocompletion will precisely geolocate your target coordinates.
                </div>

                {/* Home Address Autocomplete */}
                <div className="relative">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">
                    SEARCH HOME ADDRESS / CITY (LIVE AUTOCOMPLETE)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 221B Baker Street, London or Targa, India..."
                    value={editHomeSearchQuery}
                    onChange={(e) => setEditHomeSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm transition-colors"
                  />
                  {isSearchingHomeBase && (
                    <div className="absolute right-3.5 top-9 text-xs text-zinc-400 animate-spin">ΓÅ│</div>
                  )}
                  {editHomeSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {editHomeSuggestions.map((item: any, idx: any) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            const addr = item.address || {};
                            setEditStreet(addr.road || addr.suburb || item.display_name.split(',')[0] || "");
                            setEditCity(addr.city || addr.town || addr.village || addr.county || "");
                            setEditCountry(addr.country || "");
                            setEditHomeSearchQuery(item.display_name);
                            setEditHomeSuggestions([]);
                          }}
                          className="p-3 hover:bg-emerald-500/10 cursor-pointer text-xs transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{item.display_name}</span>
                          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">SELECT</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stadium Autocomplete */}
                <div className="relative">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5 uppercase tracking-wider">
                    SEARCH TARGET STADIUM / CLUB VENUE
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Anfield, Camp Nou, Emirates Stadium..."
                    value={editStadiumSearchQuery}
                    onChange={(e) => setEditStadiumSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm transition-colors"
                  />
                  {isSearchingStadiumBase && (
                    <div className="absolute right-3.5 top-9 text-xs text-zinc-400 animate-spin">ΓÅ│</div>
                  )}
                  {editStadiumSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {editStadiumSuggestions.map((item: any, idx: any) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            const stName = item.address?.stadium || item.address?.amenity || item.display_name.split(',')[0] || "";
                            setEditStadium(stName);
                            setEditStadiumSearchQuery(item.display_name);
                            setEditStadiumSuggestions([]);
                          }}
                          className="p-3 hover:bg-emerald-500/10 cursor-pointer text-xs transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{item.display_name}</span>
                          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">SELECT</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manual Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="text-[9px] font-mono font-bold text-zinc-400 block mb-1">STREET</label>
                    <input 
                      type="text" 
                      value={editStreet}
                      onChange={(e) => setEditStreet(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono font-bold text-zinc-400 block mb-1">CITY</label>
                    <input 
                      type="text" 
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono font-bold text-zinc-400 block mb-1">COUNTRY</label>
                    <input 
                      type="text" 
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono font-bold text-zinc-400 block mb-1">TARGET STADIUM</label>
                    <input 
                      type="text" 
                      value={editStadium}
                      onChange={(e) => setEditStadium(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setIsEditingHomeBase(false)}
                    className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveHomeBase}
                    disabled={savingHomeBase}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingHomeBase ? "Saving Coordinates..." : "Save Coordinates & Update Engine"}
                  </button>
                </div>
              </div>
            ) : (
              /* NORMAL DISPLAY */
              <div className="space-y-6">
                {/* Coordinate Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {[
                    ["STREET", userProfile?.street || "ΓÇö"],
                    ["CITY", userProfile?.city || "ΓÇö"],
                    ["COUNTRY", userProfile?.country || "ΓÇö"],
                    ["TARGET STADIUM", userProfile?.stadium || "ΓÇö"],
                  ].map(([label, val]) => (
                    <div key={label} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 text-left relative overflow-hidden flex flex-col justify-between min-h-[90px] shadow-sm hover:border-emerald-500/30 transition-all">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                      <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider block mb-1">{label}</span>
                      <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white break-words">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Live Google Maps Preview */}
                <div className="w-full h-[320px] relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md group">
                  <iframe
                    title="Live Location Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: "contrast(1.05) brightness(0.95)" }}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent((userProfile?.stadium ? userProfile.stadium + ", " : "") + (userProfile?.city || "") + (userProfile?.country ? ", " + userProfile.country : ""))}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  />
                  <div className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center gap-2 pointer-events-none shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>LIVE SATELLITE TRACKING ΓÇö {userProfile?.stadium || userProfile?.city || "ACTIVE STATION"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Upcoming matches of followed teams */}
      <div>
        <div className="matches-section-title">
          Upcoming Matches ΓÇö Your Followed Teams
        </div>
        {matchesLoading ? (
          <div className="match-cards-grid">
            {[1, 2, 3].map(i => <div key={i} className="loading-shimmer shimmer-card" />)}
          </div>
        ) : followedMatches.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <p className="text-sm font-semibold">No upcoming matches found for your followed teams.</p>
            <p className="text-xs">Try updating your followed teams in onboarding.</p>
          </div>
        ) : (
          <div className="match-cards-grid">
            {followedMatches.map((match: any) => {
              const isBooked = bookedMatchIds.has(match.id);
              const isBooking = bookingInProgress === match.id;
              return (
                <div
                  key={match.id}
                  className={`glass-card match-card ${isBooked ? "cursor-pointer hover:border-emerald-500/40" : ""}`}
                  onClick={() => {
                    if (isBooked) {
                      handlePlanJourneyForMatch(match);
                    }
                  }}
                >
                  <div className="match-card-header">
                    <span className="match-league-badge">{match.league_code || match.league || "ΓÇö"}</span>
                    <span className={`match-status-chip ${statusChipClass(match.status)}`}>
                      {statusLabel(match.status)}
                    </span>
                  </div>

                   <div className="match-teams-row">
                    <div className="match-team">
                      {match.homeCrest ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={match.homeCrest} alt={match.homeTeam} />
                      ) : (
                        <div style={{ width: 36, height: 36, background: "rgba(16,185,129,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#10b981" }}>
                          {match.homeTeam.charAt(0)}
                        </div>
                      )}
                      <span className="match-team-name">{match.homeTeam}</span>
                    </div>

                     <div className="match-vs-block">
                      {["IN_PLAY", "PAUSED", "FINISHED", "FT"].includes((match.status || "").toUpperCase()) ? (
                        <span className="match-score">{match.homeScore} ΓÇô {match.awayScore}</span>
                      ) : (
                        <span className="match-vs">VS</span>
                      )}
                      {match.minute && !["SCHEDULED", "TIMED"].includes(match.status?.toUpperCase() || "") && (
                        <span className="match-time">{match.minute}&apos;</span>
                      )}
                    </div>

                     <div className="match-team">
                      {match.awayCrest ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={match.awayCrest} alt={match.awayTeam} />
                      ) : (
                        <div style={{ width: 36, height: 36, background: "rgba(16,185,129,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#10b981" }}>
                          {match.awayTeam.charAt(0)}
                        </div>
                      )}
                      <span className="match-team-name">{match.awayTeam}</span>
                    </div>
                  </div>

                   {match.eventDate && (
                    <div className="text-center text-[11px] text-zinc-500 font-mono -mt-1">
                      {formatMatchDate(match.eventDate)}
                    </div>
                  )}

                   <div className="match-card-footer">
                    <span className="match-venue-text">{match.venue || "ΓÇö"}</span>
                    {isBooked ? (
                      <button
                        className="book-ticket-btn booked cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlanJourneyForMatch(match);
                        }}
                      >
                        Plan Journey
                      </button>
                    ) : (
                      <button
                        className="book-ticket-btn cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookTicket(match);
                        }}
                        disabled={!!isBooking}
                      >
                        {isBooking ? "BookingΓÇª" : "Book Ticket"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  
  );



}
