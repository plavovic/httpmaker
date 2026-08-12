import "server-only";
import { prisma } from "@/lib/prisma";

export const listUserSessions=(userId:string)=>prisma.session.findMany({where:{userId,expires:{gt:new Date()}},orderBy:[{updatedAt:"desc"},{createdAt:"desc"}],take:50,select:{id:true,createdAt:true,updatedAt:true,expires:true}});
export const findSessionIdByToken=(sessionToken:string,userId:string)=>prisma.session.findFirst({where:{sessionToken,userId,expires:{gt:new Date()}},select:{id:true}});
export const revokeOwnedSession=(id:string,userId:string)=>prisma.session.deleteMany({where:{id,userId}});
export const revokeOtherSessions=(userId:string,currentId:string)=>prisma.session.deleteMany({where:{userId,id:{not:currentId}}});
