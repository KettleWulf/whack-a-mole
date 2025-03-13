import { GameData } from "@prisma/client";
import prisma from "../prisma";
import { GameDataOmitID } from "../types/gamedata_types";


// Not needed anymore?
export const createGameData = (data: GameData) => {
    return prisma.gameData.create({
        data, 
    });
}

export const createOrUpdateGameData = (id: string, updateData: GameDataOmitID, data: GameData) => {
    return prisma.gameData.upsert({
        where: { id },
        update: updateData,
        create: data,
    });
}
export const updateGameData = (roomdata: GameData) => {
    return prisma.gameData.update({
        where: {
            id : roomdata.id
        }, data: {
            coordinates: roomdata.coordinates,
            randomImage: roomdata.randomImage,
            startDelay: roomdata.startDelay

        }
    })
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