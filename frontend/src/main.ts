import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ReactionTime,   Gamelobby, ServerToClientEvents, ActiveRooms } from "@shared/types/SocketEvents.types";
import { UserData } from "../../backend/src/types/user_types";
import Mole1 from "./assets/images/Mole1.png";
import Mole2 from "./assets/images/Mole2.png";
import Mole3 from "./assets/images/Mole3.png";
import Mole4 from "./assets/images/Mole4.png";
import Mole5 from "./assets/images/Mole5.png";
import "./assets/scss/style.scss";
import { GameDataOmitID } from "../../backend/src/types/gamedata_types";
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
const playerWraperEl = document.querySelector(".sektion1-wrapper") as HTMLDivElement;
const playAgainEl = document.querySelector(".sektion2-wrapper") as HTMLDivElement;
const waitingForPlayerEl = document.querySelector(".sektion3-wrapper") as HTMLDivElement;
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
const statsBtnOneEl = document.querySelector(".highscoreBtn") as HTMLButtonElement;
const statsBtnTwoEl = document.querySelector(".highscoreBtn2") as HTMLButtonElement;
const sectionOneEl = document.querySelector(".sektion1") as HTMLDivElement;
const sectionTwoEl = document.querySelector(".sektion2") as HTMLDivElement;
const statsLobyBtnEl = document.querySelector(".lobyBtn") as HTMLDivElement;
const playBtnEl = document.querySelector("#connectBtn") as HTMLButtonElement;
const roundDataEl = document.querySelector(".round-data") as HTMLDivElement;
const scoreDataEl = document.querySelector(".score-data") as HTMLDivElement;
const roundInfoEl = document.querySelector(".round-info") as HTMLDivElement;

let myIndex:number;
const games: Gamelobby[] = [];
const playerTime: number[] = [];
const playerScore: number[][] = [[2,8], [5,5], [6,4], [10,0], [4,6], [2,8], [8,2], [3,7]];
console.log("This is an array of gamescoores:", playerScore);
const moleImages = [Mole1, Mole2, Mole3, Mole4, Mole5];
let playerOneTimer = false;
let playerTwoTimer = false;
let gameOn = false;
let userOne: UserData;
let userTwo: UserData;
let timeStamp: number;
let clickStamp: number;
let room: string | undefined;
let playerOnestartTime = 0;
let playerTwostartTime = 0;
let playerOneelapsedTime = 0;
let playerTwoelapsedTime = 0;
let timerInterval:number;



playBtnEl.disabled = true;


playerNameEl.addEventListener("input", () => {
    playBtnEl.disabled = playerNameEl.value.trim() === "";
});


/**
 * Socket Event Listeners
 */

// Listen for when connection is established
socket.on("connect", () => {
	console.log("💥 Connected to server", socket.io.opts.hostname + ":" + socket.io.opts.port);
	console.log("🔗 Socket ID:", socket.id);
	socket.emit("cts_getHighscores", "room" ,(displayPlayedGames));
	socket.emit("stc_getActiveRooms", (displayOngoingGames));
	gameHighscores();
});

// Listen for when server got tired of us
socket.on("disconnect", () => {
	console.log("🥺 Got disconnected from server", socket.io.opts.hostname + ":" + socket.io.opts.port);
});

socket.on("stc_gameInfo", (payload) => {
	roundInfoEl.classList.toggle("hide");
	roundInfoEl.innerHTML = payload
	setTimeout(() => {
		roundInfoEl.classList.toggle("hide");
	}, 5000);

})

// Listen for server messages
socket.on("stc_Message", (payload)=> {
	myIndex = payload;
	if (myIndex) {
		console.log("My index should only be 1 with this msg", myIndex);
	}else {
		console.log("My index should only be 0 with this msg", myIndex)
	}
});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on("reconnect", () => {
	console.log("😊 Reconnected to server:", socket.io.opts.hostname + ":" + socket.io.opts.port);
	const username = playerNameEl.value.trim();
	if (username) {
		socket.emit("cts_joinRequest", { content: username });
	}
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
    }
});


