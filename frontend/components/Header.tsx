"use client";

import Link from "next/link";
import React from "react";
import { useEffect, useState } from "react";
import { getCurrentUser, logoutUser, StoredUser } from "../lib/auth";

export default function Header() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [appMode, setAppMode] = useState<"club" | "worldcup">("club");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setUser(getCurrentUser());
    async function fetchConfig() {
      try {
        const res = await fetch("http://localhost:8080/api/v1/config");
        if (res.ok) {
          const data = await res.json();
          if (data.app_mode) {
            setAppMode(data.app_mode);
          }
        }
      } catch {
        // Fallback silently to default
      }
    }
    fetchConfig();

    // Theme initialization
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const activeTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(activeTheme);
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="header-container">
      <div className="header-accent" />
      <div className="header-wrapper">
        <div className="header-inner">
          <Link href="/" className="logo-container">
            <div className="logo-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="logo-svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z"
                />
              </svg>
            </div>
            <span className="logo-text">
              OFFSIDE AI
            </span>
          </Link>

          <nav className="nav-menu">
            <Link href="/" className="nav-link-active">
              Dashboard
            </Link>
            <Link href="/" className="nav-link">
              Live Scores
            </Link>
            <Link href="/" className="nav-link">
              {appMode === "club" ? "Club Schedules" : "2026 Schedule"}
            </Link>
            <Link href="/" className="nav-link">
              AI Analytics
            </Link>
          </nav>

          <div className="header-actions">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label="Toggle theme"
              type="button"
            >
              {theme === "light" ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25C18 12 12 7.25 12 1.5M12 18.75A6.75 6.75 0 1 0 12 5.25a6.75 6.75 0 0 0 0 13.5ZM3.75 12H1.5m18.75 0h-2.25m-1.932-6.364l-1.591 1.591M6.343 17.657l-1.591 1.591m12.728 0l-1.591-1.591M6.343 6.343L4.752 4.752" />
                </svg>
              )}
            </button>
            <span className="badge-container">
              <span className="badge-dot" />
              {appMode === "club" ? "Club Season Live" : "FIFA 2026 Live"}
            </span>
            {user ? (
              <div className="user-menu">
                <span className="user-chip">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-name">{user.name}</span>
                <button type="button" className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-actions">
                <Link className="login-link" href="/login">Login</Link>
                <Link className="signup-link" href="/signup">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
