import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";

export const authRoutes = Router();
authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", requireAuthentication, me);
