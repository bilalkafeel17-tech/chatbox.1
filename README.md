# Chatbox — Production-Ready Real-Time Messaging Application

A full-stack, real-time messaging application engineered with Node.js, Express, MongoDB Atlas / Mongoose, Socket.IO, React, and Vite. Designed with an executive Black + Navy Blue visual identity, clean typography, human-crafted UI/UX, and strict adherence to iconographic consistency (Lucide icons only, zero emojis).

---

## 1. Technology Stack

### Frontend
- **React.js (v18)** with **Vite**
- **React Router (v6)** for client-side routing & protected routes
- **Axios** with automatic JWT header injection and interceptors
- **Socket.IO Client** for persistent bi-directional communication
- **Lucide React Icons** (no emojis used anywhere)
- **Custom CSS Design System** featuring responsive flex/grid layouts

### Backend
- **Node.js & Express.js** REST API
- **MongoDB & Mongoose** for persistent data modeling & querying
- **Socket.IO** server with JWT handshake authentication & room isolation
- **JWT (JSON Web Tokens)** for stateless, secure session authorization
- **bcryptjs** for salted password hashing (10 rounds)
- **CORS** middleware

---

## 2. Design System & Palette

The user interface follows a minimal, executive Black + Navy Blue color scheme:

| Element | Color Hex | Description |
| :--- | :--- | :--- |
| **Main Background** | `#080B12` | Deepest black-navy tone for window framing |
| **Secondary Background** | `#101827` | Subtle dark navy for inputs and secondary surfaces |
| **Sidebar Background** | `#0D1422` | Structured navy for conversation lists and navigation |
| **Card / Incoming Bubble** | `#131E30` | Elevated navy card & incoming message bubble |
| **Primary Accent / Outgoing** | `#2563EB` | Cobalt blue for outgoing bubbles & primary actions |
| **Secondary Accent** | `#1D4ED8` | Deep cobalt for hover states |
| **Main Text** | `#F1F5F9` | Slate white for primary content |
| **Muted Text** | `#94A3B8` | Cool slate for timestamps and status captions |
| **Border Color** | `#263449` | Deep slate-navy borders |
| **Online Status** | `#10B981` | Emerald green for active online indicators |

---

## 3. Project Structure

```
c:/chatbox/
├── package.json               # Root scripts (dev, start, install:all)
├── README.md                  # Comprehensive documentation
├── client/                    # React + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── assets/
│       ├── components/
│       │   ├── ChatHeader.jsx
│       │   ├── ChatWindow.jsx
│       │   ├── MessageBubble.jsx
│       │   ├── MessageInput.jsx
│       │   ├── MessageList.jsx
│       │   ├── ProfileModal.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── Sidebar.jsx
│       │   └── UserSearchModal.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── ChatContext.jsx
│       │   ├── SocketContext.jsx
│       │   └── ToastContext.jsx
│       ├── pages/
│       │   ├── ChatPage.jsx
│       │   ├── LoginPage.jsx
│       │   └── RegisterPage.jsx
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── chatService.js
│       │   └── userService.js
│       ├── styles/
│       │   ├── auth.css
│       │   ├── chat.css
│       │   ├── components.css
│       │   └── index.css
│       └── utils/
│           ├── avatarUtils.js
│           └── dateUtils.js
└── server/                    # Node.js + Express + Socket.IO backend
    ├── package.json
    ├── .env
    ├── .env.example
    ├── seed.js                # Demo users seeder (Alex & Sarah)
    ├── test-app.js            # Automated 12-point E2E integration test
    └── src/
        ├── server.js
        ├── config/
        │   ├── db.js
        │   └── env.js
        ├── controllers/
        │   ├── authController.js
        │   ├── conversationController.js
        │   ├── messageController.js
        │   └── userController.js
        ├── middleware/
        │   ├── authMiddleware.js
        │   └── errorMiddleware.js
        ├── models/
        │   ├── Conversation.js
        │   ├── Message.js
        │   └── User.js
        ├── routes/
        │   ├── authRoutes.js
        │   ├── conversationRoutes.js
        │   ├── messageRoutes.js
        │   └── userRoutes.js
        ├── sockets/
        │   └── socketHandler.js
        └── utils/
            └── tokenUtils.js
```

---

## 4. Environment Variables

