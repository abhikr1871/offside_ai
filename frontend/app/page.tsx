"use client";

import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import LiveScore from "../components/LiveScore";
import FollowTeam from "../components/FollowTeam";
import ScheduleRAG from "../components/ScheduleRAG";
import LeagueStandings from "../components/LeagueStandings";
import JourneyHub from "../components/JourneyHub";

const BACKEND_URL = "http://localhost:8080";

export default function Home() {
  const [followedTeams, setFollowedTeams] = useState<string[]>([]);
  const [appMode, setAppMode] = useState<"club" | "worldcup">("club");

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.app_mode) {
            setAppMode(data.app_mode);
          }
        }
      } catch (err) {
        console.warn("Could not reach backend config endpoint. Defaulting to club mode.", err);
      }
    }
    fetchConfig();
  }, []);

  return (
    <div className="min-h-screen text-zinc-950 dark:text-white font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300" style={{ background: "var(--bg-gradient)" }}>
      <Header />

      {/* Centered rectangular box for LiveScore */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <LiveScore appMode={appMode} />
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-zinc-950 dark:text-white transition-colors">
            {appMode === "club" ? "Club Football Leagues Dashboard" : "World Cup 2026 Dashboard"}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 transition-colors">
            {appMode === "club"
              ? "Live matches across European and world leagues, personalized team tracking, and intelligent schedules."
              : "Real match feeds, user-based favorite teams, and focused schedule filtering."}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <section className="md:col-span-1">
            <FollowTeam onFollowChange={setFollowedTeams} appMode={appMode} />
          </section>

          <section className="md:col-span-2 flex flex-col gap-6">
            <LeagueStandings />
            <JourneyHub />
          </section>
        </div>

        <section className="pt-4">
          <ScheduleRAG followedTeams={followedTeams} appMode={appMode} />
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs mt-12 transition-colors duration-300" style={{ borderColor: "var(--header-border)", background: "var(--card-bg)", color: "var(--text-secondary)" }}>
        <p>Offside AI 2026. Match intelligence dashboard.</p>
      </footer>
    </div>
  );
}
