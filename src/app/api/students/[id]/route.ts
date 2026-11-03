import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireUser,isResponse,jsonError} from "@/lib/http";

const updateSchema=z.object({
 firstName:z.string().trim().min(1).max(80).optional(),lastName:z.string().trim().min(1).max(80).optional(),
 middleName:z.string().trim().max(80).nullable().optional(),dateOfBirth:z.string().nullable().optional(),
 sex:z.enum(["Male","Female","Other"]).nullable().optional(),stateOfOrigin:z.string().trim().max(60).nullable().optional(),
 guardianName:z.string().trim().max(120).nullable().optional(),guardianPhone:z.string().trim().max(30).nullable().optional(),
 guardianEmail:z.string().email().nullable().optional(),classroomId:z.string().min(1).optional(),
});
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const user=await requireUser(["SCHOOL_ADMIN","SUPER_ADMIN"]);if(isResponse(user))return user;
 const {id}=await params;const parsed=updateSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError("Invalid student details.");
 const existing=await prisma.student.findFirst({where:{id,schoolId:user.schoolId}});if(!existing)return jsonError("Student not found.",404);
 const data=parsed.data;
 if(data.classroomId){const classroom=await prisma.classroom.findFirst({where:{id:data.classroomId,schoolId:user.schoolId}});if(!classroom)return jsonError("Class not found.",404);}
 const student=await prisma.student.update({where:{id},data:{...data,dateOfBirth:data.dateOfBirth===undefined?undefined:data.dateOfBirth?new Date(data.dateOfBirth):null}});
 await prisma.auditLog.create({data:{schoolId:user.schoolId,userId:user.id,action:"STUDENT_UPDATED",entity:"Student",entityId:id}});
 return NextResponse.json({student});
}
export async function DELETE(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const user=await requireUser(["SCHOOL_ADMIN","SUPER_ADMIN"]);if(isResponse(user))return user;
 const {id}=await params;const existing=await prisma.student.findFirst({where:{id,schoolId:user.schoolId}});if(!existing)return jsonError("Student not found.",404);
 await prisma.student.update({where:{id},data:{status:"INACTIVE"}});
 await prisma.auditLog.create({data:{schoolId:user.schoolId,userId:user.id,action:"STUDENT_ARCHIVED",entity:"Student",entityId:id}});
 return NextResponse.json({archived:true});
}
