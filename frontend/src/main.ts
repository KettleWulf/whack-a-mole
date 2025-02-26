import { io, Socket } from "socket.io-client";
import {
	ClientToServerEvents,
	Messagedata,
	ServerToClientEvents,
	Startgame,
} from "@shared/types/SocketEvents.types";
import "./assets/scss/style.scss";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;
console.log("🙇 Connecting to Socket.IO Server at:", SOCKET_HOST);

// Connect to Socket.IO Server
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST);

/**
 * Query Selectors
 */

const usernameEl = document.querySelector<HTMLButtonElement>("#userName")!;
const startGameEl = document.querySelector<HTMLButtonElement>("#startGame")!;
const virusEl = document.querySelector<HTMLButtonElement>("#clickedVirus")!;
const quitGameEl = document.querySelector<HTMLButtonElement>("#quit")!;
const infoEl = document.querySelector<HTMLDivElement>("#infoEl")!;

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

// Listen for server messages
socket.on("stc_Message", (payload)=> {
	const time = new Date(payload.timestamp).toLocaleTimeString(); 
	infoEl.innerHTML += `<p> <span>${time} </span> | Server Message: ${payload.content}</p>`
});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on("reconnect", () => {
	console.log("😊 Reconnected to server:", socket.io.opts.hostname + ":" + socket.io.opts.port);
});

const startgameCallback = (response: Startgame) => {
	
	setTimeout(() => {
		infoEl.innerHTML += `<p> Virus is on positiion ${response.position} after delay: ${response.startDelay}</p>`
	}, response.startDelay);


}


usernameEl.addEventListener("click", ()=> {
 // socket Emit userName
	const payload: Messagedata = {
		content: "client Sent in their username: Pingpong",
		timestamp: Date.now()
	}
	socket.emit("cts_joinRequest", payload);
});

startGameEl.addEventListener("click", ()=> {
	// socket emit start game
	socket.emit("cts_startRequest", "ROOMID",startgameCallback);
});

virusEl.addEventListener("click", ()=> {
	// socket emit clicked Virus
	const payload: Messagedata = {
		content: "Client clicked virus",
		timestamp: Date.now()
	}
	socket.emit("cts_clickedVirus", payload);
});

quitGameEl.addEventListener("click", ()=> {
	//socket emit quitted game
	const payload: Messagedata = {
		content: "Client clicked virus",
		timestamp: Date.now()
	}
	socket.emit("cts_quitGame", payload);
});

