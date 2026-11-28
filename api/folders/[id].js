import { route } from "../../server/routes.js";

export default route((req) => ["folders", String(req.query.id || "")]);
