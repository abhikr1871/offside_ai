"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { loginUser, signUpUser } from "../lib/auth";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      if (isSignup) {
        if (!name.trim()) throw new Error("Please enter your name.");
        signUpUser(name, email, password);
      } else {
        loginUser(email, password);
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand-panel">
          <div className="auth-brand-mark">O</div>
          <p className="auth-eyebrow">Offside AI account</p>
          <h1 className="auth-heading">
            Keep your match dashboard tuned to your teams.
          </h1>
          <p className="auth-copy">
            Sign in to keep followed teams separate for each user and make the schedule view feel personal from the first click.
          </p>
        </section>

        <section className="auth-card">
          <h2 className="auth-card-title">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="auth-card-subtitle">
            {isSignup ? "Save your favorite teams under your own profile." : "Log in to load your saved favorite teams."}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && (
              <label className="auth-field">
                <span className="auth-label">Name</span>
                <input
                  className="auth-input"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
            )}

            <label className="auth-field">
              <span className="auth-label">Email</span>
              <input
                className="auth-input"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">Password</span>
              <input
                className="auth-input"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={4}
                required
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-submit" type="submit">
              {isSignup ? "Create Account" : "Login"}
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? "Already have an account? " : "New to Offside AI? "}
            <Link className="auth-link" href={isSignup ? "/login" : "/signup"}>
              {isSignup ? "Login" : "Create one"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
