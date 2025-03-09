/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, Gamelobby, Messagedata, ServerToClientEvents, RoundResultData } from "@shared/types/SocketEvents.types";
import { Gameroom } from "../types/gameroom_type";
import { createGameroom, deleteRoomById, findPendingGameroom, getGameroomsUsers } from "../services/gameroom_service";
import { User } from "@prisma/client";
import { createUser, findUserById, getOpponent, getUsersByRoomId, updateUserRoomId } from "../services/user_service";
import { FinishedGameData } from "../types/gameroom_types";
import { addToHighscores, GetHighscores } from "../services/highscore.service";
import { NewHighscoreRecord } from "../types/highscore.types";
import prisma from "../prisma";
import { createGameData, createOrUpdateGameData, getGameData } from "../services/gamedata_service";

// Create a new debug instance
const debug = Debug("backend:socket_controller");
const Gamerooms: Gameroom[]= [];
// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
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

		await updateUserRoomId(socket.id, createRoom.id);
		socket.join(createRoom.id);
		const message: Messagedata = {
			content: "Joined gameroom" + createRoom.id + " Gamerooms:" + gameRooms,
			timestamp: Date.now()
		}
		io.to(createRoom.id).emit("stc_Message", message);
		return;
	}
		//join player 2 to room which is missing a player
	if (findfreeGameroom) {
		const roomId = findfreeGameroom[0].id;
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
		// Generate new gameData
		const data = generateGameData(roomId);
		
		// Deconstruct data (in case we update instead of create)
		const { id, ...updateData } = data;
		
		// Update if it exists, if not create it
		await createOrUpdateGameData(id, updateData, data);

		// Get new, fresh gamedata from DB
		const gameData = await getGameData(roomId)

		// Check if we made a boo-boo
		if(!gameData) {
			debug("Couldn't find GameData in relation to roomId: %s", roomId);
			return;
		}

		// Send it with the callback
		callback(gameData)

		const payload: Messagedata = {
			content: "Game is starting",
			timestamp: Date.now()
		}
		io.to(roomId).emit("stc_Message", payload)
	});

	socket.on("cts_clickedVirus", async (payload)=> {
		debug("Player %s wacked a mole! Payload: %o", socket.id, payload)

		// Get user who clicked
		const user = await prisma.user.findUnique({
			where: {
				id: socket.id
			},
			select: {
				roomId: true
			},
		});


		if (!user) {
			debug("Couldn't find user or corresponding gameroomID");
			return;
		}

		debug("User %s corresponding roomId: %s", socket.id, user.roomId)

		// Get gameroom, including users[] from DB
		const gameRoom = await getGameroomsUsers(socket.id);

		if(!gameRoom) {
			debug("GameRoom not found!");
			return;
		}

		// Handle player forfeiting
		if (payload.forfeit === true) {
			handlePlayerForfeit(socket.id);
			return;
		}


		// Calculate reactiontime
		const reactionTime = payload.playerclicked - payload.roundstart;
		debug("Players reaction time: %s", reactionTime)

		// Upload reactiontime to user and get roomId of said players room
		await prisma.user.update({
			where: {
				id: socket.id,
			},
			data: {
				reactionTime,
			},
			select: {
				roomId: true,
			}
		});

		// Check if both players has an uploaded reactiontime using roomId
		const getUserReactions = await prisma.user.findMany({
			where: {
				roomId: user.roomId,
				reactionTime: {
					not: null,
				}
			}
		});

		debug("getUserReactions length: %s", getUserReactions.length);

		// Determine if both users has a registered reactiontime, otherwise bail
		if (getUserReactions.length !== 2) return;


		// If both players have a reaction time, determine winner
		const [player1, player2] = getUserReactions;

		if (!player1.reactionTime || !player2.reactionTime) {
			debug("One or both reactionTimes are null. Player one: %o Player two: %o", player1, player2);
			return;
		}

		const winner = player1.reactionTime < player2.reactionTime
			? player1
			: player2

		debug("And the winner is: %o", winner);

		// As winner is determined, reset reactionTime on both users
		await prisma.user.updateMany({
			where: {
				roomId: user.roomId
			},
			data: {
				reactionTime: null
			}
		});

		// Create array to update and replace array in DB - (manipulating arrays in DB not possible using prisma?)
		const updatedScore = [...gameRoom.score]

		// Update the right score
		winner.id === player1.id
			? updatedScore[0]++
			: updatedScore[1]++

		debug("Current score: %s", updatedScore);

		// Accumulate score of players to determine current round
		const currentRound = updatedScore.reduce((sum, score) => sum + score, 0);

		debug("Current Round: %s", currentRound)

		// If current round is 10, call the game!
		if (currentRound === 10) {
			debug("Game finished! Score: Player 1 %s Player 2 %s", updatedScore[0], updatedScore[1]);

			const gameData: FinishedGameData = {
				title: `${player1.username} vs ${player2.username}`,
				score: updatedScore
			}

			finishedGame(gameRoom.id, false, gameData);
			return;
		}

		// Update GameRoom in DB with new score
		await prisma.gameroom.update({
			where: {
				id: gameRoom.id,
			},
			data: {
				score: updatedScore,
			}
		});

		// emit shit to start next round?
		 const RoundResultData: RoundResultData = {
			roomId: gameRoom.id,
			currentRound,
			reactionTimes: [player1.reactionTime, player2.reactionTime],
			score: updatedScore
		}

		io.to(gameRoom.id).emit("stc_roundUpdate", RoundResultData);
	});

	socket.on("cts_quitGame", (payload)=> {
		const message: Messagedata = {
			content: "User disconnected",
			timestamp: payload.timestamp,
		}
		socket.emit("stc_Message", message);
	});

	socket.on("cts_getHighscores", async (roomid, callback)=> {
		const highscoreCollection = await GetHighscores();
			callback({...highscoreCollection})
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

	// if (payload.forfeit === true) {
		debug("Player %s forfeited the game", userId);

		const gameRoom = await getGameroomsUsers(userId);
		if(!gameRoom) {
			debug("GameRoom not found!");
			return;
		}

		// Get opponent (winner by forfeit) from DB
		const opponent = await getOpponent(gameRoom.id, userId)
		if (!opponent) {
			debug("No opponent found, cannot award win.");
			return;
		}

		// Award last point to opponent/winner
		const updatedScore = [...gameRoom.score];
		opponent.id === gameRoom.users[0].id
			? updatedScore[0]++
			: updatedScore[1]++;

		// Update GameRoom in DB with new score
		await prisma.gameroom.update({
			where: {
				id: gameRoom.id,
			},
			data: {
				score: updatedScore,
			}
		});

		// Get usernames to include in title
		const [player1, player2] = gameRoom.users;

		// Call the game
		const gameData: FinishedGameData = {
			title: `${player1.username} vs ${player2.username}`,
			score: updatedScore
		}

		finishedGame(gameRoom.id, true, gameData);
		return;
}

