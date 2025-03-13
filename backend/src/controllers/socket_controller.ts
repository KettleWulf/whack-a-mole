/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, Gamelobby, ServerToClientEvents, RoundResultData, ActiveRooms } from "@shared/types/SocketEvents.types";
import { createGameroom, findPendingGameroom, getGameRoomAndUsers, updateGameRoomScore } from "../services/gameroom_service";
import { User } from "@prisma/client";
import { createUser, findUserById, getUsersByRoomId, getUsersReactionTimes, resetReactionTimes, updateUserReactionTime, updateUserRoomId } from "../services/user_service";
import { FinishedGameData } from "../types/gameroom_types";
import { addToHighscores, GetHighscores } from "../services/highscore.service";
import { createOrUpdateGameData, getGameData, } from "../services/gamedata_service";
import prisma from "../prisma";

// Create a new debug instance
const debug = Debug("backend:socket_controller");
// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	addToHighscores({title: "Kalle vs. Hobbe", score: [3,7]});
	debug("🙋 A user connnected", socket.id);

	// Handle a user disconnecting
	socket.on("disconnect", () => {
		debug("👋 A user disconnected", socket.id);
	});

	socket.on("cts_joinRequest", async (payload)=> {
	/**	Check if a lobby is missing 2nd player
	 * if no match, create a new Gameroom and set socket as playerOne
	 *
	 *  emit a notification of joining the lobby
	 *  return;
	 *
	 * if found, assign socket as playerTwo
	 * emit event to start game
	 */
	const gameRooms = await findPendingGameroom();
	const findfreeGameroom = gameRooms.filter((gameRoom)=> {return gameRoom.users.length < 2})
	debug("Getting GameRooms: %O", gameRooms);
	debug("Getting fullrooms: %O", findfreeGameroom);
	// if no room or no room with only 1 player, create a new room
	if (!gameRooms.length || !findfreeGameroom.length) {
		const createRoom = await createGameroom("Gameroom");
		const findUser = await findUserById(socket.id);
		if (!findUser) {
			const userdata: User = {
				id: socket.id,
				username: payload.content,
				roomId: createRoom.id,
				reactionTime: null
			}
			await createUser(userdata);
		}

		if (!createRoom) {
			debug("Failed to retrieve created room from DB");
			return;
		}
		const data = generateGameData(createRoom.id);
		const { id, ...updateData } = data;
		// Create GameData in DB
		await createOrUpdateGameData(id, updateData, data);


		await updateUserRoomId(socket.id, createRoom.id);
		socket.join(createRoom.id);
		io.to(socket.id).emit("stc_Message", 0);
		return;
	}
		//join player 2 to room which is missing a player
	if (findfreeGameroom) {
		const roomId = findfreeGameroom[0].id;
		// const socketCount = io.in(roomId).fetchSockets();
		// if ((await socketCount).length !== 1) {
		// 	return
		// }
		const findUser = await findUserById(socket.id);
		if (!findUser) {
			const userdata: User = {
				id: socket.id,
				username: payload.content,
				roomId: roomId,
				reactionTime: null
			}
			await createUser(userdata);
		}
		await updateUserRoomId(socket.id, roomId);
		io.to(socket.id).emit("stc_Message", 1);
		socket.join(roomId);
		const getUsers = await getUsersByRoomId(roomId);
		const message: Gamelobby = {
			room: findfreeGameroom[0],
			users: getUsers
		}

		//room is ready for game, broadcast!
		io.to(roomId).emit("stc_GameroomReadyMessage", message);

        return;
    }
	});
	socket.on("cts_startRequest", async (roomId, callback)=> {

		// Generate GameData
		const gameData = await getGameData(roomId);
		if(!gameData) {
			debug("Couldn't find GameData in relation to roomId: %s", roomId);
			return;
		}

		callback(gameData);

	});
	socket.on("cts_clickedVirus", async (payload)=> {


		debug("Player %s wacked a mole! Payload: %o", socket.id, payload)

		// Assume it's not a draw, for now
		let draw = false;
		let gameInfoMessage: string;

		// Get gameroom, including users[] from DB
		const gameRoom = await getGameRoomAndUsers(socket.id);

		if(!gameRoom) {
			debug("GameRoom not found!");
			return;
		}
		debug("User %s corresponding roomId: %s", socket.id, gameRoom.id);

		if (payload.forfeit) {
			io.to(gameRoom.id).emit("stc_finishedgame");
		}

		// Calculate reactiontime
		const reactionTime = payload.playerclicked - payload.roundstart;
		socket.to(gameRoom.id).emit("stc_sendingTime", reactionTime);
		debug("Players reaction time: %s", reactionTime)

		// Upload reactiontime to user
		debug("updating user reactiontime %s!: %s", reactionTime, socket.id);
		const userupdated = await updateUserReactionTime(socket.id, reactionTime);
		if (!userupdated) {
			debug("userReactions wasnt updated!: %s", userupdated);
			return
		}
		// Check if both players has an uploaded reactiontime using roomId
		const userReactionTimes = await getUsersReactionTimes(gameRoom.id)

		debug("userReactions length: %s", userReactionTimes.length);

		// Determine if both users has a registered reactiontime, otherwise bail
		if (userReactionTimes.length !== 2) return;
		const gameRoomWhenBothPlayershasClicked = await getGameRoomAndUsers(socket.id);
		if (!gameRoomWhenBothPlayershasClicked) {
			return;
		}
		// Deconstruct players from gameRoom (they SHOULD be in order)
		const [player1, player2] = gameRoomWhenBothPlayershasClicked.users;

		if (!player1.reactionTime || !player2.reactionTime) {
			debug("One or both reactionTimes are null. Player one: %o Player two: %o", player1, player2);
			return;
		}

		// Create score array to update and replace in DB - (manipulating arrays in DB not possible using prisma?)
		const updatedScore = [...gameRoom.score]

		// Determine draw or winner
		if (player1.reactionTime === player2.reactionTime) {
			debug("It's a draw!")
			updatedScore[2] = (updatedScore[2] || 0) + 1;

			draw = true;

		} else if (player1.reactionTime < player2.reactionTime) {
			updatedScore[0]++

		} else {
			updatedScore[1]++
		}

		const winner = player1.reactionTime < player2.reactionTime
				? player1
				: player2;


		// As winner is determined, reset reactionTime on both users
		await resetReactionTimes(gameRoom.id);
		debug("userReactions length after reset: %s", userReactionTimes.length);

		debug("Current score: %s", updatedScore);

		// Accumulate score of players to determine current round
		const currentRound = updatedScore.reduce((sum, score) => sum + score, 0);

		debug("Current Round: %s", currentRound)

		// If current round is 10, call the game!
		if (currentRound === 10) {
			debug("Game finished! Score: Player 1 %s Player 2 %s", updatedScore[0], updatedScore[1]);
			let matchWinner: string;

			if (updatedScore[0] === updatedScore[1]) {

				gameInfoMessage = `
					<div class="playerwon">It's a draw! You both loose :D</div>
					<div class="reactiontime-wrapper">
						<div class="reactiontime1">
							<div class="playerNameWon1">${player1.username}</div>
							<div class="playerNameReaction1">Score: ${updatedScore[0]}</div>
						</div>
						<div class="reactiontime2">
							<div class="playerNameWon2">${player2.username}</div>
							<div class="playerNameReaction2">Score: ${updatedScore[1]}</div>
						</div>
					</div>
					`

			} else {
				matchWinner = updatedScore[0] > updatedScore[1]
					? player1.username
					: player2.username

				gameInfoMessage = `
					<div class="playerwon"><span class="playerwonspan">Game Over! Winner:</span> ${matchWinner}</div>
					<div class="reactiontime-wrapper">
						<div class="reactiontime1">
							<div class="playerNameWon1">${player1.username}</div>
							<div class="playerNameReaction1">Score: ${updatedScore[0]}</div>
						</div>
						<div class="reactiontime2">
							<div class="playerNameWon2">${player2.username}</div>
							<div class="playerNameReaction2">Score: ${updatedScore[1]}</div>
						</div>
					</div>
					`
			}

			const gameData: FinishedGameData = {
				title: `${player1.username} vs ${player2.username}`,
				score: updatedScore
			}

			finishedGame(gameRoom.id, false, gameData);

			io.to(gameRoom.id).emit("stc_finishedGameScore", updatedScore)
			io.to(gameRoom.id).emit("stc_gameInfo", gameInfoMessage)
			socket.to(gameRoom.id).emit("stc_finishedgame");
			return;
		}

		// Update GameRoom in DB with new score
		await updateGameRoomScore(gameRoom.id, updatedScore);

		// emit shit to start next round?
		 const RoundResultData: RoundResultData = {
			roomId: gameRoom.id,
			currentRound,
			reactionTimes: [player1.reactionTime, player2.reactionTime],
			score: updatedScore,
			draw,
		}

		if (draw) {
			gameInfoMessage = `
					<div class="playerwon">It's a draw!</div>
					<div class="reactiontime-wrapper">
						<div class="reactiontime1">
							<div class="playerNameWon1">${player1.username}</div>
							<div class="playerNameReaction1">Reaction Time: ${(player1.reactionTime / 1000).toFixed(2)}</div>
						</div>
						<div class="reactiontime2">
							<div class="playerNameWon2">${player2.username}</div>
							<div class="playerNameReaction2">Reaction Time: ${(player2.reactionTime / 1000).toFixed(2)}</div>
						</div>
					</div>
					`
		} else {
			gameInfoMessage = `
					<div class="playerwon">Round Winner: ${winner.username}</div>
					<div class="reactiontime-wrapper">
						<div class="reactiontime1">
							<div class="playerNameWon1">${player1.username}</div>
							<div class="playerNameReaction1">Reaction Time: ${(player1.reactionTime / 1000).toFixed(2)}</div>
						</div>
						<div class="reactiontime2">
							<div class="playerNameWon2">${player2.username}</div>
							<div class="playerNameReaction2">Reaction Time: ${(player2.reactionTime / 1000).toFixed(2)}</div>
						</div>
					</div>
					`
		}
		debug("RoundResultData: %O", RoundResultData);
		const data = generateGameData(gameRoom.id);
		const { id, ...updateData } = data;
		// Create GameData in DB
		await createOrUpdateGameData(id, updateData, data);
		io.to(gameRoom.id).emit("stc_gameInfo", gameInfoMessage)
		io.to(gameRoom.id).emit("stc_roundUpdate", RoundResultData);
	});



	socket.on("cts_quitGame", async (roomId, callback)=> {
		const gameroom = await prisma.gameroom.findUnique({where: {
			id: roomId
		}})
		if (!gameroom) {
			return;
		}
		// TODO, move this to services

		/**
		 * Get users with roomID, delete them all!
		 * Then, delete Gameroom
		 * let the Opponent know that player left
		 * disconnect sockets from roomId,
		 * if everything is successful, acknowledge callback
		 */
		await prisma.user.deleteMany({where: {
			roomId
		}}).then(async()=> {
			await prisma.gameroom.delete({
				where: {id: roomId
				}
			})
		});
		socket.to(roomId).emit("stc_opponentleft");
		io.socketsLeave(roomId);
		callback(true)
		debug("Socket left gameroom", roomId)
	});

	socket.on("cts_getHighscores", async (roomid, callback)=> {
		const highscoreCollection = await GetHighscores();
			callback(highscoreCollection)
	});
	socket.on("stc_getActiveRooms", async (callback)=> {
		const roomcollection: ActiveRooms[] = await GetActiveRooms();
		if (roomcollection) {
			callback(roomcollection)
		}

	})

}
const finishedGame = async (roomId: string, forfeit: boolean, gameData: FinishedGameData | null)=> {
	// await deleteRoomById(roomId);
	if (!forfeit && gameData) {
		const addFinishedGame = await addToHighscores(gameData);
		return addFinishedGame;
	}
}

