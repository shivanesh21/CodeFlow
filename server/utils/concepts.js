// ============================================================
// CodeFlow — Concept Taxonomy
// Shared constant used across all learning-platform models.
// ============================================================

export const CONCEPT_CATEGORIES = {
  FOUNDATIONS: "Foundations",
  DATA_STRUCTURES: "Data Structures",
  ALGORITHMS: "Algorithms",
};

// Flat list of all valid concept strings
export const ALL_CONCEPTS = [
  // Foundations
  "Variables",
  "DataTypes",
  "Operators",
  "Conditions",
  "Loops",
  "Functions",

  // Data Structures
  "Array",
  "LinkedList",
  "Stack",
  "Queue",
  "Tree",
  "BST",
  "Graph",
  "HashTable",

  // Algorithms
  "Searching",
  "Sorting",
  "Recursion",
  "DynamicProgramming",
  "Greedy",
];

// Map each concept to its category
export const CONCEPT_TO_CATEGORY = {
  Variables: "Foundations",
  DataTypes: "Foundations",
  Operators: "Foundations",
  Conditions: "Foundations",
  Loops: "Foundations",
  Functions: "Foundations",

  Array: "Data Structures",
  LinkedList: "Data Structures",
  Stack: "Data Structures",
  Queue: "Data Structures",
  Tree: "Data Structures",
  BST: "Data Structures",
  Graph: "Data Structures",
  HashTable: "Data Structures",

  Searching: "Algorithms",
  Sorting: "Algorithms",
  Recursion: "Algorithms",
  DynamicProgramming: "Algorithms",
  Greedy: "Algorithms",
};

// Human-readable display names
export const CONCEPT_DISPLAY_NAMES = {
  Variables: "Variables",
  DataTypes: "Data Types",
  Operators: "Operators",
  Conditions: "Conditions / Branching",
  Loops: "Loops / Iteration",
  Functions: "Functions",
  Array: "Arrays",
  LinkedList: "Linked Lists",
  Stack: "Stack",
  Queue: "Queue",
  Tree: "Trees",
  BST: "Binary Search Tree",
  Graph: "Graphs",
  HashTable: "Hash Tables",
  Searching: "Searching",
  Sorting: "Sorting",
  Recursion: "Recursion",
  DynamicProgramming: "Dynamic Programming",
  Greedy: "Greedy Algorithms",
};

// Configurable Mastery Thresholds (Accuracy %)
export const MASTERY_THRESHOLDS = {
  WEAK: { min: 0, max: 49, label: "Weak", color: "#ef4444" },
  DEVELOPING: { min: 50, max: 64, label: "Developing", color: "#f59e0b" },
  GOOD: { min: 65, max: 79, label: "Good", color: "#3b82f6" },
  MASTERED: { min: 80, max: 100, label: "Mastered", color: "#10b981" },
};

// Minimum attempts required to declare full mastery (prevent false positives from 1 easy question)
export const MIN_ATTEMPTS_FOR_MASTERY = 3;

/**
 * Derive mastery level string from accuracy percentage and attempt count.
 * Requires sufficient evidence before awarding "Mastered".
 * @param {number} accuracy - 0 to 100
 * @param {number} totalAttempts - number of questions attempted
 * @returns {string} - "Weak" | "Developing" | "Good" | "Mastered"
 */
export function getMasteryLevel(accuracy, totalAttempts = 1) {
  if (accuracy >= 80) {
    // Require sufficient evidence (at least MIN_ATTEMPTS_FOR_MASTERY questions)
    if (totalAttempts >= MIN_ATTEMPTS_FOR_MASTERY) {
      return "Mastered";
    }
    return "Good"; // Provisional good until more evidence is gathered
  }
  if (accuracy >= 65) return "Good";
  if (accuracy >= 50) return "Developing";
  return "Weak";
}

