import { Fragment, useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

import { BackToHomeButton, ExamDashboardPageLayout } from "../../exam-dashboard/components";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "../../../shared/components";
import { cn } from "../../../shared/lib";
import type { GrandOralCandidate } from "../data/candidates";
import { grandOralCandidates20260417 } from "../data/candidates";

const tabs = [
  { id: "overview", label: "Organisation complète" },
  { id: "jury", label: "Planning par jury" },
  { id: "room", label: "Planning par salle" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const fullDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(isoDate: string): string {
  return fullDateFormatter.format(new Date(`${isoDate}T00:00:00`));
}

function toCsvValue(value: string | number): string {
  const stringValue = String(value ?? "").replace(/\r?\n/g, " ");

  if (/[";\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
  const csvContent = rows.map((row) => row.map(toCsvValue).join(";")).join("\n");
  const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

interface PdfColumn {
  header: string;
  widthRatio: number;
}

function downloadPlanningPdf(filename: string, title: string, subtitle: string, columns: PdfColumn[], rows: string[][]): void {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const marginX = 36;
  const marginY = 52;
  const usableWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  const columnWidths = columns.map((column) => column.widthRatio * usableWidth);

  const drawHeader = (y: number): number => {
    const headerHeight = 24;
    let x = marginX;

    doc.setFillColor(15, 23, 42);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    columns.forEach((column, index) => {
      const width = columnWidths[index];
      doc.rect(x, y, width, headerHeight, "F");
      doc.text(column.header, x + 6, y + 16);
      x += width;
    });

    return y + headerHeight;
  };

  const drawRows = (startY: number) => {
    let y = startY;

    rows.forEach((row, rowIndex) => {
      const lineHeight = 12;
      const rowPadding = 6;
      const splitCells = row.map((value, index) => doc.splitTextToSize(value, Math.max(columnWidths[index] - 12, 30)));
      const maxLines = Math.max(...splitCells.map((cell) => cell.length || 1));
      const rowHeight = maxLines * lineHeight + rowPadding * 2;

      if (y + rowHeight > pageHeight - marginY) {
        doc.addPage();
        y = drawHeader(marginY);
      }

      let x = marginX;
      splitCells.forEach((cell, index) => {
        const width = columnWidths[index];
        doc.setFillColor(rowIndex % 2 === 0 ? 248 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 252 : 255);
        doc.rect(x, y, width, rowHeight, "F");
        doc.setDrawColor(226, 232, 240);
        doc.rect(x, y, width, rowHeight);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);

        let textY = y + rowPadding + lineHeight;
        cell.forEach((line) => {
          doc.text(line, x + 6, textY);
          textY += lineHeight;
        });
        x += width;
      });

      y += rowHeight;
    });
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(title, marginX, marginY - 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, marginX, marginY);

  const tableStartY = drawHeader(marginY + 16);
  drawRows(tableStartY);

  doc.save(filename);
}

function getJuryPair(candidate: GrandOralCandidate): string {
  return `${candidate.juryExpert} / ${candidate.juryNaif}`;
}

function toFilenameSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function sortCandidates(candidates: GrandOralCandidate[]): GrandOralCandidate[] {
  return [...candidates].sort((a, b) => {
    const convocationDiff = a.convocationTime.localeCompare(b.convocationTime);
    if (convocationDiff !== 0) {
      return convocationDiff;
    }
    return a.candidate.localeCompare(b.candidate);
  });
}

function groupBy<T>(items: T[], keyGetter: (item: T) => string): Array<{ key: string; items: T[] }> {
  const map = new Map<string, T[]>();

  items.forEach((item) => {
    const key = keyGetter(item);
    const previous = map.get(key);
    if (previous) {
      previous.push(item);
    } else {
      map.set(key, [item]);
    }
  });

  return Array.from(map.entries()).map(([key, groupedItems]) => ({ key, items: groupedItems }));
}

interface CandidateTableProps {
  candidates: GrandOralCandidate[];
  showRoom?: boolean;
  showJuryPair?: boolean;
}

function CandidateTable({ candidates, showRoom = false, showJuryPair = false }: CandidateTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table className="min-w-full divide-y divide-slate-200">
        <TableHead>
          <TableRow className="bg-slate-100">
            <TableHeaderCell>Nom du candidat</TableHeaderCell>
            <TableHeaderCell>Classe</TableHeaderCell>
            <TableHeaderCell>Convocation</TableHeaderCell>
            <TableHeaderCell>Passage</TableHeaderCell>
            <TableHeaderCell>Jury expert</TableHeaderCell>
            <TableHeaderCell>Jury naïf</TableHeaderCell>
            {showJuryPair ? <TableHeaderCell>Binôme</TableHeaderCell> : null}
            {showRoom ? <TableHeaderCell>Salle</TableHeaderCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={`${candidate.candidate}-${candidate.convocationTime}-${candidate.room}`}>
              <TableCell className="font-medium text-slate-900">{candidate.candidate}</TableCell>
              <TableCell>{candidate.className}</TableCell>
              <TableCell>{candidate.convocationTime}</TableCell>
              <TableCell>{candidate.examTime}</TableCell>
              <TableCell>{candidate.juryExpert}</TableCell>
              <TableCell>{candidate.juryNaif}</TableCell>
              {showJuryPair ? <TableCell>{getJuryPair(candidate)}</TableCell> : null}
              {showRoom ? <TableCell>Salle {candidate.room}</TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function GrandOralExam20260417Page() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const sortedCandidates = useMemo(() => sortCandidates(grandOralCandidates20260417), []);
  const candidatesByJuryPair = useMemo(() => groupBy(sortedCandidates, getJuryPair), [sortedCandidates]);
  const candidatesByRoom = useMemo(() => groupBy(sortedCandidates, (candidate) => candidate.room), [sortedCandidates]);

  const uniqueRooms = new Set(sortedCandidates.map((candidate) => candidate.room)).size;
  const uniqueJuryPairs = candidatesByJuryPair.length;

  return (
    <ExamDashboardPageLayout action={<BackToHomeButton />}>
      <div className="space-y-10">
        <header className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Grand Oral Blanc — Terminale
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Organisation du Grand Oral Blanc — vendredi 17 avril 2026</h1>
            <p className="max-w-3xl text-lg text-slate-600">
              Planning détaillé des convocations avec jurys expert/naïf, horaires de passage et salles.
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">Date</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{formatDate("2026-04-17")}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">Candidats</dt>
              <dd className="mt-1 text-3xl font-bold text-slate-900">{sortedCandidates.length}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">Jurys / salles</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{uniqueJuryPairs} binômes · {uniqueRooms} salles</dd>
            </div>
          </dl>
        </header>

        <nav className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm" aria-label="Navigation des onglets">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {activeTab === "overview" ? <CandidateTable candidates={sortedCandidates} showRoom /> : null}

        {activeTab === "jury" ? (
          <section className="space-y-8">
            {candidatesByJuryPair.map(({ key, items }) => {
              const rows = items.map((candidate) => [
                candidate.candidate,
                candidate.className,
                candidate.convocationTime,
                candidate.examTime,
                candidate.juryExpert,
                candidate.juryNaif,
                `Salle ${candidate.room}`,
              ]);

              return (
                <div key={key} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Binôme de jury</p>
                      <h2 className="text-2xl font-bold text-slate-900">{key}</h2>
                      <p className="text-sm text-slate-600">{items.length} candidats</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => downloadCsv(`planning-jury-${toFilenameSlug(key)}.csv`, [["Nom", "Classe", "Convocation", "Passage", "Jury expert", "Jury naïf", "Salle"], ...rows])}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        CSV
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadPlanningPdf(
                            `planning-jury-${toFilenameSlug(key)}.pdf`,
                            `Grand Oral Blanc — Jury ${key}`,
                            `Vendredi 17 avril 2026 · ${items.length} candidats`,
                            [
                              { header: "Nom", widthRatio: 0.31 },
                              { header: "Classe", widthRatio: 0.1 },
                              { header: "Convocation", widthRatio: 0.1 },
                              { header: "Passage", widthRatio: 0.1 },
                              { header: "Jury expert", widthRatio: 0.13 },
                              { header: "Jury naïf", widthRatio: 0.13 },
                              { header: "Salle", widthRatio: 0.13 },
                            ],
                            rows,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        PDF
                      </button>
                    </div>
                  </header>
                  <CandidateTable candidates={items} showRoom />
                </div>
              );
            })}
          </section>
        ) : null}

        {activeTab === "room" ? (
          <section className="space-y-8">
            {candidatesByRoom.map(({ key, items }) => {
              const rows = items.map((candidate) => [
                candidate.candidate,
                candidate.className,
                candidate.convocationTime,
                candidate.examTime,
                candidate.juryExpert,
                candidate.juryNaif,
              ]);

              return (
                <div key={key} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Salle</p>
                      <h2 className="text-2xl font-bold text-slate-900">Salle {key}</h2>
                      <p className="text-sm text-slate-600">{items.length} candidats</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => downloadCsv(`planning-salle-${key}.csv`, [["Nom", "Classe", "Convocation", "Passage", "Jury expert", "Jury naïf"], ...rows])}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        CSV
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadPlanningPdf(
                            `planning-salle-${key}.pdf`,
                            `Grand Oral Blanc — Salle ${key}`,
                            `Vendredi 17 avril 2026 · ${items.length} candidats`,
                            [
                              { header: "Nom", widthRatio: 0.36 },
                              { header: "Classe", widthRatio: 0.1 },
                              { header: "Convocation", widthRatio: 0.12 },
                              { header: "Passage", widthRatio: 0.12 },
                              { header: "Jury expert", widthRatio: 0.15 },
                              { header: "Jury naïf", widthRatio: 0.15 },
                            ],
                            rows,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        PDF
                      </button>
                    </div>
                  </header>
                  <div className="space-y-6">
                    {groupBy(items, (candidate) => getJuryPair(candidate)).map(({ key: pairKey, items: pairItems }) => (
                      <Fragment key={pairKey}>
                        <h3 className="text-lg font-semibold text-slate-900">{pairKey}</h3>
                        <CandidateTable candidates={pairItems} />
                      </Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}
      </div>
    </ExamDashboardPageLayout>
  );
}
