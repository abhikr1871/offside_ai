/**
 * dev.js - Safe Next.js dev server launcher
 *
 * Problem: OneDrive / zombie Node processes lock `distDir/trace` on startup.
 * Solution:
 *   1. Kill any existing Node processes holding port 3000.
 *   2. Delete the stale trace file.
 *   3. Start `next dev` cleanly.
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const TRACE_FILE = path.join(
  process.env.USERPROFILE,
  "AppData",
  "Local",
  "offside-ai-next",
  "trace"
);

// ── Step 1: Kill processes holding port 3000 ──────────────────────────────────
console.log("[dev] Checking for zombie processes on port 3000...");
try {
  const output = execSync("netstat -ano", { encoding: "utf8" });
  const pids = new Set();
  output.split("\n").forEach((line) => {
    // Match LISTENING or ESTABLISHED on :3000
    if (/:3000\s/.test(line)) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") {
        pids.add(pid);
      }
    }
  });

  if (pids.size > 0) {
    pids.forEach((pid) => {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        console.log(`[dev] Killed zombie process PID ${pid}`);
      } catch (_) {
        // Process may have already exited
      }
    });
    // Give OS a moment to release file handles
    execSync("ping 127.0.0.1 -n 2 > nul");
  } else {
    console.log("[dev] No zombie processes found.");
  }
} catch (_) {
  // netstat failed - skip
}

// ── Step 2: Remove stale trace file ──────────────────────────────────────────
console.log(`[dev] Removing stale trace file: ${TRACE_FILE}`);
try {
  fs.unlinkSync(TRACE_FILE);
  console.log("[dev] Trace file removed.");
} catch (_) {
  console.log("[dev] Trace file not present (clean start).");
}

// ── Step 3: Start next dev ────────────────────────────────────────────────────
console.log("[dev] Starting Next.js dev server...\n");
const next = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    NODE_PATH: "./node_modules",
  },
});

next.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => next.kill("SIGINT"));
process.on("SIGTERM", () => next.kill("SIGTERM"));
