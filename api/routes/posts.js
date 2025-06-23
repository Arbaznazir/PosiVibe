import express from "express";
import multer from "multer";
import {
  getPosts,
  addPost,
  deletePost,
  analyzeContent,
} from "../controllers/post.js";
import {
  zeroTolerancePostFilter,
  zeroToleranceFileFilter,
} from "../utils/zeroToleranceMiddleware.js";

const router = express.Router();

// Configure multer for memory storage (Cloudinary upload)
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getPosts);

// Apply zero tolerance filtering to post creation
router.post(
  "/",
  upload.single("file"),
  zeroToleranceFileFilter,
  zeroTolerancePostFilter,
  addPost
);

router.delete("/:id", deletePost);

// New endpoint for content analysis preview
router.post("/analyze", analyzeContent);

export default router;
