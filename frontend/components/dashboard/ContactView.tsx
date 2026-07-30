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

export default function ContactView() {
  const { email, userProfile, setUserProfile, activeTab, setActiveTab, handleLogout, setEmail, profileLoading, setProfileLoading, teamDetailModal, setTeamDetailModal, teamDetailLoading, setTeamDetailLoading, playerDetailModal, setPlayerDetailModal, playerDetailLoading, setPlayerDetailLoading, isEditingHomeBase, setIsEditingHomeBase, editStreet, setEditStreet, editCity, setEditCity, editCountry, setEditCountry, editStadium, setEditStadium, savingHomeBase, setSavingHomeBase, editHomeSearchQuery, setEditHomeSearchQuery, editStadiumSearchQuery, setEditStadiumSearchQuery, editHomeSuggestions, setEditHomeSuggestions, editStadiumSuggestions, setEditStadiumSuggestions, isSearchingHomeBase, setIsSearchingHomeBase, isSearchingStadiumBase, setIsSearchingStadiumBase, followedMatches, setFollowedMatches, matchesLoading, setMatchesLoading, bookedMatchIds, setBookedMatchIds, bookingInProgress, setBookingInProgress, tickets, setTickets, ticketsLoading, setTicketsLoading, storeProducts, setStoreProducts, storeLoading, setStoreLoading, storeSearch, setStoreSearch, storeCategory, setStoreCategory, isListingModalOpen, setIsListingModalOpen, listingForm, setListingForm, listingSubmitting, setListingSubmitting, ticketSelectedMatchId, setTicketSelectedMatchId, ticketAvailabilityError, setTicketAvailabilityError, ticketAvailabilityData, setTicketAvailabilityData, ticketAvailabilityLoading, setTicketAvailabilityLoading, ticketForecastingData, setTicketForecastingData, stadiumIntelData, setStadiumIntelData, stadiumIntelLoading, setStadiumIntelLoading, ticketForecastingLoading, setTicketForecastingLoading, isCustomTicketSearch, setIsCustomTicketSearch, customTicketQuery, setCustomTicketQuery, customHomeQuery, setCustomHomeQuery, customAwayQuery, setCustomAwayQuery, customTicketDate, setCustomTicketDate, customSelectedMatch, setCustomSelectedMatch, isSearchingCustomTicket, setIsSearchingCustomTicket, analysisSelectedMatchId, setAnalysisSelectedMatchId, analysisMatchDetail, setAnalysisMatchDetail, analysisLoading, setAnalysisLoading, analysisAILoading, setAnalysisAILoading, analysisAIData, setAnalysisAIData, analysisAIError, setAnalysisAIError, isCustomAnalysisPrompt, setIsCustomAnalysisPrompt, customAnalysisPromptQuery, setCustomAnalysisPromptQuery, messages, setMessages, inputVal, setInputVal, sending, setSending, activeMcpTools, setActiveMcpTools, selectedArchStep, setSelectedArchStep, selectedService, setSelectedService, assistantSelectedMapPlace, setAssistantSelectedMapPlace, assistantSelectedStay, setAssistantSelectedStay, journeyStep, setJourneyStep, journeyMatchName, setJourneyMatchName, journeyMatchDate, setJourneyMatchDate, journeyStadium, setJourneyStadium, stadiumSearchQuery, setStadiumSearchQuery, stadiumSuggestions, setStadiumSuggestions, isSearchingStadiums, setIsSearchingStadiums, showStadiumDropdown, setShowStadiumDropdown, journeyMaxPrice, setJourneyMaxPrice, journeyAccommodationType, setJourneyAccommodationType, journeyAmenities, setJourneyAmenities, journeyStays, setJourneyStays, journeyLoading, setJourneyLoading, journeyError, setJourneyError, journeySelectedStay, setJourneySelectedStay, journeyCheckIn, setJourneyCheckIn, journeyCheckOut, setJourneyCheckOut, journeyMaxDistance, setJourneyMaxDistance, showMoreFilters, setShowMoreFilters, planningMode, setPlanningMode, aiPrompt, setAiPrompt, journeyOrigin, setJourneyOrigin, journeyRouteMode, setJourneyRouteMode, journeyRoutes, setJourneyRoutes, journeyRouteLoading, setJourneyRouteLoading, journeyRouteError, setJourneyRouteError, journeyAILoading, setJourneyAILoading, loadingLogs, setLoadingLogs, currentLogMsg, setCurrentLogMsg, aiPlanningStages, setAiPlanningStages, activeAIStageIndex, setActiveAIStageIndex, completedAIStageCount, setCompletedAIStageCount, selectedRouteIdx, setSelectedRouteIdx, journeySelectedRoute, setJourneySelectedRoute, journeySafetyBriefing, setJourneySafetyBriefing, activePlacesTab, setActivePlacesTab, journeyRecommendations, setJourneyRecommendations, journeyTotalFare, setJourneyTotalFare, journeySummary, setJourneySummary, journeySelectedStayReason, setJourneySelectedStayReason, journeySelectedRouteReason, setJourneySelectedRouteReason, journeySafetySources, setJourneySafetySources, journeyValidationChecks, setJourneyValidationChecks, journeyDataWarnings, setJourneyDataWarnings, showStayOptions, setShowStayOptions, showRouteOptions, setShowRouteOptions, activeStep5Section, setActiveStep5Section, settingsTab, setSettingsTab, profileForm, setProfileForm, notifPreferences, setNotifPreferences, settingsSaved, setSettingsSaved, handleOpenTeamDetails, handleOpenPlayerDetails, handleOpenEditHomeBase, handleSaveHomeBase, handlePlanJourneyForMatch, handlePlanJourneyForTicket, handleBookTicket, handleCheckAvailability, handleRunAISeatingForecast, handleSearchCustomTicketMatch, handleSelectMatch, handleSelectAnalysisMatch, handleGenerateTacticalBreakdownForMatch, handleGenerateTacticalBreakdown, handleSearchAnalysisMatchByPrompt, handleSendMessage, handleSendDirectQuery, handleAIPlan, fetchFollowedMatches, fetchTickets, contactForm, setContactForm, contactSubmitting, setContactSubmitting, contactSubmitted, setContactSubmitted, openFaq, setOpenFaq } = useDashboard();


    const handleContactSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!contactForm.message.trim()) return;
      setContactSubmitting(true);
      setTimeout(() => {
        setContactSubmitting(false);
        setContactSubmitted(true);
      }, 1000);
    };

    const faqs = [
      {
        q: "When will I receive my digital matchday tickets?",
        a: "Digital mobile tickets are securely delivered to your Offside AI account and verified email address 48 to 72 hours prior to kick-off, complying with official club security and anti-scalping protocols."
      },
      {
        q: "What is your policy if a fixture is rescheduled or postponed?",
        a: "If a match date or kick-off time is adjusted by the league or television broadcasters, your existing booking remains 100% valid for the rescheduled fixture. If you cannot attend the new date, our automated resale portal allows you to list your seats up to 5 days prior."
      },
      {
        q: "How does the integrated Matchday Route Planner work?",
        a: "Our Route Planner combines real-time metro timetables, train schedules, and airport transfers directly from your saved Home City to the stadium turnstiles, avoiding known road closures and matchday congestion."
      },
      {
        q: "How are stadium sightlines and seat view ratings verified?",
        a: "Our sightline ratings are compiled from official stadium architectural drawings and verified attendee feedback, ensuring you know exact sun angles, roof coverage, and pitch visibility before finalizing your booking."
      }
    ];

    return (
      <div className="flex flex-col gap-8 w-full text-white pb-16 font-sans animate-fadeIn">
        {/* Top Header */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Help & Customer Support</h3>
            <p className="text-xs text-zinc-400 mt-1">We are here to assist with your ticket bookings, travel itineraries, stadium access, and account inquiries.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Support Desk Open 24/7</span>
          </div>
        </div>

        {/* Quick Support Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between gap-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">≡ƒÄƒ∩╕Å</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Ticket & Booking Assistance</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Seat allocations, mobile ticket delivery, or payment queries.</p>
              </div>
            </div>
            <div className="text-[11px] font-medium text-emerald-400 border-t border-zinc-800/80 pt-2.5 flex items-center justify-between">
              <span>Average response: &lt;15 mins</span>
              <span>Priority Support ΓåÆ</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between gap-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">≡ƒÅƒ∩╕Å</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Matchday Access & Travel</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Turnstile navigation, gate opening times, or transit updates.</p>
              </div>
            </div>
            <div className="text-[11px] font-medium text-cyan-400 border-t border-zinc-800/80 pt-2.5 flex items-center justify-between">
              <span>Live Matchday Desk</span>
              <span>View Guides ΓåÆ</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between gap-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">≡ƒñ¥</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Partnerships & Hospitality</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Corporate suites, group bookings, or club licensing inquiries.</p>
              </div>
            </div>
            <div className="text-[11px] font-medium text-amber-400 border-t border-zinc-800/80 pt-2.5 flex items-center justify-between">
              <span>Dedicated Manager</span>
              <span>Inquire Now ΓåÆ</span>
            </div>
          </div>
        </div>

        {/* Main Section: Contact Form vs FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Contact Form */}
          <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-base font-semibold text-white pb-4 border-b border-zinc-800/80 mb-6">Send Us a Message</h4>

              {contactSubmitted ? (
                <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 my-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">[OK]</div>
                  <h5 className="text-base font-semibold text-white mt-1">Inquiry Submitted Successfully</h5>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out. A support representative has received your request and will reply to your connected email within 15 minutes.
                  </p>
                  <button
                    onClick={() => { setContactSubmitted(false); setContactForm({ ...contactForm, message: "", orderRef: "" }); }}
                    className="mt-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name || userProfile?.name || ""}
                        onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Alex Ferguson"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email || email || ""}
                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="alex@manutd.co.uk"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">Inquiry Subject</label>
                      <select
                        value={contactForm.subject}
                        onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="booking_support">Ticket Booking & Seat Selection</option>
                        <option value="ticket_delivery">Mobile Ticket Delivery & Gate Entry</option>
                        <option value="travel_support">Travel & Route Planning Assistance</option>
                        <option value="billing_refunds">Billing, Refunds & Payments</option>
                        <option value="hospitality">VIP Hospitality & Corporate Boxes</option>
                        <option value="general">General Feedback & Suggestions</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">Order / Reference # (Optional)</label>
                      <input
                        type="text"
                        value={contactForm.orderRef}
                        onChange={e => setContactForm({ ...contactForm, orderRef: e.target.value })}
                        placeholder="e.g. #OFS-8492"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Message</label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Please provide details regarding your inquiry or assistance request..."
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg p-3.5 text-xs text-white focus:outline-none transition-all resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {contactSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <span>Submit Inquiry</span>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Secure SSL Encrypted Channel</span>
              <span>Offside Support Center ΓÇó London & Buenos Aires</span>
            </div>
          </div>

          {/* Right: FAQ & Direct Contact */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-zinc-950/80 border border-zinc-800/80 p-6 rounded-2xl shadow-xl">
              <h4 className="text-base font-semibold text-white mb-4">Frequently Asked Questions</h4>

              <div className="flex flex-col gap-2.5">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        isOpen ? "bg-zinc-900/80 border-zinc-700 shadow-sm" : "bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="leading-snug">{faq.q}</span>
                        <span className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180 text-emerald-400" : "text-zinc-500"}`}>Γû╝</span>
                      </button>
                      {isOpen && (
                        <div className="px-3.5 pb-3.5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-2.5">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct Contact Details Box */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl shadow-lg flex flex-col gap-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Direct Contact Details</h4>
              <div className="flex flex-col gap-2 text-xs text-zinc-300 mt-1">
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Email Support:</span>
                  <span className="font-mono text-emerald-400">support@offside.ai</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Telephone Helpline:</span>
                  <span className="font-mono">+44 (0) 20 7946 0192</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-zinc-400">Operating Hours:</span>
                  <span>24/7 Matchdays ΓÇó Mon-Fri 8am-8pm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  


  // ΓöÇΓöÇ Professional Account & Preferences Center ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

}
