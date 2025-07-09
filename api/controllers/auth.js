import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  filterUserContent,
  logContentViolation,
} from "../utils/aiContentFilter.js";
import User from "../models/User.js";

// All user data is now stored in MongoDB Atlas

export const register = async (req, res) => {
  try {
    console.log("Registration attempt:", req.body);

    // 🚫 CONTENT FILTERATION - Check for inappropriate content in registration
    const filterResult = await filterUserContent(req.body);
    console.log("🔍 Registration filter result:", filterResult);

    if (
      !filterResult.isClean &&
      filterResult.violations &&
      filterResult.violations.length > 0
    ) {
      // Log the violation only if there are actual violations
      logContentViolation(
        "user_registration",
        "unknown",
        filterResult,
        req.body
      );

      return res.status(400).json({
        error: "Content not allowed",
        reason: filterResult.reason || "Content violates community guidelines",
        message:
          "Your registration contains content that violates our community guidelines. Please choose a different username or display name.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }],
    });

    if (existingUser) {
      return res.status(409).json("User already exists!");
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    // Create new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      name: req.body.name,
      coverPic: null,
      profilePic: null,
      city: null,
      website: null,
    });

    await newUser.save();

    // Create JWT token for automatic login
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || "secretkey"
    );

    // Remove password from response and convert to plain object
    const userObj = newUser.toObject();
    delete userObj.password;
    userObj.id = userObj._id; // Ensure id field exists for frontend compatibility
    userObj.token = token; // Add token to response for frontend

    console.log(
      "✅ User created and logged in successfully:",
      newUser.username
    );

    // Set cookie and return user data (same as login)
    res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      })
      .status(200)
      .json({
        ...userObj,
        message: "Account created successfully! Welcome to PosiVibe!",
      });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json("Registration failed");
  }
};

export const login = async (req, res) => {
  try {
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: req.body.username },
        { email: req.body.username }, // Allow login with email
      ],
    });

    if (!user) return res.status(404).json("User not found!");

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!isPasswordCorrect) return res.status(400).json("Wrong password!");

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json("Account is banned. Please contact support.");
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretkey"
    );

    const { password, ...others } = user._doc;

    // Add token to response and ensure id field exists
    const userResponse = {
      ...others,
      id: others._id, // Ensure id field exists for frontend compatibility
      token: token, // Add token to response for frontend
    };

    res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      })
      .status(200)
      .json(userResponse);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json(err);
  }
};

export const logout = (req, res) => {
  res
    .clearCookie("accessToken", {
      secure: true,
      sameSite: "none",
    })
    .status(200)
    .json("User has been logged out.");
};

export const clearSession = (req, res) => {
  // Force clear all cookies and session data
  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken") // in case there's a refresh token
    .status(200)
    .json("Session cleared. Please login again.");
};
