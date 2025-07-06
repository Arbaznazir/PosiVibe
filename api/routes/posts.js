import express from "express";
import multer from "multer";
import {
  getPosts,
  addPost,
  deletePost,
  analyzeContent,
} from "../controllers/post.js";

const router = express.Router();

// Configure multer for memory storage (Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).single("image"); // Changed to match frontend's field name

router.get("/", getPosts);

// Apply zero tolerance filtering to post creation
router.post(
  "/",
  (req, res, next) => {
    console.log("📝 Received post request", {
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
    });

    upload(req, res, (err) => {
      if (err) {
        console.error("❌ Upload error:", err);
        return res.status(400).json({
          message: err.message || "Failed to upload file",
        });
      }
      next();
    });
  },
  addPost
);

router.delete("/:id", deletePost);

// New endpoint for content analysis preview
router.post("/analyze", analyzeContent);

export default router;
