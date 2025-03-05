import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, GameEvolution, Gamelobby, ServerToClientEvents, Startgame } from "@shared/types/SocketEvents.types";
import { UserData } from "../../backend/src/types/user_types";
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
const lobbyEl = document.querySelector(".loby") as HTMLDivElement;
const gameBoardEl = document.querySelector("#game-board") as HTMLDivElement;
const countdownEl = document.querySelector("#countdown-timer") as HTMLDivElement;
const playersTimerEl = document.querySelector(".players-timer") as HTMLDivElement;
const playersNamesEl = document.querySelector(".players-name") as HTMLDivElement;
const playedGamesEl = document.querySelector(".games-data") as HTMLDivElement;

const games: Gamelobby[] = [];
const moleImages = [Mole1, Mole2, Mole3, Mole4, Mole5];
let playerOneTimer = false;
let playerTwoTimer = false;
let gameOn = false;
let playerOneTimerSec = 0;
let playerTwoTimerSec = 0;
let userOne: UserData;
let userTwo: UserData;
let timeStamp: number;
let clickStamp: number;
let room: string | undefined;



/**
 * Socket Event Listeners
 */

// Listen for when connection is established
socket.on("connect", () => {
	console.log("💥 Connected to server", socket.io.opts.hostname + ":" + socket.io.opts.port);
	console.log("🔗 Socket ID:", socket.id);
	socket.emit("cts_getHighscores",roomID ,(displayPlayedGames));
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
			// gridEl.classList.add("test");
            gridEl.dataset.coords = `${i}-${j}`;
            gridContainer.appendChild(gridEl);
        }
    }

	lobbyEl.classList.add("hide");
	gameBoardEl.classList.remove("hide");

	playersNamesEl.innerHTML = `
			<div>${userOne.username}</div>
			<div>vs</div>
			<div>${userTwo.username}</div>
		`;

	if (countdownEl) {
		countdownEl.classList.remove("hide");
		let timeLeft = Math.floor(response.startDelay / 1000);

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
		timeStamp = Date.now();
		countdownEl.classList.add("hide");
		playersNamesEl.innerHTML = `
			<div>${userOne.username}</div>
			<div>vs</div>
			<div>${userTwo.username}</div>
		`;
		playerOneTimer = true;
		playerTwoTimer = true;
		gameOn = true;
		gameTimer ();

		const molePosition = response.position;
		console.log("The mole position is: ", molePosition);
		const moleElement = document.querySelector(`[data-coords="${molePosition}"]`) as HTMLDivElement;

		if (moleElement) {
			const randomMoleImage = moleImages[response.randomImage];
			moleElement.classList.add("mole");
			moleElement.style.backgroundImage = `url('${randomMoleImage}')`;

		} else {
			console.error(`Elementet med position ${molePosition} hittades inte!`);
		}

		gridContainer.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			const moleElement = document.querySelector(`[data-coords="${response.position}"]`);

			if (target === moleElement) {

				clickStamp = Date.now();
				const payload: GameEvolution = {
					start: timeStamp,
					cliked: clickStamp,
					forfeit: false,
					roomId: room || "room"
				}
				socket.emit("cts_clickedVirus", payload);
				playerOneTimer = false;
			};

		});
    }, response.startDelay);
};

socket.on('stc_GameroomReadyMessage', (message) => {
	const roomId = message.room.id;
	console.log("This is it:",message);
	userOne = message.users[0];
	userTwo = message.users[1];
	games.push(message);
	console.log("Updated games array:", games);

	if(roomId) {
		socket.emit("cts_startRequest", roomId, (startgameCallback))
		room = message.room.id;
	}

});

const gameTimer = () => {

	if (!gameOn) return;

	const timerInterval = setInterval(() => {
		if (gameOn) {
			if (playerOneTimer) {
				playerOneTimerSec += 0.01;
			}
			if (playerTwoTimer) {
				playerTwoTimerSec += 0.01;
			}
			playersTimerEl.innerHTML = `
				<span class="span">${playerOneTimerSec.toFixed(3)}</span>
				<span class="span">${playerTwoTimerSec.toFixed(3)}</span>
			`;
		} else {
			clearInterval(timerInterval);
		}
	}, 10);
};

socket.on("stc_sendingTime", (playerclicked) => {
	playerTwoTimer = playerclicked;
	console.log("Kom detta igenom", playerTwoTimer);
});

const displayPlayedGames = () => {
	// ongoingGamesEl.innerHTML = "";
	playedGamesEl.innerHTML = games.map(game => {
	return `
	<div>${game.users.map(user => user.username).join(' vs ')} ${game.room.score}</div>
	`
	}).join('');
  };
