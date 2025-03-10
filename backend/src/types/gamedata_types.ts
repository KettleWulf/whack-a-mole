import { GameData } from "@prisma/client";
export type StartGameData = Omit<GameData, "id">