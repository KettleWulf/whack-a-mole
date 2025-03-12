import { FinishedGame } from "@prisma/client";

type Highscore = Omit<FinishedGame, "id">
export type NewHighscoreRecord = Omit<Highscore, "date">