import API from "./api";

// Get all snippets
export const getSnippets = async () => {
    const response = await API.get("/snippets");
    return response.data;
};

// Save snippet
export const createSnippet = async (snippet) => {
    const response = await API.post("/snippets", snippet);
    return response.data;
};

// Update snippet
export const updateSnippet = async (id, snippet) => {
    const response = await API.put(`/snippets/${id}`, snippet);
    return response.data;
};

// Delete snippet
export const deleteSnippet = async (id) => {
    const response = await API.delete(`/snippets/${id}`);
    return response.data;
};

// Search snippets
export const searchSnippets = async (keyword) => {
    const response = await API.get("/snippets/search", {
        params: {
            q: keyword,
        },
    });
    return response.data;
};
