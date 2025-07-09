import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json("Not logged in!");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (!decoded) return res.status(403).json("Token is not valid!");

    // Check if user exists and is not banned
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json("User not found!");
    if (user.isBanned)
      return res.status(403).json({
        error: "Account suspended",
        reason:
          user.lastBanReason ||
          "Account suspended for violating community guidelines",
      });

    // Add user info to request
    req.userInfo = decoded;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Token is not valid!");
    }
    console.error("Auth middleware error:", err);
    return res.status(500).json("Internal server error");
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Not logged in!" });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (!decoded) return res.status(403).json({ error: "Token is not valid!" });

    // Check if user exists and is admin
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found!" });
    if (!user.isAdmin)
      return res.status(403).json({ error: "Admin access required!" });

    // Add user info to request
    req.user = user;
    req.userInfo = decoded;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Token is not valid!" });
    }
    console.error("Admin auth middleware error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
