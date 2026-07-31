# CodeFlow – Interactive Code Execution Visualizer

CodeFlow is a full-stack MERN (MongoDB, Express.js, React, Node.js) web application designed for interactive code execution, snippet management, visual execution history, dark/light theme customization, and developer analytics.

---

## 🌟 Key Features

- **Monaco Code Editor Integration**: Full-featured code editor with syntax highlighting for JavaScript, Python, Java, C++, and C.
- **Polyglot Code Execution Engine**: Run multi-language programs securely with custom standard inputs (stdin) and real-time execution timers.
- **Code Snippets Library**: Save, edit, search, filter, copy, and export code snippets with custom tags and public/private visibility settings.
- **Execution History Module**: Detailed logging of all code executions with detailed modals, time metrics, and clear history capabilities.
- **Dashboard & Developer Analytics**: Interactive statistics cards and Chart.js graphs tracking language usage, execution success rates, and activity timelines.
- **User Profile & Security**: Update profile details, change avatars, set bio, and modify passwords securely.
- **Theme Customization System**: Seamless Dark Mode and Light Mode switching with localStorage persistence and CSS variables.
- **Editor Productivity Tools**: Auto-save drafts, starter code templates, keyboard shortcuts (Ctrl+Enter run, Ctrl+S save), copy, download, upload, font size selector, line number toggle.
- **Performance & Error Handling**: Lazy-loaded routes (`React.lazy`), Error Boundaries, Toast Notification system, and clean RESTful API design.

---

## 📁 Repository Structure

```text
CodeFlow/
├── client/                     # Vite + React Frontend Application
│   ├── src/
│   │   ├── components/         # Modular Components (Navbar, CodeEditor, Console, etc.)
│   │   ├── context/            # Auth, Theme, and Toast Context Providers
│   │   ├── layouts/            # Main Layout Shell
│   │   ├── pages/              # Login, Register, Dashboard, Editor, History, Snippets, Profile
│   │   ├── services/           # Axios API services
│   │   ├── utils/              # Code templates & helpers
│   │   ├── App.jsx             # Main router & lazy loading configuration
│   │   └── main.jsx            # Application entry point
│   ├── .env.example
│   └── package.json
└── server/                     # Node.js + Express + MongoDB Backend
    ├── config/                 # Database connection setup
    ├── controllers/            # Auth, Execution, Snippet, and User controllers
    ├── middleware/             # JWT authentication middleware
    ├── models/                 # Mongoose Data Models (User, Execution, CodeSnippet)
    ├── routes/                 # Express REST API routes
    ├── services/               # Polyglot execution engines
    ├── app.js                  # Express App configuration
    ├── server.js               # Entry point
    ├── .env.example
    └── package.json
```

---

## 🚀 Environment Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local instance running on `mongodb://localhost:27017` or MongoDB Atlas URI

### 1. Clone & Install Server Dependencies
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/codeflow
JWT_SECRET=your_jwt_secret_key
```

### 2. Install Client Dependencies
```bash
cd ../client
npm install
```

Create a `.env` file in the `client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🏃 Running the Application

### Option A: Run Backend & Frontend Separately

#### Start Backend:
```bash
cd server
npm start
```

#### Start Frontend:
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🔒 API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new account
- `POST /api/auth/login`: Authenticate and receive JWT token

### Execution Engine (`/api/execute`)
- `POST /api/execute`: Execute code payload (supports `language`, `code`, `input`)
- `GET /api/execute/history`: Get execution logs for logged-in user
- `DELETE /api/execute/:id`: Delete specific execution log
- `DELETE /api/execute/history/clear`: Clear all execution history

### Code Snippets (`/api/snippets`)
- `GET /api/snippets`: Fetch user snippets
- `POST /api/snippets`: Create snippet
- `PUT /api/snippets/:id`: Update snippet
- `DELETE /api/snippets/:id`: Delete snippet
- `GET /api/snippets/search?q=`: Search snippets by keyword

### User Profile (`/api/users`)
- `GET /api/users/profile`: Fetch user profile
- `PUT /api/users/profile`: Update profile info & avatar
- `PUT /api/users/change-password`: Change user password

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router DOM, Monaco Editor (`@monaco-editor/react`), Chart.js, React-ChartJS-2, Axios, Vanilla CSS.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT (`jsonwebtoken`), Bcrypt.js, CORS, Dotenv.
