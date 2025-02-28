import { Gameroom } from "@prisma/client";
import { Omit } from "@prisma/client/runtime/library";

export type GameroomData = Partial<Gameroom>
export type FinishedGameData = Omit<Gameroom, "id">