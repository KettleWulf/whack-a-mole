export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
    // generic server event
    stc_Message: (payload: Messagedata) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
    // player submitted username
    cts_joinRequest: (payload: Messagedata) => void;
    cts_startRequest: (payload: Messagedata) => void;
    cts_clickedVirus: (payload: Messagedata) => void;
    cts_quitGame: (payload: Messagedata) => void;
}

export interface Messagedata {
    content: string;
    timestamp: number;
}