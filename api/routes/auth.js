import express from "express";
import { login, register, logout, clearSession, resetPassword } from "../controllers/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.post("/clear-session", clearSession);
router.post("/reset-password", resetPassword);

export default router;
