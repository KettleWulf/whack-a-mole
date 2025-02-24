/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, Messagedata, ServerToClientEvents } from "@shared/types/SocketEvents.types";
import { Gameroom } from "../types/gameroom_type";

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
	socket.on("cts_joinRequest", (payload)=> {
		let gameRoomId: string= "";
		const message: Messagedata = {
			content: payload.content,
			timestamp: Date.now(),
		}
		if (!Gamerooms.length) {
			gameRoomId = "Lobby:" + socket.id;
			const GameRoomData: Gameroom = {
				roomID: gameRoomId,
				playerOne: socket.id,
				playerTwo: "",
				round: 1,
				score: [0,0]
	
			}
			Gamerooms.push(GameRoomData);
			message.content = JSON.stringify(GameRoomData);
			socket.join(gameRoomId);
			socket.emit("stc_Message", message);
		};
		if (!Gamerooms[0].playerTwo && Gamerooms[0].playerOne !== socket.id) {
			Gamerooms[0].playerTwo = socket.id
			socket.join(Gamerooms[0].roomID);
			socket.emit("stc_Message", message);
			debug("Lobby is now: %O", Gamerooms[0]);
		}

	});

	socket.on("cts_startRequest", (payload)=> {
		const message: Messagedata = {
			content: payload.content + "Broadcasting to Gameroom Lobby",
			timestamp: Date.now(),
		}
		const Roomlobby = Gamerooms[0].roomID
		if (Roomlobby) {
			io.to(Roomlobby).emit("stc_Message", message);
		}else {
			const message: Messagedata = {
				content: "No Room found",
				timestamp: Date.now(),
			}
			socket.emit("stc_Message", message);
		}
		
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
