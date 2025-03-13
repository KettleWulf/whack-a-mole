import prisma from "../prisma"
import { Gameroom } from "../types/gameroom_type";


export const deleterooms = async () => {
    return prisma.gameroom.deleteMany({});
}

export const findSingleGameRoom = (roomId: string) => {
    return prisma.gameroom.findUnique({
        where: {
            id: roomId,
    }})
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

export const deleteEmptyGameRoom = (roomId: string) => {
    return prisma.gameroom.delete({
        where: {
            id: roomId
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

export const getGameRoomAndUsers = (userId: string) => {
    return prisma.gameroom.findFirst({
        where: {
            users: {
                some: { id: userId }
            }
        },
        include: {
            users: true
        }
    });
};

export const updateGameRoomScore = (roomId: string, score: number[]) => {
    return prisma.gameroom.update({
        where: {
            id: roomId,
        },
        data: {
            score,
        }
    });
}

export const GetActiveRooms = async() => {
	return prisma.gameroom.findMany({
		include: {
			users: true
		}
	})
}
