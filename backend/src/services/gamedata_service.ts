import { GameData } from "@prisma/client";
import prisma from "../prisma";

export const createGameData = (data: GameData) => {
    return prisma.gameData.create({
        data, 
    });
}