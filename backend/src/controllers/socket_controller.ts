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
		io.to(roomId).emit("stc_GameroomReadyMessage", message)
        return;
    }
	});

	socket.on("cts_startRequest", (roomId, callback)=> {
		const x = Math.floor(Math.random() * 10) + 1;
		const y = Math.floor(Math.random() * 10) + 1;
		const time = Math.floor(Math.random() * 10000) + 1500;
		const moleImages = ["Mole1", "Mole2", "Mole3", "Mole4", "Mole5"];
		const randomIndex = Math.floor(Math.random() * moleImages.length);

		console.log(` Mullvaden kommer att dyka upp på: ${x}-${y}`);

		callback({
			position: `${x}-${y}`,
			startDelay: time,
			randomImage: randomIndex
		})
		const payload: Messagedata = {
			content: "Game is starting",
			timestamp: Date.now()
		}
		io.to(roomId).emit("stc_Message", payload)
	});

	socket.on("cts_clickedVirus", (payload)=> {
		const finished = false;
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
	});

};

const finishedGame = async (roomId: string, forfeit: boolean, gameData: FinishedGameData | null)=> {
	await deleteRoomById(roomId);
	if (!forfeit && gameData) {
		const addFinishedGame = await addToHighscores(gameData);
		return addFinishedGame;
	}
};
