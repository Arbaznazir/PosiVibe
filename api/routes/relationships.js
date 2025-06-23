import express from "express";
import {
  getRelationships,
  addRelationship,
  deleteRelationship,
  getFollowing,
} from "../controllers/relationship.js";

const router = express.Router();

router.get("/", getRelationships);
router.get("/following", getFollowing);
router.post("/", addRelationship);
router.delete("/", deleteRelationship);

export default router;
