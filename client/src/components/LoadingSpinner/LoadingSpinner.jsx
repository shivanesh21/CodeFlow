import React from "react";
import "./LoadingSpinner.css";

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="loading-spinner-overlay">
      <div className="spinner-box">
        <div className="spinner-ring"></div>
        <p className="spinner-text">{message}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;