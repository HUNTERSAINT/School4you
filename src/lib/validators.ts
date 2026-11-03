import { z } from "zod";

export const onboardingSchema = z.object({
  schoolName: z.string().trim().min(2).max(120),
  schoolEmail: z.string().trim().email().optional().or(z.literal("")),
  schoolPhone: z.string().trim().max(30).optional(),
  schoolAddress: z.string().trim().max(250).optional(),
  adminName: z.string().trim().min(2).max(100),
  adminEmail: z.string().trim().email(),
  password: z.string().min(10).max(128),
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(128) });
export const studentSchema = z.object({
  admissionNo: z.string().trim().min(1).max(40),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional(),
  dateOfBirth: z.string().optional(),
  sex: z.enum(["Male", "Female", "Other"]).optional(),
  stateOfOrigin: z.string().trim().max(60).optional(),
  guardianName: z.string().trim().max(120).optional(),
  guardianPhone: z.string().trim().max(30).optional(),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  classroomId: z.string().min(1),
});
export const attendanceSchema = z.object({
  classroomId: z.string().min(1),
  date: z.string().date(),
  records: z.array(z.object({ studentId: z.string().min(1), status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]) })).min(1),
});
export const resultSchema = z.object({
  studentId: z.string().min(1), subjectId: z.string().min(1), termId: z.string().min(1),
  caScore: z.number().min(0), examScore: z.number().min(0),
});
export const feeInvoiceSchema = z.object({
  studentId: z.string().min(1), termId: z.string().min(1),
  description: z.string().trim().min(2).max(120),
  amountDue: z.number().positive().max(100000000),
});
