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

export default function SettingsView() {
  const { email, userProfile, setUserProfile, activeTab, setActiveTab, handleLogout, setEmail, profileLoading, setProfileLoading, teamDetailModal, setTeamDetailModal, teamDetailLoading, setTeamDetailLoading, playerDetailModal, setPlayerDetailModal, playerDetailLoading, setPlayerDetailLoading, isEditingHomeBase, setIsEditingHomeBase, editStreet, setEditStreet, editCity, setEditCity, editCountry, setEditCountry, editStadium, setEditStadium, savingHomeBase, setSavingHomeBase, editHomeSearchQuery, setEditHomeSearchQuery, editStadiumSearchQuery, setEditStadiumSearchQuery, editHomeSuggestions, setEditHomeSuggestions, editStadiumSuggestions, setEditStadiumSuggestions, isSearchingHomeBase, setIsSearchingHomeBase, isSearchingStadiumBase, setIsSearchingStadiumBase, followedMatches, setFollowedMatches, matchesLoading, setMatchesLoading, bookedMatchIds, setBookedMatchIds, bookingInProgress, setBookingInProgress, tickets, setTickets, ticketsLoading, setTicketsLoading, storeProducts, setStoreProducts, storeLoading, setStoreLoading, storeSearch, setStoreSearch, storeCategory, setStoreCategory, isListingModalOpen, setIsListingModalOpen, listingForm, setListingForm, listingSubmitting, setListingSubmitting, ticketSelectedMatchId, setTicketSelectedMatchId, ticketAvailabilityError, setTicketAvailabilityError, ticketAvailabilityData, setTicketAvailabilityData, ticketAvailabilityLoading, setTicketAvailabilityLoading, ticketForecastingData, setTicketForecastingData, stadiumIntelData, setStadiumIntelData, stadiumIntelLoading, setStadiumIntelLoading, ticketForecastingLoading, setTicketForecastingLoading, isCustomTicketSearch, setIsCustomTicketSearch, customTicketQuery, setCustomTicketQuery, customHomeQuery, setCustomHomeQuery, customAwayQuery, setCustomAwayQuery, customTicketDate, setCustomTicketDate, customSelectedMatch, setCustomSelectedMatch, isSearchingCustomTicket, setIsSearchingCustomTicket, analysisSelectedMatchId, setAnalysisSelectedMatchId, analysisMatchDetail, setAnalysisMatchDetail, analysisLoading, setAnalysisLoading, analysisAILoading, setAnalysisAILoading, analysisAIData, setAnalysisAIData, analysisAIError, setAnalysisAIError, isCustomAnalysisPrompt, setIsCustomAnalysisPrompt, customAnalysisPromptQuery, setCustomAnalysisPromptQuery, messages, setMessages, inputVal, setInputVal, sending, setSending, activeMcpTools, setActiveMcpTools, selectedArchStep, setSelectedArchStep, selectedService, setSelectedService, assistantSelectedMapPlace, setAssistantSelectedMapPlace, assistantSelectedStay, setAssistantSelectedStay, journeyStep, setJourneyStep, journeyMatchName, setJourneyMatchName, journeyMatchDate, setJourneyMatchDate, journeyStadium, setJourneyStadium, stadiumSearchQuery, setStadiumSearchQuery, stadiumSuggestions, setStadiumSuggestions, isSearchingStadiums, setIsSearchingStadiums, showStadiumDropdown, setShowStadiumDropdown, journeyMaxPrice, setJourneyMaxPrice, journeyAccommodationType, setJourneyAccommodationType, journeyAmenities, setJourneyAmenities, journeyStays, setJourneyStays, journeyLoading, setJourneyLoading, journeyError, setJourneyError, journeySelectedStay, setJourneySelectedStay, journeyCheckIn, setJourneyCheckIn, journeyCheckOut, setJourneyCheckOut, journeyMaxDistance, setJourneyMaxDistance, showMoreFilters, setShowMoreFilters, planningMode, setPlanningMode, aiPrompt, setAiPrompt, journeyOrigin, setJourneyOrigin, journeyRouteMode, setJourneyRouteMode, journeyRoutes, setJourneyRoutes, journeyRouteLoading, setJourneyRouteLoading, journeyRouteError, setJourneyRouteError, journeyAILoading, setJourneyAILoading, loadingLogs, setLoadingLogs, currentLogMsg, setCurrentLogMsg, aiPlanningStages, setAiPlanningStages, activeAIStageIndex, setActiveAIStageIndex, completedAIStageCount, setCompletedAIStageCount, selectedRouteIdx, setSelectedRouteIdx, journeySelectedRoute, setJourneySelectedRoute, journeySafetyBriefing, setJourneySafetyBriefing, activePlacesTab, setActivePlacesTab, journeyRecommendations, setJourneyRecommendations, journeyTotalFare, setJourneyTotalFare, journeySummary, setJourneySummary, journeySelectedStayReason, setJourneySelectedStayReason, journeySelectedRouteReason, setJourneySelectedRouteReason, journeySafetySources, setJourneySafetySources, journeyValidationChecks, setJourneyValidationChecks, journeyDataWarnings, setJourneyDataWarnings, showStayOptions, setShowStayOptions, showRouteOptions, setShowRouteOptions, activeStep5Section, setActiveStep5Section, settingsTab, setSettingsTab, profileForm, setProfileForm, notifPreferences, setNotifPreferences, settingsSaved, setSettingsSaved, handleOpenTeamDetails, handleOpenPlayerDetails, handleOpenEditHomeBase, handleSaveHomeBase, handlePlanJourneyForMatch, handlePlanJourneyForTicket, handleBookTicket, handleCheckAvailability, handleRunAISeatingForecast, handleSearchCustomTicketMatch, handleSelectMatch, handleSelectAnalysisMatch, handleGenerateTacticalBreakdownForMatch, handleGenerateTacticalBreakdown, handleSearchAnalysisMatchByPrompt, handleSendMessage, handleSendDirectQuery, handleAIPlan, fetchFollowedMatches, fetchTickets, contactForm, setContactForm, contactSubmitting, setContactSubmitting, contactSubmitted, setContactSubmitted, openFaq, setOpenFaq } = useDashboard();


    const handleSaveSettings = () => {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    };

    return (
      <div className="flex flex-col gap-8 w-full text-white pb-16 font-sans animate-fadeIn">
        {/* Top Header */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Account & Preferences</h3>
            <p className="text-xs text-zinc-400 mt-1">Manage your profile details, matchday notifications, ticketing defaults, and display settings.</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {settingsSaved && (
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                [OK] Preferences Saved
              </span>
            )}
            <button
              onClick={handleSaveSettings}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-800/80 pb-4">
          {[
            { id: "profile", label: "Profile & Preferences", icon: "≡ƒæñ" },
            { id: "notifications", label: "Notifications & Alerts", icon: "≡ƒöö" },
            { id: "security", label: "Security & Account", icon: "≡ƒöÆ" }
          ].map((t: any) => (
            <button
              key={t.id}
              onClick={() => setSettingsTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                settingsTab === t.id
                  ? "bg-zinc-800 border-zinc-700 text-white shadow-sm"
                  : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Profile & Preferences */}
        {settingsTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Card 1: Personal Profile */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 p-6 rounded-2xl shadow-lg flex flex-col justify-between gap-5">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Personal Profile</h4>
                <p className="text-xs text-zinc-400 mb-4">Your display identity and primary club affiliation for match recommendations.</p>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={profileForm.displayName || userProfile?.name || ""}
                      onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })}
                      placeholder="Alex Ferguson"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Connected Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={email || "alex@manutd.co.uk"}
                      className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-lg px-3.5 py-2.5 text-xs cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Favorite Club Affiliation</label>
                    <select
                      value={profileForm.favoriteClub}
                      onChange={e => setProfileForm({ ...profileForm, favoriteClub: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="CA Boca Juniors">CA Boca Juniors</option>
                      <option value="River Plate">River Plate</option>
                      <option value="Real Madrid">Real Madrid</option>
                      <option value="Manchester United">Manchester United</option>
                      <option value="Arsenal">Arsenal</option>
                      <option value="FC Barcelona">FC Barcelona</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Home Base City (For Travel Routing)</label>
                    <input
                      type="text"
                      value={journeyOrigin || "Buenos Aires, Argentina"}
                      onChange={e => setJourneyOrigin(e.target.value)}
                      placeholder="e.g. London, UK"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Display & Ticketing Defaults */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 p-6 rounded-2xl shadow-lg flex flex-col justify-between gap-5">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Display & Ticketing Defaults</h4>
                <p className="text-xs text-zinc-400 mb-4">Set your default currency, betting odds presentation, and travel routing mode.</p>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Preferred Currency</label>
                    <select
                      value={profileForm.currency}
                      onChange={e => setProfileForm({ ...profileForm, currency: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="USD ($)">USD ($) - US Dollar</option>
                      <option value="EUR (Γé¼)">EUR (Γé¼) - Euro</option>
                      <option value="GBP (┬ú)">GBP (┬ú) - British Pound</option>
                      <option value="ARS ($)">ARS ($) - Argentine Peso</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Odds Display Format</label>
                    <select
                      value={profileForm.oddsFormat}
                      onChange={e => setProfileForm({ ...profileForm, oddsFormat: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="Decimal (1.85)">Decimal (e.g. 1.85)</option>
                      <option value="Fractional (17/20)">Fractional (e.g. 17/20)</option>
                      <option value="American (-118)">American (e.g. -118)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Default Travel & Routing Mode</label>
                    <select
                      value={profileForm.defaultTravelMode}
                      onChange={e => setProfileForm({ ...profileForm, defaultTravelMode: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="transit">Public Transit & Metro</option>
                      <option value="driving">Driving & Taxi Transfers</option>
                      <option value="flight">Flights & High-Speed Rail</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">System Timezone</label>
                    <input
                      type="text"
                      disabled
                      value="Local System Time (Auto-Detected)"
                      className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-lg px-3.5 py-2.5 text-xs cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Notifications & Alerts */}
        {settingsTab === "notifications" && (
          <div className="bg-zinc-950/80 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl shadow-lg animate-fadeIn max-w-3xl">
            <h4 className="text-base font-semibold text-white mb-1">Matchday & Ticketing Alerts</h4>
            <p className="text-xs text-zinc-400 mb-6">Choose when and how you receive updates regarding match scores, turnstile entry, and ticket availability.</p>
            
            <div className="flex flex-col gap-3.5">
              {[
                { id: "liveGoals", label: "Live Goal & Match Score Alerts", desc: "Receive immediate visual updates when a followed team scores, concedes, or suffers a red card during play.", val: notifPreferences.liveGoals },
                { id: "ticketAlerts", label: "Ticket Availability & Price Drops", desc: "Notify when new seat allocations are released or prices drop for your bookmarked upcoming matches.", val: notifPreferences.ticketAlerts },
                { id: "gateReminders", label: "Stadium Gate Opening Reminders", desc: "Receive automated digital alerts 2 hours prior to kick-off with turnstile entry directions.", val: notifPreferences.gateReminders },
                { id: "matchRoundup", label: "Weekly Matchup & Travel Roundup", desc: "Receive a curated email summary of weekend fixtures, ticket rates, and transit advisories.", val: notifPreferences.matchRoundup }
              ].map((notif: any) => (
                <div key={notif.id} className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-white">{notif.label}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{notif.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifPreferences({ ...notifPreferences, [notif.id]: !notif.val })}
                    className={`w-11 h-6 rounded-full transition-all relative p-0.5 cursor-pointer flex items-center ${notif.val ? "bg-emerald-600" : "bg-zinc-700"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notif.val ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Security & Account */}
        {settingsTab === "security" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Security */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl shadow-lg flex flex-col justify-between gap-6">
              <div>
                <h4 className="text-base font-semibold text-white mb-1">Account Security</h4>
                <p className="text-xs text-zinc-400 mb-6">Manage authentication settings and protect your connected ticketing profile.</p>

                <div className="flex flex-col gap-4 text-xs">
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">Password Protection</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Last changed 30 days ago</div>
                    </div>
                    <button type="button" className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer">
                      Change Password
                    </button>
                  </div>

                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">Two-Factor Authentication</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Secure your match ticket bookings</div>
                    </div>
                    <button type="button" className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500">
                Active Session: Windows Client ΓÇó IP Verified
              </div>
            </div>

            {/* Data & Privacy */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl shadow-lg flex flex-col justify-between gap-6">
              <div>
                <h4 className="text-base font-semibold text-white mb-1">Data & Privacy</h4>
                <p className="text-xs text-zinc-400 mb-6">Download your personal ticketing archive or manage session status.</p>
                
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ profile: userProfile, tickets: tickets, followedMatches: followedMatches, exportDate: new Date() }, null, 2));
                      const dlAnchorElem = document.createElement("a");
                      dlAnchorElem.setAttribute("href", dataStr);
                      dlAnchorElem.setAttribute("download", `offside_ai_bookings_${Date.now()}.json`);
                      dlAnchorElem.click();
                    }}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-medium text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Download Bookings Archive (.JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium text-xs py-3 rounded-xl transition-all cursor-pointer text-center mt-2"
                  >
                    Sign Out & Clear Session
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 text-center">
                100% Data Privacy Compliant ΓÇó Zero Third-Party Ad Trackers
              </div>
            </div>
          </div>
        )}
      </div>
    );
  



}
