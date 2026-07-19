import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ==========================================
// Protect Routes Middleware
// ==========================================
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Extract Token
      token = req.headers.authorization.split(" ")[1];

      // Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get User without Password
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