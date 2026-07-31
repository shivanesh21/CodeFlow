import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getSnippets,
  createSnippet,
  updateSnippet,
  deleteSnippet,
  searchSnippets,
} from "../../services/snippetService";
import { useToast } from "../../context/ToastContext";
import "./Snippets.css";

function Snippets() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    language: "javascript",
    code: "",
    description: "",
    tags: "",
    isPublic: false,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getSnippets();
      setSnippets(data.snippets || []);
    } catch (err) {
      console.error("Load snippets error:", err);
      setError(err.response?.data?.message || "Failed to fetch snippets.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      loadSnippets();
      return;
    }
    try {
      setLoading(true);
      const data = await searchSnippets(search.trim());
      setSnippets(data.snippets || []);
    } catch (err) {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingSnippet(null);
    setFormData({
      title: "",
      language: "javascript",
      code: "// Write your reusable code snippet here...",
      description: "",
      tags: "",
      isPublic: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (snippet) => {
    setEditingSnippet(snippet);
    setFormData({
      title: snippet.title || "",
      language: snippet.language || "javascript",
      code: snippet.code || "",
      description: snippet.description || "",
      tags: Array.isArray(snippet.tags) ? snippet.tags.join(", ") : "",
      isPublic: !!snippet.isPublic,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.code.trim()) {
      addToast("Title and Code are required!", "error");
      return;
    }

    const payload = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      setFormSubmitting(true);
      if (editingSnippet) {
        await updateSnippet(editingSnippet._id, payload);
        addToast("Snippet updated successfully", "success");
      } else {
        await createSnippet(payload);
        addToast("New snippet created!", "success");
      }
      setIsModalOpen(false);
      loadSnippets();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to save snippet.", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDuplicate = async (snippet) => {
    try {
      const duplicatePayload = {
        title: `${snippet.title} (Copy)`,
        language: snippet.language,
        code: snippet.code,
        description: snippet.description,
        tags: snippet.tags || [],
        isPublic: snippet.isPublic,
      };
      await createSnippet(duplicatePayload);
      addToast(`Duplicated "${snippet.title}"`, "success");
      loadSnippets();
    } catch (err) {
      addToast("Failed to duplicate snippet", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this snippet?")) return;
    try {
      await deleteSnippet(id);
      setSnippets((prev) => prev.filter((s) => s._id !== id));
      addToast("Snippet deleted", "info");
    } catch (err) {
      addToast("Failed to delete snippet.", "error");
    }
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    addToast("Snippet code copied!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenInEditor = (snippet) => {
    navigate("/editor", {
      state: { code: snippet.code, language: snippet.language },
    });
  };

  const filteredSnippets = snippets.filter((s) => {
    const matchesLang =
      selectedLanguage === "all" ||
      s.language?.toLowerCase() === selectedLanguage.toLowerCase();
    return matchesLang;
  });

  const availableLanguages = Array.from(
    new Set(snippets.map((s) => s.language).filter(Boolean))
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <MainLayout>
      <div className="snippets-page-container">
        {/* Header */}
        <header className="snippets-header">
          <div>
            <h1 className="snippets-title">📄 My Snippets Repository</h1>
            <p className="snippets-subtitle">
              Manage reusable code snippets saved by <strong>{user?.name || "Developer"}</strong>.
            </p>
          </div>
          <button className="btn btn-primary-create" onClick={handleOpenCreateModal}>
            + New Snippet
          </button>
        </header>

        {/* Search & Filter Bar */}
        <div className="snippets-controls">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search snippets by title, description, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearch("");
                  loadSnippets();
                }}
              >
                ✕
              </button>
            )}
          </form>

          <div className="filter-group">
            <label>Language:</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="snippet-state-card">
            <div className="spinner"></div>
            <p>Loading code snippets...</p>
          </div>
        )}

        {error && !loading && (
          <div className="snippet-state-card error">
            <p>⚠️ {error}</p>
            <button className="btn btn-primary" onClick={loadSnippets}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredSnippets.length === 0 && (
          <div className="snippet-state-card empty">
            <div className="empty-icon">📄</div>
            <h2>No Saved Snippets</h2>
            <p>Click "+ New Snippet" or save code directly from the Editor playground.</p>
            <button className="btn btn-primary-create" onClick={handleOpenCreateModal}>
              + New Snippet
            </button>
          </div>
        )}

        {/* Snippets Cards Grid */}
        {!loading && !error && filteredSnippets.length > 0 && (
          <div className="snippets-grid">
            {filteredSnippets.map((snippet) => (
              <article key={snippet._id} className="snippet-card">
                <div className="snippet-card-header">
                  <div className="title-row">
                    <span className="card-file-icon">📄</span>
                    <h3 className="snippet-card-title">{snippet.title}</h3>
                  </div>

                  <span className="language-tag">{snippet.language?.toUpperCase()}</span>
                </div>

                {snippet.description && (
                  <p className="snippet-card-desc">{snippet.description}</p>
                )}

                <div className="snippet-code-box">
                  <pre>{snippet.code}</pre>
                </div>

                {/* Tags section */}
                {snippet.tags && snippet.tags.length > 0 && (
                  <div className="tag-list">
                    {snippet.tags.map((tag, idx) => (
                      <span key={idx} className="tag-pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dates Meta */}
                <div className="snippet-dates-meta">
                  <span>Created: {formatDate(snippet.createdAt)}</span>
                  <span>Updated: {formatDate(snippet.updatedAt)}</span>
                </div>

                {/* Action Buttons Bar */}
                <div className="snippet-card-actions">
                  <button
                    className="btn-card-action open-btn"
                    onClick={() => handleOpenInEditor(snippet)}
                    title="Open snippet in Monaco Editor"
                  >
                    🚀 Open
                  </button>

                  <button
                    className="btn-card-action edit-btn"
                    onClick={() => handleOpenEditModal(snippet)}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="btn-card-action duplicate-btn"
                    onClick={() => handleDuplicate(snippet)}
                    title="Duplicate snippet"
                  >
                    📑 Duplicate
                  </button>

                  <button
                    className="btn-card-action delete-btn"
                    onClick={() => handleDelete(snippet._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingSnippet ? "Edit Snippet" : "+ Create New Snippet"}</h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Binary Search Algorithm"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Language *</label>
                    <select
                      value={formData.language}
                      onChange={(e) =>
                        setFormData({ ...formData, language: e.target.value })
                      }
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="typescript">TypeScript</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Fast O(log N) search algorithm for sorted arrays"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="DSA, Array, Search"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Code *</label>
                    <textarea
                      rows="8"
                      required
                      className="code-textarea"
                      placeholder="Paste your full code snippet here..."
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={formSubmitting}
                  >
                    {formSubmitting
                      ? "Saving..."
                      : editingSnippet
                      ? "Update Snippet"
                      : "Save Snippet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Snippets;
