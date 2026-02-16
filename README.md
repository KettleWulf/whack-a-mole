# Whack-a-Mole (Realtime Multiplayer)

<p align="center">
  <img src="https://github.com/user-attachments/assets/05cfd923-a269-4ee0-b615-a0e9fbf5c450" alt="landing page" height="280" />
  <img src="https://github.com/user-attachments/assets/d62ace91-fce0-413f-835b-20408d47b128" alt="game board" height="280" />
</p>


A realtime, round-based multiplayer reaction game built with Socket.IO.
Two players are matched into a room, race to click the mole first each round, and play to 10 total rounds.

## Project Description

This project is a full-stack TypeScript implementation of a competitive Whack-a-Mole game:

- Players join a lobby and get paired automatically.
- Each round places one mole on a 10x10 board after a short countdown.
- Both players react as fast as possible; the fastest click wins the round.
- Scores are updated live, with support for draws and forfeits.
- Match history and ongoing game data are surfaced in the UI.

## Tech Stack

Frontend:

- TypeScript
- Vite
- Socket.IO Client
- SCSS
- Bootstrap + Font Awesome

Backend:

- Node.js
- TypeScript
- Express
- Socket.IO
- Prisma ORM
- MongoDB

Shared:

- Shared TypeScript event/type contracts in `shared/types`

## Architecture

- `frontend/`: Browser client, lobby/game UI, realtime event handling.
- `backend/`: Socket + API server, game room handling, round scoring, persistence.
- `shared/`: Shared models and socket event typings used by both frontend and backend.

## Getting Started

### 1. Install dependencies (root)

```sh
npm install
```

This installs dependencies for both `frontend` and `backend` via the root script.

### 2. Configure environment variables

Frontend:

- Copy `frontend/.env.example` to `frontend/.env`
- Set `VITE_SOCKET_HOST` (default local value is fine for local dev)

Backend:

- Copy `backend/.env.example` to `backend/.env`
- Set `DATABASE_URL` to your MongoDB connection string
- Set `PORT` (default: `3000`)

### 3. Run in development

Frontend (terminal 1):

```sh
cd frontend
npm run dev
```

Backend (terminal 2):

```sh
cd backend
npm run dev
```

### 4. Production build and start (from root)

```sh
npm run build
npm start
```

## Available Root Scripts

- `npm install` - installs frontend and backend dependencies
- `npm run build` - builds frontend and backend
- `npm start` - starts backend in production mode (serves built frontend)

## Collaborators

Kudos to the team behind this project:

- Fredrik Wiking - Lead / Back End
- Oktavian Paunku - Front End / UX
- Olle Wistedt - Back End / Game Loop Logic
