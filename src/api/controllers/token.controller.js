import { createControllerWrapper } from "./common.js";
import { tokenService } from "../services/index.js";

export const getTokens = createControllerWrapper(tokenService.getTokens, "C-001");
