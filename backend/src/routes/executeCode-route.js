import express from "express";
import { isloggedIn } from "../middlewares/auth.middlewares.js";

import executeCode from "../controllers/executeCode.controller.js";
const executionRoute = express.Router()

executionRoute.post("/",isloggedIn,executeCode)

export default executionRoute;