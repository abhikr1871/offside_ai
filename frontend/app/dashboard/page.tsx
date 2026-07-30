"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FloatingSettings from "../../components/FloatingSettings";
import { getCurrentUser, logoutUser } from "../../lib/auth";
import { UserProfile, MatchDocument, TicketDocument, StoreProduct, ChatMessage, AIPlanningStage, TeamDetail, PlayerDetail, MongoTeam, TabId } from "../../lib/types";
import { BACKEND, DEFAULT_AI_PLANNING_STAGES, NAV_ITEMS, TEAM_CRESTS, MCP_SERVICES } from "../../lib/constants";
import { getTeamCrest, formatMatchDate, formatShortDateRange, statusChipClass, statusLabel, renderMd } from "../../lib/utils";
import { DashboardProvider } from "../../context/DashboardContext";
import TeamDetailModal from "../../components/modals/TeamDetailModal";
import PlayerDetailModal from "../../components/modals/PlayerDetailModal";
import ContactView from "../../components/dashboard/ContactView";
import DashboardHomeView from "../../components/dashboard/DashboardHomeView";
import JourneyPlannerView from "../../components/dashboard/JourneyPlannerView";
import TicketsView from "../../components/dashboard/TicketsView";
import AssistantView from "../../components/dashboard/AssistantView";
import AnalysisView from "../../components/dashboard/AnalysisView";
import StoreView from "../../components/dashboard/StoreView";
import SettingsView from "../../components/dashboard/SettingsView";

