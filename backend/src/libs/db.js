// import {PrismaClient} from "../generated/prisma/index.js"

// const globalForPrisma = globalThis;
// console.log("Connected to DB successfully.");

// export const db = globalForPrisma.prisma || new PrismaClient();

// if(process.env.NODE_ENV !== "prodcution") {
//     globalForPrisma.prisma = db
// }


import {PrismaClient} from "../generated/prisma/index.js";


const globalForPrisma = globalThis;


export const db = globalForPrisma.prisma || new PrismaClient();


if(process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

