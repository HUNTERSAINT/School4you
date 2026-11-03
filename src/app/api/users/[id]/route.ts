import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireUser,isResponse,jsonError} from "@/lib/http";
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const user=await requireUser(["SCHOOL_ADMIN","SUPER_ADMIN"]);if(isResponse(user))return user;
 const {id}=await params;const parsed=z.object({isActive:z.boolean()}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError("Invalid account status.");
 const target=await prisma.user.findFirst({where:{id,schoolId:user.schoolId}});if(!target)return jsonError("Staff account not found.",404);
 if(target.id===user.id&&!parsed.data.isActive)return jsonError("You cannot deactivate your own account.");
 const updated=await prisma.user.update({where:{id},data:{isActive:parsed.data.isActive},select:{id:true,name:true,email:true,role:true,isActive:true}});
 await prisma.auditLog.create({data:{schoolId:user.schoolId,userId:user.id,action:parsed.data.isActive?"STAFF_ACTIVATED":"STAFF_DEACTIVATED",entity:"User",entityId:id}});
 return NextResponse.json({user:updated});
}
