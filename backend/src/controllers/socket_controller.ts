/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types/SocketEvents.types";

// Create a new debug instance
const debug = Debug("backend:socket_controller");

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
}
