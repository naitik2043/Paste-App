import handler from "./index.js";

// Create an explicit Vercel Function route and pass its normalized path to the shared API handler.
export function route(path) {
  return function routeHandler(req, res) {
    req.query = req.query || {};
    req.query.path = typeof path === "function" ? path(req) : path;
    return handler(req, res);
  };
}
