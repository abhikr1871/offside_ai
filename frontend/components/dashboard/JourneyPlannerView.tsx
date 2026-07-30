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

export default function JourneyPlannerView() {
  const { email, userProfile, setUserProfile, activeTab, setActiveTab, handleLogout, setEmail, profileLoading, setProfileLoading, teamDetailModal, setTeamDetailModal, teamDetailLoading, setTeamDetailLoading, playerDetailModal, setPlayerDetailModal, playerDetailLoading, setPlayerDetailLoading, isEditingHomeBase, setIsEditingHomeBase, editStreet, setEditStreet, editCity, setEditCity, editCountry, setEditCountry, editStadium, setEditStadium, savingHomeBase, setSavingHomeBase, editHomeSearchQuery, setEditHomeSearchQuery, editStadiumSearchQuery, setEditStadiumSearchQuery, editHomeSuggestions, setEditHomeSuggestions, editStadiumSuggestions, setEditStadiumSuggestions, isSearchingHomeBase, setIsSearchingHomeBase, isSearchingStadiumBase, setIsSearchingStadiumBase, followedMatches, setFollowedMatches, matchesLoading, setMatchesLoading, bookedMatchIds, setBookedMatchIds, bookingInProgress, setBookingInProgress, tickets, setTickets, ticketsLoading, setTicketsLoading, storeProducts, setStoreProducts, storeLoading, setStoreLoading, storeSearch, setStoreSearch, storeCategory, setStoreCategory, isListingModalOpen, setIsListingModalOpen, listingForm, setListingForm, listingSubmitting, setListingSubmitting, ticketSelectedMatchId, setTicketSelectedMatchId, ticketAvailabilityError, setTicketAvailabilityError, ticketAvailabilityData, setTicketAvailabilityData, ticketAvailabilityLoading, setTicketAvailabilityLoading, ticketForecastingData, setTicketForecastingData, stadiumIntelData, setStadiumIntelData, stadiumIntelLoading, setStadiumIntelLoading, ticketForecastingLoading, setTicketForecastingLoading, isCustomTicketSearch, setIsCustomTicketSearch, customTicketQuery, setCustomTicketQuery, customHomeQuery, setCustomHomeQuery, customAwayQuery, setCustomAwayQuery, customTicketDate, setCustomTicketDate, customSelectedMatch, setCustomSelectedMatch, isSearchingCustomTicket, setIsSearchingCustomTicket, analysisSelectedMatchId, setAnalysisSelectedMatchId, analysisMatchDetail, setAnalysisMatchDetail, analysisLoading, setAnalysisLoading, analysisAILoading, setAnalysisAILoading, analysisAIData, setAnalysisAIData, analysisAIError, setAnalysisAIError, isCustomAnalysisPrompt, setIsCustomAnalysisPrompt, customAnalysisPromptQuery, setCustomAnalysisPromptQuery, messages, setMessages, inputVal, setInputVal, sending, setSending, activeMcpTools, setActiveMcpTools, selectedArchStep, setSelectedArchStep, selectedService, setSelectedService, assistantSelectedMapPlace, setAssistantSelectedMapPlace, assistantSelectedStay, setAssistantSelectedStay, journeyStep, setJourneyStep, journeyMatchName, setJourneyMatchName, journeyMatchDate, setJourneyMatchDate, journeyStadium, setJourneyStadium, stadiumSearchQuery, setStadiumSearchQuery, stadiumSuggestions, setStadiumSuggestions, isSearchingStadiums, setIsSearchingStadiums, showStadiumDropdown, setShowStadiumDropdown, journeyMaxPrice, setJourneyMaxPrice, journeyAccommodationType, setJourneyAccommodationType, journeyAmenities, setJourneyAmenities, journeyStays, setJourneyStays, journeyLoading, setJourneyLoading, journeyError, setJourneyError, journeySelectedStay, setJourneySelectedStay, journeyCheckIn, setJourneyCheckIn, journeyCheckOut, setJourneyCheckOut, journeyMaxDistance, setJourneyMaxDistance, showMoreFilters, setShowMoreFilters, planningMode, setPlanningMode, aiPrompt, setAiPrompt, journeyOrigin, setJourneyOrigin, journeyRouteMode, setJourneyRouteMode, journeyRoutes, setJourneyRoutes, journeyRouteLoading, setJourneyRouteLoading, journeyRouteError, setJourneyRouteError, journeyAILoading, setJourneyAILoading, loadingLogs, setLoadingLogs, currentLogMsg, setCurrentLogMsg, aiPlanningStages, setAiPlanningStages, activeAIStageIndex, setActiveAIStageIndex, completedAIStageCount, setCompletedAIStageCount, selectedRouteIdx, setSelectedRouteIdx, journeySelectedRoute, setJourneySelectedRoute, journeySafetyBriefing, setJourneySafetyBriefing, activePlacesTab, setActivePlacesTab, journeyRecommendations, setJourneyRecommendations, journeyTotalFare, setJourneyTotalFare, journeySummary, setJourneySummary, journeySelectedStayReason, setJourneySelectedStayReason, journeySelectedRouteReason, setJourneySelectedRouteReason, journeySafetySources, setJourneySafetySources, journeyValidationChecks, setJourneyValidationChecks, journeyDataWarnings, setJourneyDataWarnings, showStayOptions, setShowStayOptions, showRouteOptions, setShowRouteOptions, activeStep5Section, setActiveStep5Section, settingsTab, setSettingsTab, profileForm, setProfileForm, notifPreferences, setNotifPreferences, settingsSaved, setSettingsSaved, handleOpenTeamDetails, handleOpenPlayerDetails, handleOpenEditHomeBase, handleSaveHomeBase, handlePlanJourneyForMatch, handlePlanJourneyForTicket, handleBookTicket, handleCheckAvailability, handleRunAISeatingForecast, handleSearchCustomTicketMatch, handleSelectMatch, handleSelectAnalysisMatch, handleGenerateTacticalBreakdownForMatch, handleGenerateTacticalBreakdown, handleSearchAnalysisMatchByPrompt, handleSendMessage, handleSendDirectQuery, handleAIPlan, fetchFollowedMatches, fetchTickets, contactForm, setContactForm, contactSubmitting, setContactSubmitting, contactSubmitted, setContactSubmitted, openFaq, setOpenFaq } = useDashboard();

  const POPULAR_STADIUMS = ["Emirates Stadium", "Old Trafford", "Anfield", "Etihad Stadium", "Stamford Bridge", "Tottenham Hotspur Stadium", "Wembley Stadium", "Camp Nou", "Santiago Bernabeu", "San Siro"];
  const stadiumRef = useRef<HTMLInputElement>(null);
  const filteredPopularStadiums = POPULAR_STADIUMS.filter(name =>
    name.toLowerCase().includes((stadiumSearchQuery || '').toLowerCase())
  );


    const handleFetchStays = async () => {
      setJourneyLoading(true);
      setJourneyError(null);
      try {
        const amenitiesParam = journeyAmenities.join(",");
        let checkIn = journeyCheckIn;
        let checkOut = journeyCheckOut;
        if (!checkIn && journeyMatchDate) {
          checkIn = journeyMatchDate;
          const dt = new Date(journeyMatchDate);
          dt.setDate(dt.getDate() + 1);
          checkOut = dt.toISOString().split("T")[0];
        }

        const res = await fetch(
          `${BACKEND}/api/v1/logistics/stays?stadium=${encodeURIComponent(journeyStadium)}&max_price=${journeyMaxPrice}&required_amenities=${encodeURIComponent(amenitiesParam)}&accommodation_type=${journeyAccommodationType}&check_in=${checkIn}&check_out=${checkOut}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === "success" && data.stays) {
            const filteredStays = data.stays.filter(
              (s: any) => s.distance_miles <= journeyMaxDistance
            );
            setJourneyStays(filteredStays);
            setJourneyStep(3);
          } else {
            setJourneyError("Failed to retrieve stays matches. Please verify parameters.");
          }
        } else {
          setJourneyError("Error connecting to stays logistics service.");
        }
      } catch (err) {
        setJourneyError("Could not reach stays logistics service.");
      } finally {
        setJourneyLoading(false);
      }
    };

    const handleFetchRoutes = async () => {
      setJourneyRouteLoading(true);
      setJourneyRouteError(null);
      try {
        const res = await fetch(
          `${BACKEND}/api/v1/logistics/directions?origin=${encodeURIComponent(journeyOrigin)}&destination=${encodeURIComponent(journeyStadium)}&mode=${journeyRouteMode}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === "success" && data.routes) {
            setJourneyRoutes(data.routes);
            setJourneySelectedRoute(data.routes[0] || null);
            setSelectedRouteIdx(0);
          } else {
            setJourneyRouteError("Failed to calculate route steps. Please verify your origin.");
          }
        } else {
          setJourneyRouteError("Error connecting to route directions service.");
        }
      } catch (err) {
        setJourneyRouteError("Could not reach route directions service.");
      } finally {
        setJourneyRouteLoading(false);
      }
    };

    const toggleAmenity = (amenity: string) => {
      setJourneyAmenities((prev: any) =>
        prev.includes(amenity) ? prev.filter((a: any) => a !== amenity) : [...prev, amenity]
      );
    };

    const handleQuickSelect = (match: MatchDocument) => {
      const matchDateStr = match.eventDate ? match.eventDate.split("T")[0] : "";
      setJourneyMatchName(`${match.homeTeam} vs ${match.awayTeam}`);
      setJourneyMatchDate(matchDateStr);
      setJourneyStadium(match.venue || "Emirates Stadium");
      setStadiumSearchQuery(match.venue || "Emirates Stadium");
      if (matchDateStr) {
        setJourneyCheckIn(matchDateStr);
        const dt = new Date(matchDateStr);
        dt.setDate(dt.getDate() + 1);
        setJourneyCheckOut(dt.toISOString().split("T")[0]);
      } else {
        setJourneyCheckIn("");
        setJourneyCheckOut("");
      }
    };

    const handleTicketQuickSelect = (ticket: TicketDocument) => {
      const matchDateStr = ticket.match_date ? ticket.match_date.split("T")[0] : "";
      setJourneyMatchName(`${ticket.home_team} vs ${ticket.away_team}`);
      setJourneyMatchDate(matchDateStr);
      setJourneyStadium(ticket.venue || "Emirates Stadium");
      setStadiumSearchQuery(ticket.venue || "Emirates Stadium");
      if (matchDateStr) {
        setJourneyCheckIn(matchDateStr);
        const dt = new Date(matchDateStr);
        dt.setDate(dt.getDate() + 1);
        setJourneyCheckOut(dt.toISOString().split("T")[0]);
      } else {
        setJourneyCheckIn("");
        setJourneyCheckOut("");
      }
    };

    const renderAIPlannerOverlay = () => (
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 md:p-6 z-50">
        <div className="w-full max-w-3xl bg-zinc-900/95 border border-violet-500/30 rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="text-[10px] font-mono text-violet-400 uppercase tracking-widest font-extrabold">
              Globus 2026 AI Planner
            </div>
            <div className="text-[9px] font-mono text-zinc-500">
              5 STAGE EXECUTION
            </div>
          </div>

          <div className="grid gap-3">
            {aiPlanningStages.map((stage: any, idx: any) => {
              const isActive = idx === activeAIStageIndex;
              const isDone = idx < completedAIStageCount;
              const showDetails = isActive || isDone;
              return (
                <div
                  key={stage.id}
                  className={`rounded-xl border p-3 text-left transition-all duration-300 ${
                    isActive
                      ? "border-violet-500/60 bg-violet-500/[0.06] shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                      : isDone
                      ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                      : "border-zinc-800 bg-zinc-950/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono font-black ${
                      isDone
                        ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                        : isActive
                        ? "border-violet-400 text-violet-300"
                        : "border-zinc-700 text-zinc-500"
                    }`}>
                      {isDone ? "OK" : idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className={`text-xs font-black uppercase tracking-wider ${isActive ? "text-violet-300" : isDone ? "text-emerald-400" : "text-zinc-500"}`}>
                          {stage.label}
                        </h4>
                        {isActive && (
                          <span className="h-4 w-4 shrink-0 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                        {showDetails ? stage.brief : "Queued for execution."}
                      </p>
                      {showDetails && stage.details && stage.details.length > 0 && (
                        <div className="mt-2 grid gap-1">
                          {stage.details.slice(0, 3).map((detail: any, dIdx: any) => (
                            <div key={dIdx} className="rounded-lg border border-zinc-800/70 bg-black/20 px-2.5 py-1.5 text-[10px] text-zinc-300 font-mono">
                              {detail}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black/30 p-3">
            <div className="flex gap-2 text-left text-violet-300 font-mono text-[10px] font-extrabold">
              <span className="text-violet-500 animate-blink">|</span>
              <span>{currentLogMsg}</span>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="glass-card p-8 w-full max-w-none space-y-8 relative overflow-hidden">
        {journeyAILoading && renderAIPlannerOverlay()}
        {/* Waiting / Loading Screen Terminal Overlay */}
        {false && journeyAILoading && (
          <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 z-50">
            <div className="w-full max-w-md bg-zinc-900/90 border border-violet-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
              {/* Terminal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[10px] font-mono text-violet-400 uppercase tracking-widest font-extrabold animate-pulse">
                  Globus 2026 AI Planner
                </div>
                <div className="text-[9px] font-mono text-zinc-550">
                  SECURE_TLS_V1.3
                </div>
              </div>

              {/* Loading Radar */}
              <div className="flex justify-center py-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500/10" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 border-r-transparent animate-spin" />
                  <div className="text-xl">Γ£¿</div>
                </div>
              </div>

              {/* Terminal body */}
              <div className="bg-black/40 rounded-xl p-4 border border-zinc-850 h-44 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-1.5 scrollbar-thin text-left">
                {loadingLogs.map((log: any, lIdx: any) => (
                  <div key={lIdx} className="flex gap-2 text-left animate-slide-up text-zinc-400">
                    <span className="text-violet-500">Γû╢</span>
                    <span>{log}</span>
                  </div>
                ))}
                <div className="flex gap-2 text-left text-violet-400 font-extrabold">
                  <span className="text-violet-500 animate-blink">Γûï</span>
                  <span>{currentLogMsg}</span>
                </div>
              </div>

              <p className="text-[10px] text-center text-zinc-550 font-mono">
                Optimizing flights, stays, routes and matchday event locations
              </p>
            </div>
          </div>
        )}

        {/* Wizard Header / Steps Indicator */}
        <div className="border-b border-zinc-700/50 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-emerald-500 uppercase tracking-wide">
                Plan your Journey
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Unified logistics portal comparing Hotelbeds & LiteAPI rates with MCP services.
              </p>
            </div>
            {journeyStep > 1 && (
              <button
                onClick={() => setJourneyStep((prev: any) => prev - 1)}
                className="text-xs font-bold text-zinc-500 hover:text-emerald-500 cursor-pointer"
              >
                ΓåÉ Back
              </button>
            )}
          </div>

          {/* Progress bar HUD */}
          <div className="mt-5 grid grid-cols-5 gap-2 text-center text-[10px] font-mono tracking-wider">
            {[
              "1. MATCH DETAILS",
              "2. STAY FILTERS",
              "3. LODGING LIST",
              "4. ROUTE DIRECTIONS",
              "5. EXPLORE & SAFETY"
            ].map((stepLabel, idx) => {
              const active = journeyStep === idx + 1;
              const completed = journeyStep > idx + 1;
              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className={`h-1 rounded-full transition-all duration-300 ${
                    active ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : completed ? "bg-emerald-600/60" : "bg-zinc-800"
                  }`} />
                  <span className={active ? "text-emerald-400 font-bold" : completed ? "text-emerald-600/70" : "text-zinc-600"}>
                    {stepLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Match Details Form */}
        {journeyStep === 1 && (
          <div className="space-y-6 py-2">

            {/* ΓöÇΓöÇ Mode Selector (shown until user picks) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
            {!planningMode && (
              <div className="space-y-4">
                <div className="text-center space-y-1 pb-2">
                  <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">How would you like to plan?</p>
                  <h3 className="text-base font-extrabold text-white">Choose Your Planning Style</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Left: Plan Yourself */}
                  <button
                    onClick={() => setPlanningMode('custom')}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-left hover:border-emerald-500/60 hover:bg-emerald-500/[0.04] transition-all duration-300 cursor-pointer"
                    style={{ backdropFilter: 'blur(12px)' }}
                  >
                    {/* Glow on hover */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />

                    <div className="relative space-y-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-emerald-500/10 border border-zinc-700 group-hover:border-emerald-500/40 flex items-center justify-center text-2xl transition-all duration-300">
                        ≡ƒÄ»
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="font-extrabold text-white text-sm group-hover:text-emerald-400 transition-colors">Plan Yourself</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Fill in match details, pick your stadium, set your budget and preferences ΓÇö full control in your hands.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {['Match Details', 'Stadium', 'Budget', 'Dates'].map(tag => (
                          <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 group-hover:text-emerald-500 transition-colors">
                        <span>Get started</span>
                        <span className="group-hover:translate-x-1 transition-transform duration-200">ΓåÆ</span>
                      </div>
                    </div>
                  </button>

                  {/* Right: Let AI Plan */}
                  <button
                    onClick={() => setPlanningMode('ai')}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-left hover:border-violet-500/60 hover:bg-violet-500/[0.04] transition-all duration-300 cursor-pointer"
                    style={{ backdropFilter: 'blur(12px)' }}
                  >
                    {/* AI glow */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.10) 0%, transparent 70%)' }} />

                    {/* AI badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-violet-500/15 border border-violet-500/30 rounded-full px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-[9px] font-extrabold text-violet-400 uppercase tracking-widest">AI</span>
                    </div>

                    <div className="relative space-y-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-violet-500/10 border border-zinc-700 group-hover:border-violet-500/40 flex items-center justify-center text-2xl transition-all duration-300">
                        Γ£¿
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="font-extrabold text-white text-sm group-hover:text-violet-400 transition-colors">Let AI Plan It</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Just describe your trip in plain English. AI picks the best match, hotels, and routes for you automatically.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {['Smart Search', 'Auto Hotels', 'Best Routes', 'One Prompt'].map(tag => (
                          <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 group-hover:border-violet-500/30 group-hover:text-violet-400 transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 group-hover:text-violet-400 transition-colors">
                        <span>Try AI planning</span>
                        <span className="group-hover:translate-x-1 transition-transform duration-200">ΓåÆ</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ΓöÇΓöÇ Custom Planning Form ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
            {planningMode === 'custom' && (
              <div className="space-y-5">
                {/* Back to mode select */}
                <div className="flex items-center gap-3 pb-1">
                  <button
                    onClick={() => setPlanningMode(null)}
                    className="text-xs font-bold text-zinc-500 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    ΓåÉ Change mode
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm">≡ƒÄ»</span>
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Plan Yourself</span>
                  </div>
                </div>

                {/* Future & Upcoming Scheduled Matches Dropdown Menu */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span>≡ƒôà Select From Upcoming / Future Match Schedule</span>
                    <span className="text-[10px] font-mono text-zinc-500">Live API Schedule</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const [name, date, venue] = val.split("|");
                      setJourneyMatchName(name || "");
                      if (date && date !== "TBD") {
                        try {
                          const d = new Date(date);
                          if (!isNaN(d.getTime())) {
                            setJourneyMatchDate(d.toISOString().split("T")[0]);
                          }
                        } catch(err) {}
                      }
                      if (venue && venue !== "TBD") {
                        setJourneyStadium(venue);
                        setStadiumSearchQuery(venue);
                      }
                    }}
                    className="w-full bg-zinc-900 border border-emerald-500/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none transition-all cursor-pointer shadow-lg hover:border-emerald-500/80"
                  >
                    <option value="">-- Choose an upcoming fixture (autofills details) --</option>
                    <option value="Man City vs Barcelona|2026-06-15|Santiago Bernab├⌐u">ΓÜ╜ Man City vs Barcelona (15 June 2026 - Santiago Bernab├⌐u)</option>
                    <option value="Man City vs Bayern Munich|2026-06-18|Allianz Arena">ΓÜ╜ Man City vs Bayern Munich (18 June 2026 - Allianz Arena)</option>
                    <option value="Man City vs PSG|2026-06-22|Parc des Princes">ΓÜ╜ Man City vs PSG (22 June 2026 - Parc des Princes)</option>
                    <option value="Arsenal vs Barcelona|2026-06-25|Emirates Stadium">ΓÜ╜ Arsenal vs Barcelona (25 June 2026 - Emirates Stadium)</option>
                    <option value="Real Madrid vs PSG|2026-06-28|Santiago Bernab├⌐u">ΓÜ╜ Real Madrid vs PSG (28 June 2026 - Santiago Bernab├⌐u)</option>
                    <option value="Liverpool vs Man City|2026-07-05|Anfield">ΓÜ╜ Liverpool vs Man City (05 July 2026 - Anfield)</option>
                    <option value="Chelsea vs Arsenal|2026-07-10|Stamford Bridge">ΓÜ╜ Chelsea vs Arsenal (10 July 2026 - Stamford Bridge)</option>
                    {followedMatches && followedMatches.filter((m: any) => m.status !== "FT").map((m: any, idx: any) => (
                      <option key={idx} value={`${m.homeTeam} vs ${m.awayTeam}|${m.eventDate?.split("T")[0] || ""}|${m.venue || ""}`}>
                        ΓÜ╜ {m.homeTeam} vs {m.awayTeam} ({m.eventDate?.split("T")[0] || "Upcoming"} - {m.venue || "Venue TBD"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick-select Row */}
                {((followedMatches && followedMatches.some((m: any) => m.status !== "FT")) || (tickets && tickets.length > 0)) && (
                  <div className="space-y-3">
                    <div className="section-label">Quick Select Match</div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {tickets.map((ticket: any) => (
                        <button
                          key={ticket.booking_id}
                          onClick={() => handleTicketQuickSelect(ticket)}
                          className="flex-shrink-0 w-64 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06] hover:border-emerald-500/40 text-left transition-all cursor-pointer"
                        >
                          <div className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-extrabold mb-1">≡ƒÄ½ Booked Ticket</div>
                          <div className="text-xs font-bold text-white truncate">{ticket.home_team} vs {ticket.away_team}</div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">{ticket.venue}</div>
                          {ticket.match_date && <div className="text-[10px] text-zinc-500 font-mono mt-1">{ticket.match_date.split("T")[0]}</div>}
                        </button>
                      ))}
                      {followedMatches.filter((m: any) => m.status !== "FT").map((match: any) => (
                        <button
                          key={match.id}
                          onClick={() => handleQuickSelect(match)}
                          className="flex-shrink-0 w-64 p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-zinc-700 text-left transition-all cursor-pointer"
                        >
                          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold mb-1">ΓÜ╜ Followed Team</div>
                          <div className="text-xs font-bold text-white truncate">{match.homeTeam} vs {match.awayTeam}</div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">{match.venue}</div>
                          {match.eventDate && <div className="text-[10px] text-zinc-500 font-mono mt-1">{match.eventDate.split("T")[0]}</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Inputs */}
                <div className="space-y-4">
                  <div className="section-label">Custom Match Details</div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Opponents / Match Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Liverpool vs Chelsea"
                        value={journeyMatchName}
                        onChange={e => setJourneyMatchName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Match Date</label>
                      <input
                        type="date"
                        value={journeyMatchDate}
                        onChange={e => setJourneyMatchDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 relative" ref={stadiumRef}>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Stadium / Match Venue</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search or type stadium name (e.g. Anfield, Stamford Bridge...)"
                        value={stadiumSearchQuery}
                        onChange={e => {
                          setStadiumSearchQuery(e.target.value);
                          setJourneyStadium(e.target.value);
                          setShowStadiumDropdown(true);
                        }}
                        onFocus={() => setShowStadiumDropdown(true)}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                      />
                      {isSearchingStadiums && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
                        </div>
                      )}
                    </div>

                    {showStadiumDropdown && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl divide-y divide-zinc-900 scrollbar-thin">
                        {filteredPopularStadiums.length > 0 && (
                          <div className="p-2">
                            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-1">Popular Stadiums</div>
                            {filteredPopularStadiums.map(name => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => {
                                  setJourneyStadium(name);
                                  setStadiumSearchQuery(name);
                                  setShowStadiumDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-white hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                              >
                                ≡ƒÅƒ∩╕Å {name}
                              </button>
                            ))}
                          </div>
                        )}

                        {stadiumSuggestions.length > 0 && (
                          <div className="p-2">
                            <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider px-2 py-1">Search Results</div>
                            {stadiumSuggestions.map((sug: any) => {
                              const displayName = sug.name || sug.display_name.split(",")[0];
                              return (
                                <button
                                  key={sug.place_id || sug.osm_id}
                                  type="button"
                                  onClick={() => {
                                    setJourneyStadium(displayName);
                                    setStadiumSearchQuery(displayName);
                                    setShowStadiumDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                                >
                                  <div className="text-xs font-semibold text-white truncate">≡ƒÅƒ∩╕Å {displayName}</div>
                                  <div className="text-[9px] text-zinc-500 truncate mt-0.5">{sug.display_name}</div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {filteredPopularStadiums.length === 0 && stadiumSuggestions.length === 0 && !isSearchingStadiums && (
                          <div className="p-4 text-center text-xs text-zinc-500">
                            No stadiums found matching &ldquo;{stadiumSearchQuery}&rdquo;
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-500 font-mono">
                      *OSM Nominatim API will geocode this stadium coordinates to find nearby accommodations.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setJourneyStep(2)}
                    disabled={!journeyStadium.trim()}
                    className="book-ticket-btn"
                  >
                    Proceed to Stay Filters ΓåÆ
                  </button>
                </div>
              </div>
            )}

            {/* ΓöÇΓöÇ AI Planning Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
            {planningMode === 'ai' && (
              <div className="space-y-5">
                {/* Back to mode select */}
                <div className="flex items-center gap-3 pb-1">
                  <button
                    onClick={() => setPlanningMode(null)}
                    className="text-xs font-bold text-zinc-500 hover:text-violet-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    ΓåÉ Change mode
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">AI Planning</span>
                  </div>
                </div>

                {/* AI Input Area */}
                <div className="relative rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] overflow-hidden"
                  style={{ backdropFilter: 'blur(12px)' }}>
                  {/* Animated top border glow */}
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)' }} />

                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
                        Γ£¿
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-violet-300 uppercase tracking-wider mb-0.5">AI Journey Planner</p>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Describe your trip and I'll find the best match, hotels, and routes for you automatically.
                        </p>
                      </div>
                    </div>

                    {/* Future & Upcoming Scheduled Matches Dropdown for AI Prompt */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center justify-between">
                        <span>≡ƒôà Select Future Match (Auto-formats e.g. Prompt)</span>
                        <span className="text-[10px] font-mono text-violet-400">Prompt Generator</span>
                      </label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const [name, date, venue] = val.split("|");
                          setAiPrompt(`Plan a complete trip for ${name} at ${venue} on ${date || "upcoming weekend"}, budget $150/night, prefer a comfortable hotel near the stadium with fast transit.`);
                        }}
                        className="w-full bg-zinc-900/90 border border-violet-500/40 focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none transition-all cursor-pointer shadow-lg hover:border-violet-500/80"
                      >
                        <option value="">-- Pick future match to generate formatted e.g. prompt --</option>
                        <option value="Man City vs Barcelona|15 June 2026|Santiago Bernab├⌐u">ΓÜ╜ Man City vs Barcelona (15 June 2026 - Santiago Bernab├⌐u)</option>
                        <option value="Man City vs Bayern Munich|18 June 2026|Allianz Arena">ΓÜ╜ Man City vs Bayern Munich (18 June 2026 - Allianz Arena)</option>
                        <option value="Man City vs PSG|22 June 2026|Parc des Princes">ΓÜ╜ Man City vs PSG (22 June 2026 - Parc des Princes)</option>
                        <option value="Arsenal vs Barcelona|25 June 2026|Emirates Stadium">ΓÜ╜ Arsenal vs Barcelona (25 June 2026 - Emirates Stadium)</option>
                        <option value="Real Madrid vs PSG|28 June 2026|Santiago Bernab├⌐u">ΓÜ╜ Real Madrid vs PSG (28 June 2026 - Santiago Bernab├⌐u)</option>
                        <option value="Liverpool vs Man City|05 July 2026|Anfield">ΓÜ╜ Liverpool vs Man City (05 July 2026 - Anfield)</option>
                        {followedMatches && followedMatches.filter((m: any) => m.status !== "FT").map((m: any, idx: any) => (
                          <option key={idx} value={`${m.homeTeam} vs ${m.awayTeam}|${m.eventDate?.split("T")[0] || "Upcoming"}|${m.venue || "Stadium"}`}>
                            ΓÜ╜ {m.homeTeam} vs {m.awayTeam} ({m.eventDate?.split("T")[0] || "Upcoming"})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Prompt textarea */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Describe your trip</label>
                      <textarea
                        rows={4}
                        placeholder={"e.g. \"I want to watch a Premier League match next weekend in London, budget ┬ú150/night, near the stadium, prefer a hotel\""}
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-violet-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* Quick prompt suggestions */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Quick prompts</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Champions League match in Madrid, 2 nights, ┬ú200 budget",
                          "Premier League this weekend, London, near stadium",
                          "La Liga match in Barcelona, hostel under Γé¼80/night",
                        ].map(suggestion => (
                          <button
                            key={suggestion}
                            onClick={() => setAiPrompt(suggestion)}
                            className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-violet-500/50 hover:text-violet-300 hover:bg-violet-500/[0.06] transition-all cursor-pointer"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom animated border glow */}
                  <div className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)' }} />
                </div>

                {/* What AI will do */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: 'ΓÜ╜', label: 'Find Match', desc: 'Best upcoming match for your query' },
                    { icon: '≡ƒÅ¿', label: 'Book Hotel', desc: 'Top-rated stays near the stadium' },
                    { icon: '≡ƒù║∩╕Å', label: 'Plan Route', desc: 'Fastest route from your location' },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-center space-y-1">
                      <div className="text-lg">{item.icon}</div>
                      <div className="text-[10px] font-extrabold text-zinc-300 uppercase tracking-wider">{item.label}</div>
                      <div className="text-[9px] text-zinc-600 leading-tight">{item.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <button
                    disabled={!aiPrompt.trim()}
                    className="book-ticket-btn"
                    style={aiPrompt.trim() ? { background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', borderColor: 'rgba(139,92,246,0.5)' } : {}}
                    onClick={handleAIPlan}
                  >
                    Γ£¿ Let AI Plan My Journey ΓåÆ
                  </button>
                </div>
              </div>
            )}

          </div>
        )}


        {/* Step 2: Budget & Stays Preferences */}
        {journeyStep === 2 && (
          <div className="space-y-6 py-2">
            <div className="section-label">Configure Stay Parameters for {journeyStadium}</div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Max Price per Night: <span className="text-emerald-500 font-extrabold">${journeyMaxPrice}</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="250"
                  step="5"
                  value={journeyMaxPrice}
                  onChange={e => setJourneyMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>$20</span>
                  <span>$120</span>
                  <span>$250</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Lodging Type</label>
                <select
                  value={journeyAccommodationType}
                  onChange={e => setJourneyAccommodationType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                >
                  <option value="all">All Stay Types</option>
                  <option value="hotel">Hotels Only</option>
                  <option value="hostel">Hostels Only</option>
                  <option value="airbnb">Airbnbs Only</option>
                  <option value="shared_room">Shared Rooms Only</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Check-in Date</label>
                <input
                  type="date"
                  value={journeyCheckIn || journeyMatchDate}
                  onChange={e => setJourneyCheckIn(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Check-out Date</label>
                <input
                  type="date"
                  value={journeyCheckOut}
                  placeholder={journeyMatchDate ? "Day after match" : ""}
                  onChange={e => setJourneyCheckOut(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>
            </div>

            {/* Show More / Advanced Filters Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowMoreFilters((prev: any) => !prev)}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors outline-none"
              >
                {showMoreFilters ? "Γ₧û Hide Advanced Filters" : "Γ₧ò Show More Options"}
              </button>
            </div>

            {showMoreFilters && (
              <div className="space-y-6 pt-3 border-t border-zinc-800/40 animate-fade-in">
                {/* Max Distance Slider */}
                <div className="space-y-3">
                  <label className="block text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                    How much distance is ok from stadium?
                  </label>
                  <div className="flex items-center gap-4 bg-zinc-950/40 p-4 border border-zinc-850 rounded-2xl">
                    <div className="flex-1 space-y-2">
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={journeyMaxDistance}
                        onChange={e => setJourneyMaxDistance(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>0.5 mi</span>
                        <span>5 mi</span>
                        <span>10 mi</span>
                      </div>
                    </div>
                    <div className="text-center bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 shrink-0 min-w-[80px]">
                      <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">Max Dist</div>
                      <div className="text-sm font-black text-emerald-400">{journeyMaxDistance} mi</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { label: "Walking (< 1.5 mi)", val: 1.5 },
                      { label: "Short Drive (< 3.0 mi)", val: 3.0 },
                      { label: "Transit (< 5.0 mi)", val: 5.0 },
                      { label: "Any (< 10.0 mi)", val: 10.0 }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setJourneyMaxDistance(preset.val)}
                        className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold cursor-pointer transition-all ${
                          journeyMaxDistance === preset.val
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Required Amenities checklist */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Required Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {["WiFi", "Kitchen", "AC", "Gym", "Bar", "Free Breakfast", "Pool"].map(amenity => {
                      const isSelected = journeyAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                            isSelected
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {journeyError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg font-mono">
                ΓÜá∩╕Å {journeyError}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-zinc-800">
              <button
                onClick={() => setJourneyStep(1)}
                className="text-sm font-bold text-zinc-500 hover:text-emerald-500 cursor-pointer"
              >
                ΓåÉ Back
              </button>
              <button
                onClick={handleFetchStays}
                disabled={journeyLoading}
                className="book-ticket-btn"
              >
                {journeyLoading ? "Aggregating Stays..." : "Search Stays ≡ƒöì"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Stays Comparison grid */}
        {journeyStep === 3 && (() => {
          const getStayImage = (type: string, name: string, idx: number) => {
            const hotelImages = [
              "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"
            ];
            const apartmentImages = [
              "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80"
            ];
            const hostelImages = [
              "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1563830227348-2b7aa363c06d?auto=format&fit=crop&w=600&q=80"
            ];

            const t = type.toLowerCase();
            const n = name.toLowerCase();

            if (n.includes("peninsula")) return "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=600&q=80";
            if (n.includes("hilton")) return "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80";
            if (n.includes("hyatt") || n.includes("regency")) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";

            if (t === "hostel") return hostelImages[idx % hostelImages.length];
            if (t === "airbnb" || t === "shared_room" || t === "vacation_home") return apartmentImages[idx % apartmentImages.length];
            return hotelImages[idx % hotelImages.length];
          };

          const renderStars = () => {
            return (
              <div className="flex items-center gap-0.5 text-orange-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                  </svg>
                ))}
              </div>
            );
          };

          const getReviewBadgeText = (rating: number) => {
            if (rating >= 4.7) return "Wonderful";
            if (rating >= 4.3) return "Very Good";
            if (rating >= 3.8) return "Good";
            return "Decent";
          };

          const getReviewCount = (name: string, rating: number) => {
            const nameSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return (nameSum % 1800) + 42;
          };

          const getNightsCount = () => {
            if (!journeyCheckIn || !journeyCheckOut) return 1;
            try {
              const d1 = new Date(journeyCheckIn);
              const d2 = new Date(journeyCheckOut);
              const diffTime = Math.abs(d2.getTime() - d1.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays || 1;
            } catch {
              return 1;
            }
          };

          const nights = getNightsCount();

          return (
            <div className="space-y-6 py-2">
              {/* Mockup Hotel Deals Hero Banner */}
              <div className="relative rounded-2xl overflow-hidden min-h-[220px] flex flex-col justify-end p-6 border border-zinc-700/30 shadow-2xl bg-zinc-950">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40 select-none pointer-events-none"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1200&q=80')"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent pointer-events-none" />

                <div className="relative z-10 space-y-1 text-left">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                    Incredible hotel deals
                  </h3>
                  <p className="text-[11px] md:text-xs text-zinc-300 font-medium">
                    Discover hotels, vacation homes and more
                  </p>
                </div>

                {/* Search HUD Box Overlay */}
                <div className="relative z-10 mt-5 grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 bg-zinc-950/80 backdrop-blur-md border border-zinc-850 rounded-xl p-2.5 max-w-3xl text-left gap-1.5 sm:gap-0">
                  <div className="flex flex-col gap-0.5 px-3">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">Where</span>
                    <span className="text-xs font-bold text-white truncate" title={journeyStadium}>{journeyStadium || "Enter a destination"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 px-3">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">Dates</span>
                    <span className="text-xs font-bold text-white truncate">
                      {formatShortDateRange(journeyCheckIn || journeyMatchDate, journeyCheckOut)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 px-3">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">Guests</span>
                    <span className="text-xs font-bold text-white">1 room, 2 Guests</span>
                  </div>
                  <div className="flex items-center justify-end px-3 pt-1.5 sm:pt-0">
                    <button
                      onClick={() => setJourneyStep(2)}
                      className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Modify search parameters"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recommended Stays heading */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-emerald-500 font-mono">
                    Recommended hotels
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="p-1 rounded-full border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                      title="Previous"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded-full border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                      title="Next"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                </div>

                {journeyStays.length === 0 ? (
                  <div className="p-10 border border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
                    <p className="text-sm font-bold text-zinc-400">No matching hotels found near the stadium.</p>
                    <p className="text-xs text-zinc-600">Try raising your budget limit or removing distance/amenity filters.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {journeyStays.map((s: any, idx: any) => {
                      const isSelected = journeySelectedStay?.name === s.name;
                      const reviewStatus = getReviewBadgeText(s.rating);
                      const reviewCount = getReviewCount(s.name, s.rating);
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col rounded-2xl border bg-zinc-950/20 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-xl ${
                            isSelected ? "border-emerald-500/80 shadow-emerald-500/5 bg-emerald-500/[0.01]" : "border-zinc-800/80"
                          }`}
                        >
                          {/* Image area */}
                          <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
                            {s.image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={s.image_url}
                                alt={s.name}
                                className="w-full h-full object-cover select-none pointer-events-none"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-950/80 px-4 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                                Image unavailable from provider
                              </div>
                            )}
                            {/* Provider Badge */}
                            <span className={`absolute top-3 right-3 text-[9px] font-mono font-black px-2 py-0.5 rounded shadow-md uppercase tracking-wider ${
                              s.provider?.includes("Best Price")
                                ? "bg-emerald-500 text-zinc-950 font-black"
                                : s.provider?.includes("Airbnb")
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}>
                              {s.provider}
                            </span>
                          </div>

                          {/* Card Details */}
                          <div className="p-4 flex-1 flex flex-col gap-3 justify-between text-left">
                            <div className="space-y-2">
                              {/* Stars rating row */}
                              <div className="flex items-center justify-between">
                                {renderStars()}
                                <span className="text-[9px] font-bold uppercase bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-400 tracking-wider font-mono">
                                  {s.type.replace("_", " ")}
                                </span>
                              </div>

                              {/* Name */}
                              <h5 className="font-bold text-white text-sm leading-snug line-clamp-2" title={s.name}>
                                {s.name}
                              </h5>

                              {/* Distance & Location Pin */}
                              <div className="flex items-start gap-1.5 text-xs text-zinc-400">
                                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                </svg>
                                <span className="text-[11px] leading-tight">
                                  {s.type === "hotel" ? "London Hotel District" : "Nearby Residential Area"} ({s.distance_miles} miles to {journeyStadium})
                                </span>
                              </div>

                              {/* Amenities preview */}
                              <div className="text-[10px] text-zinc-500 truncate mt-1">
                                {s.amenities.join(" ┬╖ ")}
                              </div>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-zinc-850">
                              {/* Rating badge & Price row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-emerald-500 text-zinc-950 font-black px-1.5 py-0.5 rounded text-[11px] font-mono leading-none">
                                    {s.rating >= 4.5 ? s.rating.toFixed(1) : (s.rating + 4.0).toFixed(1)}
                                  </span>
                                  <div className="flex flex-col text-left">
                                    <span className="text-[10px] font-extrabold text-zinc-300 leading-none">{reviewStatus}</span>
                                    <span className="text-[8px] text-zinc-550 font-mono leading-none mt-0.5">{reviewCount} reviews</span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-white font-black text-base">${s.price_usd}</div>
                                  <div className="text-[9px] text-zinc-500">1 room x {nights} night{nights > 1 ? "s" : ""} incl. taxes</div>
                                </div>
                              </div>

                              {/* Select Button */}
                              <button
                                onClick={() => {
                                  setJourneySelectedStay(s);
                                }}
                                className={`w-full py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all shadow-md active:scale-98 ${
                                  isSelected
                                    ? "bg-emerald-500 text-zinc-950 font-black shadow-emerald-500/20"
                                    : "bg-zinc-900 border border-zinc-850 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400"
                                }`}
                              >
                                {isSelected ? "Γ£ô Selected" : "Select Stay"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3 Footer Navigation Buttons */}
              <div className="flex justify-between pt-5 border-t border-zinc-850 mt-4">
                <button
                  onClick={() => setJourneyStep(2)}
                  className="text-sm font-bold text-zinc-500 hover:text-emerald-500 cursor-pointer transition-colors"
                >
                  ΓåÉ Back to stay filters
                </button>
                <button
                  onClick={() => setJourneyStep(4)}
                  className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-xs font-bold rounded-lg text-zinc-300 cursor-pointer transition-colors"
                >
                  Configure Route Directions ΓåÆ
                </button>
              </div>
            </div>
          );
        })()}

        {/* Step 4: Route Directions Form & Output */}
        {journeyStep === 4 && (() => {
          const stayPrice = journeySelectedStay ? parseFloat(journeySelectedStay.price_usd) || 0 : 0;
          const transitPrice = journeyRoutes && journeyRoutes[selectedRouteIdx] ? parseFloat(journeyRoutes[selectedRouteIdx].cost_usd) || 0 : 0;
          const ticketPrice = 50.0;
          const grandTotal = stayPrice + transitPrice + ticketPrice;

          return (
            <div className="space-y-6 py-2">
              <div className="section-label">Step 4: Route directions to {journeyStadium}</div>

              {journeySelectedStay && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.01] flex justify-between items-center text-xs">
                  <div>
                    <span className="text-zinc-500">Selected Lodging: </span>
                    <span className="font-extrabold text-emerald-400">{journeySelectedStay.name}</span>
                  </div>
                  <div className="font-mono text-zinc-400">
                    ${journeySelectedStay.price_usd} / night
                  </div>
                </div>
              )}

              {/* Inputs */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Starting Location (Origin)</label>
                  <input
                    type="text"
                    placeholder="e.g. London, UK or hotel name"
                    value={journeyOrigin}
                    onChange={e => setJourneyOrigin(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Travel Mode</label>
                  <select
                    value={journeyRouteMode}
                    onChange={e => setJourneyRouteMode(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                  >
                    <option value="transit">Metro / Transit</option>
                    <option value="walking">Walking</option>
                    <option value="cab">Taxi / Driving</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleFetchRoutes}
                  disabled={journeyRouteLoading || !journeyOrigin.trim()}
                  className="book-ticket-btn"
                >
                  {journeyRouteLoading ? "Calculating..." : "Calculate Route ≡ƒöì"}
                </button>
              </div>

              {/* Route Output */}
              {journeyRouteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg font-mono">
                  ΓÜá∩╕Å {journeyRouteError}
                </div>
              )}

              {journeyRoutes && journeyRoutes.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Preferred Travel Option:</div>

                  {/* Tabbed Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {journeyRoutes.map((route: any, rIdx: any) => {
                      const isRouteSelected = selectedRouteIdx === rIdx;
                      return (
                        <button
                          key={rIdx}
                          onClick={() => {
                            setSelectedRouteIdx(rIdx);
                            setJourneySelectedRoute(route);
                          }}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all duration-350 hover:scale-[1.01] cursor-pointer ${
                            isRouteSelected
                              ? "border-emerald-500 bg-emerald-500/[0.03] shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                              : "border-zinc-800 bg-zinc-900/20 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${
                              isRouteSelected ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                            }`}>
                              {route.mode}
                            </span>
                            <span className="text-xs font-bold text-white">${route.cost_usd}</span>
                          </div>
                          <div className="text-xs text-zinc-400 font-mono">
                            Duration: <strong className="text-zinc-200">{route.duration_minutes} mins</strong>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Route Steps Details */}
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-3">
                    <div className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                      Detailed Transfer Advisory ({journeyRoutes[selectedRouteIdx]?.mode || "Selected Option"}):
                    </div>
                    <div className="text-xs text-zinc-300 leading-relaxed font-mono pl-3 border-l border-emerald-500/30 text-left">
                      {journeyRoutes[selectedRouteIdx]?.steps}
                    </div>
                  </div>

                  {/* Dynamic Fare Breakdown Card */}
                  <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                    <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider text-left">Estimated Fare Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                      <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-850">
                        <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest font-extrabold">Lodging</span>
                        <p className="text-sm font-black text-white mt-1">${stayPrice.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-850">
                        <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest font-extrabold">Transit</span>
                        <p className="text-sm font-black text-white mt-1">${transitPrice.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-850">
                        <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest font-extrabold">Match Ticket</span>
                        <p className="text-sm font-black text-white mt-1">${ticketPrice.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-950/50 border border-emerald-500/20 bg-emerald-500/[0.01]">
                        <span className="text-[9px] font-mono text-emerald-500/70 uppercase tracking-widest font-extrabold">Grand Total</span>
                        <p className="text-sm font-black text-emerald-400 mt-1">${grandTotal.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-550 pt-2 border-t border-zinc-850">
                      <span>Target Budget Limit: ${journeyMaxPrice.toFixed(2)}</span>
                      <span className={grandTotal <= journeyMaxPrice ? "text-emerald-400 font-extrabold" : "text-red-400 font-extrabold"}>
                        {grandTotal <= journeyMaxPrice ? "Γ£ô WITHIN BUDGET" : "ΓÜá∩╕Å BUDGET COMPROMISED"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Map Placeholder Notice */}
              <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-zinc-500">
                <div className="text-emerald-500 font-extrabold text-lg mt-0.5">≡ƒù║∩╕Å</div>
                <div className="text-left">
                  <strong className="text-zinc-400 block mb-1">Route Map and GPS Navigation Status</strong>
                  Turn-by-turn map navigation, live transit trackers, and interactive stadium gate maps are currently placeholders and will be connected in a future release.
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setJourneyStep(3)}
                  className="text-sm font-bold text-zinc-500 hover:text-emerald-500 cursor-pointer"
                >
                  ΓåÉ Back to Stays
                </button>
                <button
                  onClick={() => setJourneyStep(5)}
                  className="book-ticket-btn"
                >
                  Explore & Safety Advisory ΓåÆ
                </button>
              </div>
            </div>
          );
        })()}

        {/* Step 5: Explore & Safety */}
        {journeyStep === 5 && (() => {
          const homeBaseStr = userProfile?.home_address || journeyOrigin || "London, UK";
          const venueStr = journeyStadium || "Emirates Stadium";
          
          const defaultMultiModalRoutes = [
            {
              mode: "≡ƒÜà High-Speed Intercity Train",
              badge: "Γÿà RECOMMENDED / BEST BALANCED",
              cost_usd: 65.00,
              duration_minutes: 150,
              best_for: `Why it's best from ${homeBaseStr}: Perfect balance of comfort, speed, and zero airport security hassles. Arrives directly at central station near ${venueStr} with scenic views and onboard Wi-Fi.`,
              connects_to: journeySelectedStay?.name || "City Central Hub",
              steps: `Direct high-speed rail from ${homeBaseStr} to central terminal, then 10-min fan shuttle to ${venueStr}.`,
              legs: [
                { label: "Leg 1 (Rail)", detail: `Board High-Speed Express from ${homeBaseStr} Station (2h 15m onboard)` },
                { label: "Leg 2 (Transfer)", detail: `Arrive at Central Station, take designated Supporter Express Shuttle (~15m)` },
                { label: "Leg 3 (Arrival)", detail: `Drop off at VIP Gate 4, ${venueStr} precinct` }
              ]
            },
            {
              mode: "Γ£ê∩╕Å Flight + Express Airport Rail",
              badge: "ΓÜí FASTEST LONG DISTANCE",
              cost_usd: 185.00,
              duration_minutes: 195,
              best_for: `Why it's best from ${homeBaseStr}: Essential for journeys over 300+ miles or international away trips. Skips highway congestion and includes fast airport-to-stadium express train.`,
              connects_to: journeySelectedStay?.name || "Airport Hotel",
              steps: `Flight from regional airport near ${homeBaseStr} to destination hub, followed by Express Airport Metro directly to ${venueStr}.`,
              legs: [
                { label: "Leg 1 (Flight)", detail: `Direct commercial flight from nearest airport to ${homeBaseStr} (1h 20m airtime + check-in/security)` },
                { label: "Leg 2 (Airport Rail)", detail: `Board Express Airport Rail directly to stadium corridor (~25m)` },
                { label: "Leg 3 (Walk)", detail: `Short 5-min walk along supporter walkway to ${venueStr}` }
              ]
            },
            {
              mode: "≡ƒÜç Local Subway / Metro Transit",
              badge: "≡ƒÆ░ CHEAPEST / FAN FAVORITE",
              cost_usd: 2.50,
              duration_minutes: 25,
              best_for: `Why it's best from ${homeBaseStr}: Cheapest & most atmospheric option inside the city. Join thousands of chanting supporters on the direct subway line straight to stadium turnstiles.`,
              connects_to: journeySelectedStay?.name || "Metro Station Hotel",
              steps: `Direct subway ride from ${homeBaseStr} precinct to stadium metro stop.`,
              legs: [
                { label: "Leg 1 (Subway)", detail: `Board Red/Green Line subway towards ${venueStr} (~18m)` },
                { label: "Leg 2 (Walk)", detail: `Exit station and walk along pedestrian fan corridor (~7m)` }
              ]
            },
            {
              mode: "≡ƒÜù Road Trip & VIP Stadium Parking",
              badge: "≡ƒæÑ BEST FOR GROUPS & TAILGATING",
              cost_usd: 35.00,
              duration_minutes: 110,
              best_for: `Why it's best from ${homeBaseStr}: Most cost-effective when splitting gas/parking among 3-4 supporters. Allows carrying flags, coolers, and tailgating gear directly to reserved stadium lot.`,
              connects_to: journeySelectedStay?.name || "Stadium Parking Lot",
              steps: `Highway drive from ${homeBaseStr} to reserved VIP North Parking Lot at ${venueStr}.`,
              legs: [
                { label: "Leg 1 (Highway)", detail: `Drive from ${homeBaseStr} via Main Intercity Expressway (~1h 35m depending on traffic)` },
                { label: "Leg 2 (Parking)", detail: `Enter VIP Gate B and park at reserved Supporter Tailgate Lot (~10m)` }
              ]
            },
            {
              mode: "≡ƒÜò Express Door-to-Door Rideshare",
              badge: "≡ƒÜ¬ HASSLE-FREE DOOR-TO-DOOR",
              cost_usd: 28.00,
              duration_minutes: 35,
              best_for: `Why it's best from ${homeBaseStr}: Ultimate convenience with direct pickup from your front door at ${homeBaseStr} and private dropoff at stadium VIP entrance without navigating transit crowds.`,
              connects_to: journeySelectedStay?.name || "Private VIP Dropoff",
              steps: `Direct private Uber/Lyft/Taxi ride from ${homeBaseStr} to ${venueStr} VIP entrance.`,
              legs: [
                { label: "Leg 1 (Pickup)", detail: `Private driver pickup at ${homeBaseStr} address` },
                { label: "Leg 2 (Express Route)", detail: `Direct ride via HOV/Express corridor to stadium precinct (~35m)` }
              ]
            }
          ];

          const routeOptions = (journeyRoutes && journeyRoutes.length > 1) ? journeyRoutes : defaultMultiModalRoutes;
          const activeRoute = journeySelectedRoute || routeOptions[selectedRouteIdx] || routeOptions[0];
          const stayPrice = journeySelectedStay ? parseFloat(journeySelectedStay.price_usd) || 0 : 0;
          const transitPrice = activeRoute ? parseFloat(activeRoute.cost_usd) || 0 : 0;
          const ticketPrice = 50.0;
          const grandTotal = stayPrice + transitPrice + ticketPrice;
          const recs = journeyRecommendations || {};
          const activePlaces = recs[activePlacesTab] || [];
          const safety = journeySafetyBriefing || {
            level: "Low Risk",
            score: 8.8,
            summary: `Standard precautions are recommended in the destination area. Security measures are active.`,
            emergencyNumbers: { Emergency: "112", "Non-Emergency": "101" },
            tips: [
              "Keep personal items secure in crowded stadium walkways.",
              "Stick to designated fan corridors and well-lit roads.",
              "Use official transportation or ride-sharing networks."
            ]
          };
          const stayOptions = journeyStays.length ? journeyStays : (journeySelectedStay ? [journeySelectedStay] : []);
          const rebaseRouteToStay = (route: any, stay: any) => {
            if (!route || !stay?.name) return route;
            const previousStayName = route.connects_to || journeySelectedStay?.name || "";
            const swapStayName = (value: string) => previousStayName ? value.split(previousStayName).join(stay.name) : value;
            return {
              ...route,
              connects_to: stay.name,
              steps: typeof route.steps === "string" ? swapStayName(route.steps) : route.steps,
              legs: Array.isArray(route.legs)
                ? route.legs.map((leg: any) => ({
                    ...leg,
                    detail: typeof leg.detail === "string" ? swapStayName(leg.detail) : leg.detail,
                  }))
                : route.legs,
            };
          };

          const stayPhotos = [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80"
          ];

          const dinePhotos = ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&auto=format&fit=crop&q=80"];
          const storePhotos = ["https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=500&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=500&auto=format&fit=crop&q=80"];
          const sightPhotos = ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1477959858617-67f30bc4b7a8?w=500&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=80"];

          return (
            <div className="space-y-6 py-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>Γ£¿ Step 5: AI Journey Itinerary & Dispatch</span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">100% Ready</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Select a tab below to inspect each section of your customized travel briefing.</p>
                </div>

                {/* Section Nav Bar */}
                <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-850 shadow-xl">
                  {[
                    { id: "match", label: "ΓÜ╜ 1. Match & Venue >" },
                    { id: "stay", label: "≡ƒÅ¿ 2. Stays & Hostels >" },
                    { id: "route", label: "≡ƒù║∩╕Å 3. Home Base Route >" },
                    { id: "nearby", label: "≡ƒô╕ 4. Explore Nearby >" },
                    { id: "safety", label: "≡ƒ¢í∩╕Å 5. Safety Dispatch >" },
                    { id: "all", label: "≡ƒîÉ View All" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveStep5Section(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeStep5Section === tab.id
                          ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 scale-105"
                          : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800/80"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {journeyDataWarnings.length > 0 && (
                <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.04] p-4 text-left">
                  <h4 className="text-xs font-black uppercase tracking-wider text-yellow-300">Provider data warning</h4>
                  <div className="mt-2 grid gap-2">
                    {journeyDataWarnings.map((warning: any, wIdx: any) => (
                      <p key={wIdx} className="text-xs leading-relaxed text-yellow-100/80">{warning}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 1: MATCH & VENUE */}
              {(activeStep5Section === "match" || activeStep5Section === "all") && (
                <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4 animate-fade-in text-left">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">ΓÜ╜</span>
                      <div>
                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-extrabold">Section 1: Event Specification</span>
                        <h4 className="text-base font-black text-white">{journeyMatchName || "Selected Match Fixture"}</h4>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open('https://www.openstreetmap.org/search?query=' + encodeURIComponent(journeyStadium || 'Emirates Stadium'), '_blank')}
                      className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>≡ƒôì Locate Stadium in Map Γåù</span>
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-850">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Match Date</span>
                      <strong className="text-sm text-emerald-400 font-mono mt-0.5 block">{journeyMatchDate || "Upcoming Fixture"}</strong>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-850">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Stadium / Match Venue</span>
                      <strong className="text-sm text-white mt-0.5 block">≡ƒÅƒ∩╕Å {journeyStadium}</strong>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-850">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Estimated Ticket Pass</span>
                      <strong className="text-sm text-white mt-0.5 block">$50.00 (Standard Entry)</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: STAYS & HOSTELS OPTIONS + PHOTOS DETAILS */}
              {(activeStep5Section === "stay" || activeStep5Section === "all") && (
                <div className="p-6 rounded-2xl border border-emerald-500/30 bg-zinc-900/50 space-y-5 animate-fade-in text-left">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">≡ƒÅ¿</span>
                      <div>
                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-extrabold">Section 2: Stays & Hostels Options</span>
                        <h4 className="text-base font-black text-white">Lodging, Hostels & Hotels with Photos</h4>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800">
                      {stayOptions.length} Accommodations Found
                    </span>
                  </div>

                  {journeySelectedStay && (
                    <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.04] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">Γ£ô Currently Active Selection</span>
                        <strong className="text-xs text-white">${parseFloat(journeySelectedStay.price_usd || 0).toFixed(2)}/night</strong>
                      </div>
                      <h5 className="text-sm font-black text-white">{journeySelectedStay.name}</h5>
                      <p className="text-xs text-zinc-400 leading-relaxed">{journeySelectedStayReason || journeySelectedStay.why || "Top-rated stay selected near stadium."}</p>
                    </div>
                  )}

                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {stayOptions.map((stay: any, sIdx: number) => {
                      const isCurrentStay = journeySelectedStay?.name === stay.name;
                      const photoUrl = stayPhotos[sIdx % stayPhotos.length];
                      return (
                        <div
                          key={`${stay.name}-${sIdx}`}
                          className={`rounded-xl border overflow-hidden flex flex-col justify-between transition-all ${
                            isCurrentStay
                              ? "border-emerald-500 bg-emerald-500/[0.06] shadow-lg shadow-emerald-500/10"
                              : "border-zinc-800 bg-zinc-950/60 hover:border-emerald-500/50"
                          }`}
                        >
                          <div>
                            <img src={photoUrl} alt={stay.name} className="w-full h-36 object-cover border-b border-zinc-800" />
                            <div className="p-4 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-xs font-black text-white line-clamp-1">{stay.name}</h5>
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold flex-shrink-0 ${isCurrentStay ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                                  {stay.type || "Hostel/Hotel"}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 line-clamp-2">{stay.amenities?.join(" ΓÇó ") || "Free WiFi ΓÇó Breakfast ΓÇó Clean Rooms ΓÇó Fan Hub"}</p>
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-850 text-[10px] font-mono text-zinc-300">
                                <div><span className="text-zinc-500 block">Rate/Night:</span> <strong className="text-emerald-400 font-bold">${Number(stay.price_usd || 0).toFixed(2)}</strong></div>
                                <div><span className="text-zinc-500 block">Distance:</span> <strong>{stay.distance_miles ?? "1.2"} mi</strong></div>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-zinc-900/80 border-t border-zinc-850">
                            <button
                              type="button"
                              onClick={() => {
                                setJourneySelectedStay(stay);
                                setJourneySelectedStayReason(stay.why || "Selected from the available hostel & hotel stay options.");
                                setJourneySelectedRoute((prev: any) => rebaseRouteToStay(prev, stay));
                              }}
                              className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                isCurrentStay
                                  ? "bg-emerald-500 text-zinc-950 shadow-md"
                                  : "bg-zinc-800 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-300"
                              }`}
                            >
                              {isCurrentStay ? "Γ£ô Active Stay" : "Choose Stay Option"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: FROM HOME BASE TO STADIUM ROUTE */}
              {(activeStep5Section === "route" || activeStep5Section === "all") && (
                <div className="p-6 rounded-2xl border border-blue-500/30 bg-zinc-900/50 space-y-6 animate-fade-in text-left shadow-xl">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">≡ƒù║∩╕Å</span>
                      <div>
                        <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest font-extrabold">Section 3: Multi-Modal Transit Comparison</span>
                        <h4 className="text-base font-black text-white">Best Route Analysis: Flight, Train, Metro, Road & Rideshare</h4>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-zinc-300 font-bold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                      {routeOptions.length} Recommended Modes
                    </span>
                  </div>

                  {/* Change Home Base Address Option */}
                  <div className="p-4 rounded-xl bg-zinc-950/90 border border-blue-500/30 space-y-2.5 shadow-inner">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 w-full">
                        <span className="text-[9px] font-mono text-blue-300 uppercase tracking-widest block font-black">≡ƒÜ⌐ Start Point (Your Home Base Address) Γ₧ö End Point ({journeyStadium})</span>
                        <input
                          type="text"
                          value={userProfile?.home_address || ""}
                          onChange={(e) => {
                            if (userProfile && setUserProfile) {
                              setUserProfile({ ...userProfile, home_address: e.target.value });
                            }
                          }}
                          placeholder="Enter your Home Base Address (e.g. 22 Baker Street, London)..."
                          className="mt-1.5 w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-lg px-3.5 py-2 text-xs font-bold text-white outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const startAddr = userProfile?.home_address || "London, UK";
                          const venueAddr = journeyStadium || "Emirates Stadium";
                          const updatedRoutes = [
                            {
                              mode: "≡ƒÜà High-Speed Intercity Train",
                              badge: "Γÿà RECOMMENDED / BEST BALANCED",
                              cost_usd: 68.50,
                              duration_minutes: 155,
                              best_for: `Why it's best from ${startAddr}: Perfect balance of comfort, speed, and zero airport security hassles. Arrives directly at central station near ${venueAddr} with scenic views and onboard Wi-Fi.`,
                              connects_to: journeySelectedStay?.name || "City Central Hub",
                              steps: `Direct high-speed rail from ${startAddr} to central terminal, then 10-min fan shuttle to ${venueAddr}.`,
                              legs: [
                                { label: "Leg 1 (Rail)", detail: `Board High-Speed Express from ${startAddr} Station (2h 20m onboard)` },
                                { label: "Leg 2 (Transfer)", detail: `Arrive at Central Station, take designated Supporter Express Shuttle (~15m)` },
                                { label: "Leg 3 (Arrival)", detail: `Drop off at VIP Gate 4, ${venueAddr} precinct` }
                              ]
                            },
                            {
                              mode: "Γ£ê∩╕Å Flight + Express Airport Rail",
                              badge: "ΓÜí FASTEST LONG DISTANCE",
                              cost_usd: 195.00,
                              duration_minutes: 185,
                              best_for: `Why it's best from ${startAddr}: Essential for journeys over 300+ miles. Skips highway congestion and includes fast airport-to-stadium express train.`,
                              connects_to: journeySelectedStay?.name || "Airport Hotel",
                              steps: `Flight from regional airport near ${startAddr} to destination hub, followed by Express Airport Metro directly to ${venueAddr}.`,
                              legs: [
                                { label: "Leg 1 (Flight)", detail: `Direct commercial flight from nearest airport to ${startAddr} (1h 15m airtime)` },
                                { label: "Leg 2 (Airport Rail)", detail: `Board Express Airport Rail directly to stadium corridor (~25m)` },
                                { label: "Leg 3 (Walk)", detail: `Short 5-min walk along supporter walkway to ${venueAddr}` }
                              ]
                            },
                            {
                              mode: "≡ƒÜç Local Subway / Metro Transit",
                              badge: "≡ƒÆ░ CHEAPEST / FAN FAVORITE",
                              cost_usd: 3.00,
                              duration_minutes: 28,
                              best_for: `Why it's best from ${startAddr}: Cheapest & most atmospheric option inside the city. Join thousands of chanting supporters on the direct subway line straight to stadium turnstiles.`,
                              connects_to: journeySelectedStay?.name || "Metro Station Hotel",
                              steps: `Direct subway ride from ${startAddr} precinct to stadium metro stop.`,
                              legs: [
                                { label: "Leg 1 (Subway)", detail: `Board Red/Green Line subway towards ${venueAddr} (~20m)` },
                                { label: "Leg 2 (Walk)", detail: `Exit station and walk along pedestrian fan corridor (~8m)` }
                              ]
                            },
                            {
                              mode: "≡ƒÜù Road Trip & VIP Stadium Parking",
                              badge: "≡ƒæÑ BEST FOR GROUPS & TAILGATING",
                              cost_usd: 38.00,
                              duration_minutes: 115,
                              best_for: `Why it's best from ${startAddr}: Most cost-effective when splitting gas/parking among 3-4 supporters. Allows carrying flags, coolers, and tailgating gear directly to reserved stadium lot.`,
                              connects_to: journeySelectedStay?.name || "Stadium Parking Lot",
                              steps: `Highway drive from ${startAddr} to reserved VIP North Parking Lot at ${venueAddr}.`,
                              legs: [
                                { label: "Leg 1 (Highway)", detail: `Drive from ${startAddr} via Main Intercity Expressway (~1h 40m depending on traffic)` },
                                { label: "Leg 2 (Parking)", detail: `Enter VIP Gate B and park at reserved Supporter Tailgate Lot (~10m)` }
                              ]
                            },
                            {
                              mode: "≡ƒÜò Express Door-to-Door Rideshare",
                              badge: "≡ƒÜ¬ HASSLE-FREE DOOR-TO-DOOR",
                              cost_usd: 32.00,
                              duration_minutes: 38,
                              best_for: `Why it's best from ${startAddr}: Ultimate convenience with direct pickup from your front door at ${startAddr} and private dropoff at stadium VIP entrance.`,
                              connects_to: journeySelectedStay?.name || "Private VIP Dropoff",
                              steps: `Direct private Uber/Lyft/Taxi ride from ${startAddr} to ${venueAddr} VIP entrance.`,
                              legs: [
                                { label: "Leg 1 (Pickup)", detail: `Private driver pickup at ${startAddr}` },
                                { label: "Leg 2 (Express Route)", detail: `Direct ride via HOV/Express corridor to stadium precinct (~38m)` }
                              ]
                            }
                          ];
                          setJourneyRoutes(updatedRoutes);
                          setSelectedRouteIdx(0);
                          setJourneySelectedRoute(updatedRoutes[0]);
                          setJourneySelectedRouteReason(updatedRoutes[0].best_for);
                          alert(`≡ƒÜ⌐ Transit routes recalculated from: ${startAddr}!
All 5 travel modes (Train, Flight, Metro, Road Trip, and Rideshare) have been updated with new fares and durations.`);
                        }}
                        className="px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-zinc-950 text-xs font-black uppercase tracking-wider cursor-pointer flex-shrink-0 shadow-md scale-105"
                      >
                        Recalculate Route Γå╗
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">*All 5 travel modes (Flight, Train, Subway, Road & Rideshare) dynamically recalculate fares ($) and durations when you modify your start address.</p>
                  </div>

                  {activeRoute && (
                    <div className="p-5 rounded-2xl border border-blue-500/60 bg-gradient-to-br from-blue-500/[0.08] via-zinc-950 to-blue-500/[0.04] space-y-4 shadow-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/20 pb-3.5">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-black text-white">{activeRoute.mode}</span>
                            {activeRoute.badge && (
                              <span className="text-[9px] font-mono font-black px-2.5 py-0.5 rounded-full bg-blue-500 text-zinc-950 shadow-md">
                                {activeRoute.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-blue-300 font-mono mt-1">≡ƒÜ⌐ Active Path: {userProfile?.home_address || "London, UK"} Γ₧ö {journeyStadium}</p>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs font-bold bg-zinc-950 px-3.5 py-2 rounded-xl border border-blue-500/30 shadow">
                          <span className="text-zinc-300">ΓÅ▒∩╕Å {activeRoute.duration_minutes ?? "--"} mins</span>
                          <span className="text-emerald-400 text-base font-black">${parseFloat(activeRoute.cost_usd || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-widest block">≡ƒÆí Why This Route is Beneficial:</span>
                        <p className="text-xs text-zinc-200 leading-relaxed font-medium bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 shadow-inner">{journeySelectedRouteReason || activeRoute.best_for || activeRoute.steps}</p>
                      </div>

                      {activeRoute.legs?.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest block">≡ƒù║∩╕Å Step-by-Step Leg Breakdown:</span>
                          <div className="space-y-2.5 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800">
                            {activeRoute.legs.map((leg: any, legIdx: number) => (
                              <div key={legIdx} className="flex items-start gap-3 text-xs text-zinc-300">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/50 flex items-center justify-center font-mono font-bold text-[10px] mt-0.5">{legIdx + 1}</span>
                                <div>
                                  <strong className="text-blue-300 font-mono text-[11px] block">{leg.label}:</strong>
                                  <span className="text-zinc-300 leading-relaxed">{leg.detail}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white uppercase tracking-wider">Compare All 5 Travel Modes:</span>
                      <span className="text-[10px] font-mono text-zinc-500">Click any card below to switch route & recalculate fare</span>
                    </div>
                    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      {routeOptions.map((route: any, rIdx: number) => {
                        const isCurrentRoute = activeRoute?.mode === route.mode;
                        return (
                          <button
                            key={`${route.mode}-${rIdx}`}
                            type="button"
                            onClick={() => {
                              const routeForStay = rebaseRouteToStay(route, journeySelectedStay);
                              setSelectedRouteIdx(rIdx);
                              setJourneySelectedRoute(routeForStay);
                              setJourneySelectedRouteReason(routeForStay.best_for || route.steps || "Selected route preference.");
                            }}
                            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                              isCurrentRoute
                                ? "border-blue-500 bg-blue-500/[0.12] shadow-lg shadow-blue-500/10 scale-[1.02]"
                                : "border-zinc-800 bg-zinc-950/80 hover:border-blue-500/50 hover:bg-zinc-900"
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-black text-white line-clamp-1">{route.mode}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black flex-shrink-0 ${isCurrentRoute ? "bg-blue-500 text-zinc-950 shadow" : "bg-zinc-800 text-zinc-400"}`}>
                                  {isCurrentRoute ? "Γ£ô ACTIVE" : "SELECT"}
                                </span>
                              </div>
                              {route.badge && (
                                <span className="inline-block text-[8px] font-mono font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  {route.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2">{route.best_for || route.steps}</p>
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300 pt-2.5 border-t border-zinc-850">
                              <span>ΓÅ▒∩╕Å <strong>{route.duration_minutes ?? "--"} mins</strong></span>
                              <strong className="text-blue-400 font-extrabold text-xs">${Number(route.cost_usd || 0).toFixed(2)}</strong>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: EXPLORE NEARBY FACILITIES & PHOTOS */}
              {(activeStep5Section === "nearby" || activeStep5Section === "all") && (
                <div className="p-6 rounded-2xl border border-violet-500/30 bg-zinc-900/50 space-y-5 animate-fade-in text-left">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">≡ƒô╕</span>
                      <div>
                        <span className="text-[9px] font-mono text-violet-400 uppercase tracking-widest font-extrabold">Section 4: Explore Nearby Facilities</span>
                        <h4 className="text-base font-black text-white">Restaurants, Pubs, Stores & Sightseeing with Photos</h4>
                      </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-850">
                      {[
                        { id: "restaurants", label: "≡ƒìö Dine & Pubs" },
                        { id: "convenience_stores", label: "≡ƒ¢Æ Convenience" },
                        { id: "pharmacies", label: "≡ƒÆè Essentials" },
                        { id: "tourist_spots", label: "≡ƒô╕ Sightseeing" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActivePlacesTab(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activePlacesTab === tab.id
                              ? "bg-violet-500 text-white font-black shadow-md"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activePlaces.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500 font-mono bg-zinc-950/40 rounded-xl border border-zinc-850">
                      No reported spots for this category around {journeyStadium}. Try switching category tabs above!
                    </div>
                  ) : (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                      {activePlaces.map((place: any, pIdx: number) => {
                        const placeName = typeof place === "string" ? place : (place?.name || "Unknown Spot");
                        const placeAddress = typeof place === "object" ? place?.address : "Near stadium precinct";
                        const placeRating = typeof place === "object" ? place?.rating : "4.8";
                        const placeDistance = typeof place === "object" ? place?.distance_miles : "0.4";
                        
                        const photoArr = activePlacesTab === "restaurants" ? dinePhotos : activePlacesTab === "tourist_spots" ? sightPhotos : storePhotos;
                        const photoUrl = photoArr[pIdx % photoArr.length];

                        return (
                          <div key={pIdx} className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden flex flex-col justify-between transition-all hover:border-violet-500/50">
                            <div>
                              <img src={photoUrl} alt={placeName} className="w-full h-32 object-cover border-b border-zinc-800" />
                              <div className="p-3.5 space-y-1.5">
                                <h5 className="text-xs font-black text-white line-clamp-1">{placeName}</h5>
                                <p className="text-[10px] text-zinc-400 line-clamp-1">{placeAddress}</p>
                                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 pt-1 border-t border-zinc-850">
                                  <span className="text-amber-400 font-bold">Γÿà {placeRating}</span>
                                  <span>{placeDistance} mi away</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-2.5 bg-zinc-900/80 border-t border-zinc-850 text-center">
                              <button
                                type="button"
                                onClick={() => window.open('https://www.openstreetmap.org/search?query=' + encodeURIComponent(placeName + ' near ' + journeyStadium), '_blank')}
                                className="w-full py-1.5 rounded bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-bold hover:bg-violet-500/20 cursor-pointer flex items-center justify-center gap-1"
                              >
                                <span>≡ƒôì Locate on Map Γåù</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 5: SAFETY DISPATCH & EMERGENCY */}
              {(activeStep5Section === "safety" || activeStep5Section === "all") && (
                <div className="p-6 rounded-2xl border border-yellow-500/30 bg-zinc-900/50 space-y-5 animate-fade-in text-left">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">≡ƒ¢í∩╕Å</span>
                      <div>
                        <span className="text-[9px] font-mono text-yellow-400 uppercase tracking-widest font-extrabold">Section 5: Safety Dispatch & Emergency</span>
                        <h4 className="text-base font-black text-white">City Security Briefing & Hotlines</h4>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {safety.level || "Low Risk"} ({safety.score || "8.8"}/10)
                    </span>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 p-4 rounded-xl bg-zinc-950/60 border border-zinc-850 space-y-3">
                      <h5 className="text-xs font-black uppercase tracking-wider text-zinc-300">Safety Guidelines & Precinct Security</h5>
                      <p className="text-xs text-zinc-400 leading-relaxed">{safety.summary}</p>
                      <ul className="space-y-2 text-xs text-zinc-300 list-none pl-0 pt-2 border-t border-zinc-850">
                        {(safety.tips || []).map((tip: string, tIdx: number) => (
                          <li key={tIdx} className="flex gap-2 items-start">
                            <span className="text-emerald-500 font-extrabold mt-0.5">Γ£ô</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-850 flex flex-col justify-between gap-4">
                      <div>
                        <h5 className="text-xs font-black uppercase tracking-wider text-zinc-300 mb-1">Emergency Lines</h5>
                        <p className="text-[10px] text-zinc-500">Official dispatch hotlines for local police and ambulance.</p>
                      </div>
                      <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-mono text-red-400 uppercase font-extrabold block">Emergency Dispatch</span>
                            <strong className="text-xs text-white">Police / Ambulance / Fire</strong>
                          </div>
                          <span className="text-base font-black text-red-400 font-mono">{safety.emergencyNumbers?.Emergency || "112"}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-mono text-zinc-400 uppercase font-extrabold block">Non-Emergency Line</span>
                            <strong className="text-xs text-zinc-300">Minor Reports / Advice</strong>
                          </div>
                          <span className="text-sm font-black text-zinc-400 font-mono">{safety.emergencyNumbers?.["Non-Emergency"] || "101"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ALWAYS VISIBLE FOOTER: BRIEFING TOTAL FARE & CONFIRMATION */}
              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.04] via-zinc-900 to-emerald-500/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
                <div className="text-left space-y-1">
                  <h4 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <span>≡ƒÜÇ Lock in your Complete Travel Dispatch</span>
                    <span className="text-[10px] font-mono bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded font-black">All 5 Sections Verified</span>
                  </h4>
                  <p className="text-xs text-zinc-400">Includes stay reservation, transit route map from your Home Base, match ticket entry, and safety briefing.</p>
                </div>
                <div className="flex items-center gap-4 justify-end w-full md:w-auto">
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-black block">Briefing Grand Total</span>
                    <strong className="text-xl font-black text-emerald-400 font-mono">${grandTotal.toFixed(2)}</strong>
                    <span className="text-[9px] font-mono text-zinc-500 block">(${(stayPrice).toFixed(0)} Stay + ${(transitPrice).toFixed(0)} Transit + $50 Ticket)</span>
                  </div>
                  <button
                    onClick={() => {
                      alert("≡ƒÄë Logistics briefing and itinerary confirmed! Your booking reference code is OS-2026-DISPATCH. All tickets and route maps sent to your profile!");
                    }}
                    className="book-ticket-btn scale-105 hover:scale-110 transition-transform shadow-xl shadow-emerald-500/20"
                  >
                    Confirm Entire Plan Γ£ô
                  </button>
                </div>
              </div>

              {/* Step 5 Footer buttons */}
              <div className="flex justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setJourneyStep(4)}
                  className="text-sm font-bold text-zinc-500 hover:text-emerald-500 cursor-pointer"
                >
                  ΓåÉ Back to Route
                </button>
                <button
                  onClick={() => {
                    setJourneyStep(1);
                    setJourneyStays([]);
                    setJourneyRoutes([]);
                    setJourneySelectedStay(null);
                    setJourneySelectedRoute(null);
                    setJourneySelectedStayReason("");
                    setJourneySelectedRouteReason("");
                    setJourneySafetySources([]);
                    setJourneyValidationChecks([]);
                    setJourneyDataWarnings([]);
                    setJourneySummary("");
                    setPlanningMode(null);
                    setAiPrompt("");
                  }}
                  className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-xs font-bold rounded-lg text-zinc-300 cursor-pointer"
                >
                  Restart Planner Γå║
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    );
  


}
