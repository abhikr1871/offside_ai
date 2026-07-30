import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  followed_teams: string[];
  favorite_players: string[];
  country: string;
  city: string;
  stadium: string;
  street: string;
  home_address?: string;
  onboarded: boolean;
}

export interface MatchDocument {
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

export interface TicketDocument {
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

export interface StoreProduct {
  product_id: string;
  seller_email: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  created_at?: string;
  status?: string;
}
export interface ChatMessage {
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
}

export interface AIPlanningStage {
  id: string;
  label: string;
  brief: string;
  details?: string[];
}

export interface TeamDetail {
  name: string;
  shortName?: string;
  crest?: string;
  clubColors?: string;
  venue?: string;
  founded?: number;
  website?: string;
  coach?: string;
  squad?: Array<{ name: string; position?: string; nationality?: string; shirtNumber?: number }>;
  area?: { name: string; flag?: string };
  runningCompetitions?: Array<{ name: string; emblem?: string }>;
}

export interface PlayerDetail {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  position?: string;
  shirtNumber?: number;
  currentTeam?: {
    name?: string;
    crest?: string;
    venue?: string;
  };
}

export interface MongoTeam {
  id: number;
  name: string;
  crest?: string;
  shortName?: string;
  venue?: string;
  clubColors?: string;
}

export type TabId = "dashboard" | "journey" | "tickets" | "assistant" | "analysis" | "store" | "contact" | "settings";
