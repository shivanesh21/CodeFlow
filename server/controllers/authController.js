import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ==========================================
// Generate JWT Token
// ==========================================
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "codeflow_default_secret_key",
    {
      expiresIn: "7d",
    }
  );
};

// ==========================================
// Register User
// POST /api/auth/register
// ==========================================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email address",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user in DB
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server Error during registration",
    });
  }
};

// ==========================================
// Login User
// POST /api/auth/login
// ==========================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter email and password",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user by email
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Auto-register user account when entering login credentials to guarantee saving to DB
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const defaultName = cleanEmail.split("@")[0] || "User";

      user = await User.create({
        name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
        email: cleanEmail,
        password: hashedPassword,
      });
    } else {
      // Compare password for existing user
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server Error during login",
    });
  }
};

// ==========================================
// Get Logged-in User Profile
// GET /api/auth/me
// ==========================================
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};