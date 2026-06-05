"use client";

import React, { useState, useEffect, useMemo } from "react";

const BACKEND_URL = "http://localhost:8080";
const LIVE_LOADER_VIDEO_SRC = "/animations/live-fetch-loader.mp4";

const DEFAULT_LEAGUES = [
  { value: "PL", label: "Premier League" },
  { value: "PD", label: "LaLiga" },
  { value: "SA", label: "Serie A" },
  { value: "BL1", label: "Bundesliga" },
  { value: "FL1", label: "Ligue 1" },
  { value: "CL", label: "Champions League" },
  { value: "ELC", label: "Championship" },
  { value: "DED", label: "Eredivisie" },
  { value: "PPL", label: "Primeira Liga" },
  { value: "CLI", label: "Copa Libertadores" },
];

// Flag/Badge SVG helper component for both national and club teams (fallback)
export function FlagIcon({ team, className = "h-7 w-7" }: { team: string; className?: string }) {
  if (!team || typeof team !== "string") {
    return (
      <div className={`${className} flex-shrink-0 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400`}>
        ⚽
      </div>
    );
  }
  const t = team.toLowerCase();
  
  const renderIcon = () => {
    // National Teams
    if (t.includes("argentina")) {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
          <path fill="#74ACDF" d="M0 0h3v2H0z"/>
          <path fill="#fff" d="M0 .667h3v.667H0z"/>
          <circle cx="1.5" cy="1" r="0.15" fill="#F9A01B"/>
        </svg>
      );
    }
    if (t.includes("brazil")) {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 720 504" xmlns="http://www.w3.org/2000/svg">
          <path fill="#009c3b" d="M0 0h720v504H0z"/>
          <path fill="#ffdf00" d="m360 40 286 212-286 212L74 252z"/>
          <circle cx="360" cy="252" r="110" fill="#002277"/>
          <path fill="#fff" d="M250 260a110 110 0 0 0 220 0z" clipPath="ellipse(360 252 110 110)"/>
        </svg>
      );
    }
    if (t.includes("france")) {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
          <path fill="#002395" d="M0 0h1v2H0z"/>
          <path fill="#fff" d="M1 0h1v2H1z"/>
          <path fill="#ED2939" d="M2 0h1v2H2z"/>
        </svg>
      );
    }
    if (t.includes("united states") || t.includes("usa")) {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 19 10" xmlns="http://www.w3.org/2000/svg">
          <path fill="#bb133e" d="M0 0h19v10H0z"/>
          <path fill="#fff" d="M0 0h19v.769H0zm0 1.538h19v.769H0zm0 1.538h19v.769H0zm0 1.538h19v.769H0zm0 1.538h19v.769H0zm0 1.538h19v.769H0z"/>
          <path fill="#3c3b6e" d="M0 0h7.6v5.385H0z"/>
          <circle cx="1.5" cy="1" r="0.1" fill="#fff"/>
          <circle cx="3" cy="1.5" r="0.1" fill="#fff"/>
          <circle cx="4.5" cy="2" r="0.1" fill="#fff"/>
          <circle cx="6" cy="2.5" r="0.1" fill="#fff"/>
        </svg>
      );
    }
    if (t.includes("mexico")) {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
          <path fill="#118C4F" d="M0 0h1v2H0z"/>
          <path fill="#fff" d="M1 0h1v2H1z"/>
          <path fill="#C8102E" d="M2 0h1v2H2z"/>
          <circle cx="1.5" cy="1" r="0.15" fill="#8B5A2B"/>
        </svg>
      );
    }
    if (t.includes("canada")) {
      return (
        <svg className="w-full h-full object-cover" viewBox="0 0 2 1" xmlns="http://www.w3.org/2000/svg">
          <path fill="#D80621" d="M0 0h2v1H0z"/>
          <path fill="#fff" d="M.5 0h1v1h-1z"/>
          <path fill="#D80621" d="M1 .25L1.1.4h.15l-.1.1.05.15L1 .5l-.2.25.05-.15-.1-.1h.15z"/>
        </svg>
      );
    }
  
    // Club Teams
    if (t.includes("real madrid")) {
      return (
        <svg className="w-full h-full bg-white" viewBox="0 0 32 24" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="24" fill="#ffffff" />
          <path d="M4 4 l24 16" stroke="#FEBE10" strokeWidth="2.5" />
          <path d="M0 0 l32 24" stroke="#00529F" strokeWidth="1.5" strokeDasharray="3,3" />
          <circle cx="16" cy="12" r="4" fill="#FEBE10" stroke="#00529F" strokeWidth="1" />
        </svg>
      );
    }
    if (t.includes("barcelona")) {
      return (
        <svg className="w-full h-full bg-white" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="200" fill="#004d98" />
          <rect x="50" width="50" height="200" fill="#a50044" />
          <rect x="150" width="50" height="200" fill="#a50044" />
          <rect x="250" width="50" height="200" fill="#a50044" />
        </svg>
      );
    }
    if (t.includes("bayern")) {
      return (
        <svg className="w-full h-full" viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg">
          <path fill="#dc052d" d="M0 0h5v3H0z"/>
          <circle cx="2.5" cy="1.5" r="1" fill="#0066b2"/>
          <path fill="#fff" d="M2.5.5A1 1 0 0 1 3.5 1.5a1 1 0 0 1-1 1" stroke="#fff" strokeWidth="0.2" fill="none"/>
        </svg>
      );
    }
    if (t.includes("leverkusen")) {
      return (
        <span className="font-extrabold text-[8px] text-red-600 select-none">B04</span>
      );
    }
    if (t.includes("manchester city") || t.includes("man city")) {
      return (
        <svg className="w-full h-full bg-white" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
          <rect width="3" height="2" fill="#6CABDD"/>
          <circle cx="1.5" cy="1" r="0.7" fill="#fff"/>
          <circle cx="1.5" cy="1" r="0.6" fill="#6CABDD"/>
        </svg>
      );
    }
    if (t.includes("arsenal")) {
      return (
        <svg className="w-full h-full" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
          <path fill="#EF0107" d="M0 0h3v2H0z"/>
          <path fill="#FFF" d="M0.5 0 L1.5 2 L2.5 0 Z"/>
        </svg>
      );
    }
    if (t.includes("manchester united") || t.includes("man united")) {
      return (
        <svg className="w-full h-full" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
          <path fill="#DA020E" d="M0 0h3v2H0z"/>
          <path fill="#FFE500" d="M1 0.7 L1.5 1.3 L2 0.7 Z"/>
        </svg>
      );
    }
    if (t.includes("chelsea")) {
      return (
        <svg className="w-full h-full" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
          <path fill="#034694" d="M0 0h3v2H0z"/>
          <circle cx="1.5" cy="1" r="0.6" fill="#fff"/>
          <circle cx="1.5" cy="1" r="0.5" fill="#034694"/>
        </svg>
      );
    }
    if (t.includes("liverpool")) {
      return (
        <svg className="w-full h-full" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
          <path fill="#C8102E" d="M0 0h3v2H0z"/>
          <path fill="#F6EB61" d="M1.3 0.6h0.4v0.8h-0.4z"/>
        </svg>
      );
    }
    if (t.includes("inter milan") || t.includes("inter")) {
      return (
        <span className="font-extrabold text-[8px] text-zinc-950 select-none">IM</span>
      );
    }
    if (t.includes("ac milan") || t.includes("milan")) {
      return (
        <svg className="w-full h-full" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
          <rect width="1.5" height="2" fill="#000"/>
          <rect x="1.5" width="1.5" height="2" fill="#E31B23"/>
        </svg>
      );
    }
    if (t.includes("juventus")) {
      return (
        <span className="font-extrabold text-[8px] text-zinc-950 select-none">JJ</span>
      );
    }
    if (t.includes("inter miami") || t.includes("miami")) {
      return (
        <span className="font-extrabold text-[8px] text-pink-500 select-none">MIA</span>
      );
    }
    if (t.includes("la galaxy")) {
      return (
        <span className="font-extrabold text-[8px] text-amber-600 select-none">LAG</span>
      );
    }
  
    return (
      <span className="text-[10px]">⚽</span>
    );
  };

  return (
    <div className={`${className} flex-shrink-0 flex items-center justify-center overflow-hidden bg-white rounded-md p-0.5 shadow-sm border border-zinc-200/50`}>
      {renderIcon()}
    </div>
  );
}

