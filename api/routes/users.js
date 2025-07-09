import express from "express";
import {
  getUser,
  getAllUsers,
  updateUser,
  searchUsers,
  getSuggestions,
  getTimeLimit,
  simulateTimeUsage,
  verifyCurrentUser,
} from "../controllers/user.js";
import { zeroToleranceUserFilter } from "../utils/zeroToleranceMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAllUsers);
router.get("/verify", authMiddleware, verifyCurrentUser);
router.get("/find/:userId", authMiddleware, getUser);
router.get("/search", authMiddleware, searchUsers);
router.get("/suggestions", authMiddleware, getSuggestions);
router.get("/time-limit", authMiddleware, getTimeLimit);
router.post("/simulate-time", authMiddleware, simulateTimeUsage);

// Apply zero tolerance filtering to user profile updates
router.put("/", authMiddleware, zeroToleranceUserFilter, updateUser);

export default router;
