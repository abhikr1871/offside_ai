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

export default function AnalysisView() {
  const { email, userProfile, setUserProfile, activeTab, setActiveTab, handleLogout, setEmail, profileLoading, setProfileLoading, teamDetailModal, setTeamDetailModal, teamDetailLoading, setTeamDetailLoading, playerDetailModal, setPlayerDetailModal, playerDetailLoading, setPlayerDetailLoading, isEditingHomeBase, setIsEditingHomeBase, editStreet, setEditStreet, editCity, setEditCity, editCountry, setEditCountry, editStadium, setEditStadium, savingHomeBase, setSavingHomeBase, editHomeSearchQuery, setEditHomeSearchQuery, editStadiumSearchQuery, setEditStadiumSearchQuery, editHomeSuggestions, setEditHomeSuggestions, editStadiumSuggestions, setEditStadiumSuggestions, isSearchingHomeBase, setIsSearchingHomeBase, isSearchingStadiumBase, setIsSearchingStadiumBase, followedMatches, setFollowedMatches, matchesLoading, setMatchesLoading, bookedMatchIds, setBookedMatchIds, bookingInProgress, setBookingInProgress, tickets, setTickets, ticketsLoading, setTicketsLoading, storeProducts, setStoreProducts, storeLoading, setStoreLoading, storeSearch, setStoreSearch, storeCategory, setStoreCategory, isListingModalOpen, setIsListingModalOpen, listingForm, setListingForm, listingSubmitting, setListingSubmitting, ticketSelectedMatchId, setTicketSelectedMatchId, ticketAvailabilityError, setTicketAvailabilityError, ticketAvailabilityData, setTicketAvailabilityData, ticketAvailabilityLoading, setTicketAvailabilityLoading, ticketForecastingData, setTicketForecastingData, stadiumIntelData, setStadiumIntelData, stadiumIntelLoading, setStadiumIntelLoading, ticketForecastingLoading, setTicketForecastingLoading, isCustomTicketSearch, setIsCustomTicketSearch, customTicketQuery, setCustomTicketQuery, customHomeQuery, setCustomHomeQuery, customAwayQuery, setCustomAwayQuery, customTicketDate, setCustomTicketDate, customSelectedMatch, setCustomSelectedMatch, isSearchingCustomTicket, setIsSearchingCustomTicket, analysisSelectedMatchId, setAnalysisSelectedMatchId, analysisMatchDetail, setAnalysisMatchDetail, analysisLoading, setAnalysisLoading, analysisAILoading, setAnalysisAILoading, analysisAIData, setAnalysisAIData, analysisAIError, setAnalysisAIError, isCustomAnalysisPrompt, setIsCustomAnalysisPrompt, customAnalysisPromptQuery, setCustomAnalysisPromptQuery, messages, setMessages, inputVal, setInputVal, sending, setSending, activeMcpTools, setActiveMcpTools, selectedArchStep, setSelectedArchStep, selectedService, setSelectedService, assistantSelectedMapPlace, setAssistantSelectedMapPlace, assistantSelectedStay, setAssistantSelectedStay, journeyStep, setJourneyStep, journeyMatchName, setJourneyMatchName, journeyMatchDate, setJourneyMatchDate, journeyStadium, setJourneyStadium, stadiumSearchQuery, setStadiumSearchQuery, stadiumSuggestions, setStadiumSuggestions, isSearchingStadiums, setIsSearchingStadiums, showStadiumDropdown, setShowStadiumDropdown, journeyMaxPrice, setJourneyMaxPrice, journeyAccommodationType, setJourneyAccommodationType, journeyAmenities, setJourneyAmenities, journeyStays, setJourneyStays, journeyLoading, setJourneyLoading, journeyError, setJourneyError, journeySelectedStay, setJourneySelectedStay, journeyCheckIn, setJourneyCheckIn, journeyCheckOut, setJourneyCheckOut, journeyMaxDistance, setJourneyMaxDistance, showMoreFilters, setShowMoreFilters, planningMode, setPlanningMode, aiPrompt, setAiPrompt, journeyOrigin, setJourneyOrigin, journeyRouteMode, setJourneyRouteMode, journeyRoutes, setJourneyRoutes, journeyRouteLoading, setJourneyRouteLoading, journeyRouteError, setJourneyRouteError, journeyAILoading, setJourneyAILoading, loadingLogs, setLoadingLogs, currentLogMsg, setCurrentLogMsg, aiPlanningStages, setAiPlanningStages, activeAIStageIndex, setActiveAIStageIndex, completedAIStageCount, setCompletedAIStageCount, selectedRouteIdx, setSelectedRouteIdx, journeySelectedRoute, setJourneySelectedRoute, journeySafetyBriefing, setJourneySafetyBriefing, activePlacesTab, setActivePlacesTab, journeyRecommendations, setJourneyRecommendations, journeyTotalFare, setJourneyTotalFare, journeySummary, setJourneySummary, journeySelectedStayReason, setJourneySelectedStayReason, journeySelectedRouteReason, setJourneySelectedRouteReason, journeySafetySources, setJourneySafetySources, journeyValidationChecks, setJourneyValidationChecks, journeyDataWarnings, setJourneyDataWarnings, showStayOptions, setShowStayOptions, showRouteOptions, setShowRouteOptions, activeStep5Section, setActiveStep5Section, settingsTab, setSettingsTab, profileForm, setProfileForm, notifPreferences, setNotifPreferences, settingsSaved, setSettingsSaved, handleOpenTeamDetails, handleOpenPlayerDetails, handleOpenEditHomeBase, handleSaveHomeBase, handlePlanJourneyForMatch, handlePlanJourneyForTicket, handleBookTicket, handleCheckAvailability, handleRunAISeatingForecast, handleSearchCustomTicketMatch, handleSelectMatch, handleSelectAnalysisMatch, handleGenerateTacticalBreakdownForMatch, handleGenerateTacticalBreakdown, handleSearchAnalysisMatchByPrompt, handleSendMessage, handleSendDirectQuery, handleAIPlan, fetchFollowedMatches, fetchTickets, contactForm, setContactForm, contactSubmitting, setContactSubmitting, contactSubmitted, setContactSubmitted, openFaq, setOpenFaq } = useDashboard();

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
  };

  const renderAnalysisStatBar = (label: any, homeVal: any, awayVal: any) => {
    const hNum = parseFloat(homeVal) || 0;
    const aNum = parseFloat(awayVal) || 0;
    const total = hNum + aNum || 1;
    const homePercent = (hNum / total) * 100;
    
    return (
      <div className="flex flex-col gap-1 w-full text-xs" key={label}>
        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          <span>{homeVal}</span>
          <span className="text-zinc-500 font-mono text-[9px]">{label}</span>
          <span>{awayVal}</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800/60 rounded-full flex overflow-hidden">
          <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${homePercent}%` }} />
          <div className="bg-violet-500 h-full transition-all duration-500" style={{ width: `${100 - homePercent}%` }} />
        </div>
      </div>
    );
  };

  const renderAnalysisThreatChart = (momentum: number[]) => {
    const width = 500;
    const height = 120;
    const paddingX = 40;
    const paddingY = 20;
    
    const points = momentum.map((val, idx) => {
      const x = paddingX + (idx / 5) * (width - 2 * paddingX);
      const y = height - paddingY - (val / 100) * (height - 2 * paddingY);
      return { x, y };
    });
    
    const pathData = points.reduce((acc, p, idx) => {
      return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "");
    
    return (
      <div className="bg-zinc-950/40 border border-zinc-800/80 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h5 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Tactical Dominance Timeline</h5>
          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider">xG Threat Momentum</span>
        </div>
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[320px] overflow-visible">
            {/* Center line (50% - balanced threat) */}
            <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#27272a" strokeDasharray="3,3" strokeWidth={1} />
            <text x={paddingX - 10} y={height / 2 + 3} fill="#52525b" fontSize="8" textAnchor="end" className="font-mono">50%</text>
            <text x={paddingX - 10} y={paddingY + 3} fill="#10b981" fontSize="8" textAnchor="end" className="font-mono">Home</text>
            <text x={paddingX - 10} y={height - paddingY + 3} fill="#8b5cf6" fontSize="8" textAnchor="end" className="font-mono">Away</text>
            
            {/* Threat Dominance Line */}
            <path d={pathData} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Nodes */}
            {points.map((p: any, idx: any) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r={4.5} fill="#09090b" stroke="#10b981" strokeWidth={2.5} />
                <text x={p.x} y={p.y - 8} fill="#a1a1aa" fontSize="8" textAnchor="middle" className="font-mono font-bold">{momentum[idx]}%</text>
                <text x={p.x} y={height - 4} fill="#52525b" fontSize="8" textAnchor="middle" className="font-mono">{idx * 15 + 15}'</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderAnalysisMarkdown = (text: string) => {
    if (!text) return null;
    
    const parseInline = (content: string) => {
      const parts = content.split("**");
      return parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="text-zinc-100 font-extrabold">{part}</strong>;
        }
        return part;
      });
    };

    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-xs font-extrabold text-emerald-400 mt-5 mb-2.5 uppercase tracking-widest font-mono border-b border-zinc-900 pb-1">
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      if (trimmed.startsWith("####")) {
        return (
          <h5 key={idx} className="text-[11px] font-bold text-zinc-300 mt-4 mb-2 uppercase tracking-wide">
            {trimmed.replace("####", "").trim()}
          </h5>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-sm font-black text-emerald-400 mt-6 mb-3 uppercase tracking-widest border-b border-zinc-800 pb-1.5 font-mono">
            {trimmed.replace("##", "").trim()}
          </h3>
        );
      }
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        return (
          <li key={idx} className="text-xs text-zinc-300 list-disc ml-5 mb-1.5 leading-relaxed text-left">
            {parseInline(trimmed.substring(1).trim())}
          </li>
        );
      }
      if (trimmed) {
        return (
          <p key={idx} className="text-xs text-zinc-400 mb-3 leading-relaxed text-left">
            {parseInline(trimmed)}
          </p>
        );
      }
      return <div key={idx} className="h-1.5" />;
    });
  };


    const completedMatches = followedMatches.filter((m: any) => m.status === "FT" || m.status === "FINISHED");
    const futureMatches = followedMatches.filter((m: any) => m.status !== "FT" && m.status !== "FINISHED");
    
    const activeMatchDetail = analysisMatchDetail;
    const isFuture = activeMatchDetail && activeMatchDetail.status !== "FT" && activeMatchDetail.status !== "FINISHED" && activeMatchDetail.status !== "predicted";

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full text-white min-h-[500px]">
        {/* Match Select Panel */}
        <div className="xl:col-span-12">
          <div className="glass-card p-5 sm:p-6 border border-zinc-800 bg-zinc-950/40 rounded-2xl flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 font-mono">
                ≡ƒôè Match Statistics & AI Tactical Analysis
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Standard Selection */}
              <div className="flex flex-col gap-2 border-r-0 md:border-r border-zinc-800/80 md:pr-6">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Select Tracked Match
                </label>
                <select
                  value={analysisSelectedMatchId || ""}
                  onChange={(e) => {
                    handleSelectAnalysisMatch(e.target.value);
                    setCustomAnalysisPromptQuery("");
                  }}
                  className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white outline-none transition-colors cursor-pointer shadow-inner"
                >
                  <option value="">-- Choose a Match to Analyze --</option>
                  
                  {futureMatches.length > 0 && (
                    <optgroup label="Upcoming / Predicted Matches" className="bg-zinc-950 text-zinc-300 font-bold">
                      {futureMatches.map((m: any) => (
                        <option key={m.id} value={m.id} className="font-medium">
                          {m.homeTeam} vs {m.awayTeam} (Pre-Match Preview)
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {completedMatches.length > 0 && (
                    <optgroup label="Completed Matches" className="bg-zinc-950 text-zinc-300 font-bold mt-2">
                      {completedMatches.map((m: any) => (
                        <option key={m.id} value={m.id} className="font-medium">
                          {m.homeTeam} {m.homeScore}-{m.awayScore} {m.awayTeam} (Post-Match Review)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                  Select an upcoming match to generate a <strong className="text-zinc-400">Predicted AI Preview</strong>, or a past match for <strong className="text-zinc-400">Tactical Breakdown</strong>.
                </div>
              </div>

              {/* Right: AI Smart Search */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                  AI Smart Search (Historical or Hypothetical)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Manchester City vs Inter Milan 2023 final, Rodri scores"
                    value={customAnalysisPromptQuery}
                    onChange={e => setCustomAnalysisPromptQuery(e.target.value)}
                    className="flex-1 bg-violet-950/10 border border-violet-900/50 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder-zinc-500 transition-colors shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleSearchAnalysisMatchByPrompt}
                    disabled={analysisLoading || !customAnalysisPromptQuery.trim()}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs px-5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-md shadow-violet-900/20"
                  >
                    {analysisLoading ? "Searching..." : "AI Generate"}
                  </button>
                </div>
                <div className="text-[10px] text-zinc-500 italic mt-1 leading-relaxed">
                  Can't find it? Type what you remember. Our AI will reconstruct the exact lineups, events, and statistical graphs for you.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Match Dashboard */}
        {analysisLoading ? (
          <div className="xl:col-span-12 flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative flex items-center justify-center w-12 h-12">
              <span className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin"></span>
              <span className="absolute inset-1 border-r-2 border-violet-500 rounded-full animate-spin direction-reverse"></span>
            </div>
            <div className="text-xs text-zinc-400 font-mono tracking-widest uppercase">Fetching Match Data & AI Tactical Engine...</div>
          </div>
        ) : activeMatchDetail ? (
          <>
            {/* Left Column: Match Stats & Pitch Lineup (8 cols) */}
            <div className="xl:col-span-7 flex flex-col gap-6">
              {/* Pitch Visualizer */}
              <div className="glass-card p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl flex flex-col gap-4 text-center">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 font-mono">
                    {isFuture ? "≡ƒö« Expected Tactical Formations" : "≡ƒÅƒ∩╕Å Tactical Formations"}
                  </h4>
                  <div className="flex gap-4 text-[10px] font-mono font-bold">
                    <span className="text-emerald-400">{activeMatchDetail.homeTeam?.name}: {activeMatchDetail.homeTeam?.formation || "TBD"}</span>
                    <span className="text-violet-400">{activeMatchDetail.awayTeam?.name}: {activeMatchDetail.awayTeam?.formation || "TBD"}</span>
                  </div>
                </div>

                {/* CSS Soccer Field */}
                <div className="w-full aspect-[4/5] bg-emerald-950/20 border-2 border-emerald-500/20 rounded-xl relative p-4 overflow-hidden shadow-inner flex flex-col justify-between">
                  {/* Field Markings */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-500/10 -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-emerald-500/10 rounded-full" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-16 border-b border-x border-emerald-500/10" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-16 border-t border-x border-emerald-500/10" />
                  
                  {/* Home Team Lineup */}
                  {activeMatchDetail.homeTeam?.lineup?.map((p: any, idx: number) => {
                    const coords = getPlayerCoordinates(p.position, idx, true);
                    return (
                      <div
                        key={p.id || idx}
                        className="absolute group z-10 -translate-x-1/2 -translate-y-1/2 cursor-default animate-fadeIn"
                        style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                      >
                        <div className="w-6 h-6 rounded-full bg-emerald-500 border border-emerald-300 flex items-center justify-center text-[10px] font-black text-black shadow-lg">
                          {p.shirtNumber || idx + 1}
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-zinc-950/90 border border-zinc-800 text-[8px] text-zinc-300 rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-md font-mono">
                          {p.name} ({p.position})
                        </div>
                      </div>
                    );
                  })}

                  {/* Away Team Lineup */}
                  {activeMatchDetail.awayTeam?.lineup?.map((p: any, idx: number) => {
                    const coords = getPlayerCoordinates(p.position, idx, false);
                    return (
                      <div
                        key={p.id || idx}
                        className="absolute group z-10 -translate-x-1/2 -translate-y-1/2 cursor-default animate-fadeIn"
                        style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                      >
                        <div className="w-6 h-6 rounded-full bg-violet-600 border border-violet-400 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                          {p.shirtNumber || idx + 1}
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-zinc-950/90 border border-zinc-800 text-[8px] text-zinc-300 rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-md font-mono">
                          {p.name} ({p.position})
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Match Stats Comparison */}
              <div className="glass-card p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl flex flex-col gap-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 font-mono flex items-center justify-between">
                  <span>{isFuture ? "≡ƒôê AI Predicted Match Statistics" : "≡ƒôè Match Performance Statistics"}</span>
                  {isFuture && <span className="text-[9px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded tracking-normal">FORECAST</span>}
                </h4>
                <div className="flex flex-col gap-3.5">
                  {renderAnalysisStatBar("Possession", activeMatchDetail.homeTeam?.statistics?.ball_possession ? `${activeMatchDetail.homeTeam.statistics.ball_possession}%` : "50%", activeMatchDetail.awayTeam?.statistics?.ball_possession ? `${activeMatchDetail.awayTeam.statistics.ball_possession}%` : "50%")}
                  {renderAnalysisStatBar(isFuture ? "Expected Shots" : "Total Shots", activeMatchDetail.homeTeam?.statistics?.shots || 0, activeMatchDetail.awayTeam?.statistics?.shots || 0)}
                  {renderAnalysisStatBar("Shots on Target", activeMatchDetail.homeTeam?.statistics?.shots_on_goal || 0, activeMatchDetail.awayTeam?.statistics?.shots_on_goal || 0)}
                  {renderAnalysisStatBar("Passes Completed", activeMatchDetail.homeTeam?.statistics?.passes || 0, activeMatchDetail.awayTeam?.statistics?.passes || 0)}
                  {renderAnalysisStatBar("Pass Accuracy", activeMatchDetail.homeTeam?.statistics?.pass_accuracy ? `${activeMatchDetail.homeTeam.statistics.pass_accuracy}%` : "80%", activeMatchDetail.awayTeam?.statistics?.pass_accuracy ? `${activeMatchDetail.awayTeam.statistics.pass_accuracy}%` : "80%")}
                  {renderAnalysisStatBar("Fouls", activeMatchDetail.homeTeam?.statistics?.fouls || 0, activeMatchDetail.awayTeam?.statistics?.fouls || 0)}
                  {renderAnalysisStatBar("Corner Kicks", activeMatchDetail.homeTeam?.statistics?.corner_kicks || 0, activeMatchDetail.awayTeam?.statistics?.corner_kicks || 0)}
                  {renderAnalysisStatBar("Goalkeeper Saves", activeMatchDetail.homeTeam?.statistics?.saves || 0, activeMatchDetail.awayTeam?.statistics?.saves || 0)}
                </div>
              </div>
            </div>

            {/* Right Column: Events & AI report (5 cols) */}
            <div className="xl:col-span-5 flex flex-col gap-6">
              {/* Chronological Events Timeline */}
              <div className="glass-card p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl flex flex-col gap-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 font-mono">
                  {isFuture ? "≡ƒö« AI Predicted Events Timeline" : "≡ƒòÆ Match Events Timeline"}
                </h4>
                
                <div className="flex flex-col gap-3 relative pl-4 border-l border-zinc-800">
                  {/* Goals */}
                  {activeMatchDetail.goals && activeMatchDetail.goals.length > 0 ? (
                    activeMatchDetail.goals.map((g: any, index: number) => {
                      const isHomeGoal = g.teamId === activeMatchDetail.homeTeamId || g.teamId === activeMatchDetail.homeTeam?.id || g.teamId === "home";
                      return (
                        <div className="relative flex flex-col items-start gap-0.5 text-left" key={`g-${index}`}>
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-zinc-950 flex items-center justify-center text-[7px]" />
                          <div className="text-xs font-black text-zinc-100 flex items-center gap-1.5">
                            <span>ΓÜ╜ {g.scorer}</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-extrabold">{g.minute}'</span>
                          </div>
                          <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Goal ΓÇó {isHomeGoal ? activeMatchDetail.homeTeam?.name : activeMatchDetail.awayTeam?.name}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-zinc-600 text-[11px] text-left py-1 italic">{isFuture ? "Awaiting kick-off..." : "No goals recorded."}</div>
                  )}

                  {/* Bookings */}
                  {activeMatchDetail.bookings && activeMatchDetail.bookings.map((b: any, index: number) => {
                    const isHomeBooking = b.teamId === activeMatchDetail.homeTeamId || b.teamId === activeMatchDetail.homeTeam?.id || b.teamId === "home";
                    const isRed = b.card === "RED";
                    return (
                      <div className="relative flex flex-col items-start gap-0.5 text-left mt-1" key={`b-${index}`}>
                        <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${isRed ? "bg-red-500" : "bg-amber-400"} border border-zinc-950`} />
                        <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                          <span>≡ƒƒ¿ {b.player}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{b.minute}'</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">{b.card} Card ΓÇó {isHomeBooking ? activeMatchDetail.homeTeam?.name : activeMatchDetail.awayTeam?.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Professional Report Panel */}
              <div className="glass-card p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 font-mono">
                    ≡ƒñû AI Scout {isFuture ? "Pre-Match Preview" : "Tactical Review"}
                  </h4>
                  {analysisAIData && (
                    <span className={`text-[8px] px-2 py-0.5 rounded font-mono font-bold ${
                      analysisAIData.status === "fallback" ? "bg-amber-500/10 text-amber-400" : "bg-violet-500/10 text-violet-400"
                    }`}>
                      {analysisAIData.status === "fallback" ? "LOCAL ESTIMATE" : "GEMINI ENGINE"}
                    </span>
                  )}
                </div>

                {analysisAILoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "300ms" }} />
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 text-center max-w-[200px] leading-relaxed">
                      Analyzing {isFuture ? "form, expected lineups, and strategic mismatches" : "match stats, actual lineups, and tactical events"} with Gemini AI...
                    </div>
                  </div>
                ) : analysisAIData ? (
                  <div className="flex flex-col gap-5">
                    {/* Threat momentum graph */}
                    {analysisAIData.threat_momentum && renderAnalysisThreatChart(analysisAIData.threat_momentum)}

                    {/* MVP Player Spotlight */}
                    {analysisAIData.mvp_player && (
                      <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl flex items-start gap-4 text-left shadow-lg">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-violet-950 border border-violet-500/30 flex items-center justify-center font-black text-sm text-violet-300">
                          {analysisAIData.mvp_player.shirtNumber || 10}
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="text-[9px] font-mono text-violet-400 uppercase tracking-widest">{isFuture ? "Key Player to Watch" : "Match MVP Candidate"}</div>
                          <div className="text-xs font-extrabold text-zinc-100">{analysisAIData.mvp_player.name}</div>
                          <div className="text-[9px] font-bold text-zinc-400">{analysisAIData.mvp_player.team}</div>
                          <p className="text-[10px] text-zinc-300 leading-relaxed mt-1.5 border-t border-zinc-800/50 pt-1.5">
                            {analysisAIData.mvp_player.reason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tactical Report Text */}
                    <div className="bg-zinc-950/20 border border-zinc-900 rounded-xl p-4 max-h-[380px] overflow-y-auto custom-scrollbar flex flex-col gap-3">
                      {renderAnalysisMarkdown(analysisAIData.report_markdown)}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <p className="text-xs text-zinc-500">{isFuture ? "No prediction generated yet." : "No tactical report loaded yet."}</p>
                    <button
                      onClick={handleGenerateTacticalBreakdown}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Generate AI {isFuture ? "Pre-Match Preview" : "Tactical Breakdown"}
                    </button>
                  </div>
                )}

                {analysisAIError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[10px] text-red-400 text-left">
                    ΓÜá∩╕Å {analysisAIError}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="xl:col-span-12 glass-card p-12 text-center border border-zinc-800">
            <p className="text-xs text-zinc-500">Please select a match or use the AI Smart Search to generate deep statistical analytics.</p>
          </div>
        )}
      </div>
    );
  


}
