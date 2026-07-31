import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getExecutionHistory,
  deleteExecution,
  clearExecutionHistory,
} from "../../services/executionService";
import { useToast } from "../../context/ToastContext";
import "./History.css";

function History() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal State for View Output Details
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getExecutionHistory();
      if (data && data.success) {
        setHistory(data.history || []);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
      setError(err.response?.data?.message || "Failed to load execution history.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this execution log?")) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteExecution(id);
      setHistory((prev) => prev.filter((item) => item._id !== id));
      if (activeModalItem && activeModalItem._id === id) {
        setActiveModalItem(null);
      }
      addToast("Execution log deleted", "info");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete execution item.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearHistory = async () => {
    try {
      setClearing(true);
      await clearExecutionHistory();
      setHistory([]);
      setShowClearConfirm(false);
      if (activeModalItem) {
        setActiveModalItem(null);
      }
      addToast("Cleared all execution history", "info");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to clear execution history.", "error");
    } finally {
      setClearing(false);
    }
  };

  const handleRunAgain = (item, e) => {
    if (e) e.stopPropagation();
    navigate("/editor", {
      state: { code: item.code, language: item.language, autoRun: true },
    });
  };

  const handleCopyCode = (code, id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    addToast("Code copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const languagesAvailable = Array.from(
    new Set(history.map((item) => item.language?.toLowerCase()).filter(Boolean))
  );

  // Filter and Sort Processing
  const filteredHistory = history
    .filter((item) => {
      const matchesLanguage =
        selectedLanguage === "all" ||
        item.language?.toLowerCase() === selectedLanguage.toLowerCase();

      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        item.language?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.output?.toLowerCase().includes(query) ||
        item.error?.toLowerCase().includes(query) ||
        item.status?.toLowerCase().includes(query);

      return matchesLanguage && matchesQuery;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  // Pagination Logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: "N/A", time: "N/A" };
    const dateObj = new Date(dateString);
    const date = dateObj.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const time = dateObj.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  };

  return (
    <MainLayout>
      <div className="history-page-container">
        {/* Header Title & Actions */}
        <header className="history-header">
          <div>
            <h1 className="history-title">📜 Execution History</h1>
            <p className="history-subtitle">
              Showing code execution records for <strong>{user?.name || "Developer"}</strong>. Every code run in the editor is automatically saved.
            </p>
          </div>
          {history.length > 0 && (
            <button
              className="btn btn-clear-all"
              onClick={() => setShowClearConfirm(true)}
              disabled={clearing}
            >
              🗑️ Clear All History
            </button>
          )}
        </header>

        {/* Search, Filter & Sort Controls */}
        <div className="history-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search history by code, output, status..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
            <div className="select-wrapper">
              <label>Language:</label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setCurrentPage(1);
                }}
                className="control-select"
              >
                <option value="all">All Languages</option>
                {languagesAvailable.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrapper">
              <label>Sort By:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="control-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="history-state-card">
            <div className="spinner"></div>
            <p>Loading execution history records...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="history-state-card error-card">
            <p className="error-text">⚠️ {error}</p>
            <button className="btn btn-primary" onClick={fetchHistory}>
              Retry Loading
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && history.length === 0 && (
          <div className="history-state-card empty-card">
            <div className="empty-icon">📜</div>
            <h2>No Code Executions Recorded</h2>
            <p>Open the Monaco Editor and click "Run Code" to save your first execution log.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/editor")}
            >
              ⚡ Go to Editor
            </button>
          </div>
        )}

        {/* Filtered Empty State */}
        {!loading && !error && history.length > 0 && filteredHistory.length === 0 && (
          <div className="history-state-card empty-card">
            <div className="empty-icon">🔎</div>
            <h2>No Execution Logs Found</h2>
            <p>No records matched your search query or language filter.</p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery("");
                setSelectedLanguage("all");
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* History Cards List */}
        {!loading && !error && currentRecords.length > 0 && (
          <div className="history-cards-list">
            {currentRecords.map((item) => {
              const isSuccess = item.status === "success" || !item.error;
              const { date, time } = formatDateTime(item.createdAt);

              return (
                <div key={item._id} className="history-card">
                  {/* Top Meta Bar */}
                  <div className="card-top-bar">
                    <div className="lang-date-group">
                      <span className="language-badge">{item.language?.toUpperCase()}</span>
                      <span className="timestamp-info">
                        📅 {date} &nbsp;•&nbsp; ⏰ {time}
                      </span>
                    </div>

                    <div className="status-metrics">
                      <span
                        className={`status-pill ${
                          isSuccess ? "status-success" : "status-error"
                        }`}
                      >
                        {isSuccess ? "✅ Success" : "❌ Error"}
                      </span>
                      {item.executionTime !== undefined && (
                        <span className="metric-pill">⏱️ {item.executionTime} ms</span>
                      )}
                    </div>
                  </div>

                  {/* Main Card Content Split */}
                  <div className="card-content-grid">
                    {/* Code Container */}
                    <div className="code-block-wrapper">
                      <div className="block-label">Code</div>
                      <pre className="code-preview-text">{item.code}</pre>
                    </div>

                    {/* Output Container */}
                    <div className="output-block-wrapper">
                      <div className="block-label">Output</div>
                      <pre
                        className={`output-preview-text ${
                          item.error ? "text-error" : ""
                        }`}
                      >
                        {item.output || item.error || "No output generated"}
                      </pre>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="card-actions-bar">
                    <div className="left-actions">
                      <button
                        className="btn-action primary-btn"
                        onClick={(e) => handleRunAgain(item, e)}
                        title="Open in editor and run immediately"
                      >
                        ▶ Run Again
                      </button>

                      <button
                        className="btn-action secondary-btn"
                        onClick={(e) => handleCopyCode(item.code, item._id, e)}
                      >
                        {copiedId === item._id ? "✓ Copied" : "📋 Copy Code"}
                      </button>

                      <button
                        className="btn-action secondary-btn"
                        onClick={() => setActiveModalItem(item)}
                      >
                        🔍 View Full Output
                      </button>
                    </div>

                    <button
                      className="btn-action danger-btn"
                      disabled={deletingId === item._id}
                      onClick={(e) => handleDeleteItem(item._id, e)}
                    >
                      {deletingId === item._id ? "Deleting..." : "🗑️ Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && !error && filteredHistory.length > itemsPerPage && (
          <div className="pagination-bar">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              ← Previous
            </button>

            <span className="page-indicator">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredHistory.length} total logs)
            </span>

            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next →
            </button>
          </div>
        )}

        {/* Modal: View Full Output Details */}
        {activeModalItem && (
          <div className="modal-backdrop" onClick={() => setActiveModalItem(null)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Execution Details Log</h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setActiveModalItem(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">Language</span>
                    <span className="meta-value uppercase">{activeModalItem.language}</span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Status</span>
                    <span
                      className={`status-pill ${
                        activeModalItem.status === "success" || !activeModalItem.error
                          ? "status-success"
                          : "status-error"
                      }`}
                    >
                      {activeModalItem.status === "success" || !activeModalItem.error
                        ? "Success"
                        : "Error"}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Execution Time</span>
                    <span className="meta-value">
                      {activeModalItem.executionTime !== undefined
                        ? `${activeModalItem.executionTime} ms`
                        : "N/A"}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Executed At</span>
                    <span className="meta-value">
                      {formatDateTime(activeModalItem.createdAt).date} standard time
                    </span>
                  </div>
                </div>

                <div className="modal-section">
                  <div className="section-label">Source Code</div>
                  <pre className="code-display">{activeModalItem.code}</pre>
                </div>

                {activeModalItem.input && (
                  <div className="modal-section">
                    <div className="section-label">Standard Input (stdin)</div>
                    <pre className="code-display input-display">{activeModalItem.input}</pre>
                  </div>
                )}

                <div className="modal-section">
                  <div className="section-label">Full Output Log</div>
                  <pre
                    className={`code-display ${
                      activeModalItem.error ? "error-display" : "output-display"
                    }`}
                  >
                    {activeModalItem.output || activeModalItem.error || "No output recorded."}
                  </pre>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-primary"
                  onClick={(e) => handleRunAgain(activeModalItem, e)}
                >
                  ▶ Run Code Again in Editor
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveModalItem(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Clear All Confirmation */}
        {showClearConfirm && (
          <div
            className="modal-backdrop"
            onClick={() => setShowClearConfirm(false)}
          >
            <div
              className="modal-content confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Clear All History</h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowClearConfirm(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to permanently delete <strong>ALL</strong> past code execution logs?
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleClearHistory}
                  disabled={clearing}
                >
                  {clearing ? "Clearing..." : "Yes, Clear Everything"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default History;