const startgameCallback = (response: GameDataOmitID) => {
	gridContainer.innerHTML = "";
	for (let i = 1; i <= 10; i++) {
        for (let j = 1; j <= 10; j++) {
            const gridEl = document.createElement("div");
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
		roundInfoEl.classList.add("hide");
		countdownEl.classList.add("hide");

		playerOneTimer = true;
		playerTwoTimer = true;
		gameOn = true;
		if (myIndex) {
			gameTimer(false);
		}else {
			gameTimer(true);
		}


		const molePosition = response.coordinates;
		const moleElement = document.querySelector(`[data-coords="${molePosition}"]`) as HTMLDivElement;

		if (moleElement) {
			const randomMoleImage = moleImages[response.randomImage];
			moleElement.classList.add("mole");
			moleElement.style.backgroundImage = `url('${randomMoleImage}')`;
		}

		gridContainer.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			const moleElement = document.querySelector(`[data-coords="${response.coordinates}"]`);

			if (target === moleElement) {

				if(userOne.id === socket.id) {
                    playerOneTimer = false;
                }

				if(userTwo.id === socket.id){
                    playerTwoTimer = false;
				}

				socket.on("stc_requestclickorforfeit",(callback)=> {
					if (socket.id) {
						callback(socket.id);
					}

				})
				clickStamp = Date.now();

				const data: ReactionTime = {
					roundstart: timeStamp,
					playerclicked: clickStamp,
					forfeit: false
				}
				console.log("Här är time data", data);
				socket.emit("cts_clickedVirus", data);
			};
		});
    }, response.startDelay);
};

socket.on('stc_GameroomReadyMessage', (message) => {
	const roomId = message.room.id;

	userOne = message.users[0];
	console.log("Player1:",userOne);
	userTwo = message.users[1];
	console.log("Player2:",userTwo);
	games.push(message);

	if(roomId) {
		socket.emit("cts_startRequest", roomId, (startgameCallback))
		room = message.room.id;
	}

});

const gameTimer = (playerOne: boolean) => {
	/**
	 * playerOne = false om myindex != 0
	 * playerOne = true om myindex = 0
	 */
	if (!gameOn) return;
	if (playerOne) {
		playerOnestartTime = Date.now() - playerOneelapsedTime;
		playerOneTimer = true;
		playerTwoTimer = false;
		playerTwoTimerEl.innerText = "Don't look here wack the mole!, Duuhh!!";
	} else {
		playerTwostartTime = Date.now() - playerTwoelapsedTime;
		playerTwoTimer = true;
		playerOneTimer = false;
		playerOneTimerEl.innerText = "Don't look here wack the mole!, Duuhh!!";
	}


	timerInterval = setInterval(() => {
		if (gameOn) {
			if (playerOneTimer) {
				playerOneelapsedTime = Date.now() - playerOnestartTime;
				playerOneTimerEl.innerText = formatTimer(playerOneelapsedTime);

			}
			else if (playerTwoTimer) {
				playerTwoelapsedTime = Date.now() - playerTwostartTime;
				playerTwoTimerEl.innerText = formatTimer(playerTwoelapsedTime);

			}


		} else {
			clearInterval(timerInterval);
		}
	}, 10);
};

socket.on("stc_sendingTime", (playerclicked) => {
	const opponentReaction = `Mole got whacked at ${formatTimer(playerclicked)}`
	if(userOne.id !== socket.id) {
		playerOneTimerEl.innerText = opponentReaction;
	} else {
		playerTwoTimerEl.innerText = opponentReaction;
	}
});

