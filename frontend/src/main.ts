import { io, Socket } from "socket.io-client";
import {
	ClientToServerEvents,
	// Messagedata,
	ServerToClientEvents,
	// Startgame,
} from "@shared/types/SocketEvents.types";
import "./assets/scss/style.scss";


const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;
console.log("🙇 Connecting to Socket.IO Server at:", SOCKET_HOST);

// Connect to Socket.IO Server
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST);

/**
 * Socket Event Listeners
 */

// Listen for when connection is established
socket.on("connect", () => {
	console.log("💥 Connected to server", socket.io.opts.hostname + ":" + socket.io.opts.port);
	console.log("🔗 Socket ID:", socket.id);
});

// Listen for when server got tired of us
socket.on("disconnect", () => {
	console.log("🥺 Got disconnected from server", socket.io.opts.hostname + ":" + socket.io.opts.port);
});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on("reconnect", () => {
	console.log("😊 Reconnected to server:", socket.io.opts.hostname + ":" + socket.io.opts.port);
});


const playerFormEl = document.getElementById("player-form") as HTMLFormElement;
const playerNameEl = document.getElementById("playername") as HTMLInputElement;

playerFormEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const playerName = playerNameEl.value.trim();

    if (playerName) {
        socket.emit("cts_joinRequest", { content: playerName });

        console.log("📨 Sent join request:", { playerName, id: socket.id });
    } else {
        alert("Please enter a player name!");
    }
});
