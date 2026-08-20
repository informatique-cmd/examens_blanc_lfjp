import { Fragment, useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

import { ExamDashboardPageLayout, BackToHomeButton } from "../../exam-dashboard/components";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "../../../shared/components";
import { cn } from "../../../shared/lib";
import type { OralCandidate } from "../data/candidates";
import { oralCandidates202604 } from "../data/candidates";

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

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function toDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00`);
}

function formatFullDate(isoDate: string): string {
  return fullDateFormatter.format(toDate(isoDate));
}

function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(toDate(isoDate));
}

function formatRoomLabel(room: string): string {
  return `Salle ${room}`;
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

interface DownloadPlanningPdfOptions {
  filename: string;
  title: string;
  subtitle: string;
  columns: PdfColumn[];
  rows: Array<Array<string>>;
}

function downloadPlanningPdf({ filename, title, subtitle, columns, rows }: DownloadPlanningPdfOptions): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const marginY = 64;
  const usableWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  const columnWidths = columns.map((column) => column.widthRatio * usableWidth);

  const drawHeader = (y: number): number => {
    const headerHeight = 28;
    let x = marginX;

    doc.setFillColor(15, 23, 42);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    columns.forEach((column, index) => {
      const width = columnWidths[index];
      doc.rect(x, y, width, headerHeight, "F");
      doc.text(column.header, x + 8, y + headerHeight - 10);
      x += width;
    });

    return y + headerHeight;
  };

  const renderRows = (startY: number): void => {
    let y = startY;
    const lineHeight = 14;
    const rowPadding = 8;

    rows.forEach((row, rowIndex) => {
      const splitCells = row.map((value, index) =>
        doc.splitTextToSize(value, Math.max(columnWidths[index] - rowPadding * 2, 32)),
      );

      const maxLines = Math.max(...splitCells.map((cell) => (cell.length === 0 ? 1 : cell.length)));
      const contentHeight = maxLines * lineHeight;
      const rowHeight = contentHeight + rowPadding * 2;

      if (y + rowHeight > pageHeight - marginY) {
        doc.addPage();
        y = drawHeader(marginY);
      }

      let x = marginX;

      doc.setDrawColor(226, 232, 240);

      splitCells.forEach((cell, index) => {
        const width = columnWidths[index];
        if (rowIndex % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(x, y, width, rowHeight, "F");
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(x, y, width, rowHeight, "F");
        }
        doc.rect(x, y, width, rowHeight);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        let textY = y + rowPadding + lineHeight;
        cell.forEach((line) => {
          doc.text(line, x + rowPadding, textY);
          textY += lineHeight;
        });

        x += width;
      });

      y += rowHeight;
    });
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(title, marginX, marginY - 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  const subtitleLines = doc.splitTextToSize(subtitle, usableWidth);
  subtitleLines.forEach((line, index) => {
    doc.text(line, marginX, marginY + index * 16);
  });

  const tableStartY = drawHeader(marginY + subtitleLines.length * 16 + 24);
  renderRows(tableStartY);

  doc.save(filename);
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

function getGroupedCandidates(
  candidates: OralCandidate[],
  keyGetter: (candidate: OralCandidate) => string,
): Array<{ key: string; candidates: OralCandidate[] }> {
  const map = new Map<string, OralCandidate[]>();

  candidates.forEach((candidate) => {
    const key = keyGetter(candidate);
    const existing = map.get(key);

    if (existing) {
      existing.push(candidate);
    } else {
      map.set(key, [candidate]);
    }
  });

  return Array.from(map.entries()).map(([key, groupedCandidates]) => ({
    key,
    candidates: groupedCandidates,
  }));
}

function sortCandidates(candidates: OralCandidate[]): OralCandidate[] {
  return [...candidates].sort((a, b) => {
    const dateDiff = toDate(a.date).getTime() - toDate(b.date).getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }

    const convocationDiff = a.convocationTime.localeCompare(b.convocationTime);
    if (convocationDiff !== 0) {
      return convocationDiff;
    }

    return a.candidate.localeCompare(b.candidate);
  });
}

interface CandidateTableProps {
  candidates: OralCandidate[];
  showJury?: boolean;
  showRoom?: boolean;
}

function CandidateTable({ candidates, showJury = false, showRoom = false }: CandidateTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table className="min-w-full divide-y divide-slate-200">
        <TableHead>
          <TableRow className="bg-slate-100">
            <TableHeaderCell>Nom du candidat</TableHeaderCell>
            <TableHeaderCell>Classe</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Convocation</TableHeaderCell>
            <TableHeaderCell>Passage</TableHeaderCell>
            {showJury ? <TableHeaderCell>Jury</TableHeaderCell> : null}
            {showRoom ? <TableHeaderCell>Salle</TableHeaderCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={`${candidate.candidate}-${candidate.date}-${candidate.convocationTime}`}>
              <TableCell className="font-medium text-slate-900">{candidate.candidate}</TableCell>
              <TableCell>{candidate.className}</TableCell>
              <TableCell>{formatShortDate(candidate.date)}</TableCell>
              <TableCell>{candidate.convocationTime}</TableCell>
              <TableCell>{candidate.examTime}</TableCell>
              {showJury ? <TableCell>{candidate.jury}</TableCell> : null}
              {showRoom ? <TableCell>{formatRoomLabel(candidate.room)}</TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function OralEafExam202604Page() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const sortedCandidates = useMemo(() => sortCandidates(oralCandidates202604), []);

  const candidatesByJury = useMemo(
    () =>
      getGroupedCandidates(sortedCandidates, (candidate) => candidate.jury).map((group) => ({
        ...group,
        candidates: sortCandidates(group.candidates),
      })),
    [sortedCandidates],
  );

  const candidatesByRoom = useMemo(
    () =>
      getGroupedCandidates(sortedCandidates, (candidate) => candidate.room).map((group) => ({
        ...group,
        candidates: sortCandidates(group.candidates),
      })),
    [sortedCandidates],
  );

  const candidatesByDate = useMemo(
    () =>
      getGroupedCandidates(sortedCandidates, (candidate) => candidate.date).map((group) => ({
        ...group,
        candidates: sortCandidates(group.candidates),
      })),
    [sortedCandidates],
  );

  const uniqueJuries = useMemo(
    () => Array.from(new Set(sortedCandidates.map((candidate) => candidate.jury))),
    [sortedCandidates],
  );

  const uniqueRooms = useMemo(
    () => Array.from(new Set(sortedCandidates.map((candidate) => candidate.room))),
    [sortedCandidates],
  );

  const uniqueDates = useMemo(
    () => Array.from(new Set(sortedCandidates.map((candidate) => candidate.date))),
    [sortedCandidates],
  );

  const totalCandidates = sortedCandidates.length;

  const jurySummaries = useMemo(
    () =>
      candidatesByJury.map(({ key, candidates }) => ({
        jury: key,
        room: candidates[0]?.room ?? "",
        dates: Array.from(new Set(candidates.map((candidate) => candidate.date))).map((date) => formatFullDate(date)),
        count: candidates.length,
      })),
    [candidatesByJury],
  );

  const buildJuryPlanningRows = (candidates: OralCandidate[]) =>
    candidates.map((candidate) => [
      candidate.candidate,
      candidate.className,
      formatShortDate(candidate.date),
      candidate.convocationTime,
      candidate.examTime,
      formatRoomLabel(candidate.room),
    ]);

  const buildRoomPlanningRows = (candidates: OralCandidate[]) =>
    candidates.map((candidate) => [
      candidate.candidate,
      candidate.className,
      formatShortDate(candidate.date),
      candidate.convocationTime,
      candidate.examTime,
      candidate.jury,
    ]);

  const handleDownloadJuryPlanningCsv = (jury: string, candidates: OralCandidate[]) => {
    const header = ["Nom du candidat", "Classe", "Date", "Convocation", "Passage", "Salle"];
    const rows = buildJuryPlanningRows(candidates);

    downloadCsv(`planning-jury-${toFilenameSlug(jury)}.csv`, [header, ...rows]);
  };

  const handleDownloadJuryPlanningPdf = (jury: string, candidates: OralCandidate[]) => {
    const rows = buildJuryPlanningRows(candidates);

    downloadPlanningPdf({
      filename: `planning-jury-${toFilenameSlug(jury)}.pdf`,
      title: `Planning jury ${jury}`,
      subtitle: `${formatRoomLabel(candidates[0]?.room ?? "")} – ${candidates.length} candidats`,
      columns: [
        { header: "Nom du candidat", widthRatio: 0.28 },
        { header: "Classe", widthRatio: 0.12 },
        { header: "Date", widthRatio: 0.14 },
        { header: "Convocation", widthRatio: 0.12 },
        { header: "Passage", widthRatio: 0.12 },
        { header: "Salle", widthRatio: 0.22 },
      ],
      rows: rows.map((row) => row.map((value) => String(value ?? ""))),
    });
  };

  const handleDownloadRoomPlanningCsv = (room: string, candidates: OralCandidate[]) => {
    const header = ["Nom du candidat", "Classe", "Date", "Convocation", "Passage", "Jury"];
    const rows = buildRoomPlanningRows(candidates);

    downloadCsv(`planning-salle-${toFilenameSlug(room)}.csv`, [header, ...rows]);
  };

  const handleDownloadRoomPlanningPdf = (room: string, candidates: OralCandidate[]) => {
    const rows = buildRoomPlanningRows(candidates);

    downloadPlanningPdf({
      filename: `planning-salle-${toFilenameSlug(room)}.pdf`,
      title: `Planning salle ${formatRoomLabel(room)}`,
      subtitle: `Jury ${candidates[0]?.jury ?? ""} – ${candidates.length} candidats`,
      columns: [
        { header: "Nom du candidat", widthRatio: 0.28 },
        { header: "Classe", widthRatio: 0.12 },
        { header: "Date", widthRatio: 0.14 },
        { header: "Convocation", widthRatio: 0.12 },
        { header: "Passage", widthRatio: 0.12 },
        { header: "Jury", widthRatio: 0.22 },
      ],
      rows: rows.map((row) => row.map((value) => String(value ?? ""))),
    });
  };

  return (
    <ExamDashboardPageLayout action={<BackToHomeButton />}>
      <div className="space-y-10">
        <header className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Oraux blancs EAF 1<sup>re</sup>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Organisation des oraux blancs EAF – 13, 14 et 15 avril 2026
            </h1>
            <p className="max-w-3xl text-lg text-slate-600">
              Retrouvez ici l'ensemble des informations pour coordonner les jurys, accueillir les candidats et suivre le
              déroulé des oraux blancs de français 1<sup>re</sup> sur les trois journées d'épreuve.
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidats convoqués</dt>
              <dd className="mt-2 text-2xl font-bold text-slate-900">{totalCandidates}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jury mobilisés</dt>
              <dd className="mt-2 text-2xl font-bold text-slate-900">{uniqueJuries.length}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Salles ouvertes</dt>
              <dd className="mt-2 text-2xl font-bold text-slate-900">{uniqueRooms.length}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jours d'épreuve</dt>
              <dd className="mt-2 text-2xl font-bold text-slate-900">{uniqueDates.length}</dd>
            </div>
          </dl>
        </header>

        <nav className="flex justify-center">
          <div className="inline-flex gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-semibold transition-all",
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === "overview" ? (
          <section className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900">Organisation générale</h2>
                <p className="text-slate-600">
                  Les oraux blancs se tiennent sur trois journées consécutives avec un premier passage dès 8&nbsp;h. Chaque
                  candidat se présente directement dans la salle de son jury 30 minutes avant son horaire de convocation :
                  aucune préparation de salle n'est requise et aucun dossier individuel n'est à apporter.
                </p>
                <ul className="list-disc space-y-2 pl-5 text-slate-600">
                  <li>
                    Trois jurys distincts — Mme&nbsp;FALL, Mme&nbsp;MOURANDIOP et M.&nbsp;BARTOU — chacun dans une salle dédiée.
                  </li>
                  <li>
                    La préparation de 30&nbsp;minutes s'effectue dans la salle, devant le jury, pendant que le candidat
                    précédent termine son oral de 30&nbsp;minutes (dont 10&nbsp;minutes d'entretien).
                  </li>
                  <li>Chaque jury accueille au maximum 10 candidats par jour.</li>
                  <li>
                    Les oraux s'étalent du 13 au 15&nbsp;avril et la convocation fait foi pour justifier l'absence en cours
                    des élèves concernés.
                  </li>
                  <li>
                    Une feuille d'émargement est à faire signer à l'issue de chaque passage pour attester la présence du
                    candidat.
                  </li>
                  <li>
                    Les emplois du temps des personnels sont banalisés pour la session ; ceux des élèves restent maintenus en
                    dehors de leur convocation.
                  </li>
                </ul>
              </div>

              <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Points de coordination</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li>
                    <span className="font-semibold text-slate-900">Référente organisation :</span> Mme Brouillat, CPE.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Surveillance des couloirs :</span> non prévue.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Documents d'évaluation :</span> aucun document à
                    distribuer pour cette session.
                  </li>
                </ul>
                <a
                  href="https://drive.google.com/drive/folders/1AtdSnOHxFaKLK0vf8Wy4nSTAZXntlypQ?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  Accéder aux convocations des élèves
                </a>
              </aside>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {jurySummaries.map((summary) => (
                <div key={summary.jury} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Jury</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{summary.jury}</h3>
                  <p className="mt-2 text-sm text-slate-600">{formatRoomLabel(summary.room)} – {summary.count} candidats</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    {summary.dates.map((date) => (
                      <li key={date}>{date}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">Flux journalier</h2>
              <p className="text-slate-600">
                Utilisez ce découpage par journée pour organiser les pauses des jurys, vérifier les documents des candidats et
                anticiper les temps de rotation entre les salles.
              </p>
              <div className="space-y-6">
                {candidatesByDate.map(({ key, candidates }) => (
                  <div key={key} className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">{formatFullDate(key)}</h3>
                    <CandidateTable candidates={candidates} showJury showRoom />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "jury" ? (
          <section className="space-y-8">
            {candidatesByJury.map(({ key, candidates }) => (
              <div key={key} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Jury</p>
                    <h2 className="text-2xl font-bold text-slate-900">{key}</h2>
                    <p className="text-sm text-slate-600">
                      {formatRoomLabel(candidates[0]?.room ?? "")} – {candidates.length} candidats
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadJuryPlanningCsv(key, candidates)}
                      className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Download aria-hidden="true" className="h-4 w-4" />
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadJuryPlanningPdf(key, candidates)}
                      className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <FileText aria-hidden="true" className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                </header>
                <div className="space-y-6">
                  {getGroupedCandidates(candidates, (candidate) => candidate.date).map(({ key: date, candidates: perDate }) => (
                    <Fragment key={date}>
                      <h3 className="text-lg font-semibold text-slate-900">{formatFullDate(date)}</h3>
                      <CandidateTable candidates={perDate} showRoom />
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {activeTab === "room" ? (
          <section className="space-y-8">
            {candidatesByRoom.map(({ key, candidates }) => (
              <div key={key} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Salle</p>
                    <h2 className="text-2xl font-bold text-slate-900">{formatRoomLabel(key)}</h2>
                    <p className="text-sm text-slate-600">
                      Jury {candidates[0]?.jury ?? ""} – {candidates.length} candidats
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadRoomPlanningCsv(key, candidates)}
                      className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Download aria-hidden="true" className="h-4 w-4" />
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadRoomPlanningPdf(key, candidates)}
                      className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <FileText aria-hidden="true" className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                </header>
                <div className="space-y-6">
                  {getGroupedCandidates(candidates, (candidate) => candidate.date).map(({ key: date, candidates: perDate }) => (
                    <Fragment key={date}>
                      <h3 className="text-lg font-semibold text-slate-900">{formatFullDate(date)}</h3>
                      <CandidateTable candidates={perDate} showJury />
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </ExamDashboardPageLayout>
  );
}
