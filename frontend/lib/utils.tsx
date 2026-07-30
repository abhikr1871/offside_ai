import React from "react";
import { TEAM_CRESTS } from "./constants";

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

export function formatMatchDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export function formatShortDateRange(inDate?: string, outDate?: string) {
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

export function statusChipClass(status: string) {
  const s = (status || "").toUpperCase();
  if (["IN_PLAY", "PAUSED", "LIVE"].includes(s)) return "live";
  if (["FINISHED", "FT"].includes(s)) return "finished";
  return "scheduled";
}

export function statusLabel(status: string) {
  const s = (status || "").toUpperCase();
  if (["IN_PLAY", "LIVE"].includes(s)) return "Live";
  if (s === "PAUSED") return "HT";
  if (["FINISHED", "FT"].includes(s)) return "FT";
  if (["SCHEDULED", "TIMED"].includes(s)) return "Upcoming";
  return status;
}

export function renderMd(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
