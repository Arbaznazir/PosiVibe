import express from "express";
import {
  getRelationships,
  addRelationship,
  deleteRelationship,
  getFollowing,
  acceptFollowRequest,
  ignoreFollowRequest,
} from "../controllers/relationship.js";

const router = express.Router();

router.get("/", getRelationships);
router.get("/following", getFollowing);
router.post("/", addRelationship);
router.delete("/", deleteRelationship);
router.post("/accept/:userId", acceptFollowRequest);
router.post("/ignore/:userId", ignoreFollowRequest);

export default router;
