import API from "./api";

// Execute Code
export const executeCode = async (data) => {
  const response = await API.post("/execute", data);
  return response.data;
};

// Get Execution History
export const getExecutionHistory = async () => {
  const response = await API.get("/execute/history");
  return response.data;
};

// Delete Individual Execution
export const deleteExecution = async (id) => {
  const response = await API.delete(`/execute/${id}`);
  return response.data;
};

// Clear All Execution History
export const clearExecutionHistory = async () => {
  const response = await API.delete("/execute/history/clear");
  return response.data;
};