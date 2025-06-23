import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  filterUserContent,
  logContentViolation,
} from "../utils/contentFilter.js";
import User from "../models/User.js";

// All user data is now stored in MongoDB Atlas

export const register = async (req, res) => {
  try {
    console.log("Registration attempt:", req.body);

    // 🚫 CONTENT FILTERATION - Check for inappropriate content in registration
    const filterResult = filterUserContent(req.body);
    if (!filterResult.isClean) {
      // Log the violation
      logContentViolation(
        "user_registration",
        "unknown",
        filterResult,
        req.body
      );

      return res.status(400).json({
        error: "Content not allowed",
        reason: filterResult.reason,
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

    console.log(
      "✅ User created successfully (passed content filter):",
      newUser.username
    );

    return res.status(200).json("User has been created.");
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json("Registration failed");
  }
};

export const login = async (req, res) => {
  try {
    console.log("Login attempt:", req.body.username);

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.username }],
    });

    if (!user) {
      return res.status(404).json("User not found!");
    }

    // Check password
    const checkPassword = bcrypt.compareSync(req.body.password, user.password);
    if (!checkPassword) {
      return res.status(400).json("Wrong password or username!");
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretkey"
    );

    // Remove password from response and convert to plain object
    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = userObj._id; // Ensure id field exists for frontend compatibility

    console.log("Login successful:", user.username);
    console.log("Returning user data:", userObj);

    res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(200)
      .json(userObj);
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json("Login failed");
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
