import Execution from "../models/Execution.js";
import { executeJavaScript } from "../services/executionService.js";

// =====================================================
// Execute Code
// POST /api/execute
// =====================================================
export const executeCode = async (req, res) => {
  try {
    const { language, code, input, snippetId } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        success: false,
        message: "Language and code are required",
      });
    }

    if (language !== "javascript") {
      return res.status(400).json({
        success: false,
        message: "Only JavaScript execution is supported currently",
      });
    }

    const result = await executeJavaScript(code);

    const execution = await Execution.create({
      user: req.user._id,
      snippet: snippetId || null,
      language,
      code,
      input: input || "",
      output: result.output,
      error: result.error,
      status: result.success ? "success" : "error",
      executionTime: result.executionTime,
      exitCode: result.exitCode,
    });

    return res.status(200).json({
      success: true,
      execution,
    });

  } catch (error) {
    console.error("Execution Error:", error);

    return res.status(500).json({
      success: false,
      message: "Execution Failed",
    });
  }
};

// =====================================================
// Execution History
// GET /api/execute/history
// =====================================================
export const getExecutionHistory = async (req, res) => {
  try {
    const history = await Execution.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate("snippet", "title language");

    return res.status(200).json({
      success: true,
      total: history.length,
      history,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// Get One Execution
// GET /api/execute/:id
// =====================================================
export const getExecutionById = async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id)
      .populate("snippet", "title language");

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: "Execution not found",
      });
    }

    if (execution.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      execution,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// Delete Execution
// DELETE /api/execute/:id
// =====================================================
export const deleteExecution = async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: "Execution not found",
      });
    }

    if (execution.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Execution.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Execution deleted successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};