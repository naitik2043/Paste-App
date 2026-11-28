import handler from "./index.js";
import { createRouteHandler } from "./route-utils.js";

export function route(path) {
  return createRouteHandler(handler, path);
}
