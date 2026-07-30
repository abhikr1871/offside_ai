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

export default function AssistantView() {
  const { email, userProfile, setUserProfile, activeTab, setActiveTab, handleLogout, setEmail, profileLoading, setProfileLoading, teamDetailModal, setTeamDetailModal, teamDetailLoading, setTeamDetailLoading, playerDetailModal, setPlayerDetailModal, playerDetailLoading, setPlayerDetailLoading, isEditingHomeBase, setIsEditingHomeBase, editStreet, setEditStreet, editCity, setEditCity, editCountry, setEditCountry, editStadium, setEditStadium, savingHomeBase, setSavingHomeBase, editHomeSearchQuery, setEditHomeSearchQuery, editStadiumSearchQuery, setEditStadiumSearchQuery, editHomeSuggestions, setEditHomeSuggestions, editStadiumSuggestions, setEditStadiumSuggestions, isSearchingHomeBase, setIsSearchingHomeBase, isSearchingStadiumBase, setIsSearchingStadiumBase, followedMatches, setFollowedMatches, matchesLoading, setMatchesLoading, bookedMatchIds, setBookedMatchIds, bookingInProgress, setBookingInProgress, tickets, setTickets, ticketsLoading, setTicketsLoading, storeProducts, setStoreProducts, storeLoading, setStoreLoading, storeSearch, setStoreSearch, storeCategory, setStoreCategory, isListingModalOpen, setIsListingModalOpen, listingForm, setListingForm, listingSubmitting, setListingSubmitting, ticketSelectedMatchId, setTicketSelectedMatchId, ticketAvailabilityError, setTicketAvailabilityError, ticketAvailabilityData, setTicketAvailabilityData, ticketAvailabilityLoading, setTicketAvailabilityLoading, ticketForecastingData, setTicketForecastingData, stadiumIntelData, setStadiumIntelData, stadiumIntelLoading, setStadiumIntelLoading, ticketForecastingLoading, setTicketForecastingLoading, isCustomTicketSearch, setIsCustomTicketSearch, customTicketQuery, setCustomTicketQuery, customHomeQuery, setCustomHomeQuery, customAwayQuery, setCustomAwayQuery, customTicketDate, setCustomTicketDate, customSelectedMatch, setCustomSelectedMatch, isSearchingCustomTicket, setIsSearchingCustomTicket, analysisSelectedMatchId, setAnalysisSelectedMatchId, analysisMatchDetail, setAnalysisMatchDetail, analysisLoading, setAnalysisLoading, analysisAILoading, setAnalysisAILoading, analysisAIData, setAnalysisAIData, analysisAIError, setAnalysisAIError, isCustomAnalysisPrompt, setIsCustomAnalysisPrompt, customAnalysisPromptQuery, setCustomAnalysisPromptQuery, messages, setMessages, inputVal, setInputVal, sending, setSending, activeMcpTools, setActiveMcpTools, selectedArchStep, setSelectedArchStep, selectedService, setSelectedService, assistantSelectedMapPlace, setAssistantSelectedMapPlace, assistantSelectedStay, setAssistantSelectedStay, journeyStep, setJourneyStep, journeyMatchName, setJourneyMatchName, journeyMatchDate, setJourneyMatchDate, journeyStadium, setJourneyStadium, stadiumSearchQuery, setStadiumSearchQuery, stadiumSuggestions, setStadiumSuggestions, isSearchingStadiums, setIsSearchingStadiums, showStadiumDropdown, setShowStadiumDropdown, journeyMaxPrice, setJourneyMaxPrice, journeyAccommodationType, setJourneyAccommodationType, journeyAmenities, setJourneyAmenities, journeyStays, setJourneyStays, journeyLoading, setJourneyLoading, journeyError, setJourneyError, journeySelectedStay, setJourneySelectedStay, journeyCheckIn, setJourneyCheckIn, journeyCheckOut, setJourneyCheckOut, journeyMaxDistance, setJourneyMaxDistance, showMoreFilters, setShowMoreFilters, planningMode, setPlanningMode, aiPrompt, setAiPrompt, journeyOrigin, setJourneyOrigin, journeyRouteMode, setJourneyRouteMode, journeyRoutes, setJourneyRoutes, journeyRouteLoading, setJourneyRouteLoading, journeyRouteError, setJourneyRouteError, journeyAILoading, setJourneyAILoading, loadingLogs, setLoadingLogs, currentLogMsg, setCurrentLogMsg, aiPlanningStages, setAiPlanningStages, activeAIStageIndex, setActiveAIStageIndex, completedAIStageCount, setCompletedAIStageCount, selectedRouteIdx, setSelectedRouteIdx, journeySelectedRoute, setJourneySelectedRoute, journeySafetyBriefing, setJourneySafetyBriefing, activePlacesTab, setActivePlacesTab, journeyRecommendations, setJourneyRecommendations, journeyTotalFare, setJourneyTotalFare, journeySummary, setJourneySummary, journeySelectedStayReason, setJourneySelectedStayReason, journeySelectedRouteReason, setJourneySelectedRouteReason, journeySafetySources, setJourneySafetySources, journeyValidationChecks, setJourneyValidationChecks, journeyDataWarnings, setJourneyDataWarnings, showStayOptions, setShowStayOptions, showRouteOptions, setShowRouteOptions, activeStep5Section, setActiveStep5Section, settingsTab, setSettingsTab, profileForm, setProfileForm, notifPreferences, setNotifPreferences, settingsSaved, setSettingsSaved, handleOpenTeamDetails, handleOpenPlayerDetails, handleOpenEditHomeBase, handleSaveHomeBase, handlePlanJourneyForMatch, handlePlanJourneyForTicket, handleBookTicket, handleCheckAvailability, handleRunAISeatingForecast, handleSearchCustomTicketMatch, handleSelectMatch, handleSelectAnalysisMatch, handleGenerateTacticalBreakdownForMatch, handleGenerateTacticalBreakdown, handleSearchAnalysisMatchByPrompt, handleSendMessage, handleSendDirectQuery, handleAIPlan, fetchFollowedMatches, fetchTickets, contactForm, setContactForm, contactSubmitting, setContactSubmitting, contactSubmitted, setContactSubmitted, openFaq, setOpenFaq } = useDashboard();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


    const renderAssistantMd = (text: string) => {
      return text.split("\n").map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-bold text-emerald-400 mt-2 mb-1 uppercase tracking-wider">{line.slice(4)}</h3>;
        if (line.startsWith("#### ")) return <h4 key={i} className="text-xs font-bold text-zinc-300 mt-1.5 mb-1 uppercase tracking-wider">{line.slice(5)}</h4>;
        
        const renderLineParts = (partText: string) => {
          if (!partText.includes("**")) return partText;
          const parts = partText.split("**");
          return parts.map((p, j) => {
            if (j % 2 === 1) {
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => {
                    setAssistantSelectedMapPlace(p);
                  }}
                  className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded cursor-pointer transition-all border-none align-baseline text-left font-sans text-xs"
                >
                  ≡ƒôì {p}
                </button>
              );
            }
            return p;
          });
        };

        if (line.trim().startsWith("- ")) {
          return (
            <li key={i} className="ml-4 list-disc text-xs text-zinc-300 my-1">
              {renderLineParts(line.trim().slice(2))}
            </li>
          );
        }

        return line.trim() ? (
          <p key={i} className="text-xs text-zinc-300 my-1.5 leading-relaxed">
            {renderLineParts(line)}
          </p>
        ) : (
          <div key={i} className="h-1.5" />
        );
      });
    };

    const SUGGESTION_QUERIES = [
      { label: "≡ƒÅ¿ Find Stays", query: "Find cheap stays near Emirates Stadium" },
      { label: "ΓÜ╜ Match Fixtures", query: "Show upcoming matches for Arsenal" },
      { label: "≡ƒì║ Food & Pubs", query: "Best pubs and food reviews near Anfield" },
      { label: "≡ƒÜ╢ Route & Directions", query: "Show transit directions from London to Emirates Stadium" },
    ];

    const getMapUrl = () => {
      const defaultStadium = userProfile?.stadium || "Emirates Stadium";
      const defaultCity = userProfile?.city || "London";
      
      let origin = "";
      if (assistantSelectedStay) {
        origin = assistantSelectedStay;
      } else if (userProfile?.street && userProfile?.city) {
        origin = `${userProfile.street}, ${userProfile.city}`;
      } else if (userProfile?.city) {
        origin = userProfile.city;
      } else {
        origin = "London";
      }

      if (assistantSelectedMapPlace) {
        if (origin && origin.toLowerCase() !== assistantSelectedMapPlace.toLowerCase()) {
          return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(assistantSelectedMapPlace)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
        }
        return `https://maps.google.com/maps?q=${encodeURIComponent(assistantSelectedMapPlace)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
      }
      
      return `https://maps.google.com/maps?q=${encodeURIComponent(defaultStadium + " " + defaultCity)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-190px)] min-h-[600px] w-full text-white">
        {/* Left Column: Chat terminal */}
        <div className="lg:col-span-5 flex flex-col h-full glass-card agent-terminal overflow-hidden border border-zinc-800/80 bg-zinc-950/20 rounded-2xl">
          <div className="terminal-header flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 bg-zinc-900/40">
            <div className="terminal-title flex items-center gap-2">
              <span className="terminal-dot w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 font-mono">
                Globus 2026 ΓÇö Assistant Terminal
              </span>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              ONLINE
            </span>
          </div>

          <div className="terminal-messages flex-grow overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((msg: any, i: any) => (
              <div key={i} className={`msg-bubble ${msg.sender} max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.sender === "user" 
                  ? "self-end bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none" 
                  : "self-start bg-zinc-900/60 border border-zinc-800/60 text-zinc-300 rounded-bl-none"
              }`}>
                {msg.sender === "agent" ? (
                  <>
                    {renderAssistantMd(msg.text)}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="tool-calls-panel mt-3 pt-2 border-t border-zinc-800/80 font-mono text-[10px] text-emerald-400">
                        <div className="font-bold text-zinc-500 mb-1">ΓÜí MCP Tool Actions</div>
                        {msg.toolCalls.map((tc: any, ti: any) => (
                          <div key={ti} className="bg-zinc-950/40 border border-zinc-800/30 rounded px-2 py-1 mt-1 text-[9px]">
                            {tc.name}({JSON.stringify(tc.arguments)})
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p>{msg.text}</p>
                )}
                <span className="msg-timestamp block text-[9px] text-zinc-500 mt-1.5 text-right font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Empty chat suggestions onboarding board */}
            {messages.length <= 1 && (
              <div className="mt-2 border border-zinc-800/40 bg-zinc-900/10 rounded-xl p-3">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  Suggestions to ask Globus:
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTION_QUERIES.map((sq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendDirectQuery(sq.query)}
                      className="w-full text-left bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/50 hover:border-emerald-500/40 rounded-xl p-2.5 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span>{sq.query}</span>
                      <span className="text-emerald-400">ΓåÆ</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sending && (
              <div className="msg-bubble agent self-start bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 text-xs rounded-bl-none">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="terminal-input border-t border-zinc-800/80 p-3 bg-zinc-900/20" onSubmit={handleSendMessage}>
            {/* Horizontal suggestions chips above input box */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
              {SUGGESTION_QUERIES.map((sq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendDirectQuery(sq.query)}
                  className="flex-shrink-0 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-emerald-500/40 text-[10px] text-zinc-300 hover:text-white px-2.5 py-1 rounded-full transition-all cursor-pointer"
                >
                  {sq.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="terminal-input-field flex-grow bg-zinc-900/50 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all"
                placeholder="Ask about nearest stays, directions, food spots..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-3 py-2 flex items-center justify-center gap-1 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={!inputVal.trim() || sending}
              >
                Send
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Connected Map Hub */}
        <div className="lg:col-span-7 flex flex-col h-full glass-card border border-zinc-800/80 bg-zinc-950/20 p-4 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446 1.202-.832a2.25 2.25 0 0 0 .896-1.802V4.77a2.25 2.25 0 0 0-3.344-1.948l-2.705 1.503a1.125 1.125 0 0 1-1.012 0L7.13 2.822a2.25 2.25 0 0 0-3.344 1.948v11.758a2.25 2.25 0 0 0 .896 1.802l1.2 1.2a2.25 2.25 0 0 0 2.534-.148l2.705-1.503a1.125 1.125 0 0 1 1.012 0l2.705 1.503Z" />
                </svg>
                Live Assistant Map Hub
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Connected GPS tracking via MCP</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5 text-[9px] text-emerald-400 font-mono tracking-wider animate-pulse uppercase">
              GPS STATUS: ACTIVE
            </div>
          </div>

          {/* Lodging & Search Info Overlay */}
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 mb-3 text-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-semibold text-[10px] uppercase tracking-wider font-mono">Your Lodging Stay:</span>
                {assistantSelectedStay ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    ≡ƒÅ¿ {assistantSelectedStay}
                  </span>
                ) : (
                  <span className="text-zinc-500 italic">None selected. Click stay name in chat to set.</span>
                )}
              </div>
              {assistantSelectedMapPlace && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-zinc-500 font-semibold text-[10px] uppercase tracking-wider font-mono">Map Target:</span>
                  <span className="text-zinc-300 font-medium">≡ƒôì {assistantSelectedMapPlace}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {assistantSelectedMapPlace && assistantSelectedMapPlace !== assistantSelectedStay && (
                <button
                  onClick={() => setAssistantSelectedStay(assistantSelectedMapPlace)}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all flex items-center gap-1"
                >
                  Set as Lodging Stay
                </button>
              )}
              {(assistantSelectedMapPlace || assistantSelectedStay) && (
                <button
                  onClick={() => {
                    setAssistantSelectedMapPlace(null);
                    setAssistantSelectedStay(null);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 px-2 py-1 rounded-lg text-[10px] cursor-pointer transition-all"
                >
                  Reset Map
                </button>
              )}
            </div>
          </div>

          {/* Map Frame */}
          <div className="relative flex-1 rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-900/20 min-h-[300px]">
            <iframe
              title="Globus Assistant Map"
              src={getMapUrl()}
              className="w-full h-full border-none opacity-90 hover:opacity-100 transition-opacity"
              allowFullScreen
              loading="lazy"
            />
            {/* Cyberpunk Scanner Overlays */}
            <div className="absolute inset-0 pointer-events-none border border-emerald-500/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  



}
