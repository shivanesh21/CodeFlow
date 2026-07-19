import CodeSnippet from "../models/CodeSnippet.js";

// =====================================================
// Create New Code Snippet
// POST /api/snippets
// =====================================================
export const createSnippet = async (req, res) => {
  try {
    const {
      title,
      language,
      code,
      description,
      tags,
      isPublic,
    } = req.body;

    if (!title || !language || !code) {
      return res.status(400).json({
        success: false,
        message: "Title, language and code are required",
      });
    }

    const snippet = await CodeSnippet.create({
      title,
      language,
      code,
      description,
      tags,
      isPublic,
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Snippet Created Successfully",
      snippet,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// Get All Snippets of Logged-in User
// GET /api/snippets
// =====================================================
export const getAllSnippets = async (req, res) => {
  try {
    const snippets = await CodeSnippet.find({
      owner: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      total: snippets.length,
      snippets,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// Get Single Snippet
// GET /api/snippets/:id
// =====================================================
export const getSnippetById = async (req, res) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: "Snippet Not Found",
      });
    }

    if (snippet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    res.status(200).json({
      success: true,
      snippet,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// Update Snippet
// PUT /api/snippets/:id
// =====================================================
export const updateSnippet = async (req, res) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: "Snippet Not Found",
      });
    }

    if (snippet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const updatedSnippet = await CodeSnippet.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Snippet Updated Successfully",
      snippet: updatedSnippet,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// Delete Snippet
// DELETE /api/snippets/:id
// =====================================================
export const deleteSnippet = async (req, res) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: "Snippet Not Found",
      });
    }

    if (snippet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    await CodeSnippet.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Snippet Deleted Successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// Search Snippets
// GET /api/snippets/search?q=
// =====================================================
export const searchSnippets = async (req, res) => {
  try {
    const keyword = req.query.q || "";

    const snippets = await CodeSnippet.find({
      owner: req.user._id,
      $or: [
        {
          title: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          language: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          tags: {
            $regex: keyword,
            $options: "i",
          },
        },
      ],
    });

    res.status(200).json({
      success: true,
      total: snippets.length,
      snippets,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// Dashboard Statistics
// GET /api/snippets/dashboard
// =====================================================
export const dashboardStats = async (req, res) => {
  try {
    const snippets = await CodeSnippet.find({
      owner: req.user._id,
    });

    const totalSnippets = snippets.length;

    const publicSnippets = snippets.filter(
      (snippet) => snippet.isPublic
    ).length;

    const privateSnippets = totalSnippets - publicSnippets;

    const totalExecutions = snippets.reduce(
      (sum, snippet) => sum + snippet.executionCount,
      0
    );

    res.status(200).json({
      success: true,
      stats: {
        totalSnippets,
        publicSnippets,
        privateSnippets,
        totalExecutions,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};