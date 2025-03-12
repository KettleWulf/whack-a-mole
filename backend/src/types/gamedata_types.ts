import { GameData } from "@prisma/client";
export type GameDataOmitID = Omit<GameData, "id">