Create `.env` in the `server/` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/chatbox
JWT_SECRET=your_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### MongoDB Atlas Connection Guide

To connect to a cloud MongoDB Atlas cluster:

1. Sign in to your [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.
2. Under **Deployment** > **Database**, select **Connect**.
3. Choose **Drivers** (Node.js).
4. Copy the connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/chatbox?retryWrites=true&w=majority
   ```
5. In `server/.env`, replace `MONGODB_URI` with your connection string:
   ```env
   MONGODB_URI=mongodb+srv://dbUser:yourStrongPassword@cluster0.abcde.mongodb.net/chatbox?retryWrites=true&w=majority
   ```
6. Ensure **Network Access** in MongoDB Atlas allows your IP address (or `0.0.0.0/0` during development).

---

## 5. Quick Start & Run Commands

### Installation

Install all dependencies across root, server, and client:

```bash
# From workspace root
npm run install:all
```

Or individually:
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### Seed Demo Accounts

Create pre-configured test users (`alex` and `sarah` with password `password123`):

```bash
node server/seed.js
```

### Running in Development Mode

Run both the backend API and the Vite frontend dev server with hot-reloading:

```bash
# From root directory
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API & Sockets:** http://localhost:5000

### Running in Production Mode

Build the client and serve everything from the high-performance Express server:

```bash
# Build frontend
npm run build:client

# Start backend (serves both API and built client bundle)
npm start
```

Navigate to: `http://localhost:5000`

---

## 6. Real-Time Socket.IO Architecture

Socket connections are authenticated on handshake using JWT tokens. Sockets are isolated into conversation-specific rooms (`conv:<conversationId>`) and individual user notification rooms (`user:<userId>`).

### Socket Events Reference

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `connection` | Client -> Server | Handshake auth token | Authenticates socket, updates user online status |
| `user_status` | Server -> Broadcast | `{ userId, isOnline, lastSeen }` | Broadcasts user connection status changes |
| `join_conversation` | Client -> Server | `{ conversationId }` | Validates room membership and joins room |
| `leave_conversation` | Client -> Server | `{ conversationId }` | Leaves room |
| `send_message` | Client -> Server | `{ conversationId, text }` | Persists to MongoDB, emits to room and recipient |
| `receive_message` | Server -> Room | Populated Message document | Instantly renders incoming/outgoing message |
| `new_message_notification` | Server -> Recipient | `{ conversationId, message }` | Updates sidebar previews and unread badges |
| `typing_start` | Client -> Server | `{ conversationId }` | Broadcasts typing indicator to other room members |
| `typing_stop` | Client -> Server | `{ conversationId }` | Removes typing indicator |
| `mark_as_read` | Client -> Server | `{ conversationId }` | Updates DB records and triggers read receipts |
| `messages_read` | Server -> Room / Sender | `{ conversationId, readerId, readAt }` | Turns checkmarks blue in real-time |
| `disconnect` | Client -> Server | None | Cleans up user sockets, sets `isOnline: false` |

---

## 7. Security & Authorization

- **Password Hashing:** Passwords hashed with bcryptjs and salted (10 rounds). The password field has `select: false` on Mongoose queries to prevent accidental leakage.
- **JWT Authorization:** Tokens signed with `HS256` containing userId. Verified via `authMiddleware` on REST endpoints and via `io.use` on Socket.IO handshakes.
- **Conversation Access Control:** Every message read and send request verifies that the authenticated user's ID is in `conversation.participants`. Unauthorized requests are rejected with `403 Forbidden`.
- **Input Sanitization:** Strings are trimmed and length-bounded.
- **CORS Protection:** Configured to restrict unauthorized cross-origin requests.

---

## 8. Verification & Integration Testing

An automated end-to-end integration test is provided in `server/test-app.js`. It executes:

1. Server health check
2. User 1 registration (`alex`)
3. User 2 registration (`sarah`)
4. Login authentication
5. Protected `/api/auth/me` route verification
6. User search API
7. One-to-one conversation creation
8. Concurrent Socket.IO connections with JWT tokens
9. Joining conversation-specific rooms
10. Bi-directional real-time message exchange and read receipts
11. MongoDB message persistence verification
12. Security test verifying `403 Forbidden` for unauthorized third-party conversation access

Run the test suite anytime:
```bash
node server/test-app.js
```

