import express from "express";
import {
  getLikes,
  addLike,
  deleteLike,
  getAllLikes,
} from "../controllers/like.js";

const router = express.Router();

router.get("/", getLikes);
router.get("/debug", getAllLikes);
router.post("/", addLike);
router.delete("/", deleteLike);

export default router;
