import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types/SocketEvents.types";
import Mole1 from "./assets/images/Mole1.png";
import Mole2 from "./assets/images/Mole2.png";
import Mole3 from "./assets/images/Mole3.png";
import Mole4 from "./assets/images/Mole4.png";
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

const gridContainer = document.querySelector(".grid-container") as HTMLDivElement;

const moleImages = [
    Mole1,
    Mole2,
    Mole3,
    Mole4
];

for (let i = 1; i <= 10; i++) {
    for (let j = 1; j <= 10; j++) {
        const gridEl = document.createElement("div");
        gridEl.classList.add("grid-field");
        gridEl.dataset.coords = `${i}-${j}`;
        gridEl.textContent = `X:${i} Y:${j}`;
        gridContainer.appendChild(gridEl);
    }
}

const molePositionX = Math.floor(Math.random() * 9) + 1;
const molePositionY = Math.floor(Math.random() * 9) + 1;
const moleElement = document.querySelector(`[data-coords="${molePositionX}-${molePositionY}"]`);

if (moleElement instanceof HTMLElement) {
    const randomMoleImage = moleImages[Math.floor(Math.random() * moleImages.length)];
	console.log("Slumpmässig mulvad bild:", randomMoleImage);

    const moleDiv = document.createElement("div");
    moleDiv.classList.add("mole");
    moleDiv.style.backgroundImage = `url('${randomMoleImage}')`;
	console.log("Mulvad div lagt till:", moleDiv);

    moleElement.appendChild(moleDiv);
} else {
    console.error(`Elementet med position ${molePositionX}-${molePositionY} hittades inte!`);
}
