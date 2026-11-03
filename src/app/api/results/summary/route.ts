import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user=await requireUser(); if(isResponse(user)) return user;
  const studentId=request.nextUrl.searchParams.get("studentId"),termId=request.nextUrl.searchParams.get("termId");
  if(!studentId||!termId)return jsonError("Student and term are required.");
  const student=await prisma.student.findFirst({where:{id:studentId,schoolId:user.schoolId},include:{classroom:true}});
  if(!student)return jsonError("Student not found.",404);
  const all=await prisma.studentResult.findMany({where:{schoolId:user.schoolId,termId,student:{classroomId:student.classroomId}},include:{student:{select:{id:true,firstName:true,lastName:true,admissionNo:true}},subject:true}});
  const totals=new Map<string,{name:string;total:number;subjects:number}>();
  for(const row of all){const current=totals.get(row.studentId)||{name:`${row.student.firstName} ${row.student.lastName}`,total:0,subjects:0};current.total+=Number(row.totalScore);current.subjects++;totals.set(row.studentId,current);}
  const own=totals.get(studentId)||{name:`${student.firstName} ${student.lastName}`,total:0,subjects:0};
  const classTotals=[...totals.values()].map(v=>v.total);
  const classAverage=classTotals.length?classTotals.reduce((a,b)=>a+b,0)/classTotals.length:0;
  const position=1+classTotals.filter(v=>v>own.total).length;
  const resultRows=all.filter(r=>r.studentId===studentId).map(r=>({subject:r.subject.name,ca:Number(r.caScore),exam:Number(r.examScore),total:Number(r.totalScore),grade:r.grade,remark:r.remark}));
  return NextResponse.json({student:{name:own.name,admissionNo:student.admissionNo,className:student.classroom.name},subjects:resultRows,total:own.total,average:own.subjects?own.total/own.subjects:0,classAverage,position,classSize:totals.size,overallRemark:own.subjects?(own.total/own.subjects>=80?"Excellent":own.total/own.subjects>=70?"Very good":own.total/own.subjects>=60?"Good":own.total/own.subjects>=50?"Fair":own.total/own.subjects>=40?"Pass":"Needs improvement"):"No results entered"});
}
