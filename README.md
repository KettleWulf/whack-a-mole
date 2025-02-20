# FED24 API-utveckling Realtime Boilerplate

This is a boilerplate for a Real-time app using Socket.IO.

The frontend is a vanilla TypeScript app using Vite and the backend is a Node.js app written in TypeScript.

## Frontend

### Installation

```sh
cd frontend
npm install
```

### Configuration

Copy `frontend/.env.example` to `frontend/.env` and update the values.

### Development

```sh
cd frontend
npm run dev
```

## Backend

### Installation

```sh
cd backend
npm install
```

### Configuration

Copy `backend/.env.example` to `backend/.env` and update the values.

### Development

```sh
cd backend
npm run dev
```

## Deployment

> [!IMPORTANT]
> These commands should be executed in the root directory.

Run `npm install` to install all packages for both frontend and backend, `npm run build` to build both frontend and backend, and then start the server using `npm start`. The frontend will be served as static files from the backend on the same port.
