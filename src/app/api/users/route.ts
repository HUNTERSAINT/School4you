import {NextRequest,NextResponse} from "next/server";
import {hash} from "bcryptjs";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireUser,isResponse,jsonError} from "@/lib/http";
export async function GET(){
 const user=await requireUser(["SCHOOL_ADMIN","SUPER_ADMIN"]);if(isResponse(user))return user;
 const users=await prisma.user.findMany({where:{schoolId:user.schoolId},select:{id:true,name:true,email:true,role:true,isActive:true,createdAt:true},orderBy:{createdAt:"desc"}});
 return NextResponse.json({users});
}
export async function POST(request:NextRequest){
 const user=await requireUser(["SCHOOL_ADMIN","SUPER_ADMIN"]);if(isResponse(user))return user;
 const parsed=z.object({name:z.string().trim().min(2).max(100),email:z.string().email(),password:z.string().min(10).max(128),role:z.enum(["TEACHER","BURSAR"])}).safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return jsonError("Enter a name, valid email, password of at least 10 characters and staff role.");
 const exists=await prisma.user.findUnique({where:{email:parsed.data.email.toLowerCase()}});if(exists)return jsonError("An account with this email already exists.",409);
 const staff=await prisma.user.create({data:{schoolId:user.schoolId,name:parsed.data.name,email:parsed.data.email.toLowerCase(),passwordHash:await hash(parsed.data.password,12),role:parsed.data.role},select:{id:true,name:true,email:true,role:true,isActive:true}});
 await prisma.auditLog.create({data:{schoolId:user.schoolId,userId:user.id,action:"STAFF_ACCOUNT_CREATED",entity:"User",entityId:staff.id}});
 return NextResponse.json({user:staff},{status:201});
}
