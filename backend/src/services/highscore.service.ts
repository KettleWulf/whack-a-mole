
import prisma from "../prisma"
import { NewHighscoreRecord } from "../types/highscore.types"


export const addToHighscores = async (data: NewHighscoreRecord) =>{
    return prisma.finishedGame.create({
        data
    })
}

export const GetHighscores = async ()=> {
    return prisma.finishedGame.findMany({
        take: 10,
        orderBy: {
            date: 'asc'
        }
    })
}
