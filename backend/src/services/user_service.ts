import { User } from "@prisma/client"
import prisma from "../prisma"


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