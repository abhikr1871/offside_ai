"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FloatingSettings from "../../components/FloatingSettings";
import { getCurrentUser, logoutUser } from "../../lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  followed_teams: string[];
  favorite_players: string[];
  country: string;
  city: string;
  stadium: string;
  street: string;
  onboarded: boolean;
}

interface MatchDocument {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string;
  awayCrest?: string;
  homeScore: number;
  awayScore: number;
  minute: string;
  isLive: boolean;
  status: string;
  venue?: string;
  eventDate?: string;
  league?: string;
  league_code?: string;
  sourceName?: string;
}

interface TicketDocument {
  booking_id: string;
  email: string;
  match_id: string;
  home_team: string;
  away_team: string;
  home_crest?: string;
  away_crest?: string;
  match_date?: string;
  venue?: string;
  competition?: string;
  league_code?: string;
  booked_at: string;
  status: string;
}

interface ChatMessage {
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
}

interface AIPlanningStage {
  id: string;
  label: string;
  brief: string;
  details?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BACKEND = "http://localhost:8080";

const TEAM_CRESTS: Record<string, string> = {
  "Arsenal": "https://crests.football-data.org/57.png",
  "Chelsea": "https://crests.football-data.org/61.png",
  "Liverpool": "https://crests.football-data.org/64.png",
  "Manchester City": "https://crests.football-data.org/65.png",
  "Manchester United": "https://crests.football-data.org/66.png",
  "Tottenham Hotspur": "https://crests.football-data.org/73.png",
  "Aston Villa": "https://crests.football-data.org/58.png",
  "Newcastle United": "https://crests.football-data.org/67.png",
  "Real Madrid CF": "https://crests.football-data.org/86.png",
  "FC Barcelona": "https://crests.football-data.org/81.png",
  "Club Atlético de Madrid": "https://crests.football-data.org/78.png",
  "Sevilla FC": "https://crests.football-data.org/95.png",
  "Girona FC": "https://crests.football-data.org/298.png",
  "Juventus FC": "https://crests.football-data.org/109.png",
  "FC Internazionale Milano": "https://crests.football-data.org/108.png",
  "AC Milan": "https://crests.football-data.org/98.png",
  "SSC Napoli": "https://crests.football-data.org/113.png",
  "AS Roma": "https://crests.football-data.org/100.png",
  "FC Bayern München": "https://crests.football-data.org/5.png",
  "Borussia Dortmund": "https://crests.football-data.org/4.png",
  "Bayer 04 Leverkusen": "https://crests.football-data.org/3.png",
  "RB Leipzig": "https://crests.football-data.org/172.png",
};

const MCP_SERVICES = [
  { id: "hostel", name: "Hostel Service", tool: "search_stays(stadium, accommodation_type, max_price, min_rating, required_amenities, sort_by)", desc: "Find fan-friendly hotels, hostels, shared rooms, and airbnbs near stadium gates within your budget." },
  { id: "route",  name: "Route Service",  tool: "get_directions(origin, destination, mode)", desc: "Calculate transit, taxi, and walking routes to any stadium." },
  { id: "review", name: "Review Service", tool: "get_food_reviews(venue)", desc: "Pre-match pub ratings and food stall recommendations." },
  { id: "match",  name: "Match Service",  tool: "get_team_matches(team_name)", desc: "Upcoming fixtures and competition schedule for followed clubs." },
];

const DEFAULT_AI_PLANNING_STAGES: AIPlanningStage[] = [
  { id: "understand", label: "Understand request", brief: "Extracting city, dates, budget, team, stadium, stay, and route constraints." },
  { id: "match", label: "Find match", brief: "Searching the schedule and selecting the strongest matching fixture." },
  { id: "stay", label: "Find stay", brief: "Ranking hotels, hostels, shared rooms, and airbnbs by price, rating, and distance." },
  { id: "route", label: "Find route / flight", brief: "Building flight, train, transit, taxi, and walking route options." },
  { id: "validate", label: "Validate and brief", brief: "Checking budget, route feasibility, safety grounding, and final fare." },
];

type TabId = "dashboard" | "journey" | "tickets" | "assistant" | "analysis" | "contact" | "settings";

const NAV_ITEMS: Array<{ id: TabId; label: string; icon: React.ReactNode; badge?: string }> = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    id: "journey",
    label: "Plan your Journey",
    icon: (
      <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
    ),
  },
  {
    id: "tickets",
    label: "Book your Ticket",
    icon: (
      <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    ),
  },
  {
    id: "assistant",
    label: "Matchday Assistant",
    icon: (
      <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    badge: "AI",
  },
  {
    id: "analysis",
    label: "Match Analysis",
    icon: (
      <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
      </svg>
    ),
  },
  {
    id: "contact",
    label: "Contact Us",
    icon: (
      <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMatchDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function formatShortDateRange(inDate?: string, outDate?: string) {
  if (!inDate) return "Jun 09 - Jun 10";
  try {
    const d1 = new Date(inDate);
    const d2 = outDate ? new Date(outDate) : new Date(d1.getTime() + 86400000);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit" };
    return `${d1.toLocaleDateString("en-US", options)} - ${d2.toLocaleDateString("en-US", options)}`;
  } catch {
    return `${inDate} - ${outDate || "TBD"}`;
  }
}

function statusChipClass(status: string) {
  const s = (status || "").toUpperCase();
  if (["IN_PLAY", "PAUSED", "LIVE"].includes(s)) return "live";
  if (["FINISHED", "FT"].includes(s)) return "finished";
  return "scheduled";
}

function statusLabel(status: string) {
  const s = (status || "").toUpperCase();
  if (["IN_PLAY", "PAUSED"].includes(s)) return "LIVE";
  if (["FINISHED", "FT"].includes(s)) return "FT";
  return "UPCOMING";
}

// ─── Markdown renderer (for chat bubbles) ─────────────────────────────────────

function renderMd(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
    if (line.startsWith("#### ")) return <h4 key={i}>{line.slice(5)}</h4>;
    if (line.trim().startsWith("- ")) {
      const parts = line.trim().slice(2).split("**");
      return <li key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</li>;
    }
    if (line.includes("**")) {
      const parts = line.split("**");
      return <p key={i} className="my-1">{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
    }
    if (line.trim().startsWith("```")) return null;
    return line.trim() ? <p key={i} className="my-1">{line}</p> : <div key={i} className="h-2" />;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [email, setEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Match feed state
  const [followedMatches, setFollowedMatches] = useState<MatchDocument[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [bookedMatchIds, setBookedMatchIds] = useState<Set<string>>(new Set());
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<TicketDocument[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Agent chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [sending, setSending] = useState(false);
  const [activeMcpTools, setActiveMcpTools] = useState<string[]>([]);
  const [selectedArchStep, setSelectedArchStep] = useState<string>("langgraph");
  const [selectedService, setSelectedService] = useState<string>("hostel");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Journey planner state
  const [journeyStep, setJourneyStep] = useState<number>(1);
  const [journeyMatchName, setJourneyMatchName] = useState<string>("");
  const [journeyMatchDate, setJourneyMatchDate] = useState<string>("");
  const [journeyStadium, setJourneyStadium] = useState<string>("Emirates Stadium");
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
  const fetchTickets = useCallback(async (userEmail: string) => {
    setTicketsLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/v1/tickets?email=${encodeURIComponent(userEmail)}`);
      if (r.ok) {
        const data = await r.json();
        setTickets(data);
        setBookedMatchIds(new Set(data.map((t: TicketDocument) => t.match_id)));
      }
    } catch { }
    finally { setTicketsLoading(false); }
  }, []);

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
    fetchTickets(user.email);

    // Seed agent greeting
    setMessages([{
      sender: "agent",
      text: `### Operations Briefing\nWelcome **${user.name}**. I am **Globus 2026**, your autonomous matchday logistics coordinator.\n\nI am connected via the **Model Context Protocol (MCP)** to Hostel, Route, Review and Match services.\n\n*Ask me anything — "Find a hostel near my stadium", "Show upcoming fixtures", "Best pubs near Anfield"...*`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
  }, [router, fetchFollowedMatches, fetchTickets]);

  useEffect(() => {
    if (activeTab === "dashboard" && email) fetchFollowedMatches(email);
  }, [activeTab, email, fetchFollowedMatches]);

  useEffect(() => {
    if (activeTab === "tickets" && email) fetchTickets(email);
  }, [activeTab, email, fetchTickets]);


  // ── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePlanJourneyForMatch = (match: MatchDocument) => {
    const matchDateStr = match.eventDate ? match.eventDate.split("T")[0] : "";
    setJourneyMatchName(`${match.homeTeam} vs ${match.awayTeam}`);
    setJourneyMatchDate(matchDateStr);
    setJourneyStadium(match.venue || "Emirates Stadium");

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

  const handleBookTicket = async (match: MatchDocument) => {
    if (!email || bookingInProgress) return;
    setBookingInProgress(match.id);
    try {
      const r = await fetch(`${BACKEND}/api/v1/tickets/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          match_id: match.id,
          home_team: match.homeTeam,
          away_team: match.awayTeam,
          home_crest: match.homeCrest || "",
          away_crest: match.awayCrest || "",
          match_date: match.eventDate || "",
          venue: match.venue || "",
          competition: match.league || "",
          league_code: match.league_code || "",
        }),
      });
      if (r.ok) {
        setBookedMatchIds(prev => new Set([...prev, match.id]));
      }
    } catch { }
    finally { setBookingInProgress(null); }
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
        body: JSON.stringify({ email, query }),
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

  const renderDashboard = () => (
    <>
      {/* Profile widgets row */}
      <div className="profile-grid">
        {/* Fan Deck */}
        <div className="glass-card profile-widget">
          <div className="section-label">Personalised Fan Deck</div>
          {profileLoading ? (
            <div className="loading-shimmer" style={{ height: 80, borderRadius: 8 }} />
          ) : userProfile ? (
            <>
              <div className="mb-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-2">Followed Teams</p>
                <div className="team-badge-list">
                  {userProfile.followed_teams.map(team => (
                    <span key={team} className="team-badge">
                      {TEAM_CRESTS[team] && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={TEAM_CRESTS[team]} alt={team} />
                      )}
                      {team}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-2">Favourite Players</p>
                <div className="team-badge-list">
                  {userProfile.favorite_players.map(p => (
                    <span key={p} className="team-badge">⭐ {p}</span>
                  ))}
                </div>
              </div>
              <div className="mt-3 text-[11px] text-zinc-400">
                Signed in as <span className="text-emerald-500 font-semibold">{email}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-400">Could not load profile.</p>
          )}
        </div>

        {/* Home Base HUD */}
        <div className="glass-card profile-widget">
          <div className="section-label">Home Base Coordinates</div>
          {profileLoading ? (
            <div className="loading-shimmer" style={{ height: 80, borderRadius: 8 }} />
          ) : userProfile ? (
            <div className="coord-hud">
              <div className="coord-scanline" />
              {[
                ["STREET", userProfile.street || "—"],
                ["CITY", userProfile.city || "—"],
                ["COUNTRY", userProfile.country || "—"],
                ["TARGET STADIUM", userProfile.stadium || "—"],
              ].map(([label, val]) => (
                <div key={label} className="coord-row">
                  <span className="coord-label">{label}</span>
                  <span>{val}</span>
                </div>
              ))}
              <div className="text-[10px] text-emerald-500/40 font-mono mt-2">GEOLOCATE STATUS: ONLINE</div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No location data.</p>
          )}
        </div>
      </div>

      {/* Upcoming matches of followed teams */}
      <div>
        <div className="matches-section-title">
          Upcoming Matches — Your Followed Teams
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
            {followedMatches.map(match => {
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
                    <span className="match-league-badge">{match.league_code || match.league || "—"}</span>
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
                        <span className="match-score">{match.homeScore} – {match.awayScore}</span>
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
                    <span className="match-venue-text">{match.venue || "—"}</span>
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
                        {isBooking ? "Booking…" : "Book Ticket"}
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

  const renderTickets = () => (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="section-label">My Booked Tickets</div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            All confirmed match bookings for your account
          </p>
        </div>
        <button
          onClick={() => email && fetchTickets(email)}
          className="text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {ticketsLoading ? (
        <div className="tickets-grid">
          {[1, 2, 3].map(i => <div key={i} className="loading-shimmer shimmer-card" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <svg width="42" height="42" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
          </svg>
          <p className="text-sm font-semibold">No tickets booked yet.</p>
          <p className="text-xs">Go to Dashboard and click <strong>Book Ticket</strong> on an upcoming match.</p>
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map(t => (
            <div key={t.booking_id} className="glass-card ticket-card">
              <div className="ticket-header">
                <div className="ticket-match-name">{t.home_team} vs {t.away_team}</div>
                <div className="ticket-competition">{t.competition || t.league_code || "Match"}</div>
              </div>
              <div className="ticket-body">
                {t.match_date && (
                  <div className="ticket-detail-row">
                    <svg className="ticket-detail-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                    <span className="ticket-detail-label">Date</span>
                    <span className="ticket-detail-value">{formatMatchDate(t.match_date)}</span>
                  </div>
                )}
                {t.venue && (
                  <div className="ticket-detail-row">
                    <svg className="ticket-detail-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                    <span className="ticket-detail-label">Venue</span>
                    <span className="ticket-detail-value">{t.venue}</span>
                  </div>
                )}
                <div className="ticket-detail-row">
                  <svg className="ticket-detail-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                  <span className="ticket-detail-label">Booked</span>
                  <span className="ticket-detail-value">{formatMatchDate(t.booked_at)}</span>
                </div>
              </div>
              <div className="ticket-footer">
                <button
                  className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  onClick={() => handlePlanJourneyForTicket(t)}
                >
                  Plan Journey
                </button>
                <span className="ticket-status-pill">{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderAssistant = () => (
    <div style={{ display: "flex", gap: "1.25rem", height: "calc(100vh - 180px)", minHeight: 500 }}>
      {/* Left: Architecture panel */}
      <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="glass-card arch-panel">
          <div className="section-label">Agent Flow</div>
          <div className="arch-flow">
            {["frontend", "langgraph", "mcp-client", "mcp-server"].map((step, i) => {
              const labels = ["Frontend UI", "LangGraph Agent", "MCP Client", "MCP Tool Server"];
              const isActive = selectedArchStep === step || (step === "mcp-server" && activeMcpTools.length > 0);
              return (
                <div key={step} className={`arch-node ${isActive ? "active" : ""}`} onClick={() => setSelectedArchStep(step)}>
                  <div className="arch-dot" />
                  <span style={{ fontSize: "0.75rem" }}>{labels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card arch-panel" style={{ flexGrow: 1 }}>
          <div className="section-label">MCP Services</div>
          <div className="service-list">
            {MCP_SERVICES.map(s => {
              const toolKey = s.id === "hostel" ? "search_hostels" : s.id === "route" ? "get_directions" : s.id === "review" ? "get_food_reviews" : "get_team_matches";
              const isActive = activeMcpTools.includes(toolKey);
              return (
                <div key={s.id} className={`service-item ${selectedService === s.id ? "active" : ""} ${isActive ? "active" : ""}`} onClick={() => setSelectedService(s.id)}>
                  <div className="service-item-name">
                    {s.name}
                    {isActive && <span style={{ marginLeft: 6, fontSize: "0.6rem", background: "#10b981", color: "white", padding: "1px 5px", borderRadius: 3 }}>LIVE</span>}
                  </div>
                  <div className="service-item-tool">{s.tool}</div>
                </div>
              );
            })}
          </div>
          {selectedService && (
            <div className="service-detail-drawer">
              {MCP_SERVICES.find(s => s.id === selectedService)?.desc}
            </div>
          )}
        </div>
      </div>

      {/* Right: Chat terminal */}
      <div className="glass-card agent-terminal" style={{ flex: 1 }}>
        <div className="terminal-header">
          <div className="terminal-title">
            <span className="terminal-dot" />
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#10b981" }}>
              Globus 2026 — Agent Terminal
            </span>
          </div>
          <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "var(--text-secondary)", opacity: 0.5 }}>NODE STATUS: ACTIVE</span>
        </div>

        <div className="terminal-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-bubble ${msg.sender}`}>
              {msg.sender === "agent" ? (
                <>
                  {renderMd(msg.text)}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="tool-calls-panel">
                      <div style={{ fontWeight: 700, color: "var(--text-secondary)", opacity: 0.6, marginBottom: 4, fontSize: "0.68rem" }}>⚡ Tool calls</div>
                      {msg.toolCalls.map((tc, ti) => (
                        <div key={ti} className="tool-call-item">{tc.name}({JSON.stringify(tc.arguments)})</div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p>{msg.text}</p>
              )}
              <span className="msg-timestamp">{msg.timestamp}</span>
            </div>
          ))}
          {sending && (
            <div className="msg-bubble agent">
              <div className="typing-dots">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="terminal-input" onSubmit={handleSendMessage}>
          <input
            className="terminal-input-field"
            placeholder="Ask about hostels, directions, food spots, or fixtures..."
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            disabled={sending}
            autoFocus
          />
          <button type="submit" className="terminal-send-btn" disabled={!inputVal.trim() || sending}>
            Send
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );

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

  const renderJourney = () => {
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
      setJourneyAmenities(prev =>
        prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
      );
    };

    const handleQuickSelect = (match: MatchDocument) => {
      const matchDateStr = match.eventDate ? match.eventDate.split("T")[0] : "";
      setJourneyMatchName(`${match.homeTeam} vs ${match.awayTeam}`);
      setJourneyMatchDate(matchDateStr);
      setJourneyStadium(match.venue || "Emirates Stadium");
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
            {aiPlanningStages.map((stage, idx) => {
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
                          {stage.details.slice(0, 3).map((detail, dIdx) => (
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
                  <div className="text-xl">✨</div>
                </div>
              </div>

              {/* Terminal body */}
              <div className="bg-black/40 rounded-xl p-4 border border-zinc-850 h-44 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-1.5 scrollbar-thin text-left">
                {loadingLogs.map((log, lIdx) => (
                  <div key={lIdx} className="flex gap-2 text-left animate-slide-up text-zinc-400">
                    <span className="text-violet-500">▶</span>
                    <span>{log}</span>
                  </div>
                ))}
                <div className="flex gap-2 text-left text-violet-400 font-extrabold">
                  <span className="text-violet-500 animate-blink">▋</span>
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
                onClick={() => setJourneyStep(prev => prev - 1)}
                className="text-xs font-bold text-zinc-500 hover:text-emerald-500 cursor-pointer"
              >
                ← Back
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

            {/* ── Mode Selector (shown until user picks) ─────────────────── */}
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
                        🎯
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="font-extrabold text-white text-sm group-hover:text-emerald-400 transition-colors">Plan Yourself</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Fill in match details, pick your stadium, set your budget and preferences — full control in your hands.
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
                        <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
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
                        ✨
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
                        <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ── Custom Planning Form ───────────────────────────────────── */}
            {planningMode === 'custom' && (
              <div className="space-y-5">
                {/* Back to mode select */}
                <div className="flex items-center gap-3 pb-1">
                  <button
                    onClick={() => setPlanningMode(null)}
                    className="text-xs font-bold text-zinc-500 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    ← Change mode
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm">🎯</span>
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Plan Yourself</span>
                  </div>
                </div>

                {/* Quick-select Row */}
                {((followedMatches && followedMatches.length > 0) || (tickets && tickets.length > 0)) && (
                  <div className="space-y-3">
                    <div className="section-label">Quick Select Match</div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {tickets.slice(0, 3).map(ticket => (
                        <button
                          key={ticket.booking_id}
                          onClick={() => handleTicketQuickSelect(ticket)}
                          className="flex-shrink-0 w-64 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06] hover:border-emerald-500/40 text-left transition-all cursor-pointer"
                        >
                          <div className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-extrabold mb-1">🎫 Booked Ticket</div>
                          <div className="text-xs font-bold text-white truncate">{ticket.home_team} vs {ticket.away_team}</div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">{ticket.venue}</div>
                          {ticket.match_date && <div className="text-[10px] text-zinc-500 font-mono mt-1">{ticket.match_date.split("T")[0]}</div>}
                        </button>
                      ))}
                      {followedMatches.slice(0, 3).map(match => (
                        <button
                          key={match.id}
                          onClick={() => handleQuickSelect(match)}
                          className="flex-shrink-0 w-64 p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-zinc-700 text-left transition-all cursor-pointer"
                        >
                          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold mb-1">⚽ Followed Team</div>
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

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Stadium / Match Venue</label>
                    <div className="grid gap-3 sm:grid-cols-4">
                      {["Emirates Stadium", "Anfield", "Santiago Bernabéu"].map(venue => (
                        <button
                          key={venue}
                          onClick={() => setJourneyStadium(venue)}
                          className={`p-3 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                            journeyStadium === venue
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                              : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 text-zinc-400"
                          }`}
                        >
                          {venue}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          if (["Emirates Stadium", "Anfield", "Santiago Bernabéu"].includes(journeyStadium)) {
                            setJourneyStadium("");
                          }
                        }}
                        className={`p-3 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                          !["Emirates Stadium", "Anfield", "Santiago Bernabéu"].includes(journeyStadium)
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 text-zinc-400"
                        }`}
                      >
                        Custom Stadium...
                      </button>
                    </div>

                    {!["Emirates Stadium", "Anfield", "Santiago Bernabéu"].includes(journeyStadium) && (
                      <div className="pt-2">
                        <input
                          type="text"
                          placeholder="Type custom stadium name (e.g. Stamford Bridge)"
                          value={journeyStadium}
                          onChange={e => setJourneyStadium(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                          *OSM Nominatim API will geocode this stadium coordinates for stay/route search.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setJourneyStep(2)}
                    disabled={!journeyStadium.trim()}
                    className="book-ticket-btn"
                  >
                    Proceed to Stay Filters →
                  </button>
                </div>
              </div>
            )}

            {/* ── AI Planning Panel ──────────────────────────────────────── */}
            {planningMode === 'ai' && (
              <div className="space-y-5">
                {/* Back to mode select */}
                <div className="flex items-center gap-3 pb-1">
                  <button
                    onClick={() => setPlanningMode(null)}
                    className="text-xs font-bold text-zinc-500 hover:text-violet-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    ← Change mode
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
                        ✨
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-violet-300 uppercase tracking-wider mb-0.5">AI Journey Planner</p>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Describe your trip and I'll find the best match, hotels, and routes for you automatically.
                        </p>
                      </div>
                    </div>

                    {/* Prompt textarea */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Describe your trip</label>
                      <textarea
                        rows={4}
                        placeholder={"e.g. \"I want to watch a Premier League match next weekend in London, budget £150/night, near the stadium, prefer a hotel\""}
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
                          "Champions League match in Madrid, 2 nights, £200 budget",
                          "Premier League this weekend, London, near stadium",
                          "La Liga match in Barcelona, hostel under €80/night",
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
                    { icon: '⚽', label: 'Find Match', desc: 'Best upcoming match for your query' },
                    { icon: '🏨', label: 'Book Hotel', desc: 'Top-rated stays near the stadium' },
                    { icon: '🗺️', label: 'Plan Route', desc: 'Fastest route from your location' },
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
                    ✨ Let AI Plan My Journey →
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
                onClick={() => setShowMoreFilters(prev => !prev)}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors outline-none"
              >
                {showMoreFilters ? "➖ Hide Advanced Filters" : "➕ Show More Options"}
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
                ⚠️ {journeyError}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-zinc-800">
              <button
                onClick={() => setJourneyStep(1)}
                className="text-sm font-bold text-zinc-500 hover:text-emerald-500 cursor-pointer"
              >
                ← Back
              </button>
              <button
                onClick={handleFetchStays}
                disabled={journeyLoading}
                className="book-ticket-btn"
              >
                {journeyLoading ? "Aggregating Stays..." : "Search Stays 🔍"}
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
                    {journeyStays.map((s, idx) => {
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
                                {s.amenities.join(" · ")}
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
                                {isSelected ? "✓ Selected" : "Select Stay"}
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
                  ← Back to stay filters
                </button>
                <button
                  onClick={() => setJourneyStep(4)}
                  className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-xs font-bold rounded-lg text-zinc-300 cursor-pointer transition-colors"
                >
                  Configure Route Directions →
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
                  {journeyRouteLoading ? "Calculating..." : "Calculate Route 🔍"}
                </button>
              </div>

              {/* Route Output */}
              {journeyRouteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg font-mono">
                  ⚠️ {journeyRouteError}
                </div>
              )}

              {journeyRoutes && journeyRoutes.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Preferred Travel Option:</div>

                  {/* Tabbed Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {journeyRoutes.map((route, rIdx) => {
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
                        {grandTotal <= journeyMaxPrice ? "✓ WITHIN BUDGET" : "⚠️ BUDGET COMPROMISED"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Map Placeholder Notice */}
              <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-zinc-500">
                <div className="text-emerald-500 font-extrabold text-lg mt-0.5">🗺️</div>
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
                  ← Back to Stays
                </button>
                <button
                  onClick={() => setJourneyStep(5)}
                  className="book-ticket-btn"
                >
                  Explore & Safety Advisory →
                </button>
              </div>
            </div>
          );
        })()}

        {/* Step 5: Explore & Safety */}
        {journeyStep === 5 && (() => {
          const stayPrice = journeySelectedStay ? parseFloat(journeySelectedStay.price_usd) || 0 : 0;
          const activeRoute = journeySelectedRoute || (journeyRoutes && journeyRoutes[selectedRouteIdx] ? journeyRoutes[selectedRouteIdx] : null);
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
          const routeOptions = journeyRoutes.length ? journeyRoutes : (activeRoute ? [activeRoute] : []);
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

          return (
            <div className="space-y-6 py-2">
              <div className="section-label">Step 5: Event City Explore & Safety Dispatch</div>

              {journeyDataWarnings.length > 0 && (
                <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.04] p-4 text-left">
                  <h4 className="text-xs font-black uppercase tracking-wider text-yellow-300">Provider data warning</h4>
                  <div className="mt-2 grid gap-2">
                    {journeyDataWarnings.map((warning, wIdx) => (
                      <p key={wIdx} className="text-xs leading-relaxed text-yellow-100/80">{warning}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-5 xl:grid-cols-12">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-left xl:col-span-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">Match</span>
                  <h4 className="mt-2 text-sm font-black text-white leading-snug">{journeyMatchName || "Selected match"}</h4>
                  <p className="mt-1 text-[10px] text-zinc-500">{journeyStadium}</p>
                  <p className="mt-1 text-[10px] font-mono text-emerald-400">{journeyMatchDate || "Date TBD"}</p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5 text-left xl:col-span-5">
                  <span className="text-[9px] font-mono text-emerald-500/80 uppercase tracking-widest font-extrabold">Selected stay</span>
                  {journeySelectedStay ? (
                    <>
                      <h4 className="mt-2 text-base font-black text-white leading-snug">{journeySelectedStay.name}</h4>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-[10px] font-mono">
                        <span className="rounded-lg bg-zinc-950/50 px-3 py-2 text-zinc-300">{journeySelectedStay.type || "Stay"}</span>
                        <span className="rounded-lg bg-zinc-950/50 px-3 py-2 text-zinc-300">${stayPrice.toFixed(2)}/night</span>
                        <span className="rounded-lg bg-zinc-950/50 px-3 py-2 text-zinc-300">{journeySelectedStay.distance_miles ?? "--"} mi</span>
                      </div>
                      {journeySelectedStayReason && (
                        <p className="mt-3 text-xs leading-relaxed text-zinc-400">{journeySelectedStayReason}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowStayOptions(prev => !prev)}
                        className="mt-4 w-full rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-3 text-[10px] font-black uppercase tracking-wider text-emerald-300 hover:border-emerald-500/50"
                      >
                        {showStayOptions ? "Hide stay options" : "Open stay details and other options"}
                      </button>
                    </>
                  ) : (
                    <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/[0.04] p-4">
                      <h4 className="text-sm font-black text-red-300">Stay data unavailable</h4>
                      <p className="mt-2 text-xs leading-relaxed text-red-100/70">No hotel/hostel provider result was returned. Check the stay API/provider configuration and retry.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] p-5 text-left xl:col-span-5">
                  <span className="text-[9px] font-mono text-blue-300 uppercase tracking-widest font-extrabold">
                    {String(activeRoute?.mode || "").toLowerCase().includes("flight") ? "Selected flight route" : "Selected route"}
                  </span>
                  {activeRoute ? (
                    <>
                      <h4 className="mt-2 text-base font-black text-white leading-snug">{activeRoute.mode}</h4>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-mono">
                        <span className="rounded-lg bg-zinc-950/50 px-3 py-2 text-zinc-300">{activeRoute.duration_minutes ?? "--"} mins</span>
                        <span className="rounded-lg bg-zinc-950/50 px-3 py-2 text-zinc-300">${transitPrice.toFixed(2)}</span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-zinc-400">{journeySelectedRouteReason || activeRoute.steps}</p>
                      <button
                        type="button"
                        onClick={() => setShowRouteOptions(prev => !prev)}
                        className="mt-4 w-full rounded-lg border border-blue-500/20 bg-blue-500/[0.04] px-3 py-3 text-[10px] font-black uppercase tracking-wider text-blue-300 hover:border-blue-500/50"
                      >
                        {showRouteOptions ? "Hide route preferences" : "Open route details and preferences"}
                      </button>
                    </>
                  ) : (
                    <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/[0.04] p-4">
                      <h4 className="text-sm font-black text-red-300">Route data unavailable</h4>
                      <p className="mt-2 text-xs leading-relaxed text-red-100/70">No flight/train/road provider result was returned. Connect a directions, rail, flight, or maps provider and retry.</p>
                    </div>
                  )}
                </div>
              </div>

              {(showStayOptions || showRouteOptions) && (
                <div className="grid gap-5 xl:grid-cols-2">
                  {showStayOptions && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-zinc-900/50 p-4 text-left">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">Stay details</h4>
                          <p className="text-[10px] text-zinc-500">Selected stay plus other hotel/hostel options.</p>
                        </div>
                        <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-[9px] font-mono text-zinc-400">
                          {stayOptions.length} options
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {stayOptions.length === 0 && (
                          <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-4 text-xs leading-relaxed text-red-100/75">
                            No stay options were returned by the lodging provider. Nothing has been substituted.
                          </div>
                        )}
                        {stayOptions.slice(0, 5).map((stay: any, sIdx: number) => {
                          const isCurrentStay = journeySelectedStay?.name === stay.name;
                          return (
                            <button
                              key={`${stay.name}-${sIdx}`}
                              type="button"
                              onClick={() => {
                                setJourneySelectedStay(stay);
                                setJourneySelectedStayReason(stay.why || "Selected from the available stay options.");
                                setJourneySelectedRoute((prev: any) => rebaseRouteToStay(prev, stay));
                              }}
                              className={`w-full rounded-xl border p-3 text-left transition-all ${
                                isCurrentStay
                                  ? "border-emerald-500/60 bg-emerald-500/[0.06]"
                                  : "border-zinc-800 bg-zinc-950/40 hover:border-emerald-500/30"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-black text-white">{stay.name}</p>
                                  <p className="mt-1 text-[10px] text-zinc-500">{stay.amenities?.join(" | ") || "Amenities not listed"}</p>
                                </div>
                                <span className={`rounded-full px-2 py-1 text-[9px] font-mono font-bold ${isCurrentStay ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                                  {isCurrentStay ? "Selected" : "Choose"}
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-300">
                                <span className="rounded-lg bg-black/25 px-2 py-1">{stay.type || "stay"}</span>
                                <span className="rounded-lg bg-black/25 px-2 py-1">${Number(stay.price_usd || 0).toFixed(2)}</span>
                                <span className="rounded-lg bg-black/25 px-2 py-1">{stay.distance_miles ?? "--"} mi</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {showRouteOptions && (
                    <div className="rounded-2xl border border-blue-500/20 bg-zinc-900/50 p-4 text-left">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-blue-300">Route preferences</h4>
                          <p className="text-[10px] text-zinc-500">Switch flight, train, road, metro, and mixed transfer plans.</p>
                        </div>
                        <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-[9px] font-mono text-zinc-400">
                          {routeOptions.length} options
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {routeOptions.length === 0 && (
                          <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-4 text-xs leading-relaxed text-red-100/75">
                            No flight, train, road, or metro route options were returned by the directions provider. Nothing has been substituted.
                          </div>
                        )}
                        {routeOptions.slice(0, 6).map((route: any, rIdx: number) => {
                          const isCurrentRoute = activeRoute?.mode === route.mode;
                          return (
                            <button
                              key={`${route.mode}-${rIdx}`}
                              type="button"
                              onClick={() => {
                                const routeForStay = rebaseRouteToStay(route, journeySelectedStay);
                                setSelectedRouteIdx(rIdx);
                                setJourneySelectedRoute(routeForStay);
                                setJourneySelectedRouteReason(routeForStay.best_for || "Selected route preference.");
                              }}
                              className={`w-full rounded-xl border p-3 text-left transition-all ${
                                isCurrentRoute
                                  ? "border-blue-500/60 bg-blue-500/[0.06]"
                                  : "border-zinc-800 bg-zinc-950/40 hover:border-blue-500/30"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-black text-white">{route.mode}</p>
                                  <p className="mt-1 text-[10px] text-zinc-500">{route.best_for || route.steps}</p>
                                </div>
                                <span className={`rounded-full px-2 py-1 text-[9px] font-mono font-bold ${isCurrentRoute ? "bg-blue-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                                  {isCurrentRoute ? "Selected" : "Switch"}
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-300">
                                <span className="rounded-lg bg-black/25 px-2 py-1">{route.duration_minutes ?? "--"} mins</span>
                                <span className="rounded-lg bg-black/25 px-2 py-1">${Number(route.cost_usd || 0).toFixed(2)}</span>
                              </div>
                              {route.legs?.length > 0 && (
                                <div className="mt-2 space-y-1 border-l border-blue-500/30 pl-3">
                                  {route.legs.slice(0, 4).map((leg: any, legIdx: number) => (
                                    <div key={legIdx} className="text-[9px] leading-relaxed text-zinc-400">
                                      <span className="font-bold text-blue-300">{leg.label}:</span> {leg.detail}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Dispatch Summary briefing if available */}
              {journeySummary && (
                <div className="p-5 rounded-2xl border border-violet-500/20 bg-violet-500/[0.02] space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                  <div className="flex items-center gap-2 text-violet-400 justify-start">
                    <span className="text-base">✨</span>
                    <h4 className="text-xs font-black uppercase tracking-wider">Globus 2026 AI Agent Briefing</h4>
                  </div>
                  <div className="text-xs text-zinc-300 leading-relaxed space-y-2 text-left font-mono">
                    {renderMd(journeySummary)}
                  </div>
                </div>
              )}

              {/* Safety Briefing Panel */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Risk assessment */}
                <div className="md:col-span-2 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">City Safety Assessment</h4>
                    <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded uppercase tracking-wider ${
                      safety.level?.toLowerCase().includes("high")
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : safety.level?.toLowerCase().includes("moderate") || safety.level?.toLowerCase().includes("caution")
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {safety.level}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center bg-zinc-950/60 border border-zinc-850 rounded-xl px-4 py-3 min-w-[70px]">
                      <span className="text-zinc-500 text-[8px] font-mono font-bold uppercase tracking-widest leading-none">Score</span>
                      <span className="text-xl font-black text-emerald-400 mt-1">{safety.score}/10</span>
                    </div>
                    <div className="text-xs text-zinc-400 leading-relaxed text-left">
                      {safety.summary}
                      <div className="mt-2 inline-flex rounded-full border border-blue-500/20 bg-blue-500/[0.05] px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-blue-300">
                        {safety.sourceLabel || "Estimated safety status"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-850">
                    <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest block text-left">Event Day Safety Guidelines:</span>
                    <ul className="space-y-1.5 text-xs text-zinc-300 text-left list-none pl-0">
                      {(safety.tips || []).map((tip: string, tIdx: number) => (
                        <li key={tIdx} className="flex gap-2 items-start justify-start">
                          <span className="text-emerald-500 font-extrabold mt-0.5">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {(journeySafetySources.length > 0 || journeyValidationChecks.length > 0) && (
                    <div className="grid gap-3 pt-2 border-t border-zinc-850 md:grid-cols-2">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest block text-left">RAG Sources Used:</span>
                        {(journeySafetySources.length ? journeySafetySources : safety.sourcesUsed || []).slice(0, 3).map((src: any, sIdx: number) => (
                          <div key={sIdx} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 text-left">
                            <p className="text-[10px] font-bold text-zinc-300">{src.title || "Safety source"}</p>
                            <p className="mt-0.5 line-clamp-2 text-[9px] text-zinc-500">{src.excerpt || src.scope}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest block text-left">Validation Checks:</span>
                        {journeyValidationChecks.slice(0, 4).map((check: any, cIdx: number) => (
                          <div key={cIdx} className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 text-left">
                            <span className={`mt-0.5 h-2 w-2 rounded-full ${check.status === "pass" ? "bg-emerald-400" : "bg-yellow-400"}`} />
                            <div>
                              <p className="text-[10px] font-bold text-zinc-300">{check.label}</p>
                              <p className="mt-0.5 text-[9px] text-zinc-500">{check.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Emergency Numbers widget */}
                <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Emergency Contact Lines</h4>
                    <p className="text-[10px] text-zinc-500">Official dispatch hotlines for the local authority.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest font-extrabold">Emergency Dispatch</span>
                        <p className="text-xs font-bold text-red-400 mt-0.5">Police / Ambulance / Fire</p>
                      </div>
                      <span className="text-sm font-black text-white font-mono">{safety.emergencyNumbers?.Emergency || "112"}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest font-extrabold">Non-Emergency Line</span>
                        <p className="text-xs font-bold text-zinc-400 mt-0.5">Enquiries / Minor Reports</p>
                      </div>
                      <span className="text-sm font-black text-zinc-300 font-mono">{safety.emergencyNumbers?.["Non-Emergency"] || "101"}</span>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-zinc-650 leading-tight text-center">
                    *Toll-free from any mobile or landline device.
                  </div>
                </div>
              </div>

              {/* Nearby Places Section */}
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-850">
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Explore Nearby Facilities</h4>
                    <p className="text-[10px] text-zinc-500">Convenient spots geocoded around {journeyStadium}.</p>
                  </div>

                  {/* Places Category Tabs */}
                  <div className="flex flex-wrap gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-zinc-850">
                    {[
                      { id: "restaurants", label: "🍔 Dine" },
                      { id: "convenience_stores", label: "🛒 Convenience" },
                      { id: "pharmacies", label: "💊 Essentials" },
                      { id: "tourist_spots", label: "📸 Sightseeing" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActivePlacesTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activePlacesTab === tab.id
                            ? "bg-emerald-500 text-zinc-950 font-black shadow-md"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Places Grid */}
                {activePlaces.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-550 font-mono">
                    No results reported for this category.
                  </div>
                ) : (
                  <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {activePlaces.map((place: any, pIdx: number) => {
                      // Backend may return places as plain strings OR as objects
                      // with keys {name, type, rating, distance_miles, address}
                      const placeName = typeof place === "string" ? place : (place?.name || "Unknown");
                      const placeAddress = typeof place === "object" ? place?.address : null;
                      const placeRating = typeof place === "object" ? place?.rating : null;
                      const placeDistance = typeof place === "object" ? place?.distance_miles : null;

                      return (
                        <div key={pIdx} className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40 text-left flex items-start gap-3">
                          <span className="text-base mt-0.5">
                            {activePlacesTab === "restaurants" ? "🍻" : activePlacesTab === "convenience_stores" ? "🏪" : activePlacesTab === "pharmacies" ? "🏥" : "📍"}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white line-clamp-1">{placeName}</p>
                            {placeAddress && (
                              <span className="text-[9px] text-zinc-500 block mt-0.5 line-clamp-1">{placeAddress}</span>
                            )}
                            <span className="text-[9px] font-mono text-zinc-550 uppercase mt-0.5 block">
                              {placeRating ? `★ ${placeRating}` : ""}
                              {placeRating && placeDistance ? " · " : ""}
                              {placeDistance ? `${placeDistance} mi` : "Geocoded radius match"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Complete Booking HUD */}
              <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight font-black">Lock in your Travel Briefing</h4>
                  <p className="text-xs text-zinc-400">Secure stay bookings, route maps, and match tickets in one click.</p>
                </div>
                <div className="flex items-center gap-3 justify-end w-full md:w-auto">
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold block">Briefing Total Fare</span>
                    <strong className="text-lg font-black text-emerald-400 font-mono">${grandTotal.toFixed(2)}</strong>
                  </div>
                  <button
                    onClick={() => {
                      alert("Logistics briefing saved! Your ticket booking reference code is OS-2026-DISPATCH.");
                    }}
                    className="book-ticket-btn"
                  >
                    Confirm Entire Plan ✓
                  </button>
                </div>
              </div>

              {/* Step 5 Footer buttons */}
              <div className="flex justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setJourneyStep(4)}
                  className="text-sm font-bold text-zinc-500 hover:text-emerald-500 cursor-pointer"
                >
                  ← Back to Route
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
                  Restart Planner ↺
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard": return renderDashboard();
      case "tickets":   return renderTickets();
      case "assistant": return renderAssistant();
      case "journey":   return renderJourney();
      case "analysis":
        return renderPlaceholder(
          "Match Analysis",
          "Deep statistical breakdowns, heat maps, player performance metrics, and AI-powered post-match summaries for your followed teams.",
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>
        );
      case "contact":
        return renderPlaceholder(
          "Contact Us",
          "Reach out to the Offside AI support team for technical help, feature requests, or partnership enquiries.",
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
        );
      case "settings":
        return renderPlaceholder(
          "Settings",
          "Manage your account preferences, notification settings, theme configuration, and connected data sources.",
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
        );
    }
  };

  const currentNav = NAV_ITEMS.find(n => n.id === activeTab);
  const userInitial = userProfile?.name?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || "U";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
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
    </main>
  );
}
