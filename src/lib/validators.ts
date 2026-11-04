import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
// bcrypt only uses the first 72 bytes, so longer passwords would be silently truncated.
export const passwordSchema = z.string().min(10, "Password must be at least 10 characters.").max(72, "Password must be 72 characters or fewer.");
const optionalDate = z.string().date().optional().or(z.literal(""));

export const onboardingSchema = z.object({
  schoolName: z.string().trim().min(2).max(120),
  schoolEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  schoolPhone: z.string().trim().max(30).optional(),
  schoolAddress: z.string().trim().max(250).optional(),
  adminName: z.string().trim().min(2).max(100),
  adminEmail: email,
  password: passwordSchema,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service and Privacy Policy." }) }),
});
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema });
export const staffSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password: passwordSchema,
  role: z.enum(["TEACHER", "BURSAR"]),
});
export const studentSchema = z.object({
  admissionNo: z.string().trim().min(1).max(40),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional(),
  dateOfBirth: optionalDate,
  sex: z.enum(["Male", "Female", "Other"]).optional().or(z.literal("")),
  stateOfOrigin: z.string().trim().max(60).optional(),
  guardianName: z.string().trim().max(120).optional(),
  guardianPhone: z.string().trim().max(30).optional(),
  guardianEmail: z.string().trim().email().optional().or(z.literal("")),
  classroomId: z.string().min(1),
});
export const studentUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  middleName: z.string().trim().max(80).nullable().optional(),
  dateOfBirth: z.string().date().nullable().optional(),
  sex: z.enum(["Male", "Female", "Other"]).nullable().optional(),
  stateOfOrigin: z.string().trim().max(60).nullable().optional(),
  guardianName: z.string().trim().max(120).nullable().optional(),
  guardianPhone: z.string().trim().max(30).nullable().optional(),
  guardianEmail: z.string().trim().email().nullable().optional(),
  classroomId: z.string().min(1).optional(),
});
export const attendanceSchema = z.object({
  classroomId: z.string().min(1),
  date: z.string().date(),
  records: z
    .array(z.object({ studentId: z.string().min(1), status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]) }))
    .min(1)
    .max(500),
});
export const attendanceQuerySchema = z.object({
  date: z.string().date().optional(),
  classroomId: z.string().min(1).optional(),
});
export const resultSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  termId: z.string().min(1),
  caScore: z.number().min(0).max(1000),
  examScore: z.number().min(0).max(1000),
});
export const subjectSchema = z.object({
  classroomId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  maxCaScore: z.number().positive().max(100).default(30),
  maxExamScore: z.number().positive().max(100).default(70),
});
export const feeInvoiceSchema = z.object({
  studentId: z.string().min(1),
  termId: z.string().min(1),
  description: z.string().trim().min(2).max(120),
  amountDue: z.number().positive().max(100000000).multipleOf(0.01),
});
export const initializePaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive().max(100000000).multipleOf(0.01),
  email,
});

const academicYearName = z
  .string()
  .trim()
  .regex(/^\d{4}\/\d{4}$/, "Use the session format 2026/2027.")
  .refine((value) => {
    const [from, to] = value.split("/").map(Number);
    return to === from + 1;
  }, "The session must span consecutive years, for example 2026/2027.");

export const termCreateSchema = z
  .object({
    academicYear: academicYearName,
    name: z.string().trim().min(2).max(40),
    startsAt: z.string().date(),
    endsAt: z.string().date(),
    makeCurrent: z.boolean().optional(),
  })
  .refine((value) => value.endsAt > value.startsAt, { message: "The end date must be after the start date.", path: ["endsAt"] });

export const termUpdateSchema = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  startsAt: z.string().date().optional(),
  endsAt: z.string().date().optional(),
  makeCurrent: z.boolean().optional(),
});
