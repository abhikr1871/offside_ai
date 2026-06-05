"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FlagIcon } from "./LiveScore";

interface Match {
  match_no: number;
  stage: string;
  date: string;
  time: string;
  home_team: string;
  away_team: string;
  venue: string;
  city: string;
  country: string;
}

interface ScheduleRAGProps {
  followedTeams: string[];
  appMode?: "club" | "worldcup";
}

const BACKEND_URL = "http://localhost:8080";

const FALLBACK_WORLDCUP_SCHEDULE: Match[] = [
  { match_no: 1, stage: "Group Stage - Group A", date: "2026-06-11", time: "18:00 Local", home_team: "Mexico", away_team: "TBD", venue: "Estadio Azteca", city: "Mexico City", country: "Mexico" },
  { match_no: 2, stage: "Group Stage - Group B", date: "2026-06-12", time: "19:30 Local", home_team: "Canada", away_team: "TBD", venue: "BMO Field", city: "Toronto", country: "Canada" },
  { match_no: 3, stage: "Group Stage - Group D", date: "2026-06-12", time: "20:00 Local", home_team: "United States", away_team: "TBD", venue: "SoFi Stadium", city: "Los Angeles", country: "United States" },
  { match_no: 11, stage: "Group Stage - Group A", date: "2026-06-15", time: "17:00 Local", home_team: "Mexico", away_team: "TBD", venue: "Estadio BBVA", city: "Monterrey", country: "Mexico" },
  { match_no: 106, stage: "Final", date: "2026-07-19", time: "16:00 Local", home_team: "Winner Match 103", away_team: "Winner Match 104", venue: "MetLife Stadium", city: "East Rutherford", country: "United States" },
];

const FALLBACK_CLUB_SCHEDULE: Match[] = [
  { match_no: 1, stage: "Premier League", date: "2026-05-17", time: "15:00 GMT", home_team: "Manchester City", away_team: "Arsenal", venue: "Etihad Stadium", city: "Manchester", country: "England" },
  { match_no: 2, stage: "Premier League", date: "2026-05-17", time: "15:00 GMT", home_team: "Chelsea", away_team: "Manchester United", venue: "Stamford Bridge", city: "London", country: "England" },
  { match_no: 3, stage: "LaLiga", date: "2026-05-10", time: "20:00 CET", home_team: "Real Madrid", away_team: "Barcelona", venue: "Santiago Bernabeu", city: "Madrid", country: "Spain" },
  { match_no: 7, stage: "UEFA Europa League - Final", date: "2026-05-27", time: "20:00 BST", home_team: "Arsenal", away_team: "Bayer Leverkusen", venue: "Dublin Arena", city: "Dublin", country: "Ireland" },
  { match_no: 8, stage: "UEFA Champions League - Final", date: "2026-05-30", time: "21:00 CET", home_team: "Real Madrid", away_team: "Manchester City", venue: "San Siro", city: "Milan", country: "Italy" },
  { match_no: 9, stage: "MLS", date: "2026-05-30", time: "19:30 EST", home_team: "Inter Miami", away_team: "LA Galaxy", venue: "Chase Stadium", city: "Fort Lauderdale", country: "United States" },
];

