import { Gameroom } from "@prisma/client";

export type GameroomData = Partial<Gameroom>
export type FinishedGameData = Omit<Gameroom, "id">
