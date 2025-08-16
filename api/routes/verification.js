import express from "express";
import { 
  requestEmailVerification, 
  verifyAndRegister,
  requestPasswordReset,
  verifyOtp,
  verifyAndResetPassword
} from "../controllers/verification.js";

const router = express.Router();

// Email verification routes
router.post("/request-verification", requestEmailVerification);
router.post("/verify-and-register", verifyAndRegister);

// Password reset routes
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-otp", verifyOtp); // Step 1: Verify OTP only
router.post("/verify-and-reset-password", verifyAndResetPassword); // Step 2: Reset password with verified OTP

export default router;