// ─── Types ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [email, setEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Team detail modal states
  const [teamDetailModal, setTeamDetailModal] = useState<TeamDetail | null>(null);
  const [teamDetailLoading, setTeamDetailLoading] = useState(false);

  // Player detail modal states
  const [playerDetailModal, setPlayerDetailModal] = useState<PlayerDetail | null>(null);
  const [playerDetailLoading, setPlayerDetailLoading] = useState(false);

  const handleOpenTeamDetails = async (teamName: string) => {
    setTeamDetailLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/v1/teams/by-name/${encodeURIComponent(teamName)}`);
      if (res.ok) {
        const found = await res.json();
        if (found && (found.name || found.shortName || found.id)) {
          const coachName = typeof found.coach === 'object' && found.coach ? found.coach.name : (typeof found.coach === 'string' ? found.coach : "First Team Manager");
          setTeamDetailModal({
            ...found,
            coach: coachName,
            crest: found.crest || getTeamCrest(found.name || teamName) || getTeamCrest(teamName)
          });
          setTeamDetailLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to fetch team details from backend:", e);
    }
    setTeamDetailModal({
      name: teamName,
      crest: getTeamCrest(teamName),
      venue: "Official Club Stadium & Arena",
      coach: "First Team Head Coach",
      founded: 1900,
      website: `https://www.google.com/search?q=${encodeURIComponent(teamName)}+official+website`,
      squad: [
        { name: "First Team Captain", position: "Midfielder", nationality: "International", shirtNumber: 10 },
        { name: "Star Forward", position: "Attacker", nationality: "International", shirtNumber: 9 },
        { name: "Lead Defender", position: "Defender", nationality: "International", shirtNumber: 4 },
        { name: "Starting Goalkeeper", position: "Goalkeeper", nationality: "International", shirtNumber: 1 }
      ]
    });
    setTeamDetailLoading(false);
  };

  const handleOpenPlayerDetails = async (playerName: string) => {
    setPlayerDetailLoading(true);
    setPlayerDetailModal({
      id: Math.floor(Math.random() * 100000),
      name: playerName,
      position: "Forward / Midfielder",
      nationality: "International Star",
      shirtNumber: 10,
      currentTeam: {
        name: "Verified Partner Club",
        crest: getTeamCrest("PSG") || "https://crests.football-data.org/524.png",
        venue: "World Class Arena"
      }
    });
    setPlayerDetailLoading(false);
  };

  // Edit home base coordinates states
  const [isEditingHomeBase, setIsEditingHomeBase] = useState(false);
  const [editStreet, setEditStreet] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editStadium, setEditStadium] = useState("");
  const [savingHomeBase, setSavingHomeBase] = useState(false);

  // Real Map search and edit states
  const [editHomeSearchQuery, setEditHomeSearchQuery] = useState("");
  const [editStadiumSearchQuery, setEditStadiumSearchQuery] = useState("");
  const [editHomeSuggestions, setEditHomeSuggestions] = useState<any[]>([]);
  const [editStadiumSuggestions, setEditStadiumSuggestions] = useState<any[]>([]);
  const [isSearchingHomeBase, setIsSearchingHomeBase] = useState(false);
  const [isSearchingStadiumBase, setIsSearchingStadiumBase] = useState(false);

  // Debounced search for Home Address suggestions
  useEffect(() => {
    if (!editHomeSearchQuery.trim() || editHomeSearchQuery.length < 3) {
      setEditHomeSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearchingHomeBase(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(editHomeSearchQuery)}&format=json&addressdetails=1&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setEditHomeSuggestions(data);
        }
      } catch (e) {
        console.error("Home search Nominatim failed", e);
      } finally {
        setIsSearchingHomeBase(false);
      }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [editHomeSearchQuery]);

  // Debounced search for Stadium suggestions
  useEffect(() => {
    if (!editStadiumSearchQuery.trim() || editStadiumSearchQuery.length < 3) {
      setEditStadiumSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearchingStadiumBase(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(editStadiumSearchQuery)}&format=json&addressdetails=1&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setEditStadiumSuggestions(data);
        }
      } catch (e) {
        console.error("Stadium search Nominatim failed", e);
      } finally {
        setIsSearchingStadiumBase(false);
      }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [editStadiumSearchQuery]);


  // Match feed state
  const [followedMatches, setFollowedMatches] = useState<MatchDocument[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Tickets state

  // Store Marketplace State
  
  // Ticketing Seating & Pricing Intelligence States

  // Match Analysis states
  const [analysisSelectedMatchId, setAnalysisSelectedMatchId] = useState<string | null>(null);
  const [analysisMatchDetail, setAnalysisMatchDetail] = useState<any | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [analysisAILoading, setAnalysisAILoading] = useState<boolean>(false);
  const [analysisAIData, setAnalysisAIData] = useState<any | null>(null);
  const [analysisAIError, setAnalysisAIError] = useState<string | null>(null);
  const [isCustomAnalysisPrompt, setIsCustomAnalysisPrompt] = useState<boolean>(false);
  const [customAnalysisPromptQuery, setCustomAnalysisPromptQuery] = useState<string>("");

  // Agent chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [sending, setSending] = useState(false);
  const [activeMcpTools, setActiveMcpTools] = useState<string[]>([]);
  const [selectedArchStep, setSelectedArchStep] = useState<string>("langgraph");
  const [selectedService, setSelectedService] = useState<string>("hostel");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [assistantSelectedMapPlace, setAssistantSelectedMapPlace] = useState<string | null>(null);
  const [assistantSelectedStay, setAssistantSelectedStay] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Journey planner state
  const [journeyStep, setJourneyStep] = useState<number>(1);
  const [journeyMatchName, setJourneyMatchName] = useState<string>("");
  const [journeyMatchDate, setJourneyMatchDate] = useState<string>("");
  const [journeyStadium, setJourneyStadium] = useState<string>("Emirates Stadium");
  const [stadiumSearchQuery, setStadiumSearchQuery] = useState<string>("Emirates Stadium");
  const [stadiumSuggestions, setStadiumSuggestions] = useState<any[]>([]);
  const [isSearchingStadiums, setIsSearchingStadiums] = useState<boolean>(false);
  const [showStadiumDropdown, setShowStadiumDropdown] = useState<boolean>(false);
  const stadiumRef = useRef<HTMLDivElement>(null);
  const [journeyMaxPrice, setJourneyMaxPrice] = useState<number>(120);
  const [journeyAccommodationType, setJourneyAccommodationType] = useState<string>("all");
  const [journeyAmenities, setJourneyAmenities] = useState<string[]>([]);
  const [journeyStays, setJourneyStays] = useState<any[]>([]);
  const [journeyLoading, setJourneyLoading] = useState<boolean>(false);
  const [journeyError, setJourneyError] = useState<string | null>(null);
  const [journeySelectedStay, setJourneySelectedStay] = useState<any | null>(null);

  // Custom check-in/out dates override
  const [journeyCheckIn, setJourneyCheckIn] = useState<string>("");
  const [journeyCheckOut, setJourneyCheckOut] = useState<string>("");
  const [journeyMaxDistance, setJourneyMaxDistance] = useState<number>(5);
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);
  const [planningMode, setPlanningMode] = useState<'custom' | 'ai' | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>("");

  // Route planning state
  const [journeyOrigin, setJourneyOrigin] = useState<string>("");
  const [journeyRouteMode, setJourneyRouteMode] = useState<string>("transit");
  const [journeyRoutes, setJourneyRoutes] = useState<any[]>([]);
  const [journeyRouteLoading, setJourneyRouteLoading] = useState<boolean>(false);
  const [journeyRouteError, setJourneyRouteError] = useState<string | null>(null);

  // Journey AI & Explore states
  const [journeyAILoading, setJourneyAILoading] = useState<boolean>(false);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [currentLogMsg, setCurrentLogMsg] = useState<string>("");
  const [aiPlanningStages, setAiPlanningStages] = useState<AIPlanningStage[]>(DEFAULT_AI_PLANNING_STAGES);
  const [activeAIStageIndex, setActiveAIStageIndex] = useState<number>(0);
  const [completedAIStageCount, setCompletedAIStageCount] = useState<number>(0);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const [journeySelectedRoute, setJourneySelectedRoute] = useState<any | null>(null);
  const [journeySafetyBriefing, setJourneySafetyBriefing] = useState<any | null>(null);
  const [activePlacesTab, setActivePlacesTab] = useState<string>("restaurants");
  const [journeyRecommendations, setJourneyRecommendations] = useState<any | null>(null);
  const [journeyTotalFare, setJourneyTotalFare] = useState<any | null>(null);
  const [journeySummary, setJourneySummary] = useState<string>("");
  const [journeySelectedStayReason, setJourneySelectedStayReason] = useState<string>("");
  const [journeySelectedRouteReason, setJourneySelectedRouteReason] = useState<string>("");
  const [journeySafetySources, setJourneySafetySources] = useState<any[]>([]);
  const [journeyValidationChecks, setJourneyValidationChecks] = useState<any[]>([]);
  const [journeyDataWarnings, setJourneyDataWarnings] = useState<string[]>([]);
  const [showStayOptions, setShowStayOptions] = useState<boolean>(false);
  const [showRouteOptions, setShowRouteOptions] = useState<boolean>(false);
  const [activeStep5Section, setActiveStep5Section] = useState<string>("match");

  // ── Contact & Support State ──────────────────────────────────────────────
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "booking_support", orderRef: "", message: "" });
  const [contactSubmitting, setContactSubmitting] = useState<boolean>(false);
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ── Account Settings State ───────────────────────────────────────────────
  const [settingsTab, setSettingsTab] = useState<string>("profile");
  const [profileForm, setProfileForm] = useState({ displayName: "", favoriteClub: "CA Boca Juniors", currency: "USD ($)", oddsFormat: "Decimal (1.85)", defaultTravelMode: "transit" });
  const [notifPreferences, setNotifPreferences] = useState({ liveGoals: true, ticketAlerts: true, gateReminders: true, matchRoundup: false, priceDrops: true });
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // ── Fetch followed matches ───────────────────────────────────────────────
  const fetchFollowedMatches = useCallback(async (userEmail: string) => {
    setMatchesLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/v1/live-matches/followed-upcoming?email=${encodeURIComponent(userEmail)}`);
      if (r.ok) {
        const data = await r.json();
        setFollowedMatches(data.matches || []);
      }
    } catch { /* network error */ }
    finally { setMatchesLoading(false); }
  }, []);

  // ── Fetch booked tickets ──────────────────────────────────────────────────

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.push("/login"); return; }
    setEmail(user.email);

    // Load profile
    fetch(`${BACKEND}/api/v1/auth/profile?email=${encodeURIComponent(user.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUserProfile(data);
          const addressParts = [];
          if (data.street) addressParts.push(data.street);
          if (data.city) addressParts.push(data.city);
          if (data.country) addressParts.push(data.country);
          setJourneyOrigin(addressParts.join(", "));
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));

      // Pre-fetch matches and tickets for quick-select in journey planner
      fetchFollowedMatches(user.email);
  
      // Seed agent greeting
      setMessages([{
        sender: "agent",
        text: `### Operations Briefing\nWelcome **${user.name}**. I am **Globus 2026**, your autonomous matchday logistics coordinator.\n\nI am connected via the **Model Context Protocol (MCP)** to Hostel, Route, Review and Match services.\n\n*Ask me anything — "Find a hostel near my stadium", "Show upcoming fixtures", "Best pubs near Anfield"...*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, [router, fetchFollowedMatches]);

  useEffect(() => {
    if (activeTab === "dashboard" && email) fetchFollowedMatches(email);
  }, [activeTab, email, fetchFollowedMatches]);


  const handleOpenEditHomeBase = () => {
    if (userProfile) {
      setEditStreet(userProfile.street || "");
      setEditCity(userProfile.city || "");
      setEditCountry(userProfile.country || "");
      setEditStadium(userProfile.stadium || "");
      setEditHomeSearchQuery(
        [userProfile.street, userProfile.city, userProfile.country]
          .filter(Boolean)
          .join(", ")
      );
      setEditStadiumSearchQuery(userProfile.stadium || "");
    }
    setIsEditingHomeBase(true);
  };

  const handleSaveHomeBase = async () => {
    if (!email) return;
    setSavingHomeBase(true);
    try {
      const response = await fetch(`${BACKEND}/api/v1/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          followed_teams: userProfile?.followed_teams || [],
          favorite_players: userProfile?.favorite_players || [],
          country: editCountry,
          city: editCity,
          stadium: editStadium,
          street: editStreet,
        }),
      });

      if (response.ok) {
        const profileRes = await fetch(`${BACKEND}/api/v1/auth/profile?email=${encodeURIComponent(email)}`);
        if (profileRes.ok) {
          const updatedProfile = await profileRes.json();
          setUserProfile(updatedProfile);
          const addressParts = [];
          if (updatedProfile.street) addressParts.push(updatedProfile.street);
          if (updatedProfile.city) addressParts.push(updatedProfile.city);
          if (updatedProfile.country) addressParts.push(updatedProfile.country);
          setJourneyOrigin(addressParts.join(", "));
        }
        setIsEditingHomeBase(false);
      } else {
        alert("Failed to save home base coordinates.");
      }
    } catch (err) {
      console.error("Error saving coordinates:", err);
      alert("Error connecting to server.");
    } finally {
      setSavingHomeBase(false);
    }
  };




  // ── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // ── Stadium Search & Suggestions ──────────────────────────────────────────
  const POPULAR_STADIUMS = [
    "Emirates Stadium",
    "Anfield",
    "Old Trafford",
    "Stamford Bridge",
    "Etihad Stadium",
    "Tottenham Hotspur Stadium",
    "Wembley Stadium",
    "Santiago Bernabéu",
    "Camp Nou",
    "Allianz Arena",
    "Parc des Princes",
    "San Siro",
    "Signal Iduna Park",
    "Johan Cruyff Arena"
  ];

  const filteredPopularStadiums = POPULAR_STADIUMS.filter(name =>
    name.toLowerCase().includes(stadiumSearchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stadiumRef.current && !stadiumRef.current.contains(event.target as Node)) {
        setShowStadiumDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!stadiumSearchQuery.trim()) {
      setStadiumSuggestions([]);
      return;
    }

    if (stadiumSearchQuery === journeyStadium) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingStadiums(true);
      try {
        const hasStadiumKeyword = stadiumSearchQuery.toLowerCase().includes("stadium") || 
                                  stadiumSearchQuery.toLowerCase().includes("arena") || 
                                  stadiumSearchQuery.toLowerCase().includes("park") || 
                                  stadiumSearchQuery.toLowerCase().includes("estadio") || 
                                  stadiumSearchQuery.toLowerCase().includes("stade") ||
                                  stadiumSearchQuery.toLowerCase().includes("camp") ||
                                  stadiumSearchQuery.toLowerCase().includes("siro") ||
                                  stadiumSearchQuery.toLowerCase().includes("trafford") ||
                                  stadiumSearchQuery.toLowerCase().includes("bridge");
        const query = encodeURIComponent(stadiumSearchQuery + (hasStadiumKeyword ? "" : " stadium"));
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setStadiumSuggestions(data);
        }
      } catch (e) {
        console.error("Nominatim fetch failed", e);
      } finally {
        setIsSearchingStadiums(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [stadiumSearchQuery, journeyStadium]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePlanJourneyForMatch = (match: MatchDocument) => {
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

    setJourneyStep(2);
    setActiveTab("journey");
  };

  const handlePlanJourneyForTicket = (ticket: TicketDocument) => {
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

    setJourneyStep(2);
    setActiveTab("journey");
  };

  const handleLogout = () => { logoutUser(); router.push("/login"); };





  

  const handleSelectAnalysisMatch = async (matchId: string) => {
    setAnalysisSelectedMatchId(matchId);
    setAnalysisMatchDetail(null);
    setAnalysisAIData(null);
    setAnalysisAIError(null);
    
    if (!matchId) return;
    
    setAnalysisLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/v1/live-matches/match/${matchId}`);
      if (r.ok) {
        const data = await r.json();
        setAnalysisMatchDetail(data);
      } else {
        setAnalysisAIError("Failed to load match details statistics.");
      }
    } catch (exc: any) {
      setAnalysisAIError(exc?.message || "Failed to load match details statistics.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleGenerateTacticalBreakdownForMatch = async (matchData: any) => {
    setAnalysisAILoading(true);
    setAnalysisAIError(null);
    setAnalysisAIData(null);
    
    try {
      const r = await fetch(`${BACKEND}/api/v1/analysis/tactical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_data: matchData })
      });
      
      if (r.ok) {
        const data = await r.json();
        setAnalysisAIData(data);
      } else {
        const errData = await r.json();
        setAnalysisAIError(errData.detail || "Failed to generate AI tactical report.");
      }
    } catch (exc: any) {
      setAnalysisAIError(exc?.message || "Failed to generate AI tactical report.");
    } finally {
      setAnalysisAILoading(false);
    }
  };

  const handleGenerateTacticalBreakdown = async () => {
    if (!analysisMatchDetail) return;
    await handleGenerateTacticalBreakdownForMatch(analysisMatchDetail);
  };

  const handleSearchAnalysisMatchByPrompt = async () => {
    if (!customAnalysisPromptQuery.trim()) return;
    setAnalysisLoading(true);
    setAnalysisAIError(null);
    setAnalysisAIData(null);
    setAnalysisMatchDetail(null);
    
    try {
      const res = await fetch(`${BACKEND}/api/v1/analysis/prompt-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: customAnalysisPromptQuery })
      });
      
      if (res.ok) {
        const matchData = await res.json();
        setAnalysisMatchDetail(matchData);
        setAnalysisSelectedMatchId(matchData.id);
        
        // Automatically trigger breakdown
        handleGenerateTacticalBreakdownForMatch(matchData);
      } else {
        const err = await res.json();
        setAnalysisAIError(err.detail || "Failed to find match from prompt.");
      }
    } catch (e: any) {
      setAnalysisAIError(e?.message || "Failed to connect to search service.");
    } finally {
      setAnalysisLoading(false);
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || !email || sending) return;
    const query = inputVal.trim();
    setInputVal("");
    setSending(true);
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { sender: "user", text: query, timestamp: ts }]);

    try {
      const r = await fetch(`${BACKEND}/api/v1/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, query, lodging: assistantSelectedStay }),
      });
      const data = await r.json();
      const toolsCalled: string[] = (data.tool_calls || []).map((t: { name: string }) => t.name);
      setActiveMcpTools(toolsCalled);
      if (toolsCalled.length) {
        setSelectedArchStep("mcp-server");
        if (toolsCalled.includes("search_hostels") || toolsCalled.includes("search_stays")) setSelectedService("hostel");
        else if (toolsCalled.includes("get_directions")) setSelectedService("route");
        else if (toolsCalled.includes("get_food_reviews")) setSelectedService("review");
        else if (toolsCalled.includes("get_team_matches")) setSelectedService("match");
      }
      setTimeout(() => setActiveMcpTools([]), 6000);

      // Extract locations from action_details to auto-focus map
      if (data.action_details && Array.isArray(data.action_details)) {
        for (const detail of data.action_details) {
          if (detail.status === "success") {
            if (detail.stays && detail.stays.length > 0) {
              const firstStay = detail.stays[0];
              setAssistantSelectedStay(firstStay.name);
              setAssistantSelectedMapPlace(firstStay.name);
            } else if (detail.routes && detail.routes.length > 0) {
              setAssistantSelectedMapPlace(journeyStadium || "Emirates Stadium");
            } else if (detail.reviews) {
              if (detail.venue) {
                setAssistantSelectedMapPlace(detail.venue);
              }
            }
          }
        }
      }

      setMessages(prev => [...prev, {
        sender: "agent",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolCalls: data.tool_calls,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        sender: "agent",
        text: "⚠️ **Agent connection interrupted.** Please ensure the backend server is online.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally { setSending(false); }
  };

  const handleSendDirectQuery = async (queryText: string) => {
    if (!queryText.trim() || !email || sending) return;
    setSending(true);
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { sender: "user", text: queryText, timestamp: ts }]);

    try {
      const r = await fetch(`${BACKEND}/api/v1/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, query: queryText, lodging: assistantSelectedStay }),
      });
      const data = await r.json();
      const toolsCalled: string[] = (data.tool_calls || []).map((t: { name: string }) => t.name);
      setActiveMcpTools(toolsCalled);
      if (toolsCalled.length) {
        setSelectedArchStep("mcp-server");
        if (toolsCalled.includes("search_hostels") || toolsCalled.includes("search_stays")) setSelectedService("hostel");
        else if (toolsCalled.includes("get_directions")) setSelectedService("route");
        else if (toolsCalled.includes("get_food_reviews")) setSelectedService("review");
        else if (toolsCalled.includes("get_team_matches")) setSelectedService("match");
      }
      setTimeout(() => setActiveMcpTools([]), 6000);

      // Extract locations from action_details to auto-focus map
      if (data.action_details && Array.isArray(data.action_details)) {
        for (const detail of data.action_details) {
          if (detail.status === "success") {
            if (detail.stays && detail.stays.length > 0) {
              const firstStay = detail.stays[0];
              setAssistantSelectedStay(firstStay.name);
              setAssistantSelectedMapPlace(firstStay.name);
            } else if (detail.routes && detail.routes.length > 0) {
              setAssistantSelectedMapPlace(journeyStadium || "Emirates Stadium");
            } else if (detail.reviews) {
              if (detail.venue) {
                setAssistantSelectedMapPlace(detail.venue);
              }
            }
          }
        }
      }

      setMessages(prev => [...prev, {
        sender: "agent",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolCalls: data.tool_calls,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        sender: "agent",
        text: "⚠️ **Agent connection interrupted.** Please ensure the backend server is online.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally { setSending(false); }
  };

  const handleAIPlan = async () => {
    if (!aiPrompt.trim() || !email || journeyAILoading) return;
    setJourneyAILoading(true);
    setJourneyError(null);
    setLoadingLogs([]);
    setAiPlanningStages(DEFAULT_AI_PLANNING_STAGES);
    setActiveAIStageIndex(0);
    setCompletedAIStageCount(0);
    setCurrentLogMsg("Initializing Globus 2026 AI planner...");
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      const res = await fetch(`${BACKEND}/api/v1/agent/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, prompt: aiPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          const resultStages: AIPlanningStage[] = data.planningStages?.length ? data.planningStages : DEFAULT_AI_PLANNING_STAGES;
          setAiPlanningStages(resultStages);
          setJourneyMatchName(data.matchName || "");
          setJourneyMatchDate(data.matchDate || "");
          setJourneyStadium(data.stadium || "");
          setStadiumSearchQuery(data.stadium || "");
          setJourneySelectedStay(data.selectedStay || null);
          setJourneySelectedStayReason(data.selectedStayReason || "");
          setJourneySelectedRoute(data.selectedRoute || data.routes?.[0] || null);
          setJourneySelectedRouteReason(data.selectedRouteReason || "");
          setJourneyStays(data.stayOptions || data.stays || (data.selectedStay ? [data.selectedStay] : []));
          setJourneyRoutes(data.routeOptions || data.routes || []);
          setJourneySafetyBriefing(data.safetyBriefing || null);
          setJourneySafetySources(data.safetySources || data.safetyBriefing?.sourcesUsed || []);
          setJourneyValidationChecks(data.validationChecks || []);
          setJourneyDataWarnings(data.dataWarnings || []);
          setJourneyRecommendations(data.recommendations || null);
          setJourneyTotalFare(data.totalFare || null);
          setJourneySummary(data.summary || "");
          setSelectedRouteIdx(0);
          setShowStayOptions(true);
          setShowRouteOptions(true);
          setActivePlacesTab("restaurants");

          for (let idx = 0; idx < resultStages.length; idx++) {
            setActiveAIStageIndex(idx);
            setCompletedAIStageCount(idx);
            setCurrentLogMsg(resultStages[idx].brief || resultStages[idx].label);
            setLoadingLogs(prev => [...prev, resultStages[idx].brief || resultStages[idx].label]);
            await wait(900);
            setCompletedAIStageCount(idx + 1);
            await wait(350);
          }
          setCurrentLogMsg("Plan ready.");
          await wait(450);
          setJourneyStep(5);
        } else {
          setJourneyError(data.detail || "Failed to generate AI plan. Please refine your prompt constraints.");
        }
      } else {
        setJourneyError("Error connecting to Globus AI planning engine.");
      }
    } catch (err) {
      setJourneyError("Could not reach AI planning engine backend.");
    } finally {
      setJourneyAILoading(false);
    }
  };

  // ── Tab Content Renderers ──────────────────────────────────────────────────



  // ── Match Analysis Helpers ────────────────────────────────────────────────
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

  const renderAnalysisStatBar = (label: string, homeVal: any, awayVal: any) => {
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
            {points.map((p, idx) => (
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


  const renderPlaceholder = (title: string, desc: string, icon: React.ReactNode) => (
    <div className="placeholder-tab">
      <div className="placeholder-icon">{icon}</div>
      <div className="placeholder-title">{title}</div>
      <div className="placeholder-desc">{desc}</div>
      <div style={{ marginTop: "1.5rem", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)", borderRadius: "0.75rem", padding: "1rem 1.5rem", textAlign: "left", maxWidth: 460, fontSize: "0.78rem", fontFamily: "monospace", color: "var(--text-secondary)", lineHeight: 1.7 }}>
        <div style={{ color: "#10b981", fontWeight: 700, marginBottom: "0.5rem" }}>{"// TO BE IMPLEMENTED"}</div>
        <div>{"// This section will connect to real data and backend services."}</div>
        <div>{"// Feature development tracked in implementation_plan.md"}</div>
      </div>
    </div>
  );

  // ── Professional Contact & Support Center ─────────────────────────────────
  const renderContact = () => {
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
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">🎟️</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Ticket & Booking Assistance</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Seat allocations, mobile ticket delivery, or payment queries.</p>
              </div>
            </div>
            <div className="text-[11px] font-medium text-emerald-400 border-t border-zinc-800/80 pt-2.5 flex items-center justify-between">
              <span>Average response: &lt;15 mins</span>
              <span>Priority Support →</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between gap-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">🏟️</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Matchday Access & Travel</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Turnstile navigation, gate opening times, or transit updates.</p>
              </div>
            </div>
            <div className="text-[11px] font-medium text-cyan-400 border-t border-zinc-800/80 pt-2.5 flex items-center justify-between">
              <span>Live Matchday Desk</span>
              <span>View Guides →</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between gap-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">🤝</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Partnerships & Hospitality</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Corporate suites, group bookings, or club licensing inquiries.</p>
              </div>
            </div>
            <div className="text-[11px] font-medium text-amber-400 border-t border-zinc-800/80 pt-2.5 flex items-center justify-between">
              <span>Dedicated Manager</span>
              <span>Inquire Now →</span>
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
              <span>Offside Support Center • London & Buenos Aires</span>
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
                        <span className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180 text-emerald-400" : "text-zinc-500"}`}>▼</span>
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
                  <span>24/7 Matchdays • Mon-Fri 8am-8pm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Professional Account & Preferences Center ─────────────────────────────





  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardHomeView />;
      case "store": return <StoreView />;
      case "tickets": return <TicketsView />;
      case "assistant": return <AssistantView />;
      case "journey": return <JourneyPlannerView />;
      case "analysis": return <AnalysisView />;
      case "contact": return <ContactView />;
      case "settings": return <SettingsView />;
    }
  };

  const currentNav = NAV_ITEMS.find(n => n.id === activeTab);
  const userInitial = userProfile?.name?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || "U";

  // ── Render ─────────────────────────────────────────────────────────────────
  const dashboardContextValue = {
    email,
    userProfile,
    setUserProfile,
    activeTab,
    setActiveTab,
    handleLogout,
    setEmail,
    profileLoading,
    setProfileLoading,
    teamDetailModal,
    setTeamDetailModal,
    teamDetailLoading,
    setTeamDetailLoading,
    playerDetailModal,
    setPlayerDetailModal,
    playerDetailLoading,
    setPlayerDetailLoading,
    isEditingHomeBase,
    setIsEditingHomeBase,
    editStreet,
    setEditStreet,
    editCity,
    setEditCity,
    editCountry,
    setEditCountry,
    editStadium,
    setEditStadium,
    savingHomeBase,
    setSavingHomeBase,
    editHomeSearchQuery,
    setEditHomeSearchQuery,
    editStadiumSearchQuery,
    setEditStadiumSearchQuery,
    editHomeSuggestions,
    setEditHomeSuggestions,
    editStadiumSuggestions,
    setEditStadiumSuggestions,
    isSearchingHomeBase,
    setIsSearchingHomeBase,
    isSearchingStadiumBase,
    setIsSearchingStadiumBase,
    followedMatches,
    setFollowedMatches,
    matchesLoading,
    setMatchesLoading,
    analysisSelectedMatchId,
    setAnalysisSelectedMatchId,
    analysisMatchDetail,
    setAnalysisMatchDetail,
    analysisLoading,
    setAnalysisLoading,
    analysisAILoading,
    setAnalysisAILoading,
    analysisAIData,
    setAnalysisAIData,
    analysisAIError,
    setAnalysisAIError,
    isCustomAnalysisPrompt,
    setIsCustomAnalysisPrompt,
    customAnalysisPromptQuery,
    setCustomAnalysisPromptQuery,
    messages,
    setMessages,
    inputVal,
    setInputVal,
    sending,
    setSending,
    activeMcpTools,
    setActiveMcpTools,
    selectedArchStep,
    setSelectedArchStep,
    selectedService,
    setSelectedService,
    assistantSelectedMapPlace,
    setAssistantSelectedMapPlace,
    assistantSelectedStay,
    setAssistantSelectedStay,
    journeyStep,
    setJourneyStep,
    journeyMatchName,
    setJourneyMatchName,
    journeyMatchDate,
    setJourneyMatchDate,
    journeyStadium,
    setJourneyStadium,
    stadiumSearchQuery,
    setStadiumSearchQuery,
    stadiumSuggestions,
    setStadiumSuggestions,
    isSearchingStadiums,
    setIsSearchingStadiums,
    showStadiumDropdown,
    setShowStadiumDropdown,
    journeyMaxPrice,
    setJourneyMaxPrice,
    journeyAccommodationType,
    setJourneyAccommodationType,
    journeyAmenities,
    setJourneyAmenities,
    journeyStays,
    setJourneyStays,
    journeyLoading,
    setJourneyLoading,
    journeyError,
    setJourneyError,
    journeySelectedStay,
    setJourneySelectedStay,
    journeyCheckIn,
    setJourneyCheckIn,
    journeyCheckOut,
    setJourneyCheckOut,
    journeyMaxDistance,
    setJourneyMaxDistance,
    showMoreFilters,
    setShowMoreFilters,
    planningMode,
    setPlanningMode,
    aiPrompt,
    setAiPrompt,
    journeyOrigin,
    setJourneyOrigin,
    journeyRouteMode,
    setJourneyRouteMode,
    journeyRoutes,
    setJourneyRoutes,
    journeyRouteLoading,
    setJourneyRouteLoading,
    journeyRouteError,
    setJourneyRouteError,
    journeyAILoading,
    setJourneyAILoading,
    loadingLogs,
    setLoadingLogs,
    currentLogMsg,
    setCurrentLogMsg,
    aiPlanningStages,
    setAiPlanningStages,
    activeAIStageIndex,
    setActiveAIStageIndex,
    completedAIStageCount,
    setCompletedAIStageCount,
    selectedRouteIdx,
    setSelectedRouteIdx,
    journeySelectedRoute,
    setJourneySelectedRoute,
    journeySafetyBriefing,
    setJourneySafetyBriefing,
    activePlacesTab,
    setActivePlacesTab,
    journeyRecommendations,
    setJourneyRecommendations,
    journeyTotalFare,
    setJourneyTotalFare,
    journeySummary,
    setJourneySummary,
    journeySelectedStayReason,
    setJourneySelectedStayReason,
    journeySelectedRouteReason,
    setJourneySelectedRouteReason,
    journeySafetySources,
    setJourneySafetySources,
    journeyValidationChecks,
    setJourneyValidationChecks,
    journeyDataWarnings,
    setJourneyDataWarnings,
    showStayOptions,
    setShowStayOptions,
    showRouteOptions,
    setShowRouteOptions,
    activeStep5Section,
    setActiveStep5Section,
    settingsTab,
    setSettingsTab,
    profileForm,
    setProfileForm,
    notifPreferences,
    setNotifPreferences,
    settingsSaved,
    setSettingsSaved,
    handleOpenTeamDetails,
    handleOpenPlayerDetails,
    handleOpenEditHomeBase,
    handleSaveHomeBase,
    handlePlanJourneyForMatch,
    handlePlanJourneyForTicket,
    handleSelectAnalysisMatch,
    handleGenerateTacticalBreakdownForMatch,
    handleGenerateTacticalBreakdown,
    handleSearchAnalysisMatchByPrompt,
    handleSendMessage,
    handleSendDirectQuery,
    handleAIPlan,
    fetchFollowedMatches,
    contactForm,
    setContactForm,
    contactSubmitting,
    setContactSubmitting,
    contactSubmitted,
    setContactSubmitted,
    openFaq,
    setOpenFaq
  };
  return (
      <DashboardProvider value={dashboardContextValue}>
    <main className="min-h-screen selection:bg-emerald-500 selection:text-white relative">
      <FloatingSettings />

      {/* Top header bar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b backdrop-blur-md"
        style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="font-extrabold text-xl tracking-tighter text-emerald-500 hover:scale-105 transition-transform">O</Link>
          <div className="h-5 w-px bg-emerald-500/20" />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-500/70">Offside AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-emerald-500 transition-colors">Home</Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard shell: sidebar + content */}
      <div className="dashboard-shell">
        {/* Sidebar navigation */}
        <nav className="dashboard-nav">
          {/* User block */}
          <div className="nav-user-block">
            <div className="nav-avatar">{userInitial}</div>
            <div className="nav-user-info">
              <div className="nav-user-name">{userProfile?.name || "Loading…"}</div>
              <div className="nav-user-email">{email || ""}</div>
            </div>
          </div>

          <div className="nav-section-title">Main</div>

          {NAV_ITEMS.slice(0, 4).map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="nav-section-title">More</div>

          {NAV_ITEMS.slice(4).map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </button>
          ))}

          <div className="nav-spacer" />

          <div className="nav-bottom">
            <button onClick={handleLogout} className="nav-item" style={{ color: "#f87171" }}>
              <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
              </svg>
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </nav>

        {/* Main content */}
        <div className="dashboard-content">
          <div className="content-header">
            <div>
              <div className="content-title">{currentNav?.label}</div>
              <div className="content-subtitle">
                {activeTab === "dashboard" && "Your personalized match intelligence center"}
                {activeTab === "tickets" && "Manage your match ticket bookings"}
                {activeTab === "assistant" && "LangGraph agent powered by MCP tool services"}
                {activeTab === "journey" && "Plan optimal travel routes to any stadium"}
                {activeTab === "analysis" && "AI-driven match statistics and insights"}
                {activeTab === "contact" && "Get in touch with our team"}
                {activeTab === "settings" && "Configure your account preferences"}
              </div>
            </div>
          </div>

          {renderTabContent()}
        </div>
      </div>

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

      {/* P2P Store Listing Modal */}
      
    </main>
      </DashboardProvider>
  );
}
