/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, Messagedata, ServerToClientEvents } from "@shared/types/SocketEvents.types";
import { Gameroom } from "../types/gameroom_type";
import { createGameroom, findPendingGameroom } from "../services/gameroom_service";
import { User } from "@prisma/client";
import { createUser } from "../services/user_service";

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
	const gameRoom = await findPendingGameroom();
	if (!gameRoom) {
		const createRoom = await createGameroom("Gameroom");
		const userdata: User = {
			id: socket.id,
			username: payload.content,
			roomId: createRoom.id
		}
		await createUser(userdata);
		socket.join(createRoom.id);
		const message: Messagedata = {
			content: "Joined gameroom",
			timestamp: Date.now()
		}
		io.to(createRoom.id).emit("stc_Message", message);
		return;
	}
	const userdata: User = {
		id: socket.id,
		username: payload.content,
		roomId: gameRoom.id
	}
	await createUser(userdata);
	socket.join(gameRoom.id);
	const message: Messagedata = {
		content: "Joined gameroom",
		timestamp: Date.now()
	}
	io.to(gameRoom.id).emit("stc_Message", message);
	});

	socket.on("cts_startRequest", (roomId, callback)=> {

		callback({
			position: "x-y",
			startDelay: 3500
		})
		const payload: Messagedata = {
			content: "Game is starting",
			timestamp: Date.now()
		}
		io.to(roomId).emit("stc_Message", payload)
	});

	socket.on("cts_clickedVirus", (payload)=> {
		const message: Messagedata = {
			content: payload.content + " " + Gamerooms[0].score.join(" - "),
			timestamp: Date.now(),
		}
		socket.emit("stc_Message", message);
	});

	socket.on("cts_quitGame", (payload)=> {
		const message: Messagedata = {
			content: "User disconnected",
			timestamp: payload.timestamp,
		}
		socket.emit("stc_Message", message);
	})
}
