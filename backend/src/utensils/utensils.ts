import Debug from "debug";
import { addToHighscores } from "../services/highscore.service";
import { getGameRoomAndUsers, updateGameRoomScore } from "../services/gameroom_service"
import { FinishedGameData } from "../types/gameroom_types";


// Create a new debug instance
const debug = Debug("backend:utensils");

export const handlePlayerForfeit = async (userId: string) => {

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
    return true;
}

export const finishedGame = async (roomId: string, forfeit: boolean, gameData: FinishedGameData | null)=> {
	// await deleteRoomById(roomId);
	if (!forfeit && gameData) {
		const addFinishedGame = await addToHighscores(gameData);
		return addFinishedGame;
	}
}

export const generateGameData = (roomId: string) => {
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
