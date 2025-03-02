

export interface Gameroom {
    roomID: string;
    playerOne: string;
    playerTwo: string | null;
    round: number ;
    score: number[];
}