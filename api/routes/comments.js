import express from "express";
import {
  getComments,
  addComment,
  deleteComment,
  analyzeCommentContent,
  getCommentStats,
} from "../controllers/comment.js";
import { zeroToleranceCommentFilter } from "../utils/zeroToleranceMiddleware.js";

const router = express.Router();

router.get("/", getComments);

// Apply zero tolerance filtering to comment creation
router.post("/", zeroToleranceCommentFilter, addComment);

router.delete("/:id", deleteComment);

// New endpoints for content analysis and statistics
router.post("/analyze", analyzeCommentContent);
router.get("/stats", getCommentStats);

export default router;
