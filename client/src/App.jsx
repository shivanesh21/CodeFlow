import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";
import { ToastProvider } from "./context/ToastContext";
import "./App.css";

// Lazy Loaded Page Components
const Login = lazy(() => import("./pages/Login/Login"));
const Register = lazy(() => import("./pages/Register/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Editor = lazy(() => import("./pages/Editor/Editor"));
const History = lazy(() => import("./pages/History/History"));
const Snippets = lazy(() => import("./pages/Snippets/Snippets"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const VisualizerPage = lazy(() => import("./pages/Visualizer/VisualizerPage"));
const AssessmentList = lazy(() => import("./pages/Assessment/AssessmentList"));
const AssessmentTake = lazy(() => import("./pages/Assessment/AssessmentTake"));
const AssessmentResult = lazy(() => import("./pages/Assessment/AssessmentResult"));
const LearningDashboard = lazy(() => import("./pages/Learning/LearningDashboard"));

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Suspense fallback={<LoadingSpinner message="Loading CodeFlow application..." />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments"
              element={
                <ProtectedRoute>
                  <AssessmentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/:id/take"
              element={
                <ProtectedRoute>
                  <AssessmentTake />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/result/:attemptId"
              element={
                <ProtectedRoute>
                  <AssessmentResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning"
              element={
                <ProtectedRoute>
                  <LearningDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/snippets"
              element={
                <ProtectedRoute>
                  <Snippets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visualizer"
              element={
                <ProtectedRoute>
                  <VisualizerPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
