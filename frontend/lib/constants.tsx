import React from "react";
import { AIPlanningStage, TabId } from "./types";

export const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const TEAM_CRESTS: Record<string, string> = {
  "Arsenal": "https://crests.football-data.org/57.png",
  "Chelsea": "https://crests.football-data.org/61.png",
  "Liverpool": "https://crests.football-data.org/64.png",
  "Manchester City": "https://crests.football-data.org/65.png",
  "Man City": "https://crests.football-data.org/65.png",
  "Manchester United": "https://crests.football-data.org/66.png",
  "Tottenham Hotspur": "https://crests.football-data.org/73.png",
  "Aston Villa": "https://crests.football-data.org/58.png",
  "Newcastle United": "https://crests.football-data.org/67.png",
  "Real Madrid CF": "https://crests.football-data.org/86.png",
  "Real Madrid": "https://crests.football-data.org/86.png",
  "FC Barcelona": "https://crests.football-data.org/81.png",
  "Barcelona": "https://crests.football-data.org/81.png",
  "Club Atlético de Madrid": "https://crests.football-data.org/78.png",
  "Atletico Madrid": "https://crests.football-data.org/78.png",
  "Sevilla FC": "https://crests.football-data.org/95.png",
  "Girona FC": "https://crests.football-data.org/298.png",
  "Paris Saint-Germain FC": "https://crests.football-data.org/524.png",
  "Paris Saint-Germain": "https://crests.football-data.org/524.png",
  "PSG": "https://crests.football-data.org/524.png",
  "Olympique de Marseille": "https://crests.football-data.org/516.png",
  "Olympique Lyonnais": "https://crests.football-data.org/523.png",
  "AS Monaco FC": "https://crests.football-data.org/548.png",
  "Lille OSC": "https://crests.football-data.org/521.png",
  "Bayern Munich": "https://crests.football-data.org/5.png",
  "FC Bayern München": "https://crests.football-data.org/5.png",
  "Borussia Dortmund": "https://crests.football-data.org/4.png",
  "Bayer 04 Leverkusen": "https://crests.football-data.org/3.png",
  "RB Leipzig": "https://crests.football-data.org/172.png",
  "Juventus FC": "https://crests.football-data.org/109.png",
  "FC Internazionale Milano": "https://crests.football-data.org/108.png",
  "Inter Milan": "https://crests.football-data.org/108.png",
  "AC Milan": "https://crests.football-data.org/98.png",
  "SSC Napoli": "https://crests.football-data.org/113.png",
  "AS Roma": "https://crests.football-data.org/100.png",
  "Inter Miami CF": "https://crests.football-data.org/8144.png",
  "Inter Miami": "https://crests.football-data.org/8144.png",
  "Al Nassr FC": "https://crests.football-data.org/8468.png",
  "Al Nassr": "https://crests.football-data.org/8468.png",
  "Al Hilal": "https://crests.football-data.org/8466.png",
  "Al Ahli": "https://crests.football-data.org/8467.png",
  "LA Galaxy": "https://crests.football-data.org/1844.png",
  "England": "https://crests.football-data.org/770.svg",
  "Spain": "https://crests.football-data.org/760.svg",
  "France": "https://crests.football-data.org/773.svg",
  "Germany": "https://crests.football-data.org/759.svg",
  "Argentina": "https://crests.football-data.org/762.svg",
  "Brazil": "https://crests.football-data.org/764.svg",
  "Portugal": "https://crests.football-data.org/765.svg"
};

export const getTeamCrest = (name: string): string | undefined => {
  if (!name) return undefined;
  if (TEAM_CRESTS[name]) return TEAM_CRESTS[name];
  const lower = name.trim().toLowerCase();
  for (const [key, url] of Object.entries(TEAM_CRESTS)) {
    if (key.toLowerCase() === lower || key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return url;
    }
  }
  return undefined;
};

export const MCP_SERVICES = [
  { id: "hostel", name: "Hostel Service", tool: "search_stays(stadium, accommodation_type, max_price, min_rating, required_amenities, sort_by)", desc: "Find fan-friendly hotels, hostels, shared rooms, and airbnbs near stadium gates within your budget." },
  { id: "route",  name: "Route Service",  tool: "get_directions(origin, destination, mode)", desc: "Calculate transit, taxi, and walking routes to any stadium." },
  { id: "review", name: "Review Service", tool: "get_food_reviews(venue)", desc: "Pre-match pub ratings and food stall recommendations." },
  { id: "match",  name: "Match Service",  tool: "get_team_matches(team_name)", desc: "Upcoming fixtures and competition schedule for followed clubs." },
];

export const DEFAULT_AI_PLANNING_STAGES: AIPlanningStage[] = [
  { id: "understand", label: "Understand request", brief: "Extracting city, dates, budget, team, stadium, stay, and route constraints." },
  { id: "match", label: "Find match", brief: "Searching the schedule and selecting the strongest matching fixture." },
  { id: "stay", label: "Find stay", brief: "Ranking hotels, hostels, shared rooms, and airbnbs by price, rating, and distance." },
  { id: "route", label: "Find route / flight", brief: "Building flight, train, transit, taxi, and walking route options." },
  { id: "validate", label: "Validate and brief", brief: "Checking budget, route feasibility, safety grounding, and final fare." },
];


export const NAV_ITEMS: Array<{ id: TabId; label: string; icon: React.ReactNode; badge?: string }> = [
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
    id: "store",
    label: "Fans Store",
    icon: (
      <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
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