const displayPlayedGames = (response: NewHighscoreRecord[]) => {
	playedGamesEl.innerHTML = "";
	playedGamesEl.innerHTML = `
		<div class="games">
			<h5>Last 10 Games</h5>
			${response.map(game => {
				return `
					<div class="ongoing-games-layout2">
						<div>${game.title}</div>
						<div><span class="games-info-text2">${game.score.join(" - ")}</span></div>
					</div>
				`;
			}).join('')}
		</div>
	`;
};

const backToLobby = () => {
	socket.emit("stc_getActiveRooms", (displayOngoingGames))
	lobbyEl.classList.remove("hide");
	gameBoardEl.classList.add("hide");
	waitingForPlayerEl.classList.add("hide");
	playAgainEl.classList.remove("hide");
};

backtolobbyEl.addEventListener("click", () => {

	if (room){
		socket.emit("cts_quitGame", room, (response)=> {
			if (response) {
				backToLobby();
			}
		})
	}
});

const displayOngoingGames = (payload: ActiveRooms[]) => {
	ongoingGamesEl.innerHTML = "";
	ongoingGamesEl.innerHTML = `
		<div class="ongoing-games">
			<h5>Ongoing Games</h5>
			<div class="ongoing-games-display-wrapper">
			${payload.map(game => {
				const userNames = game.users.map(user => user.username).join(" vs ");
				const score = game.score || [0, 0];

				return `
					<div class="ongoing-games-layout">
						<div>${userNames}</div>
						<div><span class="games-info-text2">${score.join(" - ")}</span></div>
					</div>
				`;
			}).join('')}
			<div>
		</div>
	`;
};

const gameHighscores = () => {
    if (playerTime.length === 0 || playerScore.length === 0) return;

	const opponentIndex = myIndex === 0
		? 1
		: 0;

	console.log("This is opponentIndex:", opponentIndex);
	console.log("This is myIndex:", myIndex);


    const minTime = Math.min(...playerTime) / 1000;
    const maxTime = Math.max(...playerTime) / 1000;
    const averageTime = parseFloat(((playerTime.reduce((sum, time) => sum + time, 0) / playerTime.length) / 1000).toFixed(3));
    const gamePlayed = playerScore.length;

    let highestScore = 0;
	let highestScoreMatch: number[] = [0, 0];
	let lowestLossMatch: number[] = [0, 0];

	for (const score of playerScore) {
		if (score[myIndex] > highestScore) {
			highestScore = score[myIndex];
			highestScoreMatch = score;
		}
		else {
			lowestLossMatch = score;
		}
	}

	const HighestScoreMatch = myIndex === 0
		? `${highestScoreMatch[0]} - ${highestScoreMatch[1]}`
		: `${highestScoreMatch[1]} - ${highestScoreMatch[0]}`;

	const LowestLossMatch = myIndex === 0
		? `${lowestLossMatch[0]} - ${lowestLossMatch[1]}`
		: `${lowestLossMatch[1]} - ${lowestLossMatch[0]}`;

	const matchresults = {
		wins: 0,
		losses: 0,
		draws: 0,
	}

playerScore.map((game: number[])=>{
	if (game[0] === game[1]) {
		matchresults.draws++;
	} else if (game[0] < game[1]) {
		matchresults.losses++;
	} else {
		matchresults.wins++;
	}
})


	highscoresEl.innerHTML = `
		<div class="highscores-wrapper">
			<h5>Highscore</h5>
			<div class="game-stats-wrapper">
				<div class="game-stats">
					<div><span class="games-info-text">Total Games Played:</span> ${gamePlayed}</div>
					<div><span class="games-info-text">Games Wins:</span> ${matchresults.wins}</div>
					<div><span class="games-info-text">Games Losses:</span> ${matchresults.losses}</div>
				</div>
				<div class="game-stats-reactiontime">
					<div><span class="games-info-text">Best Reaction Time:</span> ${minTime} sec.</div>
					<div><span class="games-info-text">Worst Reaction Time:</span> ${maxTime} sec.</div>
					<div><span class="games-info-text">Average Reaction Time:</span> ${averageTime} sec.</div>
				</div>
				<div class="game-stats-highscore">
					<div><span class="games-info-text">Best Win:</span> ${HighestScoreMatch}</div>
					<div><span class="games-info-text">Worst Lost:</span> ${LowestLossMatch}</div>
					<div><span class="games-info-text">Games Draws:</span> ${matchresults.draws}</div>
				</div>
			</div>
		</div>
	`;
};

