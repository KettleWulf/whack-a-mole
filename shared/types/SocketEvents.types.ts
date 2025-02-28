import { GameroomData } from "../../backend/src/types/gameroom_types";
import { FinishedGameData } from "../../backend/src/types/highscore.types";
import { UserData } from "../../backend/src/types/user_types";

export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
    // generic server event
    stc_Message: (payload: Messagedata) => void;
    stc_GameroomReadyMessage: (payload: Gamelobby) => void
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
    // player submitted username
    cts_joinRequest: (payload: Messagedata) => void;
    cts_startRequest: (room: string, callback: (response: Startgame)=> void) => void;
    cts_clickedVirus: (payload: ReactionTime) => void;
    cts_quitGame: (payload: Messagedata) => void;
    cts_getHighscores: (roomID: string, callback: (highscoreCollection: FinishedGameData[])=> void) => void;
}

export interface Messagedata {
    content: string;
    timestamp: number;
}

export interface Startgame {
    position: string;
    startDelay: number;
}

export interface Gamelobby {
    room: GameroomData
    users: UserData[];
}

export interface ReactionTime {
    roundstart: number          // timestamp
    playerclicked: number       // timestamp
}