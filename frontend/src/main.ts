import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, GameEvaluation, Gamelobby, ServerToClientEvents, Startgame } from "@shared/types/SocketEvents.types";
import { UserData } from "../../backend/src/types/user_types";
import Mole1 from "./assets/images/Mole1.png";
import Mole2 from "./assets/images/Mole2.png";
import Mole3 from "./assets/images/Mole3.png";
import Mole4 from "./assets/images/Mole4.png";
import Mole5 from "./assets/images/Mole5.png";
import "./assets/scss/style.scss";
import { NewHighscoreRecord } from "../../backend/src/types/highscore.types";


const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;
console.log("🙇 Connecting to Socket.IO Server at:", SOCKET_HOST);

// Connect to Socket.IO Server
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST);

const gridContainer = document.querySelector(".grid-container") as HTMLDivElement;
const playerFormEl = document.querySelector("#player-form") as HTMLFormElement;
const playerFormTwoEl = document.querySelector("#player-form2") as HTMLFormElement;
const playerNameEl = document.querySelector("#playername") as HTMLInputElement;
const lobbyEl = document.querySelector(".loby") as HTMLDivElement;
const playerWraperEl = document.querySelector(".player-wrapper") as HTMLDivElement;
const playAgainEl = document.querySelector(".player-wrapper2") as HTMLDivElement;
const waitingForPlayerEl = document.querySelector(".player-wrapper3") as HTMLDivElement;
const gameBoardEl = document.querySelector("#game-board") as HTMLDivElement;
const countdownEl = document.querySelector("#countdown-timer") as HTMLDivElement;
const playerOneTimerEl = document.querySelector("#players-timer1") as HTMLDivElement;
const playerTwoTimerEl = document.querySelector("#players-timer2") as HTMLDivElement;
const playersOneEl = document.querySelector("#players-name1") as HTMLDivElement;
const playersTwoEl = document.querySelector("#players-name2") as HTMLDivElement;
const playedGamesEl = document.querySelector(".games-data") as HTMLDivElement;
const ongoingGamesEl = document.querySelector(".ongoing-games-data") as HTMLDivElement;
const highscoresEl = document.querySelector(".highscores") as HTMLDivElement;
const backtolobbyEl = document.querySelector(".backtolobby") as HTMLButtonElement;

const games: Gamelobby[] = [];
const playerTime: number[] = [2.34, 4.32, 5.67, 1.23, 2.11, 3.43]
const playerScore: [number, number][] = [[2,8], [3,7], [8,2], [10,0], [6,4],[5,5]];
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
	socket.emit("cts_getHighscores", "room" ,(displayPlayedGames));
	gameHighscores(playerTime, playerScore);
});

// Listen for when server got tired of us
socket.on("disconnect", () => {
	console.log("🥺 Got disconnected from server", socket.io.opts.hostname + ":" + socket.io.opts.port);
});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on("reconnect", () => {
	console.log("😊 Reconnected to server:", socket.io.opts.hostname + ":" + socket.io.opts.port);
});

playerFormEl.addEventListener("submit", (e) => {
    e.preventDefault();

    const playerName = playerNameEl.value.trim();

    if (playerName) {
        socket.emit("cts_joinRequest", { content: playerName });
		playerWraperEl.classList.add("hide");
		playAgainEl.classList.add("hide");
		waitingForPlayerEl.classList.remove("hide");
        console.log("Sent join request:", { playerName, id: socket.id });
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

	playersOneEl.textContent = `${userOne.username}`;
	playersTwoEl.textContent = `${userTwo.username}`;

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
				const payload: GameEvaluation = {
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
	userOne = message.users[0];
	userTwo = message.users[1];
	games.push(message);
	displayOngoingGames();

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
			playerOneTimerEl.innerText = `${playerOneTimerSec.toFixed(2)}`;
			playerTwoTimerEl.innerText = `${playerTwoTimerSec.toFixed(2)}`;

		} else {
			clearInterval(timerInterval);
		}
	}, 10);
};

socket.on("stc_sendingTime", (playerclicked) => {
	playerTwoTimer = playerclicked;
});

const displayPlayedGames = (response: NewHighscoreRecord[]) => {
	playedGamesEl.innerHTML = "";
	playedGamesEl.innerHTML = `
		<div class="games">
			<h5>Last 10 Games</h5>
			${response.map(game => {
				return `
					<div class="ongoing-games-layout">
						<div>${game.title}</div>
						<div><span class="games-info-text">${game.score.join(" - ")}</span></div>
					</div>
				`;
			}).join('')}
		</div>
	`;
};