playerFormTwoEl.addEventListener("submit", (e) => {
    e.preventDefault();
	const username = playerNameEl.value.trim();
	if (username) {
		socket.emit("cts_joinRequest", { content: username });
	}
    if (userOne && userOne.username) {

        playAgainEl.classList.add("hide");
        waitingForPlayerEl.classList.remove("hide");
        gameBoardEl.classList.add("hide");
        lobbyEl.classList.remove("hide");
        playerOneTimer = false;
        playerTwoTimer = false;
        gameOn = false;
		playerOnestartTime = 0;
		playerTwostartTime = 0;
		playerOneelapsedTime = 0;
		playerTwoelapsedTime = 0;
		gameHighscores();
		console.log("Array of reaction times",playerTime);
		console.log("Array of games",playerScore);
        gridContainer.innerHTML = "";
        console.log("Sent join request for replay:", { playerName: userOne.username, id: socket.id });
		console.log("Sent join request for replay:", { playerName: userTwo.username, id: socket.id });
    }
});

statsBtnOneEl.addEventListener("click", () => {
	sectionOneEl.classList.add("hide");
	sectionTwoEl.classList.remove("hide");
});

statsBtnTwoEl.addEventListener("click", () => {
	sectionOneEl.classList.add("hide");
	sectionTwoEl.classList.remove("hide");
});

statsLobyBtnEl.addEventListener("click", () => {
	sectionOneEl.classList.remove("hide");
	sectionTwoEl.classList.add("hide");
});

socket.on("stc_opponentleft", ()=> {

	backToLobby();
});

socket.on("stc_finishedGameScore", (payload)=> {

	if (!payload) {
		return;
	}
	const temparray:number[] = [...payload];
	if (temparray.length === 3) {
		temparray.pop();
	}
	if (myIndex) {
		playerScore.push(temparray.reverse())
	} else {
		playerScore.push(temparray);
	}
})

socket.on("stc_roundUpdate", (payload) => {
	const mydata = payload.reactionTimes[myIndex];
	playerTime.push(mydata);
	playerOnestartTime = 0;
	playerTwostartTime = 0;
	playerOneelapsedTime = 0;
	playerTwoelapsedTime = 0;
	roundDataEl.innerText = String(payload.currentRound + 1);
	scoreDataEl.innerText = String(payload.score.join(" - "));
	roundInfoEl.classList.remove("hide");
	console.log("This is an array of timereaction:", playerTime);
	console.log("This is an array of gamescoores:", playerScore);
	gameHighscores();

	socket.emit("cts_startRequest", payload.roomId, (startgameCallback))
})

socket.on("stc_finishedgame", () => {

	// kan denna förhalas länge nog att visa gameData innan man skickas till lobbyn?
	const timeout = (Math.random() * (10 - 1.5) + 1.5) * 1000;
	setTimeout(() => {
		if (room){
			socket.emit("cts_quitGame", room, (response)=> {
				//await server to handle quitgame
				if (response) {
					gameHighscores();
					backToLobby();
				}
			})
		}
	}, timeout);
});

function formatTimer(elapsedTime:number){
    const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
    const mseconds = Math.floor((elapsedTime % 1000) / 10);
    return (
        (seconds ? (seconds > 9 ? seconds : "0" + seconds) : "00")
        + "." +
        (mseconds > 9 ? mseconds : "0" + mseconds));
}
