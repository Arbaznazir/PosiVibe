import express from "express";
import {
  getUser,
  updateUser,
  searchUsers,
  getTimeLimit,
  simulateTimeUsage,
} from "../controllers/user.js";
import { zeroToleranceUserFilter } from "../utils/zeroToleranceMiddleware.js";

const router = express.Router();

router.get("/find/:userId", getUser);
router.get("/search", searchUsers);
router.get("/time-limit", getTimeLimit);
router.post("/simulate-time", simulateTimeUsage);

// Apply zero tolerance filtering to user profile updates
router.put("/", zeroToleranceUserFilter, updateUser);

export default router;
