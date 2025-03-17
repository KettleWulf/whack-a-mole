import { GameroomData } from "../../backend/src/types/gameroom_types";
import { NewHighscoreRecord } from "../../backend/src/types/highscore.types";
import { UserData } from "../../backend/src/types/user_types";
import { GameDataOmitID } from "../../backend/src/types/gamedata_types"


export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
    // generic server event
    stc_Message: (payload: number) => void;
    stc_GameroomReadyMessage: (payload: Gamelobby) => void;
	stc_sendingTime: (playerclicked: number) => void;
    stc_roundUpdate: (payload: RoundResultData) => void;
    stc_opponentleft: ()=> void;
    stc_finishedgame: ()=>void;
    stc_finishedGameScore: (payload: number[]) => void;
    stc_gameInfo: (payload: string) =>void;
    stc_requestclickorforfeit: (callback: (clicked: string)=> void)=>void;

    stc_roundStart: (roundCallback: (clicked: ClickedMole) => void) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
    // player submitted username
    cts_joinRequest: (payload: Player) => void;
    cts_clickedVirusFrontend: (payload: GameEvaluation) => void;
    cts_startRequest: (room: string, callback: (response: GameDataOmitID)=> void) => void;
    cts_clickedVirus: (payload: ReactionTime) => void;
    cts_quitGame: (roomId: string, callback:(response: boolean)=> void) => void;
    cts_getHighscores: (roomID: string, callback: (highscoreCollection: NewHighscoreRecord[])=> void) => void;
    stc_getActiveRooms: (callback: (payload: ActiveRooms[]) =>void) =>void;
}

export interface Player {
    content: string;
}

export interface Messagedata {
    content: string;
    timestamp: number;
}

export interface Startgame {
    position: string;
    startDelay: number;
	randomImage: number;
}

export interface Gamelobby {
    room: GameroomData
    users: UserData[];
}

export interface GameEvaluation {
	roomId: string;
	start: number;
	cliked: number;
	forfeit: boolean;
}
export interface ReactionTime {
    userId: string; 
    roundStart: number;          // timestamp
    playerClicked: number;       // timestamp
}

export interface ClickedMole {
    userId: string; 
    roundStart: number;          // timestamp
    playerClicked: number;       // timestamp
}

export interface RoundResultData {
	roomId: string;
	currentRound: number;
	reactionTimes: number[];
    score: number[];
    draw: boolean;
}

export interface ActiveRooms {
    id: string;
    title: string;
    score: number[];
    users: UserData[];
}

export interface HighscoresData {
   playerOne: number
}
