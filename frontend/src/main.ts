import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, Startgame } from "@shared/types/SocketEvents.types";
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
const playerFormEl = document.querySelector("#player-form") as HTMLFormElement;
const playerNameEl = document.querySelector("#playername") as HTMLInputElement;
const lobbyEl = document.querySelector("#loby") as HTMLDivElement;
const gameBoardEl = document.querySelector("#game-board") as HTMLDivElement;
const countdownEl = document.querySelector("#countdown-timer") as HTMLDivElement;

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
	console.log("✅ startgameCallback körs! Data från server:", response);
	for (let i = 1; i <= 10; i++) {
        for (let j = 1; j <= 10; j++) {
            const gridEl = document.createElement("div");
            gridEl.dataset.coords = `${i}-${j}`;
            gridContainer.appendChild(gridEl);
        }
    }

	lobbyEl.classList.add("hide");
	gameBoardEl.classList.remove("hide");

	if (countdownEl) {
		countdownEl.classList.remove("hidden");
		let timeLeft = response.startDelay / 1000;

		const countdown = () => {
			countdownEl.textContent = `${timeLeft}`;
			timeLeft -= 1;

			if (timeLeft < 0) {
				countdownEl.classList.add("hide");
			} else {
				setTimeout(countdown, 1000);
			}
		};
		countdown();
	}


    setTimeout(() => {
		countdownEl.classList.add("hide");
		const molePosition = response.position;
		console.log("This is molePosition", molePosition);
		const moleElement = document.querySelector(`[data-coords="${molePosition}"]`);

		if (moleElement instanceof HTMLElement) {
			const randomMoleImage = moleImages[response.randomImage];
			const moleDiv = document.createElement("div");
			moleDiv.classList.add("mole");
			moleDiv.style.backgroundImage = `url('${randomMoleImage}')`;
			moleElement.appendChild(moleDiv);
		} else {
			console.error(`Elementet med position ${molePosition} hittades inte!`);
		}

		gridContainer.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			const moleElement = document.querySelector(`[data-coords="${response.position}"] .mole`);

			if (target === moleElement) {
				console.log("🎯 Du klickade på mullvaden!");
			} else {
				console.log("❌ Miss! Klicka på mullvaden.");
			}
		});
    }, response.startDelay);
};


socket.on('stc_GameroomReadyMessage', (message) => {
	const roomId = message.room.id;

	if(roomId) {
		socket.emit("cts_startRequest", roomId, (startgameCallback))
	}
});