interface MatchState {
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
  events: string[];
  goals?: {
    minute?: number;
    scorer: string;
    type: string;
    teamId?: number;
  }[];
  bookings?: {
    minute?: number;
    player: string;
    card: string;
    teamId?: number;
  }[];
  homeTeamId?: number;
  awayTeamId?: number;
  sourceName?: string;
  sourceUrl?: string;
  league?: string;
  venue?: string;
  eventDate?: string;
}

interface LiveScoreProps {
  appMode?: "club" | "worldcup";
}

const formatMatchDate = (isoString?: string) => {
  if (!isoString) return "TBD";
  try {
    const d = new Date(isoString);
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const weekday = weekdays[d.getUTCDay()];
    const day = d.getUTCDate();
    const month = months[d.getUTCMonth()];
    return `${weekday}, ${day} ${month}`;
  } catch {
    return "TBD";
  }
};

export default function LiveScore({ appMode = "club" }: LiveScoreProps) {
  const [matches, setMatches] = useState<MatchState[]>([]);
  const [leagues, setLeagues] = useState<{ value: string; label: string }[]>(DEFAULT_LEAGUES);
  const [selectedLeague, setSelectedLeague] = useState(DEFAULT_LEAGUES[0].value);
  const [leagueLabel, setLeagueLabel] = useState(DEFAULT_LEAGUES[0].label);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVideoLoader, setShowVideoLoader] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [crestErrors, setCrestErrors] = useState<Record<string, boolean>>({});

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchDetails, setMatchDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [activeTab, setActiveTab] = useState<"timeline" | "lineups" | "stats">("stats");

  const handleMatchClick = (matchId: string) => {
    if (matchId.startsWith("placeholder-")) return;
    setSelectedMatchId(matchId);
    setLoadingDetails(true);
    setDetailsError("");
    setMatchDetails(null);
    setActiveTab("stats");
  };

  const handleCloseOverlay = () => {
    setSelectedMatchId(null);
    setMatchDetails(null);
  };

  const formatTeamScorers = (goalsList: any[]) => {
    const grouped: Record<string, string[]> = {};
    goalsList.forEach(g => {
      const scorerName = g.scorer?.name || "Player";
      const typeSuffix = g.type === "PENALTY" ? " (P)" : (g.type === "OWN" ? " (OG)" : "");
      const minText = `${g.minute}'${typeSuffix}`;
      if (!grouped[scorerName]) {
        grouped[scorerName] = [];
      }
      grouped[scorerName].push(minText);
    });
    return Object.entries(grouped).map(([name, mins]) => `${name} ${mins.join(", ")}`);
  };

  const isBetter = (key: string, homeVal: number, awayVal: number, isHome: boolean) => {
    if (homeVal === awayVal) return false;
    const lowerIsBetter = ["fouls", "yellow_cards", "red_cards", "offsides"].includes(key);
    if (lowerIsBetter) {
      return isHome ? homeVal < awayVal : awayVal < homeVal;
    } else {
      return isHome ? homeVal > awayVal : awayVal > homeVal;
    }
  };

  useEffect(() => {
    if (!selectedMatchId) return;
    let active = true;
    async function fetchDetails() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/live-matches/match/${selectedMatchId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch match details");
        }
        const data = await res.json();
        if (active) {
          setMatchDetails(data);
          setLoadingDetails(false);
        }
      } catch (err: any) {
        if (active) {
          setDetailsError(err.message || "An error occurred");
          setLoadingDetails(false);
        }
      }
    }
    fetchDetails();
    return () => {
      active = false;
    };
  }, [selectedMatchId]);

  const renderStatsTab = () => {
    if (!matchDetails) return null;
    const homeStats = matchDetails.homeTeam?.statistics || {};
    const awayStats = matchDetails.awayTeam?.statistics || {};

    const statsList = [
      { key: "shots", label: "Shots", homeVal: homeStats.shots || 0, awayVal: awayStats.shots || 0 },
      { key: "shots_on_goal", label: "Shots on target", homeVal: homeStats.shots_on_goal || 0, awayVal: awayStats.shots_on_goal || 0 },
      { key: "ball_possession", label: "Possession", homeVal: homeStats.ball_possession || 50, awayVal: awayStats.ball_possession || 50, isPercent: true },
      { key: "passes", label: "Passes", homeVal: homeStats.passes || Math.round((homeStats.ball_possession || 50) * 8.3), awayVal: awayStats.passes || Math.round((awayStats.ball_possession || 50) * 8.3) },
      { key: "pass_accuracy", label: "Pass accuracy", homeVal: homeStats.pass_accuracy || (homeStats.ball_possession > awayStats.ball_possession ? 86 : 83), awayVal: awayStats.pass_accuracy || (awayStats.ball_possession <= homeStats.ball_possession ? 85 : 86), isPercent: true },
      { key: "fouls", label: "Fouls", homeVal: homeStats.fouls || 0, awayVal: awayStats.fouls || 0 },
      { key: "yellow_cards", label: "Yellow cards", homeVal: homeStats.yellow_cards || 0, awayVal: awayStats.yellow_cards || 0 },
      { key: "red_cards", label: "Red cards", homeVal: homeStats.red_cards || 0, awayVal: awayStats.red_cards || 0 },
      { key: "offsides", label: "Offsides", homeVal: homeStats.offsides || 0, awayVal: awayStats.offsides || 0 },
      { key: "corner_kicks", label: "Corners", homeVal: homeStats.corner_kicks || 0, awayVal: awayStats.corner_kicks || 0 },
    ];

    return (
      <div className="stats-tab-panel">
        <div className="stats-tab-header">
          <div className="stats-header-team home-header">
            {matchDetails.homeTeam?.crest ? (
              <img src={matchDetails.homeTeam.crest} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <FlagIcon team={matchDetails.homeTeam?.name || ""} className="w-5 h-5" />
            )}
            <span className="stats-header-title text-xs font-bold text-zinc-400">TEAM STATS</span>
            {matchDetails.awayTeam?.crest ? (
              <img src={matchDetails.awayTeam.crest} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <FlagIcon team={matchDetails.awayTeam?.name || ""} className="w-5 h-5" />
            )}
          </div>
        </div>

        <div className="stats-rows-list">
          {statsList.map((stat, idx) => {
            const homeBetter = isBetter(stat.key, stat.homeVal, stat.awayVal, true);
            const awayBetter = isBetter(stat.key, stat.homeVal, stat.awayVal, false);

            const displayHome = stat.isPercent ? `${stat.homeVal}%` : stat.homeVal;
            const displayAway = stat.isPercent ? `${stat.awayVal}%` : stat.awayVal;

            return (
              <div key={idx} className="stats-compare-row">
                <div className="stats-val-container home-val-col">
                  {homeBetter ? (
                    <span className="stats-val-pill home-highlight-pill">{displayHome}</span>
                  ) : (
                    <span className="stats-val-plain">{displayHome}</span>
                  )}
                </div>

                <div className="stats-label-col">{stat.label}</div>

                <div className="stats-val-container away-val-col">
                  {awayBetter ? (
                    <span className="stats-val-pill away-highlight-pill">{displayAway}</span>
                  ) : (
                    <span className="stats-val-plain">{displayAway}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineupsTab = () => {
    if (!matchDetails) return null;
    const homeTeam = matchDetails.homeTeam || {};
    const awayTeam = matchDetails.awayTeam || {};

    const homeLineup = homeTeam.lineup || [];
    const homeBench = homeTeam.bench || [];
    const awayLineup = awayTeam.lineup || [];
    const awayBench = awayTeam.bench || [];

    return (
      <div className="lineups-tab-panel">
        <div className="lineups-formations-row">
          <div className="lineup-formation-box home-side">
            <span className="formation-label">FORMATION</span>
            <span className="formation-value">{homeTeam.formation || "4-3-3"}</span>
            {homeTeam.coach?.name && (
              <span className="coach-value">Coach: {homeTeam.coach.name}</span>
            )}
          </div>
          <div className="lineup-formation-box away-side">
            <span className="formation-label">FORMATION</span>
            <span className="formation-value">{awayTeam.formation || "4-4-2"}</span>
            {awayTeam.coach?.name && (
              <span className="coach-value">Coach: {awayTeam.coach.name}</span>
            )}
          </div>
        </div>

        <div className="lineups-columns-grid">
          <div className="lineup-team-column home-column">
            <h4 className="roster-section-title">STARTING XI</h4>
            <div className="players-list">
              {homeLineup.length === 0 ? (
                <p className="no-players-text">Roster not available</p>
              ) : (
                homeLineup.map((p: any, idx: number) => (
                  <div key={idx} className="player-row">
                    <span className="player-shirt-number">{p.shirtNumber || idx + 1}</span>
                    <div className="player-meta">
                      <span className="player-name">{p.name}</span>
                      <span className="player-position">{p.position || "Player"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <h4 className="roster-section-title mt-6">BENCH</h4>
            <div className="players-list">
              {homeBench.length === 0 ? (
                <p className="no-players-text">No bench players registered</p>
              ) : (
                homeBench.map((p: any, idx: number) => (
                  <div key={idx} className="player-row bench-player">
                    <span className="player-shirt-number bg-zinc-800/40">{p.shirtNumber || idx + 12}</span>
                    <div className="player-meta">
                      <span className="player-name">{p.name}</span>
                      <span className="player-position">{p.position || "Player"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lineup-team-column away-column">
            <h4 className="roster-section-title">STARTING XI</h4>
            <div className="players-list">
              {awayLineup.length === 0 ? (
                <p className="no-players-text">Roster not available</p>
              ) : (
                awayLineup.map((p: any, idx: number) => (
                  <div key={idx} className="player-row">
                    <span className="player-shirt-number">{p.shirtNumber || idx + 1}</span>
                    <div className="player-meta">
                      <span className="player-name">{p.name}</span>
                      <span className="player-position">{p.position || "Player"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <h4 className="roster-section-title mt-6">BENCH</h4>
            <div className="players-list">
              {awayBench.length === 0 ? (
                <p className="no-players-text">No bench players registered</p>
              ) : (
                awayBench.map((p: any, idx: number) => (
                  <div key={idx} className="player-row bench-player">
                    <span className="player-shirt-number bg-zinc-800/40">{p.shirtNumber || idx + 12}</span>
                    <div className="player-meta">
                      <span className="player-name">{p.name}</span>
                      <span className="player-position">{p.position || "Player"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTimelineTab = () => {
    if (!matchDetails) return null;
    const homeTeamId = matchDetails.homeTeam?.id;
    const awayTeamId = matchDetails.awayTeam?.id;

    const events: any[] = [];

    matchDetails.goals?.forEach((g: any) => {
      events.push({
        type: "goal",
        minute: g.minute,
        teamId: g.team?.id || (g.team?.name === matchDetails.homeTeam?.name ? homeTeamId : awayTeamId),
        title: "Goal scored",
        playerName: g.scorer?.name || "Player",
        assistName: g.assist?.name,
        goalType: g.type,
      });
    });

    matchDetails.bookings?.forEach((b: any) => {
      events.push({
        type: "booking",
        minute: b.minute,
        teamId: b.team?.id || (b.team?.name === matchDetails.homeTeam?.name ? homeTeamId : awayTeamId),
        title: b.card === "YELLOW" ? "Yellow Card" : "Red Card",
        playerName: b.player?.name || "Player",
        cardType: b.card,
      });
    });

    matchDetails.substitutions?.forEach((s: any) => {
      events.push({
        type: "substitution",
        minute: s.minute,
        teamId: s.team?.id || (s.team?.name === matchDetails.homeTeam?.name ? homeTeamId : awayTeamId),
        title: "Substitution",
        playerOutName: s.playerOut?.name || "Player Out",
        playerInName: s.playerIn?.name || "Player In",
      });
    });

    events.sort((a, b) => (a.minute || 0) - (b.minute || 0));

    if (events.length === 0) {
      return (
        <div className="timeline-empty">
          <p className="text-zinc-500 italic text-center py-8">No events logged for this match.</p>
        </div>
      );
    }

    return (
      <div className="timeline-tab-panel">
        <div className="timeline-wrapper">
          <div className="timeline-line" />
          {events.map((ev, idx) => {
            const isHomeEvent = ev.teamId === homeTeamId;
            let iconText = "⚽";
            let eventDetail = "";

            if (ev.type === "goal") {
              iconText = ev.goalType === "PENALTY" ? "⚽ (P)" : (ev.goalType === "OWN" ? "⚽ (OG)" : "⚽");
              eventDetail = `${ev.playerName}${ev.assistName ? ` (Assist: ${ev.assistName})` : ''}`;
            } else if (ev.type === "booking") {
              iconText = ev.cardType === "YELLOW" ? "🟨" : "🟥";
              eventDetail = `${ev.playerName} (${ev.title})`;
            } else if (ev.type === "substitution") {
              iconText = "🔄";
              eventDetail = `In: ${ev.playerInName} / Out: ${ev.playerOutName}`;
            }

            return (
              <div key={idx} className={`timeline-row ${isHomeEvent ? 'home-event-row' : 'away-event-row'}`}>
                <div className="timeline-time-badge">{ev.minute}'</div>
                <div className="timeline-event-card">
                  <div className="event-card-header">
                    <span className="event-icon-span">{iconText}</span>
                    <span className="event-title-span">{ev.title || ev.type.toUpperCase()}</span>
                  </div>
                  <p className="event-detail-p">{eventDetail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const activeLeagueLabel = leagues.find(option => option.value === selectedLeague)?.label || leagueLabel;

  // Listen to window size to adapt paging size
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load configuration and leagues dynamically
  useEffect(() => {
    async function fetchLeagues() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/config`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.supported_leagues) && data.supported_leagues.length > 0) {
            setLeagues(data.supported_leagues);
            setSelectedLeague(data.supported_leagues[0].value);
            setLeagueLabel(data.supported_leagues[0].label);
          }
        }
      } catch (err) {
        console.warn("Could not fetch leagues from backend config. Using defaults.", err);
      }
    }
    fetchLeagues();
  }, [appMode]);

  const pageSize = isDesktop ? 6 : 3;
  const maxPage = Math.max(0, Math.ceil(matches.length / pageSize) - 1);

  // Reset pagination when league changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedLeague, matches.length, pageSize]);

  const nextPage = () => {
    setCurrentPage((prev) => (prev >= maxPage ? 0 : prev + 1));
  };

  useEffect(() => {
    let mounted = true;

    async function fetchLiveMatches() {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ league: selectedLeague });
        const res = await fetch(`${BACKEND_URL}/api/v1/live-matches/feed?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Live match feed failed");
        }

        const data = await res.json();
        if (!mounted) return;

        setMatches(Array.isArray(data.matches) ? data.matches : []);
        setLeagueLabel(data.league_label || leagues.find(option => option.value === selectedLeague)?.label || "Selected League");
      } catch {
        if (!mounted) return;
        setMatches([]);
        setError("Could not reach the internet-backed feed. Check selected league source.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchLiveMatches();
    const interval = window.setInterval(fetchLiveMatches, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [selectedLeague, leagues]);

  const pageMatches = useMemo(() => {
    const sliced = matches.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    if (sliced.length > 0 && sliced.length < pageSize) {
      const padded = [...sliced];
      while (padded.length < pageSize) {
        padded.push({
          id: `placeholder-${padded.length}`,
          homeTeam: "",
          awayTeam: "",
          homeScore: 0,
          awayScore: 0,
          minute: "",
          isLive: false,
          status: "",
          events: [],
          isPlaceholder: true,
        } as any);
      }
      return padded;
    }
    return sliced;
  }, [matches, currentPage, pageSize]);

  return (
    <div className="livescore-container-dark">
      {/* Matches Header */}
      <div className="livescore-header-dark">
        <h2 className="livescore-title-dark">Matches</h2>
        
        <div className="flex items-center gap-3">
          {/* League Dropdown picker integrated inside the dark header */}
          <label className="league-picker-dark">
            <select
              value={selectedLeague}
              onChange={event => setSelectedLeague(event.target.value)}
              className="league-select-dark"
            >
              {leagues.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* Page Navigator > Button */}
          {maxPage > 0 && (
            <button 
              onClick={nextPage} 
              className="livescore-next-btn-dark" 
              aria-label="Next page"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="livescore-loading-dark" role="status" aria-live="polite">
          <div className="loader-video-shell-dark">
            {showVideoLoader ? (
              <video
                className="loader-video-dark"
                src={LIVE_LOADER_VIDEO_SRC}
                autoPlay
                muted
                loop
                playsInline
                onError={() => setShowVideoLoader(false)}
              />
            ) : (
              <div className="loader-ring-dark" />
            )}
          </div>
          <div className="loader-text-container-dark">
            <p className="loader-title-dark">Fetching {activeLeagueLabel} match intelligence</p>
            <p className="loader-copy-dark">Retrieving live and recently completed fixtures...</p>
          </div>
        </div>
      ) : error ? (
        <div className="livescore-empty-compact-dark">
          <p className="livescore-empty-copy-dark">{error}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="livescore-empty-compact-dark">
          <p className="livescore-empty-copy-dark">No live or recent {activeLeagueLabel} matches found.</p>
        </div>
      ) : (
        /* Dynamic 2-column Grid matches list */
        <div className="livescore-grid-dark">
          {pageMatches.map(match => {
            if (match.isPlaceholder) {
              return (
                <div key={match.id} className="match-row-dark opacity-0 pointer-events-none select-none">
                  {/* Left Part: Teams and Scores */}
                  <div className="match-teams-left-dark">
                    <div className="team-row-dark">
                      <div className="team-details-dark">
                        <FlagIcon team="" className="h-5 w-5" />
                        <span className="team-name-dark">Placeholder</span>
                      </div>
                      <div className="team-score-container-dark">
                        <span className="team-score-dark">0</span>
                        <span className="winner-arrow-dark invisible">◀</span>
                      </div>
                    </div>
                    <div className="team-row-dark">
                      <div className="team-details-dark">
                        <FlagIcon team="" className="h-5 w-5" />
                        <span className="team-name-dark">Placeholder</span>
                      </div>
                      <div className="team-score-container-dark">
                        <span className="team-score-dark">0</span>
                        <span className="winner-arrow-dark invisible">◀</span>
                      </div>
                    </div>
                  </div>
                  <div className="match-divider-dark" />
                  <div className="match-meta-right-dark">
                    <span className="match-status-text-dark">FT</span>
                    <span className="match-date-text-dark">TBD</span>
                  </div>
                </div>
              );
            }

            const isHomeWinner = (match.status === "FT" || match.status === "LIVE" || match.status === "HALF") && match.homeScore > match.awayScore;
            const isAwayWinner = (match.status === "FT" || match.status === "LIVE" || match.status === "HALF") && match.awayScore > match.homeScore;
            const homeHasRedCard = match.bookings?.some(b => b.teamId === match.homeTeamId && (b.card === "RED" || b.card === "YELLOW_RED"));
            const awayHasRedCard = match.bookings?.some(b => b.teamId === match.awayTeamId && (b.card === "RED" || b.card === "YELLOW_RED"));

            return (
              <div 
                key={match.id} 
                className="match-row-dark cursor-pointer hover:bg-zinc-800/20 active:scale-[0.99] transition-all"
                onClick={() => handleMatchClick(match.id)}
              >
                {/* Left Part: Teams and Scores */}
                <div className="match-teams-left-dark">
                  {/* Home Row */}
                  <div className="team-row-dark">
                    <div className="team-details-dark">
                      {match.homeCrest && !crestErrors[match.id + "-home"] ? (
                        <img 
                          src={match.homeCrest} 
                          alt={match.homeTeam} 
                          className="team-crest-img-dark"
                          onError={() => setCrestErrors(prev => ({ ...prev, [match.id + "-home"]: true }))}
                        />
                      ) : (
                        <FlagIcon team={match.homeTeam} className="h-5 w-5" />
                      )}
                      <span className="team-name-dark">{match.homeTeam}</span>
                    </div>
                    <div className="team-score-container-dark">
                      <span className="team-score-dark">{match.homeScore}</span>
                      <span className={`winner-arrow-dark ${isHomeWinner ? "" : "invisible select-none"}`}>◀</span>
                    </div>
                  </div>

                  {/* Away Row */}
                  <div className="team-row-dark">
                    <div className="team-details-dark">
                      {match.awayCrest && !crestErrors[match.id + "-away"] ? (
                        <img 
                          src={match.awayCrest} 
                          alt={match.awayTeam} 
                          className="team-crest-img-dark"
                          onError={() => setCrestErrors(prev => ({ ...prev, [match.id + "-away"]: true }))}
                        />
                      ) : (
                        <FlagIcon team={match.awayTeam} className="h-5 w-5" />
                      )}
                      <span className="team-name-dark">{match.awayTeam}</span>
                    </div>
                    <div className="team-score-container-dark">
                      <span className="team-score-dark">{match.awayScore}</span>
                      <span className={`winner-arrow-dark ${isAwayWinner ? "" : "invisible select-none"}`}>◀</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="match-divider-dark" />

                {/* Right Part: Status and Date */}
                <div className="match-meta-right-dark">
                  <span className="match-status-text-dark">{match.status}</span>
                  <span className="match-date-text-dark">
                    {match.eventDate ? formatMatchDate(match.eventDate) : "TBD"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Match Overlay Modal */}
      {selectedMatchId && (
        <div className="match-overlay-backdrop" onClick={handleCloseOverlay}>
          <div className="match-overlay-container" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="match-overlay-header">
              <button className="match-overlay-back-btn" onClick={handleCloseOverlay}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                <span className="match-overlay-title-text font-black text-sm uppercase tracking-wide">
                  {matchDetails ? `${matchDetails.homeTeam?.shortName || matchDetails.homeTeam?.name || 'Home'} vs ${matchDetails.awayTeam?.shortName || matchDetails.awayTeam?.name || 'Away'}` : "Loading Match Details..."}
                </span>
              </button>
              <button className="match-overlay-close-btn" onClick={handleCloseOverlay}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingDetails ? (
              <div className="match-overlay-loading">
                <div className="loader-ring-dark" />
                <p className="mt-4 text-xs font-bold text-zinc-400">Loading match metrics & intelligence...</p>
              </div>
            ) : detailsError ? (
              <div className="match-overlay-error">
                <p className="text-red-500 font-bold text-sm">{detailsError}</p>
                <button className="mt-4 px-4 py-2 bg-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-all text-white" onClick={handleCloseOverlay}>Close</button>
              </div>
            ) : matchDetails ? (
              <div className="match-overlay-content scrollbar-thin">
                
                {/* Main Score Box */}
                <div className="match-summary-card">
                  <div className="summary-card-top">
                    <span className="summary-league-text text-purple-400">
                      {matchDetails.competition?.name || "League"} · {matchDetails.utcDate ? formatMatchDate(matchDetails.utcDate) : "TBD"}
                    </span>
                    <span className="summary-status-text">
                      {matchDetails.status === "FINISHED" ? "Full-time" : matchDetails.status === "LIVE" ? `Live ${matchDetails.minute}'` : matchDetails.status}
                    </span>
                  </div>

                  <div className="summary-score-row">
                    <div className="summary-team home-side">
                      {matchDetails.homeTeam?.crest ? (
                        <img src={matchDetails.homeTeam.crest} alt={matchDetails.homeTeam.name} className="summary-crest" />
                      ) : (
                        <FlagIcon team={matchDetails.homeTeam?.name || ""} className="w-12 h-12" />
                      )}
                      <span className="summary-team-name">{matchDetails.homeTeam?.shortName || matchDetails.homeTeam?.name}</span>
                    </div>

                    <div className="summary-score-display">
                      <span className="score-number">{matchDetails.score?.fullTime?.home ?? 0}</span>
                      <span className="score-divider">-</span>
                      <span className="score-number">{matchDetails.score?.fullTime?.away ?? 0}</span>
                    </div>

                    <div className="summary-team away-side">
                      {matchDetails.awayTeam?.crest ? (
                        <img src={matchDetails.awayTeam.crest} alt={matchDetails.awayTeam.name} className="summary-crest" />
                      ) : (
                        <FlagIcon team={matchDetails.awayTeam?.name || ""} className="w-12 h-12" />
                      )}
                      <span className="summary-team-name">{matchDetails.awayTeam?.shortName || matchDetails.awayTeam?.name}</span>
                    </div>
                  </div>

                  <div className="summary-center-icon text-zinc-700/20 font-black">
                    ⚽
                  </div>

                  <div className="summary-scorers-grid">
                    <div className="summary-scorers home-scorers">
                      {formatTeamScorers(matchDetails.goals?.filter((g: any) => g.team?.id === matchDetails.homeTeam?.id || g.team?.name === matchDetails.homeTeam?.name) || []).map((s, idx) => (
                        <div key={idx} className="scorer-item">{s}</div>
                      ))}
                    </div>
                    <div className="summary-scorers away-scorers">
                      {formatTeamScorers(matchDetails.goals?.filter((g: any) => g.team?.id === matchDetails.awayTeam?.id || g.team?.name === matchDetails.awayTeam?.name) || []).map((s, idx) => (
                        <div key={idx} className="scorer-item">{s}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recap Cards */}
                <div className="match-recap-cards-container">
                  <div className="recap-card video-recap-card">
                    <div className="video-card-overlay">
                      <div className="video-card-badge">Match recap</div>
                      <div className="video-play-button-shell">
                        <div className="play-button-circle">
                          <svg className="w-6 h-6 fill-current text-white ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        <span className="play-button-label">HIGHLIGHTS</span>
                      </div>
                      <div className="video-card-duration">10:32</div>
                    </div>
                    <div className="video-card-bg-gradient" />
                    <div className="video-card-teams-text uppercase opacity-10">
                      <span className="font-extrabold text-white text-3xl tracking-widest">
                        {matchDetails.homeTeam?.tla || matchDetails.homeTeam?.shortName?.slice(0,3).toUpperCase() || "HOME"}
                      </span>
                      <span className="text-zinc-400 text-sm font-bold mx-2">vs</span>
                      <span className="font-extrabold text-white text-3xl tracking-widest">
                        {matchDetails.awayTeam?.tla || matchDetails.awayTeam?.shortName?.slice(0,3).toUpperCase() || "AWAY"}
                      </span>
                    </div>
                  </div>

                  <div className="recap-card story-recap-card">
                    <div className="story-card-header">
                      <span className="story-league-badge">{matchDetails.competition?.code || "MATCH"}</span>
                      <div className="story-arrow-circle">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                    <div className="story-card-body">
                      <h3 className="story-title">WATCH MATCH STORY</h3>
                      <p className="story-subtitle">Match recap</p>
                    </div>
                    <div className="story-card-footer">
                      <div className="story-footer-logo">⚽ OFFSIDE AI</div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="overlay-tabs-bar">
                  <button 
                    className={`overlay-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timeline')}
                  >
                    TIMELINE
                  </button>
                  <button 
                    className={`overlay-tab-btn ${activeTab === 'lineups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lineups')}
                  >
                    LINEUPS
                  </button>
                  <button 
                    className={`overlay-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                  >
                    STATS
                  </button>
                </div>

                {/* Content Panel */}
                <div className="overlay-tab-content-panel">
                  {activeTab === 'stats' && renderStatsTab()}
                  {activeTab === 'lineups' && renderLineupsTab()}
                  {activeTab === 'timeline' && renderTimelineTab()}
                </div>

                {/* Footer */}
                <div className="overlay-footer">
                  {matchDetails.venue && (
                    <p className="footer-venue">
                      Venue: <span className="venue-highlight">{matchDetails.venue}</span>
                    </p>
                  )}
                  <p className="footer-timezone">All times are in India Standard Time</p>
                </div>

              </div>
            ) : null}

          </div>
        </div>
      )}
    </div>
  );
}
