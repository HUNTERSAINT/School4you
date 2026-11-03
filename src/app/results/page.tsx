"use client";
import { useCallback, useEffect, useState, FormEvent } from "react";
import { ModuleShell } from "@/components/module-shell";
import { gradeForPercentage, round2 } from "@/lib/grades";

type ClassItem = { id: string; name: string };
type StudentItem = { id: string; firstName: string; lastName: string };
type SubjectItem = { id: string; name: string; maxCaScore: number | string; maxExamScore: number | string };
type TermItem = { id: string; name: string; isCurrent: boolean; academicYear: { name: string } };
type Summary = {
  school: { name: string; address: string | null; phone: string | null };
  term: { name: string; session: string };
  student: { name: string; admissionNo: string; className: string };
  subjects: { subject: string; ca: number; exam: number; total: number; maxTotal: number; percentage: number; grade: string | null; remark: string | null }[];
  total: number;
  maxTotal: number;
  average: number;
  classAverage: number;
  position: number | null;
  classSize: number;
  overallGrade: string | null;
  overallRemark: string;
  subjectsEntered: number;
  subjectsOffered: number;
  incomplete: boolean;
};

const select = "mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm";

export default function ResultsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [ca, setCa] = useState("0");
  const [exam, setExam] = useState("0");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    (async () => {
      const [classesRes, termsRes] = await Promise.all([fetch("/api/classes"), fetch("/api/terms")]);
      if (classesRes.status === 401) {
        location.href = "/login";
        return;
      }
      const classData = await classesRes.json();
      const termData = await termsRes.json();
      const termList: TermItem[] = termData.terms || [];
      setClasses(classData.classes || []);
      setTerms(termList);
      if (classData.classes?.[0]) setClassId(classData.classes[0].id);
      const current = termList.find((term) => term.isCurrent) ?? termList[0];
      if (current) setTermId(current.id);
    })();
  }, []);

  useEffect(() => {
    if (!classId) return;
    (async () => {
      const [studentsRes, subjectsRes] = await Promise.all([fetch("/api/students?classroomId=" + classId), fetch("/api/subjects?classroomId=" + classId)]);
      const studentData = await studentsRes.json();
      const subjectData = await subjectsRes.json();
      setStudents(studentData.students || []);
      setSubjects(subjectData.subjects || []);
    })();
  }, [classId]);

  const loadSummary = useCallback(async () => {
    if (!studentId || !termId) {
      setSummary(null);
      return;
    }
    const response = await fetch(`/api/results/summary?studentId=${studentId}&termId=${termId}`);
    setSummary(response.ok ? await response.json() : null);
  }, [studentId, termId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const subject = subjects.find((item) => item.id === subjectId);

  // Show marks that were already saved for this student, subject and term so they are edited, not overwritten blindly.
  useEffect(() => {
    if (!subject) return;
    const existing = summary?.subjects.find((row) => row.subject === subject.name);
    setCa(existing ? String(existing.ca) : "0");
    setExam(existing ? String(existing.exam) : "0");
  }, [subject, summary]);

  const maxCa = subject ? Number(subject.maxCaScore) : 30;
  const maxExam = subject ? Number(subject.maxExamScore) : 70;
  const total = Number(ca || 0) + Number(exam || 0);
  const percentage = maxCa + maxExam > 0 ? round2((total / (maxCa + maxExam)) * 100) : 0;

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, subjectId, termId, caScore: Number(ca), examScore: Number(exam) }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Could not save result.");
      return;
    }
    setMessage(`Saved: ${data.result.totalScore}/${data.maxTotal} · ${data.percentage}% · Grade ${data.result.grade}`);
    await loadSummary();
  }

  return (
    <ModuleShell title="Academic results">
      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 print:hidden">
          <h2 className="font-extrabold">Enter student marks</h2>
          <p className="mt-1 text-xs text-slate-400">Enter CA and exam scores. Total and grade are calculated automatically.</p>
          <div className="mt-5 space-y-4">
            <label className="block text-xs font-bold">Class
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId(""); setSubjectId(""); }} className={select}>
                <option value="">Select class</option>
                {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold">Student
              <select required value={studentId} onChange={(e) => setStudentId(e.target.value)} className={select}>
                <option value="">Select student</option>
                {students.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold">Academic term
              <select required value={termId} onChange={(e) => setTermId(e.target.value)} className={select}>
                <option value="">Select term</option>
                {terms.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.academicYear.name}{item.isCurrent ? " (current)" : ""}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold">Subject
              <select required value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={select}>
                <option value="">Select subject</option>
                {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold">CA score (max {maxCa})
                <input type="number" min="0" max={maxCa} step="0.5" value={ca} onChange={(e) => setCa(e.target.value)} className={select} />
              </label>
              <label className="text-xs font-bold">Exam score (max {maxExam})
                <input type="number" min="0" max={maxExam} step="0.5" value={exam} onChange={(e) => setExam(e.target.value)} className={select} />
              </label>
            </div>
            <div className="rounded-xl bg-[#f1f7fb] p-4">
              <p className="text-xs text-slate-500">Calculated total</p>
              <p className="mt-1 text-2xl font-extrabold text-[#176ba8]">{total} / {maxCa + maxExam}</p>
              <p className="text-xs text-slate-500">{percentage}% · Grade preview: {gradeForPercentage(percentage).grade}</p>
            </div>
            {message && <p className="text-xs font-semibold text-[#176ba8]">{message}</p>}
            <button disabled={!studentId || !subjectId || !termId} className="w-full rounded-xl bg-[#176ba8] p-3 text-sm font-bold text-white disabled:opacity-50">Save result</button>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
            <div>
              <h2 className="font-extrabold">Student report card</h2>
              <p className="mt-1 text-xs text-slate-400">Average, class average and position are based on percentages.</p>
            </div>
            {summary && <button onClick={() => window.print()} className="rounded-lg border px-3 py-2 text-xs font-bold">Print report</button>}
          </div>
          {summary ? (
            <div id="report-card" className="mt-5">
              <div className="border-b pb-4 text-center">
                <p className="text-xl font-extrabold">{summary.school.name}</p>
                {(summary.school.address || summary.school.phone) && <p className="mt-1 text-xs text-slate-500">{[summary.school.address, summary.school.phone].filter(Boolean).join(" · ")}</p>}
                <p className="mt-3 text-sm font-bold uppercase tracking-wide text-[#176ba8]">Report card · {summary.term.name} · {summary.term.session}</p>
              </div>
              <div className="border-b py-4">
                <p className="text-lg font-extrabold">{summary.student.name}</p>
                <p className="mt-1 text-xs text-slate-500">{summary.student.admissionNo} · {summary.student.className}</p>
              </div>
              {summary.incomplete && summary.subjectsEntered > 0 && (
                <p className="my-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 print:hidden">
                  Results are incomplete ({summary.subjectsEntered} of {summary.subjectsOffered} subjects entered). Class position is provisional until all marks are in.
                </p>
              )}
              <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total", value: `${summary.total}/${summary.maxTotal}` },
                  { label: "Average", value: summary.average.toFixed(1) + "%" },
                  { label: "Class average", value: summary.classAverage.toFixed(1) + "%" },
                  { label: "Position", value: summary.position ? `${summary.position}/${summary.classSize}` : "—" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] text-slate-400">{item.label}</p>
                    <p className="mt-1 text-lg font-extrabold">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                    <tr>{["Subject", "CA", "Exam", "Total", "%", "Grade", "Remark"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {summary.subjects.map((row) => (
                      <tr key={row.subject}>
                        <td className="p-3 font-semibold">{row.subject}</td>
                        <td className="p-3">{row.ca}</td>
                        <td className="p-3">{row.exam}</td>
                        <td className="p-3 font-bold">{row.total}/{row.maxTotal}</td>
                        <td className="p-3">{row.percentage}</td>
                        <td className="p-3 font-bold text-[#176ba8]">{row.grade}</td>
                        <td className="p-3 text-slate-500">{row.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 rounded-lg bg-[#eaf4fb] p-3 text-xs"><b>Overall:</b> {summary.overallGrade ? `Grade ${summary.overallGrade} · ` : ""}{summary.overallRemark}</p>
              <div className="mt-10 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
                <div className="border-t pt-2">Class teacher&apos;s comment and signature</div>
                <div className="border-t pt-2">Principal&apos;s signature and date</div>
              </div>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">Select a student and term to view their report card. Add subjects under School settings if none appear.</p>
          )}
        </section>
      </div>
      <style jsx global>{`@media print { body * { visibility:hidden; } #report-card, #report-card * { visibility:visible; } #report-card { position:absolute; left:0; top:0; width:100%; } }`}</style>
    </ModuleShell>
  );
}
