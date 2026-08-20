import API from "./api";

/**
 * Send a message / action to the CodeFlow AI backend.
 *
 * @param {Object} payload
 * @param {string} payload.message        - User's message text
 * @param {string} payload.code           - Current editor code
 * @param {string} payload.language       - Selected programming language
 * @param {string} [payload.action]       - Action type (explain, fixCode, etc.)
 * @param {string} [payload.selectedCode] - User-selected code portion
 * @param {string} [payload.error]        - Execution error text
 * @param {string} [payload.output]       - Program output text
 * @param {Array}  [payload.conversationHistory] - Previous messages
 * @param {string} [payload.explanationLevel]    - beginner/intermediate/advanced
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendAiMessage = async (payload) => {
  const response = await API.post("/ai/chat", payload);
  return response.data;
};
