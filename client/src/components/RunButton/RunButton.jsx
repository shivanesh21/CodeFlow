import "./RunButton.css";

function RunButton({ onClick, loading }) {
  return (
    <button className="run-button" onClick={onClick} disabled={loading}>
      {loading ? "Running..." : "Run Code"}
    </button>
  );
}

export default RunButton;
