import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, Startgame, GameroomReadyMessage } from "@shared/types/SocketEvents.types";
import Mole1 from "./assets/images/Mole1.png";
import Mole2 from "./assets/images/Mole2.png";
import Mole3 from "./assets/images/Mole3.png";
import Mole4 from "./assets/images/Mole4.png";
import Mole5 from "./assets/images/Mole5.png";
import "./assets/scss/style.scss";


const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;
console.log("🙇 Connecting to Socket.IO Server at:", SOCKET_HOST);

// Connect to Socket.IO Server
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST);

const gridContainer = document.querySelector(".grid-container") as HTMLDivElement;
const playerFormEl = document.getElementById("player-form") as HTMLFormElement;
const playerNameEl = document.getElementById("playername") as HTMLInputElement;

const moleImages = [Mole1, Mole2, Mole3, Mole4, Mole5];

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

const startgameCallback = (response: Startgame) => {

	for (let i = 1; i <= 10; i++) {
        for (let j = 1; j <= 10; j++) {
            const gridEl = document.createElement("div");
            gridEl.dataset.coords = `${i}-${j}`;
            gridContainer.appendChild(gridEl);
        }
    }

    const molePosition = response.position;
    const moleElement = document.querySelector(`[data-coords="${molePosition}"]`);

    if (moleElement instanceof HTMLElement) {
        const randomMoleImage = moleImages[Math.floor(Math.random() * moleImages.length)];
        const moleDiv = document.createElement("div");
        moleDiv.classList.add("mole");
        moleDiv.style.backgroundImage = `url('${randomMoleImage}')`;
        moleElement.appendChild(moleDiv);
    } else {
        console.error(`Elementet med position ${molePosition} hittades inte!`);
    }

    setTimeout(() => {
    }, response.startDelay);
};


socket.on('stc_GameroomReadyMessage', (data) => {
    const gameroomReadyData = data as GameroomReadyMessage;

    const { position, startDelay } = gameroomReadyData.startgameMessage;
    setTimeout(() => {
        startgameCallback({ position, startDelay });
    }, startDelay);
});
