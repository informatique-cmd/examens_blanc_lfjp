import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BackToHomeButton, ExamDashboardPageLayout } from "../../exam-dashboard/components";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "../../../shared/components";
import { frenchOralCandidates202606 } from "../data/candidates";

const tabs = [
  { id: "alpha", label: "Ordre alphabétique" },
  { id: "cross", label: "Jour et heure" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function OralEafExam202606Page() {
  const [tab, setTab] = useState<TabId>("alpha");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return frenchOralCandidates202606;
    return frenchOralCandidates202606.filter((c) => c.candidate.toLowerCase().includes(normalized));
  }, [query]);

  const sorted = useMemo(() => {
    if (tab === "alpha") return [...filtered].sort((a, b) => a.candidate.localeCompare(b.candidate, "fr"));
    return [...filtered].sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.time.localeCompare(b.time) || a.candidate.localeCompare(b.candidate, "fr"));
  }, [filtered, tab]);

  return (
    <ExamDashboardPageLayout>
      <BackToHomeButton />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Oral de français — du 1er au 5 juin 2026</h1>
        <p className="mt-2 text-slate-600">
          Cette page présente la liste des élèves convoqués. Convocations : <a className="text-blue-600 underline" href="https://drive.google.com/file/d/1wftUYJlyCUIQ6rfuJ0pxydsmI5enJ0FK/view?usp=sharin" target="_blank" rel="noreferrer">ouvrir le document</a>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === item.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
              {item.label}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Rechercher un élève" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Élève</TableHeaderCell>
                <TableHeaderCell>Date de l'oral</TableHeaderCell>
                <TableHeaderCell>Heure</TableHeaderCell>
                <TableHeaderCell>Salle</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((c) => (
                <TableRow key={`${c.candidate}-${c.dateIso}-${c.time}`}>
                  <TableCell>{c.candidate}</TableCell>
                  <TableCell>{c.dateLabel}</TableCell>
                  <TableCell>{c.time}</TableCell>
                  <TableCell>{c.room}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </ExamDashboardPageLayout>
  );
}
