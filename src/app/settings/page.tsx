"use client";
import { useCallback, useEffect, useState, FormEvent } from "react";
import { ModuleShell } from "@/components/module-shell";
import { SchoolSection } from "@/components/school-section";

type ClassItem = { id: string; name: string; _count?: { students: number } };
type Subject = { id: string; name: string; maxCaScore: number | string; maxExamScore: number | string };
type Term = { id: string; name: string; startsAt: string; endsAt: string; isCurrent: boolean; academicYear: { name: string } };
type Staff = { id: string; name: string; email: string; role: string; isActive: boolean; classroomIds: string[] };

async function call(path: string, method: string, body?: unknown) {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

const dateOnly = (value: string) => value.slice(0, 10);
const card = "rounded-2xl border bg-white p-5";
const field = "rounded-lg border border-slate-200 p-3 text-sm";
const primary = "rounded-lg bg-[#176ba8] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50";

export default function SettingsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notice, setNotice] = useState("");

  const [className, setClassName] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [maxCa, setMaxCa] = useState("30");
  const [maxExam, setMaxExam] = useState("70");
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", role: "TEACHER" });
  const [newTerm, setNewTerm] = useState({ academicYear: "", name: "", startsAt: "", endsAt: "", makeCurrent: true });
  const [editingTerm, setEditingTerm] = useState<string | null>(null);
  const [termForm, setTermForm] = useState({ name: "", startsAt: "", endsAt: "" });
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    const [classesRes, usersRes, termsRes] = await Promise.all([fetch("/api/classes"), fetch("/api/users"), fetch("/api/terms")]);
    if (classesRes.status === 401) {
      location.href = "/login";
      return;
    }
    const classData = await classesRes.json();
    setClasses(classData.classes || []);
    setClassId((current) => current || classData.classes?.[0]?.id || "");
    const termData = await termsRes.json();
    setTerms(termData.terms || []);
    if (usersRes.ok) {
      const userData = await usersRes.json();
      const list: Staff[] = userData.users || [];
      setStaff(list);
      setAssignments(Object.fromEntries(list.map((member) => [member.id, member.classroomIds])));
    } else {
      setNotice("Only school administrators can change these settings.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!classId) {
      setSubjects([]);
      return;
    }
    fetch("/api/subjects?classroomId=" + classId)
      .then((response) => response.json())
      .then((data) => setSubjects(data.subjects || []))
      .catch(() => setSubjects([]));
  }, [classId]);

  async function run(action: () => Promise<{ ok: boolean; data: { error?: string } }>, success: string, after?: () => void) {
    setNotice("");
    const result = await action();
    if (!result.ok) {
      setNotice(result.data.error || "Something went wrong. Please try again.");
      return;
    }
    setNotice(success);
    after?.();
    load();
  }

  const addClass = (event: FormEvent) => {
    event.preventDefault();
    run(() => call("/api/classes", "POST", { name: className }), "Class created.", () => setClassName(""));
  };

  const addSubject = (event: FormEvent) => {
    event.preventDefault();
    run(
      () => call("/api/subjects", "POST", { classroomId: classId, name: subjectName, maxCaScore: Number(maxCa), maxExamScore: Number(maxExam) }),
      "Subject added to class.",
      () => {
        setSubjectName("");
        fetch("/api/subjects?classroomId=" + classId)
          .then((response) => response.json())
          .then((data) => setSubjects(data.subjects || []));
      },
    );
  };

  const addTerm = (event: FormEvent) => {
    event.preventDefault();
    run(() => call("/api/terms", "POST", newTerm), "Term created.", () => setNewTerm({ academicYear: "", name: "", startsAt: "", endsAt: "", makeCurrent: true }));
  };

  const saveTerm = (id: string) => run(() => call("/api/terms/" + id, "PATCH", termForm), "Term updated.", () => setEditingTerm(null));
  const makeCurrent = (id: string) => run(() => call("/api/terms/" + id, "PATCH", { makeCurrent: true }), "Current term changed.");

  const addStaff = (event: FormEvent) => {
    event.preventDefault();
    run(() => call("/api/users", "POST", newStaff), "Staff account created. Share the login details privately.", () =>
      setNewStaff({ name: "", email: "", password: "", role: "TEACHER" }),
    );
  };

  const toggleActive = (member: Staff) => run(() => call("/api/users/" + member.id, "PATCH", { isActive: !member.isActive }), member.isActive ? "Account deactivated." : "Account activated.");

  const resetPassword = (member: Staff) => {
    const password = window.prompt(`Enter a new temporary password for ${member.name} (10–72 characters). They will be signed out everywhere.`);
    if (!password) return;
    run(() => call(`/api/users/${member.id}/reset-password`, "POST", { password }), "Password reset. Share the new password privately.");
  };

  const toggleClass = (userId: string, id: string) =>
    setAssignments((current) => {
      const selected = current[userId] || [];
      return { ...current, [userId]: selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id] };
    });
  const saveClasses = (userId: string) => run(() => call(`/api/users/${userId}/classes`, "PUT", { classroomIds: assignments[userId] || [] }), "Teacher classes saved.");

  return (
    <ModuleShell title="School settings">
      {notice && <p role="status" className="mb-5 rounded-lg bg-[#eaf4fb] p-3 text-xs font-semibold text-[#176ba8]">{notice}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <form onSubmit={addClass} className={card}>
          <h2 className="font-extrabold">Manage classes</h2>
          <p className="mt-1 text-xs text-slate-400">Create classes for student enrollment.</p>
          <div className="mt-4 flex gap-2">
            <input required value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. JSS 1" className={`min-w-0 flex-1 ${field}`} />
            <button className={primary}>Add</button>
          </div>
          <div className="mt-4 space-y-2">
            {classes.map((item) => (
              <div key={item.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-3 text-sm">
                <span className="font-semibold">{item.name}</span>
                <span className="text-xs text-slate-400">{item._count?.students || 0} students</span>
              </div>
            ))}
            {classes.length === 0 && <p className="py-4 text-xs text-slate-400">No classes created yet.</p>}
          </div>
        </form>

        <form onSubmit={addSubject} className={card}>
          <h2 className="font-extrabold">Manage subjects</h2>
          <p className="mt-1 text-xs text-slate-400">Subjects belong to a class. Grades are calculated as a percentage of the subject&apos;s total marks.</p>
          <label className="mt-4 block text-xs font-bold">Class
            <select required value={classId} onChange={(e) => setClassId(e.target.value)} className={`mt-2 w-full ${field}`}>
              <option value="">Select class</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="mt-4 block text-xs font-bold">Subject name
            <input required value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Mathematics" className={`mt-2 w-full ${field}`} />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-xs font-bold">CA maximum
              <input required type="number" min="1" max="100" value={maxCa} onChange={(e) => setMaxCa(e.target.value)} className={`mt-2 w-full ${field}`} />
            </label>
            <label className="text-xs font-bold">Exam maximum
              <input required type="number" min="1" max="100" value={maxExam} onChange={(e) => setMaxExam(e.target.value)} className={`mt-2 w-full ${field}`} />
            </label>
          </div>
          <button disabled={!classId} className={`mt-4 w-full ${primary}`}>Add subject</button>
          <div className="mt-4 space-y-2">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="font-semibold">{subject.name}</span>
                <span className="text-slate-400">CA {Number(subject.maxCaScore)} + Exam {Number(subject.maxExamScore)}</span>
              </div>
            ))}
          </div>
        </form>
      </div>

      <SchoolSection />

      <section className={`mt-5 ${card}`}>
        <h2 className="font-extrabold">Terms and sessions</h2>
        <p className="mt-1 text-xs text-slate-400">Fees, results and the overview use the current term. Switch it when a new term begins.</p>
        <div className="mt-4 space-y-2">
          {terms.map((term) => (
            <div key={term.id} className="rounded-xl bg-slate-50 p-3">
              {editingTerm === term.id ? (
                <div className="flex flex-wrap items-end gap-2">
                  <input value={termForm.name} onChange={(e) => setTermForm((v) => ({ ...v, name: e.target.value }))} className={`w-40 ${field}`} aria-label="Term name" />
                  <input type="date" value={termForm.startsAt} onChange={(e) => setTermForm((v) => ({ ...v, startsAt: e.target.value }))} className={field} aria-label="Start date" />
                  <input type="date" value={termForm.endsAt} onChange={(e) => setTermForm((v) => ({ ...v, endsAt: e.target.value }))} className={field} aria-label="End date" />
                  <button type="button" onClick={() => saveTerm(term.id)} className={primary}>Save</button>
                  <button type="button" onClick={() => setEditingTerm(null)} className="rounded-lg border px-4 py-2.5 text-xs font-bold">Cancel</button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{term.name} · {term.academicYear.name} {term.isCurrent && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Current</span>}</p>
                    <p className="text-xs text-slate-500">{dateOnly(term.startsAt)} to {dateOnly(term.endsAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    {!term.isCurrent && <button type="button" onClick={() => makeCurrent(term.id)} className="rounded-lg border px-3 py-2 text-[11px] font-bold text-[#176ba8]">Set as current</button>}
                    <button type="button" onClick={() => { setEditingTerm(term.id); setTermForm({ name: term.name, startsAt: dateOnly(term.startsAt), endsAt: dateOnly(term.endsAt) }); }} className="rounded-lg border px-3 py-2 text-[11px] font-bold">Edit</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {terms.length === 0 && <p className="py-4 text-xs text-slate-400">No terms yet.</p>}
        </div>
        <form onSubmit={addTerm} className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2 lg:grid-cols-5">
          <input required placeholder="Session, e.g. 2026/2027" value={newTerm.academicYear} onChange={(e) => setNewTerm((v) => ({ ...v, academicYear: e.target.value }))} className={field} />
          <input required placeholder="Term, e.g. Second Term" value={newTerm.name} onChange={(e) => setNewTerm((v) => ({ ...v, name: e.target.value }))} className={field} />
          <input required type="date" value={newTerm.startsAt} onChange={(e) => setNewTerm((v) => ({ ...v, startsAt: e.target.value }))} className={field} aria-label="Start date" />
          <input required type="date" value={newTerm.endsAt} onChange={(e) => setNewTerm((v) => ({ ...v, endsAt: e.target.value }))} className={field} aria-label="End date" />
          <button className={primary}>Add term</button>
          <label className="flex items-center gap-2 text-xs text-slate-500 sm:col-span-2 lg:col-span-5">
            <input type="checkbox" checked={newTerm.makeCurrent} onChange={(e) => setNewTerm((v) => ({ ...v, makeCurrent: e.target.checked }))} /> Make this the current term
          </label>
        </form>
      </section>

      <section className={`mt-5 ${card}`}>
        <h2 className="font-extrabold">Staff accounts</h2>
        <p className="mt-1 text-xs text-slate-400">Teachers can only enter attendance and results for the classes you assign to them. Bursars handle fees.</p>
        <form onSubmit={addStaff} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input required placeholder="Full name" value={newStaff.name} onChange={(e) => setNewStaff((v) => ({ ...v, name: e.target.value }))} className={field} />
          <input required type="email" placeholder="Email address" value={newStaff.email} onChange={(e) => setNewStaff((v) => ({ ...v, email: e.target.value }))} className={field} />
          <input required type="password" minLength={10} maxLength={72} placeholder="Temporary password (10+)" value={newStaff.password} onChange={(e) => setNewStaff((v) => ({ ...v, password: e.target.value }))} className={field} autoComplete="new-password" />
          <div className="flex gap-2">
            <select value={newStaff.role} onChange={(e) => setNewStaff((v) => ({ ...v, role: e.target.value }))} className={`min-w-0 flex-1 ${field}`}>
              <option value="TEACHER">Teacher</option>
              <option value="BURSAR">Bursar</option>
            </select>
            <button className={primary}>Create</button>
          </div>
        </form>
        <div className="mt-5 space-y-3">
          {staff.map((member) => (
            <div key={member.id} className="rounded-xl bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.email} · {member.role.replace("_", " ")}</p>
                </div>
                <div className="flex gap-2">
                  {(member.role === "TEACHER" || member.role === "BURSAR") && (
                    <button type="button" onClick={() => resetPassword(member)} className="rounded-lg border px-3 py-2 text-[11px] font-bold">Reset password</button>
                  )}
                  <button type="button" onClick={() => toggleActive(member)} className={`rounded-lg px-3 py-2 text-[11px] font-bold ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {member.isActive ? "Active · Deactivate" : "Inactive · Activate"}
                  </button>
                </div>
              </div>
              {member.role === "TEACHER" && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-[11px] font-bold text-slate-500">Classes this teacher handles</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {classes.map((item) => (
                      <label key={item.id} className="flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs">
                        <input type="checkbox" checked={(assignments[member.id] || []).includes(item.id)} onChange={() => toggleClass(member.id, item.id)} /> {item.name}
                      </label>
                    ))}
                    {classes.length === 0 && <span className="text-xs text-slate-400">Create classes first.</span>}
                  </div>
                  <button type="button" onClick={() => saveClasses(member.id)} className={`mt-3 ${primary}`}>Save classes</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </ModuleShell>
  );
}
