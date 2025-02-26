import prisma from "../prisma"


export const findPendingGameroom = async () => {
    return prisma.gameroom.findFirst({
        select: {
            users: true,
            id: true
        },
    })
}

export const createGameroom = async (title: string) => {
    return prisma.gameroom.create({
        data: {
            title: title
        }
    })
}