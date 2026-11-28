import { route } from "../../../server/routes.js";

export default route((req) => ["pastes", String(req.query.id || ""), "restore"]);
