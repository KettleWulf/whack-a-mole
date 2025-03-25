/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, Gamelobby, ServerToClientEvents, RoundResultData, ActiveRooms, ClickedMole } from "@shared/types/SocketEvents.types";
import { createGameroom, findSingleGameRoom ,findPendingGameroom, getGameRoomAndUsers, updateGameRoomScore, deleteEmptyGameRoom, GetActiveRooms } from "../services/gameroom_service";
import { User } from "@prisma/client";
import { createUser, deleteUser, deleteUsersInGameRoom, findUserById, getUsersByRoomId, updateUserRoomId } from "../services/user_service";
import { FinishedGameData } from "../types/gameroom_types";
import { addToHighscores, GetHighscores } from "../services/highscore.service";
import { createOrUpdateGameData, getGameData, } from "../services/gamedata_service";
import { handlePlayerForfeit, generateGameData, finishedGame } from "../utensils/utensils"
import { gameInfoMessages } from "../utensils/gameInfoMessages";


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
		deleteUser(socket.id)
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

		const gameData = await getGameData(roomId);
		if(!gameData) {
			debug("Couldn't find GameData in relation to roomId: %s", roomId);
			return;
		}

		callback(gameData);

		const forfeitTimer = 30000 + gameData.startDelay;
		const responses: ClickedMole[] = [];
		io.timeout(forfeitTimer).to(roomId).emit("stc_roundStart", async (err, response) => {
		
			let gameInfoMessage: string;

			debug("Current state of response: %o", response);
			debug("Current length of response: %d", response.length);
			if (err) {

				debug("Neither player clicked in time")
				
				gameInfoMessage = "Both players forfeited... Game over.";
				io.to(roomId).emit("stc_gameInfo", gameInfoMessage); 
				io.to(roomId).emit("stc_finishedgame");  
				return;
			}
			else {
				const responseBundle: ClickedMole[] = response
				debug("responseBundle: %o", responseBundle)
			 	if (responseBundle.length === 2) {
				
				let draw = false;
				// callback.sort((a, b) => a.playerClicked - b.playerClicked);
				// Deconstruct callback, first player should be winner (if not, sort them on callback playerClicked first)
				const [ rawWinner, rawLoser ] = response;

				const roundStart = rawWinner.roundStart;
				const reactionTimes = [rawWinner, rawLoser].map(player => player.playerClicked - roundStart);


				// Get gameRoom and users
				const gameRoom = await getGameRoomAndUsers(rawWinner.userId);

				if(!gameRoom) {
					debug("GameRoom not found!");
					return;
				}

				const [ playerOne, playerTwo ] = gameRoom.users;

				const winner = rawWinner.userId === playerOne.id
					? playerOne
					: playerTwo

				const updatedScore = [...gameRoom.score];

				debug("Reactiontimes with winner on index 0: %o", reactionTimes)

				if (reactionTimes[0] === reactionTimes[1]) {
					debug("It's a draw!")
					updatedScore[2] = (updatedScore[2] || 0) + 1;
					draw = true;

				} else if (winner === playerOne) {
					updatedScore[0]++
					debug("Player One won the round! Score: %o", updatedScore)

				} else {
					updatedScore[1]++
					reactionTimes.reverse();
					debug("Player two won the round! Score: %o", updatedScore)
				}
				debug("ReactionTimes with playerOne's on index 0: %o", reactionTimes)

				const currentRound = updatedScore.reduce((sum, score) => sum + score, 0);
				debug("Current Round: %d", currentRound)

				if (currentRound === 10) {
					// handle finished match

					if (updatedScore[0] === updatedScore[1]) {
						debug("Game Over! It's a draw!");
						gameInfoMessage = gameInfoMessages.draw(playerOne.username, playerTwo.username, updatedScore[0], updatedScore[1])
					} else {
						const matchWinner = updatedScore[0] > updatedScore[1]
							? playerOne
							: playerTwo

						gameInfoMessage = gameInfoMessages.gameOver(matchWinner.username, playerOne.username, playerTwo.username, updatedScore[0], updatedScore[1]);

					}

					const finishedGameData: FinishedGameData = {
						title: `${playerOne.username} vs ${playerTwo.username}`,
						score: updatedScore
					}
		
					await finishedGame(gameRoom.id, false, finishedGameData);
		
					io.to(gameRoom.id).emit("stc_finishedGameScore", updatedScore)
					io.to(gameRoom.id).emit("stc_gameInfo", gameInfoMessage)
					socket.to(gameRoom.id).emit("stc_finishedgame");
					return;
				}
					
				if (draw) {
					gameInfoMessage = gameInfoMessages.roundDraw(playerOne.username, playerTwo.username, updatedScore[0], updatedScore[1])
				} else {
					gameInfoMessage = gameInfoMessages.roundWin(winner.username, playerOne.username, playerTwo.username, updatedScore[0], updatedScore[1])
				}

				await updateGameRoomScore(gameRoom.id, updatedScore);

				const RoundResultData: RoundResultData = {
					roomId: gameRoom.id,
					currentRound,
					reactionTimes,
					score: updatedScore,
					draw,
				}
				
				const data = generateGameData(gameRoom.id);
				const { id, ...updateData } = data;
				await createOrUpdateGameData(id, updateData, data);
				
				io.to(gameRoom.id).emit("stc_gameInfo", gameInfoMessage)
				io.to(gameRoom.id).emit("stc_roundUpdate", RoundResultData);
				return;
			}
		}
			if (responses.length === 1) {
				debug("Only one player clicked in time");
				
				const opponentName = await handlePlayerForfeit(response[0].userId); // handlePlayerForfeit kallar på finishedGame åt oss

				gameInfoMessage = `Opponent ${opponentName} forfeited. You win!`
				io.to(roomId).emit("stc_gameInfo", gameInfoMessage);
				io.to(roomId).emit("stc_finishedgame");
				return;
			}
		});

	});
	



	socket.on("cts_quitGame", async (roomId, callback)=> {
		const gameroom = await findSingleGameRoom(roomId);
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
		await deleteUsersInGameRoom(roomId)
		.then(async()=> {
			await deleteEmptyGameRoom(roomId)
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





