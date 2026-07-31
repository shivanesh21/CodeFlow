import Execution from "../models/Execution.js";
import CodeSnippet from "../models/CodeSnippet.js";
import { executeCode } from "../services/executionService.js";

// =======================================================
// Execute Code
// POST /api/execute
// =======================================================
export const runCode = async (req, res) => {
  try {
    const {
      language,
      code,
      input = "",
      snippetId = null,
    } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        success: false,
        message: "Language and code are required",
      });
    }

    // Execute the code
    const result = await executeCode(language, code, input);

    let execution = null;

    // Save execution history if user is authenticated or guest execution
    if (req.user?._id) {
      execution = await Execution.create({
        user: req.user._id,
        snippet: snippetId,
        language,
        code,
        input,
        output: result.output,
        error: result.error,
        status: result.status,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed || 0,
        exitCode: result.exitCode,
      });

      // Update snippet statistics if snippet exists
      if (snippetId) {
        await CodeSnippet.findByIdAndUpdate(snippetId, {
          $inc: {
            executionCount: 1,
          },
          lastExecutedAt: new Date(),
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Code executed successfully",
      execution: execution || {
        language,
        code,
        input,
        output: result.output,
        error: result.error,
        status: result.status,
        executionTime: result.executionTime,
        exitCode: result.exitCode,
      },
    });
  } catch (error) {
    console.error("Execution Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================================
// Get Execution History
// GET /api/execute/history
// =======================================================
export const getExecutionHistory = async (req, res) => {
  try {
    const history = await Execution.find({
      user: req.user._id,
    })
      .populate("snippet", "title language")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: history.length,
      history,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch execution history",
    });
  }
};

// =======================================================
// Get Execution By ID
// GET /api/execute/:id
// =======================================================
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
      message: "Internal Server Error",
    });
  }
};

// =======================================================
// Delete Execution
// DELETE /api/execute/:id
// =======================================================
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
      message: "Internal Server Error",
    });
  }
};

// =======================================================
// Clear All Execution History
// DELETE /api/execute/history/clear
// =======================================================
export const clearExecutionHistory = async (req, res) => {
  try {
    await Execution.deleteMany({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Execution history cleared successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================================
// Dashboard Statistics
// GET /api/execute/stats
// =======================================================
export const getExecutionStats = async (req, res) => {
  try {
    const executions = await Execution.find({
      user: req.user._id,
    });

    const totalExecutions = executions.length;

    const successfulExecutions = executions.filter(
      (e) => e.status === "success"
    ).length;

    const failedExecutions = executions.filter(
      (e) => e.status === "error"
    ).length;

    const averageExecutionTime =
      totalExecutions > 0
        ? executions.reduce(
            (sum, e) => sum + e.executionTime,
            0
          ) / totalExecutions
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageExecutionTime: Number(
          averageExecutionTime.toFixed(2)
        ),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};