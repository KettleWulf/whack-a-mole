import { User } from "@prisma/client"
import prisma from "../prisma"

export const deleteUsers = async () => {
    return prisma.user.deleteMany();
}


export const createUser = async (data: User) => {
    return prisma.user.create({
        data
    })
}
export const findUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: {
            id
        }
    })
}

export const updateUserRoomId = async (id: string, roomId: string) => {
    return prisma.user.update({
        where: {
            id
        },
        data : {
            roomId
        }
    })
}

export const updateUserReactionTime = (userId: string, reactionTime: number) => {
    return prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            reactionTime,
        }
    });
}

export const getUsersReactionTimes = (roomId: string) => {
    return prisma.user.findMany({
        where: {
            roomId: roomId,
            reactionTime: {
                not: null,
            }
        }
    });
}

export const resetReactionTimes = (roomId: string) => {
    return prisma.user.updateMany({
        where: {
            roomId: roomId
        },
        data: {
            reactionTime: null
        }
    });

}

export const getUsersByRoomId = async (roomId: string) =>{
    return prisma.user.findMany({
        where: {
            roomId
        }
        
    })
}
