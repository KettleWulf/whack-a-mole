import { GameData } from "@prisma/client";
import prisma from "../prisma";

export const createGameData = (data: GameData) => {
    return prisma.gameData.create({
        data, 
    });
}

export const getGameData = (roomId: string) => {
    return prisma.gameData.findUnique({
        where: {
            id: roomId,
        },
        select: {
            coordinates: true,
            startDelay: true,
            randomImage: true,
        }
    });
}