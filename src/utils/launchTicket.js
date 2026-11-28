export function readLaunchTicket(hash) {
  const fragment = typeof hash === "string" && hash.startsWith("#") ? hash.slice(1) : "";
  return new URLSearchParams(fragment).get("sso") || "";
}
