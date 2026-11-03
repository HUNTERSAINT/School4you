import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser,isResponse,jsonError } from "@/lib/http";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 const user=await requireUser();if(isResponse(user))return user;
 const body=await request.json().catch(()=>null);const reference=typeof body?.reference==="string"?body.reference:"";
 if(!reference)return jsonError("Payment reference is required.");
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return jsonError("Payment gateway is not configured.",503);
 const payment=await prisma.payment.findFirst({where:{gatewayReference:reference,schoolId:user.schoolId}});
 if(!payment)return jsonError("Payment record not found.",404);
 if(payment.status==="SUCCESSFUL")return NextResponse.json({verified:true,status:"SUCCESSFUL"});
 const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`},cache:"no-store"});
 const result=await response.json().catch(()=>null);
 if(!response.ok||!result?.status||result?.data?.status!=="success")return jsonError("Paystack has not confirmed this payment.",409);
 if(Number(result.data.amount)!==Math.round(Number(payment.amount)*100)||result.data.currency!=="NGN")return jsonError("Verified payment amount does not match the invoice.",400);
 await prisma.$transaction(async tx=>{
  await tx.payment.update({where:{id:payment.id},data:{status:"SUCCESSFUL",gatewayPaymentId:String(result.data.id),paidAt:result.data.paid_at?new Date(result.data.paid_at):new Date(),verifiedAt:new Date()}});
  await tx.auditLog.create({data:{schoolId:user.schoolId,userId:user.id,action:"FEE_PAYMENT_VERIFIED",entity:"Payment",entityId:payment.id}});
 });
 return NextResponse.json({verified:true,status:"SUCCESSFUL"});
}
