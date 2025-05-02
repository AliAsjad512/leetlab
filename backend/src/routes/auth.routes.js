import express from "express"

import {login,logout,register,check} from "../controllers/auth.controller.js"
import { authMiddleware } from "../middleware/auth.middleware.js";

const authRoutes = express.Router();

authRoutes.post("/register",register)

authRoutes.post("/login",login)
authRoutes.post("/logout",authMiddleware ,logout)
authRoutes.get("/check",authMiddleware ,check)

authRoutes.get("/test", (req, res) => {
    console.log("✅ Test route hit");
    res.send("Test route working");
  });

export default authRoutes