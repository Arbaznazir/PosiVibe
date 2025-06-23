import express from "express";
import {
  getStories,
  addStory,
  deleteStory,
  viewStory,
  getStoryViews,
} from "../controllers/story.js";

const router = express.Router();

router.get("/", getStories);
router.post("/", addStory);
router.put("/:id/view", viewStory);
router.get("/:id/views", getStoryViews);
router.delete("/:id", deleteStory);

export default router;
