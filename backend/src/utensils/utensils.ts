import Debug from "debug";
import { addToHighscores } from "../services/highscore.service";
import { getGameRoomAndUsers, updateGameRoomScore } from "../services/gameroom_service"
import { FinishedGameData } from "../types/gameroom_types";


// Create a new debug instance
const debug = Debug("backend:utensils");

export const handlePlayerForfeit = async (userId: string) => {

    
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
    debug("Player %s forfeited the game", opponent.username);
    
    // Get usernames to include in title
    const [playerOne, playerTwo] = gameRoom.users;
    const updatedScore = [...gameRoom.score]

    if (opponent.id === playerOne.id) {
        updatedScore[1]++;
    } else {
        updatedScore[0]++;
    }

    // Update GameRoom in DB with new score
    await updateGameRoomScore(gameRoom.id, updatedScore);

    
    // Call the game
    const finishedGameData: FinishedGameData = {
        title: `${playerOne.username} vs ${playerTwo.username}`,
        score: updatedScore
    }

    finishedGame(gameRoom.id, true, finishedGameData);
    return opponent.username;
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