const backToLobby = () => {
	lobbyEl.classList.remove("hide");
	gameBoardEl.classList.add("hide");
	waitingForPlayerEl.classList.add("hide");
	playAgainEl.classList.remove("hide");
};

backtolobbyEl.addEventListener("click", () => {
	backToLobby();
});

const displayOngoingGames = () => {
	ongoingGamesEl.innerHTML = "";
	console.log("Funktion startat");

	ongoingGamesEl.innerHTML = games.map(game => {
		const userNames = game.users.map(user => user.username).join(" vs ");
		const score = game.room?.score || [0, 0];

		return `
		<div class="ongoing-games">
			<h5>Ongoing Games</h5>
			<div class="ongoing-games-layout">
				<div>${userNames}</div>
				<div><span class="games-info-text">${score.join(" - ")}</span></div>
			</div>
		</div>
		`;
	}).join('');
};

const gameHighscores = (playerTime: number[], playerScore: [number, number][]): void => {
    if (playerTime.length === 0 || playerScore.length === 0) return;
	console.log("Körs detta funktion som jag har skapat");

    const minTime = Math.min(...playerTime);
    const maxTime = Math.max(...playerTime);
    const averageTime = parseFloat((playerTime.reduce((sum, time) => sum + time, 0) / playerTime.length).toFixed(3));

    const wins = playerScore.filter(score => score[0] > score[1]).length;
    const lost = playerScore.filter(score => score[0] < score[1]).length;
	const draws = playerScore.filter(score => score[0] === score[1]).length;
    const gamePlayed = playerScore.length;

    let highestScore = 0;
    let highestScoreMatch: [number, number] = [0, 0];
    for (const score of playerScore) {
        if (score[0] > highestScore) {
            highestScore = score[0];
            highestScoreMatch = score;
        }
    }
	const highestScoreMatchStr = highestScoreMatch.join(" - ");

    let highestLoss = 0;
    let highestLossMatch: [number, number] = [0, 0];
    for (const score of playerScore) {
        if (score[0] < score[1]) {
            const loss = score[1] - score[0];
            if (loss > highestLoss) {
                highestLoss = loss;
                highestLossMatch = score;
            }
        }
    }
	const highestLossMatchStr = highestLossMatch.join(" - ");

	highscoresEl.innerHTML = `
		<div class="highscores-wrapper">
			<h5>Highscore</h5>
			<div class="game-stats-wrapper">
				<div class="game-stats">
					<div><span class="games-info-text">Total Games Played:</span> ${gamePlayed}</div>
					<div><span class="games-info-text">Games Wins:</span> ${wins}</div>
					<div><span class="games-info-text">Games Losses:</span> ${lost}</div>
				</div>
				<div class="game-stats-reactiontime">
					<div><span class="games-info-text">Best Reaction Time:</span> ${maxTime} sec.</div>
					<div><span class="games-info-text">Worst Reaction Time:</span> ${minTime} sec.</div>
					<div><span class="games-info-text">Average Reaction Time:</span> ${averageTime} sec.</div>
				</div>
				<div class="game-stats-highscore">
					<div><span class="games-info-text">Best Win:</span> ${highestScoreMatchStr}</div>
					<div><span class="games-info-text">Worst Lost:</span> ${highestLossMatchStr}</div>
					<div><span class="games-info-text">Games Draws:</span> ${draws > 0 ? draws : 0}</div>
				</div>
			</div>
		</div>
	`;

};

gameHighscores(playerTime, playerScore);

playerFormTwoEl.addEventListener("submit", (e) => {
    e.preventDefault();

    if (userOne && userOne.username) {
        socket.emit("cts_joinRequest", { content: userOne.username });
        playAgainEl.classList.add("hide");
        waitingForPlayerEl.classList.remove("hide");
        gameBoardEl.classList.add("hide");
        lobbyEl.classList.remove("hide");
        playerOneTimer = false;
        playerTwoTimer = false;
        gameOn = false;
        playerOneTimerSec = 0;
        playerTwoTimerSec = 0;
        gridContainer.innerHTML = "";
        console.log("Sent join request for replay:", { playerName: userOne.username, id: socket.id });
    }
});