export default function ScheduleRAG({ followedTeams, appMode = "club" }: ScheduleRAGProps) {
  const [schedule, setSchedule] = useState<Match[]>([]);
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "past">("upcoming");
  const [scheduleMode, setScheduleMode] = useState<"all" | "favorites">("all");
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // Load schedule depending on active configuration
  const defaultSchedule = appMode === "club" ? FALLBACK_CLUB_SCHEDULE : FALLBACK_WORLDCUP_SCHEDULE;

  const filteredSchedule = useMemo(() => {
    // Current date baseline for past vs upcoming split: 2026-05-25
    const baselineDate = "2026-05-25";
    
    let result = schedule;
    
    // Time filter
    if (timeFilter === "upcoming") {
      result = result.filter(match => match.date >= baselineDate);
    } else {
      result = result.filter(match => match.date < baselineDate);
    }
    
    // Favorite teams filter
    if (scheduleMode === "favorites") {
      result = result.filter(match => (
        followedTeams.includes(match.home_team) ||
        followedTeams.includes(match.away_team)
      ));
    }
    
    // Sort schedules chronologically
    return [...result].sort((a, b) => {
      const timeA = a.time && typeof a.time === "string" && a.time.includes(":") ? a.time.split(" ")[0] : "00:00";
      const timeB = b.time && typeof b.time === "string" && b.time.includes(":") ? b.time.split(" ")[0] : "00:00";
      
      const dateStrA = a.date ? `${a.date}T${timeA}` : "1970-01-01T00:00";
      const dateStrB = b.date ? `${b.date}T${timeB}` : "1970-01-01T00:00";
      
      const dateA = new Date(dateStrA);
      const dateB = new Date(dateStrB);
      
      return timeFilter === "upcoming"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime(); // reverse for results
    });
  }, [followedTeams, schedule, scheduleMode, timeFilter]);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        setLoadingSchedule(true);
        const res = await fetch(`${BACKEND_URL}/api/v1/schedule/feed`);
        if (res.ok) {
          const data = await res.json();
          setSchedule(data);
        } else {
          setSchedule(defaultSchedule);
        }
      } catch {
        console.warn("Backend API not reachable. Using fallback schedule data.");
        setSchedule(defaultSchedule);
      } finally {
        setLoadingSchedule(false);
      }
    }
    fetchSchedule();
  }, [appMode, defaultSchedule]);

  return (
    <div className="schedule-panel">
      <div className="schedule-header-row">
        <div>
          <h2 className="schedule-title">
            {appMode === "club" ? "Club Leagues Match Schedules" : "2026 FIFA World Cup Schedule"}
          </h2>
          <p className="schedule-caption">
            {timeFilter === "upcoming" ? "Showing upcoming fixtures." : "Showing recent results."}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Time filters */}
          <div className="schedule-toggle" role="group" aria-label="Time filter">
            <button
              type="button"
              onClick={() => setTimeFilter("upcoming")}
              className={timeFilter === "upcoming" ? "schedule-toggle-active" : "schedule-toggle-button"}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter("past")}
              className={timeFilter === "past" ? "schedule-toggle-active" : "schedule-toggle-button"}
            >
              Results
            </button>
          </div>

          {/* Favorite team filter */}
          <div className="schedule-toggle" role="group" aria-label="Team filter">
            <button
              type="button"
              onClick={() => setScheduleMode("all")}
              className={scheduleMode === "all" ? "schedule-toggle-active" : "schedule-toggle-button"}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode("favorites")}
              className={scheduleMode === "favorites" ? "schedule-toggle-active" : "schedule-toggle-button"}
            >
              Followed
            </button>
          </div>
        </div>
      </div>

      {loadingSchedule ? (
        <div className="schedule-skeleton">
          {[1, 2, 3].map(item => (
            <div key={item} className="schedule-skeleton-card" />
          ))}
        </div>
      ) : filteredSchedule.length === 0 ? (
        <div className="schedule-empty">
          {scheduleMode === "favorites"
            ? "Follow teams in the widget, then switch back to highlight matches."
            : "No matches found matching these filters."}
        </div>
      ) : (
        <div className="schedule-list">
          {filteredSchedule.map(match => {
            const isHomeFollowed = followedTeams.includes(match.home_team);
            const isAwayFollowed = followedTeams.includes(match.away_team);
            const isHighlighted = isHomeFollowed || isAwayFollowed;

            return (
              <div
                key={match.match_no}
                className={isHighlighted ? "schedule-card-highlighted" : "schedule-card"}
              >
                <div className="match-teams-info">
                  <div className="flex flex-col gap-1.5">
                    <div className="match-team-row">
                      <FlagIcon team={match.home_team} />
                      <span className={isHomeFollowed ? "match-team-text-active" : "match-team-text"}>
                        {match.home_team}
                      </span>
                    </div>
                    <div className="match-team-row">
                      <FlagIcon team={match.away_team} />
                      <span className={isAwayFollowed ? "match-team-text-active" : "match-team-text"}>
                        {match.away_team}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="match-meta-info">
                  <span className="match-meta-datetime">
                    {match.date} - {match.time}
                  </span>
                  <span className="match-meta-venue">
                    {match.venue} ({match.city}, {match.country}) - <span className="font-bold">{match.stage}</span>
                  </span>
                  {isHighlighted && (
                    <span className="badge-followed">
                      Followed Match
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
