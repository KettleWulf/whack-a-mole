/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, Gamelobby, Messagedata, ServerToClientEvents } from "@shared/types/SocketEvents.types";
import { Gameroom } from "../types/gameroom_type";
import { createGameroom, deleteRoomById, findPendingGameroom } from "../services/gameroom_service";
import { User } from "@prisma/client";
import { createUser, findUserById, getUsersByRoomId, updateUserRoomId } from "../services/user_service";
import { FinishedGameData } from "../types/gameroom_types";
import { addToHighscores, GetHighscores } from "../services/highscore.service";
import { NewHighscoreRecord } from "../types/highscore.types";
import prisma from "../prisma";

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

	socket.on("cts_startRequest", (roomId, callback)=> {

		callback({
			position: "3-6",
			startDelay: 3500
		})
		const payload: Messagedata = {
			content: "Game is starting",
			timestamp: Date.now()
		}
		io.to(roomId).emit("stc_Message", payload)
	});

	socket.on("cts_clickedVirus", async (payload)=> {
		debug("Player %s wacked a mole! Payload: %o", socket.id, payload)
		let finished = false;

		// Did the player forfeit?
		if (payload.forfeit === true) {
			debug("Player %s forfeited the game")
			// Automatically award other player one point

			// Call the game

			return;
		}

		// Calculate reactiontime
		const reactionTime = payload.playerclicked - payload.roundstart;
		debug("Players reaction time: %s", reactionTime)

		// Upload reactiontime to user and get roomId of said players room
		const user = await prisma.user.update({
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

		if (!user) {
			debug("Couldn't find user or corresponding gameroomID")
		}
		debug("User %s corresponding roomId: %s", socket.id, user.roomId)

		// Check if both players has an uploaded reactiontime using roomId
		const getUserReactions = await prisma.user.findMany({
			where: {
				roomId: user.roomId,
				reactionTime: {
					not: null,
				}
			},
			select: {
				id: true,
				reactionTime: true
			}
		});

		debug("getUserReactions length: %s", getUserReactions.length)

		// Determine if both users has a registered reactiontime, otherwise bail
		if (getUserReactions.length !== 2) return;
		

		// If both players have a reaction time, determine winner
		const [player1, player2] = getUserReactions as { id: string, reactionTime: number }[];
		const winner = player1.reactionTime < player2.reactionTime
			? player1
			: player2
		 
		debug("And the winner is: %o", winner)	

		// As winner is determined, reset reactionTime on both users
		await prisma.user.updateMany({
			where: { 
				roomId: user.roomId 
			},
			data: {
				reactionTime: null 
			}
		});

		// Get gameroom from DB
		const gameRoom = await prisma.gameroom.findUnique({
			where: {
				id: user.roomId
			}
		});

		if(!gameRoom) {
			debug("GameRoom not found!");
			return;
		}

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
			finished = true;
		}

		// Update GameRoom in DB with new score
		await prisma.gameroom.update({
			where: {
				id: gameRoom.id,
			},
			data: {
				score: updatedScore,
			}
		})

		// emit shit to start next round?
		




		
		const forfeit = false;
		const message: Messagedata = {
			content: payload.content + " " + Gamerooms[0].score.join(" - "),
			timestamp: Date.now(),
		}
		socket.emit("stc_Message", message);
		if (finished && !forfeit) {
			const GameData: NewHighscoreRecord = {
				title: "Cool title",
				score: [7,3],
			}
			finishedGame("ROOMID", false, GameData)
		}
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
	await deleteRoomById(roomId);
	if (!forfeit && gameData) {
		const addFinishedGame = await addToHighscores(gameData);
		return addFinishedGame;
	}
}