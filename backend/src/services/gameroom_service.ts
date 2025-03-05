import prisma from "../prisma"
import { Gameroom } from "../types/gameroom_type";


export const deleterooms = async () => {
    return prisma.gameroom.deleteMany({});
}


export const findPendingGameroom = async () => {
    return prisma.gameroom.findMany({
        include: {
            users: true
        }
    })
}

export const createGameroom = async (title: string) => {
    return prisma.gameroom.create({
        data: {
            title: title,
            score: [0,0]
        }
    })
}

export const updateRoomById = async (roomId: string, data:Gameroom) => {
    return prisma.gameroom.update({
        where: {
            id: roomId,
            
        }, data: {
            ...data
        }

    })
}

export const deleteRoomById = async(roomId: string)=> {
    return prisma.gameroom.delete({
        where: {
            id: roomId
        },
        include: {
            users: true
        }
    })
}