import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { readLaunchTicket } from "../utils/launchTicket";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const ticket = readLaunchTicket(window.location.hash);
      const hasLaunchTicket = Boolean(ticket);

      try {
        if (hasLaunchTicket) {
          // Remove the one-time credential from browser history before any network request.
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          const exchange = await fetch("/api/auth/exchange", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ ticket })
          });
          const exchangeResult = await exchange.json().catch(() => ({}));
          if (!exchange.ok) {
            throw new Error(exchangeResult.error || "Could not connect your LeetMetric account.");
          }
        }

        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
          headers: { Accept: "application/json" }
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to verify your session.");
        if (active) setUser(result.user || null);
      } catch (error) {
        if (active) {
          setUser(null);
          // Keep track of the original ticket: the URL fragment has already been cleared.
          if (hasLaunchTicket) {
            toast.error(error instanceof Error ? error.message : "Could not connect your LeetMetric account.");
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async refresh() {
      const response = await fetch("/api/auth/me", { credentials: "same-origin" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Session check failed.");
      setUser(result.user || null);
      return result.user || null;
    },
    async logout() {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      setUser(null);
    }
  }), [user, loading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider.");
  return value;
}
