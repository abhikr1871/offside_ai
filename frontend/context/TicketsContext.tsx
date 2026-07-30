import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { TicketDocument, MatchDocument } from "../lib/types";
import { BACKEND, MCP_SERVICES } from "../lib/constants";
import { useDashboard } from "./DashboardContext";

interface TicketsContextType {
  tickets: any;
  ticketsLoading: any;
  bookedMatchIds: any;
  bookingInProgress: any;
  ticketSelectedMatchId: any;
  ticketAvailabilityError: any;
  ticketAvailabilityData: any;
  ticketAvailabilityLoading: any;
  ticketForecastingData: any;
  stadiumIntelData: any;
  stadiumIntelLoading: any;
  ticketForecastingLoading: any;
  isCustomTicketSearch: any;
  customTicketQuery: any;
  customHomeQuery: any;
  customAwayQuery: any;
  customTicketDate: any;
  customSelectedMatch: any;
  isSearchingCustomTicket: any;
  setTickets: any;
  setTicketsLoading: any;
  setBookedMatchIds: any;
  setBookingInProgress: any;
  setTicketSelectedMatchId: any;
  setTicketAvailabilityError: any;
  setTicketAvailabilityData: any;
  setTicketAvailabilityLoading: any;
  setTicketForecastingData: any;
  setStadiumIntelData: any;
  setStadiumIntelLoading: any;
  setTicketForecastingLoading: any;
  setIsCustomTicketSearch: any;
  setCustomTicketQuery: any;
  setCustomHomeQuery: any;
  setCustomAwayQuery: any;
  setCustomTicketDate: any;
  setCustomSelectedMatch: any;
  setIsSearchingCustomTicket: any;
  fetchTickets: any;
  handleBookTicket: any;
  handleCheckAvailability: any;
  handleRunAISeatingForecast: any;
  handleSearchCustomTicketMatch: any;
  fetchStadiumIntelligence: any;
  handleSelectMatch: any;

}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const { email, activeTab, followedMatches } = useDashboard(); // Needed for fetchTickets

  const [tickets, setTickets] = useState<TicketDocument[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [bookedMatchIds, setBookedMatchIds] = useState<Set<string>>(new Set());
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);
  const [ticketSelectedMatchId, setTicketSelectedMatchId] = useState<string | null>(null);
  const [ticketAvailabilityError, setTicketAvailabilityError] = useState<string | null>(null);
  const [ticketAvailabilityData, setTicketAvailabilityData] = useState<any | null>(null);
  const [ticketAvailabilityLoading, setTicketAvailabilityLoading] = useState<boolean>(false);
  const [ticketForecastingData, setTicketForecastingData] = useState<any | null>(null);
  const [stadiumIntelData, setStadiumIntelData] = useState<any | null>(null);
  const [stadiumIntelLoading, setStadiumIntelLoading] = useState<boolean>(false);
  const [ticketForecastingLoading, setTicketForecastingLoading] = useState<boolean>(false);
  const [isCustomTicketSearch, setIsCustomTicketSearch] = useState<boolean>(false);
  const [customTicketQuery, setCustomTicketQuery] = useState<string>("");
  const [customHomeQuery, setCustomHomeQuery] = useState<string>("");
  const [customAwayQuery, setCustomAwayQuery] = useState<string>("");
  const [customTicketDate, setCustomTicketDate] = useState<string>("");
  const [customSelectedMatch, setCustomSelectedMatch] = useState<MatchDocument | null>(null);
  const [isSearchingCustomTicket, setIsSearchingCustomTicket] = useState<boolean>(false);

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

  const handleCheckAvailability = async (match: MatchDocument) => {
    setTicketAvailabilityLoading(true);
    setTicketAvailabilityError(null);
    setTicketAvailabilityData(null);
    try {
      const matchName = `${match.homeTeam} vs ${match.awayTeam}`;
      const r = await fetch(`${BACKEND}/api/v1/tickets/availability?match_name=${encodeURIComponent(matchName)}`);
      const data = await r.json();
      if (!r.ok) {
        setTicketAvailabilityError(data.detail || "Failed to check ticket availability.");
      } else {
        setTicketAvailabilityData(data);
      }
    } catch (exc: any) {
      setTicketAvailabilityError(exc?.message || "Failed to check ticket availability.");
    } finally {
      setTicketAvailabilityLoading(false);
    }
  };

  const handleRunAISeatingForecast = async (match: MatchDocument) => {
    setTicketForecastingLoading(true);
    setTicketForecastingData(null);
    try {
      const matchName = `${match.homeTeam} vs ${match.awayTeam}`;
      const r = await fetch(`${BACKEND}/api/v1/tickets/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_name: matchName,
          match_date: match.eventDate || "",
          venue: match.venue || "Unknown Venue"
        })
      });
      const data = await r.json();
      if (r.ok) {
        setTicketForecastingData(data);
      }
    } catch {
    } finally {
      setTicketForecastingLoading(false);
    }
  };

  const handleSearchCustomTicketMatch = async () => {
    const combinedQuery = `${customHomeQuery.trim()} vs ${customAwayQuery.trim()}`;
    if (!customHomeQuery.trim() || !customAwayQuery.trim()) return;
    setIsSearchingCustomTicket(true);
    setTicketAvailabilityError(null);
    setTicketAvailabilityData(null);
    setTicketForecastingData(null);
    setCustomSelectedMatch(null);
    try {
      const query = encodeURIComponent(combinedQuery);
      const date = encodeURIComponent(customTicketDate);
      const res = await fetch(`${BACKEND}/api/v1/tickets/custom-match?query=${query}&date=${date}`);
      if (res.ok) {
        const matchData = await res.json();
        setCustomSelectedMatch(matchData);
        setTicketSelectedMatchId(matchData.id);
        
        // Auto-correct spelling in inputs
        setCustomHomeQuery(matchData.homeTeam);
        setCustomAwayQuery(matchData.awayTeam);
        
        handleCheckAvailability(matchData);
        handleRunAISeatingForecast(matchData);
        fetchStadiumIntelligence(matchData);
      } else {
        const err = await res.json();
        setTicketAvailabilityError(err.detail || "Failed to search custom match.");
      }
    } catch (e: any) {
      setTicketAvailabilityError(e?.message || "Failed to connect to search service.");
    } finally {
      setIsSearchingCustomTicket(false);
    }
  };


  const fetchStadiumIntelligence = async (match: MatchDocument | any) => {
    if (!match) return;
    setStadiumIntelLoading(true);
    try {
      const venue = encodeURIComponent(match.venue || "The Stadium");
      const matchName = encodeURIComponent(`${match.homeTeam || "Home"} vs ${match.awayTeam || "Away"}`);
      const date = encodeURIComponent(match.eventDate || "");
      const city = encodeURIComponent((match as any).city || "");
      const res = await fetch(`${BACKEND}/api/v1/tickets/stadium-intelligence?venue=${venue}&match_name=${matchName}&date=${date}&city=${city}`);
      if (res.ok) {
        const data = await res.json();
        setStadiumIntelData(data);
      }
    } catch (e) {
      console.error("Failed to fetch stadium intelligence:", e);
    } finally {
      setStadiumIntelLoading(false);
    }
  };

  const handleSelectMatch = (matchId: string) => {
    setCustomSelectedMatch(null);
    setTicketSelectedMatchId(matchId);
    setTicketForecastingData(null);
    setTicketAvailabilityError(null);
    setTicketAvailabilityData(null);
    setStadiumIntelData(null);
    
    if (matchId) {
      const match = followedMatches.find((m: any) => m.id === matchId);
      if (match) {
        handleCheckAvailability(match);
        handleRunAISeatingForecast(match);
        fetchStadiumIntelligence(match);
      }
    }
  };


  useEffect(() => {
    if (activeTab === "tickets" && email) fetchTickets(email);
  }, [activeTab, email, fetchTickets]);

  return (
    <TicketsContext.Provider value={{
      tickets, ticketsLoading, bookedMatchIds, bookingInProgress, ticketSelectedMatchId, ticketAvailabilityError, ticketAvailabilityData, ticketAvailabilityLoading, ticketForecastingData, stadiumIntelData, stadiumIntelLoading, ticketForecastingLoading, isCustomTicketSearch, customTicketQuery, customHomeQuery, customAwayQuery, customTicketDate, customSelectedMatch, isSearchingCustomTicket, setTickets, setTicketsLoading, setBookedMatchIds, setBookingInProgress, setTicketSelectedMatchId, setTicketAvailabilityError, setTicketAvailabilityData, setTicketAvailabilityLoading, setTicketForecastingData, setStadiumIntelData, setStadiumIntelLoading, setTicketForecastingLoading, setIsCustomTicketSearch, setCustomTicketQuery, setCustomHomeQuery, setCustomAwayQuery, setCustomTicketDate, setCustomSelectedMatch, setIsSearchingCustomTicket, fetchTickets, handleBookTicket, handleCheckAvailability, handleRunAISeatingForecast, handleSearchCustomTicketMatch, fetchStadiumIntelligence, handleSelectMatch
    }}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (!context) throw new Error("useTickets must be used within TicketsProvider");
  return context;
}