const generateGameData = (roomId: string) => {
	const x = Math.floor(Math.random() * 10) + 1;
	const y = Math.floor(Math.random() * 10) + 1;
	const startDelay = (Math.random() * (10 - 1.5) + 1.5) * 1000;
	const moleImages = ["Mole1", "Mole2", "Mole3", "Mole4", "Mole5"];
	const randomImage = Math.floor(Math.random() * moleImages.length);

	return {
		id: roomId,
		coordinates: `${x}-${y}`,
		startDelay,
		randomImage,
	};
};

const handlePlayerForfeit = async (userId: string) => {

		debug("Player %s forfeited the game", userId);

		const gameRoom = await getGameRoomAndUsers(userId);
		if(!gameRoom) {
			debug("GameRoom not found!");
			return;
		}

		// Get opponent (winner by forfeit)
		const opponent = gameRoom.users.find(user => user.id !== userId);
		if (!opponent) {
			debug("Could not verify opponent: %o", opponent)
			return;
		}

		// Get usernames to include in title
		const [player1, player2] = gameRoom.users;
		const updatedScore = [...gameRoom.score]

		if (opponent.id === player1.id) {
			updatedScore[0]++;
		} else {
			updatedScore[1]++;
		}

		// Update GameRoom in DB with new score
		await updateGameRoomScore(gameRoom.id, updatedScore);

		// UserWhoStayed vs UserWholeft 10-0
		// Call the game
		const gameData: FinishedGameData = {
			title: `${player1.username} vs ${player2.username}`,
			score: updatedScore
		}

		finishedGame(gameRoom.id, true, gameData);
		return;
}

const GetActiveRooms = async() => {
	return prisma.gameroom.findMany({
		include: {
			users: true
		}
	})

}
