import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const validateToken = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json("Not logged in!");
  }

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    // Check if the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userInfo.id)) {
      console.warn("Invalid user ID in token:", userInfo.id);
      // Clear the invalid token
      res.clearCookie("accessToken");
      return res.status(401).json("Invalid session. Please login again.");
    }

    req.userInfo = userInfo;
    next();
  } catch (err) {
    console.error("Token validation error:", err);
    // Clear the invalid token
    res.clearCookie("accessToken");
    return res.status(403).json("Invalid token. Please login again.");
  }
};

export const validateTokenAsync = async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json("Not logged in!");
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secretkey",
    async (err, userInfo) => {
      if (err) {
        console.error("Token validation error:", err);
        res.clearCookie("accessToken");
        return res.status(403).json("Invalid token. Please login again.");
      }

      // Check if the user ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(userInfo.id)) {
        console.warn("Invalid user ID in token:", userInfo.id);
        res.clearCookie("accessToken");
        return res.status(401).json("Invalid session. Please login again.");
      }

      req.userInfo = userInfo;
      next();
    }
  );
};
