import prisma from "../prisma"

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
            title: title
        }
    })
}
