import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ==========================================
// Protect Routes Middleware (Required Auth)
// ==========================================
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "codeflow_default_secret_key");

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      return next();
    }

    return res.status(401).json({
      success: false,
      message: "No token provided",
    });

  } catch (error) {
    console.error("JWT Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or Expired Token",
    });
  }
};

// ==========================================
// Optional Protect Middleware (Guest or Auth)
// ==========================================
export const optionalProtect = async (req, res, next) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      const token = req.headers.authorization.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "codeflow_default_secret_key");
        req.user = await User.findById(decoded.id).select("-password");
      }
    }
  } catch (err) {
    // Silently continue for optional auth
    req.user = null;
  }
  next();
};