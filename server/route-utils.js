export function createRouteHandler(apiHandler, routePath) {
  if (typeof apiHandler !== "function") {
    throw new TypeError("An API handler function is required.");
  }
  if (typeof routePath !== "function" && !Array.isArray(routePath) && typeof routePath !== "string") {
    throw new TypeError("A route path string, array, or resolver function is required.");
  }

  return function routeHandler(req, res) {
    const resolved = typeof routePath === "function" ? routePath(req) : routePath;
    const segments = (Array.isArray(resolved) ? resolved : [resolved])
      .filter((segment) => typeof segment === "string" && segment.length > 0);

    req.query = { ...(req.query || {}), path: segments };
    return apiHandler(req, res);
  };
}
