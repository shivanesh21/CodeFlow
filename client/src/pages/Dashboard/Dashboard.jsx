import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../context/AuthContext";
import { getExecutionHistory } from "../../services/executionService";
import { getSnippets } from "../../services/snippetService";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import "./Dashboard.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExecutions: 0,
    totalSnippets: 0,
    favoriteLanguage: "N/A",
    successRate: 100,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [langChartData, setLangChartData] = useState(null);
  const [activityChartData, setActivityChartData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [historyRes, snippetRes] = await Promise.allSettled([
        getExecutionHistory(),
        getSnippets(),
      ]);

      const history =
        historyRes.status === "fulfilled" && historyRes.value?.success
          ? historyRes.value.history
          : [];

      const snippets =
        snippetRes.status === "fulfilled" && snippetRes.value?.success
          ? snippetRes.value.snippets
          : [];

      // Calculate Stats
      const totalExecutions = history.length;
      const totalSnippets = snippets.length;

      const successfulExecutions = history.filter(
        (h) => h.status === "success" || !h.error
      ).length;

      const successRate =
        totalExecutions > 0
          ? Math.round((successfulExecutions / totalExecutions) * 100)
          : 100;

      // Calculate Favorite Language
      const langCounts = {};
      history.forEach((h) => {
        const l = (h.language || "unknown").toLowerCase();
        langCounts[l] = (langCounts[l] || 0) + 1;
      });

      let favoriteLanguage = "N/A";
      let maxCount = 0;
      Object.entries(langCounts).forEach(([lang, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteLanguage = lang.toUpperCase();
        }
      });

      setStats({
        totalExecutions,
        totalSnippets,
        favoriteLanguage,
        successRate,
      });

      // Format Recent Activities
      const combined = [
        ...history.map((item) => ({
          type: "execution",
          title: `Ran ${item.language?.toUpperCase()} Code`,
          date: item.createdAt,
          status: item.status === "success" || !item.error ? "success" : "error",
          details: item.code?.slice(0, 50) + "...",
        })),
        ...snippets.map((item) => ({
          type: "snippet",
          title: `Saved Snippet: ${item.title}`,
          date: item.createdAt,
          status: "info",
          details: `${item.language?.toUpperCase()} • ${item.isPublic ? "Public" : "Private"}`,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setRecentActivities(combined.slice(0, 5));

      // Prepare Doughnut Chart Data (Languages)
      const langLabels = Object.keys(langCounts).map((l) => l.toUpperCase());
      const langValues = Object.values(langCounts);

      if (langLabels.length > 0) {
        setLangChartData({
          labels: langLabels,
          datasets: [
            {
              data: langValues,
              backgroundColor: [
                "#6366f1",
                "#38bdf8",
                "#f59e0b",
                "#10b981",
                "#ec4899",
                "#8b5cf6",
              ],
              borderColor: "#1e293b",
              borderWidth: 2,
            },
          ],
        });
      }

      // Prepare Bar Chart Data (Activity over last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const dayLabels = last7Days.map((d) =>
        d.toLocaleDateString(undefined, { weekday: "short" })
      );
      const dayCounts = last7Days.map((d) => {
        const dayStr = d.toDateString();
        return history.filter(
          (h) => new Date(h.createdAt).toDateString() === dayStr
        ).length;
      });

      setActivityChartData({
        labels: dayLabels,
        datasets: [
          {
            label: "Executions per day",
            data: dayCounts,
            backgroundColor: "#6366f1",
            borderRadius: 6,
          },
        ],
      });
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard & Analytics</h1>
            <p className="dashboard-subtitle">
              Welcome back, <strong>{user?.name || "Developer"}</strong>! Here is your platform overview.
            </p>
          </div>
          <div className="quick-actions">
            <Link to="/editor" className="btn btn-primary">
              ⚡ Open Editor
            </Link>
            <Link to="/snippets" className="btn btn-secondary">
              📁 My Snippets
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="dashboard-state-card">
            <div className="spinner"></div>
            <p>Loading analytics and metrics...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon icon-purple">🚀</div>
                <div className="stat-content">
                  <span className="stat-label">Total Executions</span>
                  <h2 className="stat-value">{stats.totalExecutions}</h2>
                  <span className="stat-hint">Programs executed</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon icon-blue">📦</div>
                <div className="stat-content">
                  <span className="stat-label">Total Snippets</span>
                  <h2 className="stat-value">{stats.totalSnippets}</h2>
                  <span className="stat-hint">Saved snippets</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon icon-yellow">⭐</div>
                <div className="stat-content">
                  <span className="stat-label">Favorite Language</span>
                  <h2 className="stat-value">{stats.favoriteLanguage}</h2>
                  <span className="stat-hint">Most executed language</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon icon-green">🎯</div>
                <div className="stat-content">
                  <span className="stat-label">Success Rate</span>
                  <h2 className="stat-value">{stats.successRate}%</h2>
                  <span className="stat-hint">Successful runs</span>
                </div>
              </div>
            </div>

            {/* AI Learning Platform Banner */}
            <div style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "1.25rem",
              padding: "1.5rem 2rem",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1.25rem",
              backdropFilter: "blur(12px)"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>🧠</span>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#f8fafc", margin: 0 }}>
                    AI-Powered Adaptive Learning
                  </h3>
                  <span style={{ fontSize: "0.75rem", background: "rgba(99, 102, 241, 0.2)", color: "#c4b5fd", padding: "0.2rem 0.5rem", borderRadius: "999px", fontWeight: "600" }}>
                    Gemini AI
                  </span>
                </div>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                  Take assessments, identify weak concepts & learning gaps, and receive adaptive roadmaps tailored to your coding level.
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link to="/assessments" style={{
                  padding: "0.6rem 1.25rem",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                  borderRadius: "0.625rem",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  textDecoration: "none"
                }}>
                  📋 Start Assessment
                </Link>
                <Link to="/learning" style={{
                  padding: "0.6rem 1.25rem",
                  background: "rgba(30, 41, 59, 0.8)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#cbd5e1",
                  borderRadius: "0.625rem",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  textDecoration: "none"
                }}>
                  📈 Learning Hub & Gaps →
                </Link>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
              <div className="chart-card">
                <h3>Executions Breakdown (by Language)</h3>
                {langChartData ? (
                  <div className="chart-wrapper doughnut-wrapper">
                    <Doughnut
                      data={langChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: { color: "#94a3b8" },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="no-chart-data">No execution language data yet.</div>
                )}
              </div>

              <div className="chart-card">
                <h3>Activity Overview (Last 7 Days)</h3>
                {activityChartData ? (
                  <div className="chart-wrapper">
                    <Bar
                      data={activityChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          x: { ticks: { color: "#94a3b8" } },
                          y: { ticks: { color: "#94a3b8" }, beginAtZero: true },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="no-chart-data">No activity recorded for this week.</div>
                )}
              </div>
            </div>

            {/* Recent Activity List */}
            <div className="recent-activity-card">
              <div className="activity-card-header">
                <h3>Recent Platform Activity</h3>
                <Link to="/history" className="view-all-link">
                  View Full History →
                </Link>
              </div>

              {recentActivities.length === 0 ? (
                <p className="no-activity">No recent activity recorded.</p>
              ) : (
                <div className="activity-list">
                  {recentActivities.map((act, index) => (
                    <div key={index} className="activity-item">
                      <div
                        className={`activity-status-dot dot-${act.status}`}
                      ></div>
                      <div className="activity-details">
                        <span className="activity-title">{act.title}</span>
                        <span className="activity-snippet">{act.details}</span>
                      </div>
                      <span className="activity-date">
                        {new Date(act.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default Dashboard;