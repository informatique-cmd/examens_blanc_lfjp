import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  FileBadge,
  FileText,
  Printer,
  Search,
  User,
  UserX,
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const STAMP_IMAGE_SRC = "https://i.imgur.com/77DP4od.png";
const HTML2CANVAS_OPTIONS = {
  scale: 1.5,
  backgroundColor: "#ffffff",
  useCORS: true,
} as const;

import type { ExamColumn } from "../data/scheduleData";
import { scheduleData } from "../data/scheduleData";

type ExamType = "bac" | "dnb" | "recap";
interface ShiftAssignment {
  room: string;
  col: ExamColumn;
}
interface ConvocationSheetProps {
  supervisor: string;
  bacShifts: ShiftAssignment[];
  dnbShifts: ShiftAssignment[];
  showSignatureBlock?: boolean;
}

function getArrivalTime(timeStr: string) {
  const start = timeStr.split("-")[0]?.trim();
  if (start === "7h30") return "7h00";
  if (start === "14h") return "13h30";

  const match = start?.match(/(\d+)h(\d*)/);
  if (match) {
    const hours = Number.parseInt(match[1], 10);
    const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
    const totalMinutes = hours * 60 + minutes - 30;
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    return `${newHours}h${newMinutes === 0 ? "00" : newMinutes.toString().padStart(2, "0")}`;
  }

  return "30 min avant";
}

function getSupervisorSortKey(name: string) {
  return name
    .trim()
    .replace(/^(?:M(?:me|lle)?\.?|Monsieur|Madame)\s+/i, "")
    .toLocaleLowerCase("fr");
}

function getUniqueSupervisors() {
  const supervisors = new Set<string>();
  ["bac", "dnb"].forEach((exam) => {
    scheduleData[exam as ExamType].rows.forEach((row) => {
      row.shifts.forEach((shift) => {
        shift.forEach((person) => {
          if (person) supervisors.add(person);
        });
      });
    });
  });

  return [...supervisors].sort((a, b) =>
    getSupervisorSortKey(a).localeCompare(getSupervisorSortKey(b), "fr", { sensitivity: "base" }),
  );
}

function buildSupervisorShifts(supervisor: string, exam: ExamType): ShiftAssignment[] {
  const shifts: ShiftAssignment[] = [];
  const dataset = scheduleData[exam];

  dataset.rows.forEach((row) => {
    row.shifts.forEach((shift, index) => {
      if (shift.includes(supervisor)) {
        shifts.push({ room: row.room, col: dataset.columns[index] });
      }
    });
  });

  shifts.sort((a, b) => dataset.columns.indexOf(a.col) - dataset.columns.indexOf(b.col));
  return shifts;
}

function ConvocationSection({ title, shifts, sectionClass }: { title: string; shifts: ShiftAssignment[]; sectionClass: string }) {
  if (shifts.length === 0) return null;

  return (
    <section className="space-y-3">
      <h4 className={`text-sm font-semibold uppercase tracking-wide ${sectionClass}`}>{title}</h4>
      <div className="space-y-2">
        {shifts.map((shift) => (
          <article
            key={`${title}-${shift.col.date}-${shift.col.subject}-${shift.room}`}
            className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3"
          >
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-4">
              <p>
                <span className="font-semibold text-slate-900">Date :</span> {shift.col.date}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Épreuve :</span> {shift.col.subject}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Salle :</span> {shift.room}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Horaires :</span> {shift.col.time}
              </p>
            </div>
            <p className="mt-2 text-sm font-semibold text-rose-700">
              Heure de présence : {getArrivalTime(shift.col.time)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConvocationSheet({ supervisor, bacShifts, dnbShifts, showSignatureBlock = true }: ConvocationSheetProps) {
  return (
    <div className="convocation-sheet mx-auto space-y-6 rounded-xl border border-gray-200 bg-white p-6 text-slate-700 shadow-sm">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-bold text-slate-900">Convocation - Surveillance des épreuves</h3>
        <p className="mt-1 text-sm text-slate-500">Session de Juin 2026</p>
      </div>

      <div className="space-y-3 text-sm">
        <p>
          Surveillant(e) : <span className="font-semibold text-slate-900">{supervisor}</span>
        </p>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 leading-relaxed text-amber-950">
          Vous êtes convoqué(e) pour assurer la surveillance des épreuves selon le calendrier ci-dessous.
          <br />
          <span className="font-semibold">RAPPEL IMPORTANT :</span> Présence au secrétariat des examens{" "}
          <span className="font-semibold underline">30 minutes avant</span> le début de l&apos;épreuve.
        </p>
      </div>

      <ConvocationSection title="Épreuves du Baccalauréat" shifts={bacShifts} sectionClass="text-blue-800" />
      <ConvocationSection title="Épreuves du DNB" shifts={dnbShifts} sectionClass="text-emerald-800" />

      {showSignatureBlock ? (
        <div className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-4 text-xs text-slate-500 sm:grid-cols-2">
          <div className="space-y-2 text-center">
            <p>Le Chef d&apos;Établissement</p>
            <img
              src={STAMP_IMAGE_SRC}
              alt="Cachet du Proviseur"
              className="mx-auto h-[88px] max-w-[200px] object-contain"
            />
          </div>
          <div className="space-y-2 text-center">
            <p>
              Signature du Surveillant(e)
              <br />
              (Précédée de la mention &quot;Lu et approuvé&quot;)
            </p>
            <div className="mx-auto mt-8 w-[230px] border-b border-slate-400" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getSafeFilename(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildPrintDocument(title: string, content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  body { font-family: Inter, Arial, sans-serif; background: white; color: #1f2937; padding: 24px; }
  .print-image { width: 100%; height: auto; display: block; }
  @media print { @page { margin: 1.5cm; } body { padding: 0; } }
</style>
</head>
<body>
${content}
<script>
setTimeout(() => { window.print(); window.close(); }, 500);
</script>
</body>
</html>`;
}

export default function BacDnbSurveillancePage() {
  const [currentExam, setCurrentExam] = useState<ExamType>("bac");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const supervisors = useMemo(() => getUniqueSupervisors(), []);
  const supervisorShiftMap = useMemo(
    () =>
      Object.fromEntries(
        supervisors.map((supervisor) => [
          supervisor,
          {
            bacShifts: buildSupervisorShifts(supervisor, "bac"),
            dnbShifts: buildSupervisorShifts(supervisor, "dnb"),
          },
        ]),
      ),
    [supervisors],
  );
  const selectedBacShifts = selectedSupervisor ? supervisorShiftMap[selectedSupervisor]?.bacShifts ?? [] : [];
  const selectedDnbShifts = selectedSupervisor ? supervisorShiftMap[selectedSupervisor]?.dnbShifts ?? [] : [];
  const totalSelectedShifts = selectedBacShifts.length + selectedDnbShifts.length;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const allCards = (["bac", "dnb"] as const).flatMap((exam) =>
    scheduleData[exam].rows.flatMap((row) => row.shifts.flatMap((shift) => shift)),
  );
  const searchMatches = normalizedSearch
    ? allCards.filter((name) => name.toLowerCase().includes(normalizedSearch)).length
    : allCards.length;

  const openConvocationMenu = (preselectedSupervisor?: string) => {
    setIsModalOpen(true);
    if (preselectedSupervisor) {
      setSelectedSupervisor(preselectedSupervisor);
    }
  };

  const closeConvocationMenu = () => {
    setIsModalOpen(false);
    setSelectedSupervisor("");
  };

  const executePrint = (title: string, content: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.alert(
        "Votre navigateur bloque l'ouverture de la fenêtre d'impression. Veuillez autoriser les fenêtres contextuelles (pop-ups) pour ce site.",
      );
      return;
    }

    printWindow.document.write(buildPrintDocument(title, content));
    printWindow.document.close();
  };

  const printMainPlanning = () => {
    const title = currentExam === "bac" ? "Baccalauréat" : currentExam === "dnb" ? "DNB" : "Récapitulatif";
    const planningNode = document.getElementById("surveillance-planning-table");
    if (!planningNode) return;

    executePrint(
      `Planning des Surveillances - ${title}`,
      `<h1>Planning des Surveillances - ${title}</h1><p>Session Juin 2026</p>${planningNode.outerHTML}`,
    );
  };

  const printConvocation = () => {
    void (async () => {
      if (!selectedSupervisor) {
        window.alert("Veuillez sélectionner un surveillant(e) avant impression.");
        return;
      }

      const captureNode = document.getElementById(`convocation-capture-${getSafeFilename(selectedSupervisor)}`);
      if (!captureNode) {
        window.alert("Impossible de préparer la convocation pour impression.");
        return;
      }

      const canvas = await html2canvas(captureNode, HTML2CANVAS_OPTIONS);
      const imgData = canvas.toDataURL("image/png");
      executePrint(`Convocation - ${selectedSupervisor}`, `<img class="print-image" src="${imgData}" alt="Convocation" />`);
    })();
  };

  const appendConvocationPage = async (pdf: jsPDF, captureNode: HTMLElement, isFirstPage: boolean): Promise<void> => {
    const canvas = await html2canvas(captureNode, HTML2CANVAS_OPTIONS);
    const imgData = canvas.toDataURL("image/png");

    if (!isFirstPage) {
      pdf.addPage();
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  };

  const downloadConvocationPdf = async () => {
    if (!selectedSupervisor) {
      window.alert("Veuillez sélectionner un surveillant(e) avant téléchargement.");
      return;
    }
    const captureNode = document.getElementById(`convocation-capture-${getSafeFilename(selectedSupervisor)}`);
    if (!captureNode) {
      window.alert("Impossible de préparer la convocation pour le PDF.");
      return;
    }
    if (isDownloadingPdf) {
      return;
    }

    try {
      setIsDownloadingPdf(true);
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      await appendConvocationPage(pdf, captureNode, true);
      pdf.save(`convocation-${getSafeFilename(selectedSupervisor)}-juin-2026.pdf`);
    } catch (error) {
      console.error("Failed to generate convocation PDF", error);
      window.alert("Impossible de générer le PDF. Veuillez réessayer.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const downloadAllConvocationsPdf = async () => {
    if (!supervisors.length) {
      window.alert("Aucun(e) surveillant(e) disponible.");
      return;
    }
    if (isDownloadingPdf) {
      return;
    }

    try {
      setIsDownloadingPdf(true);
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      for (const [index, supervisor] of supervisors.entries()) {
        const captureNode = document.getElementById(`convocation-capture-${getSafeFilename(supervisor)}`);
        if (!captureNode) {
          throw new Error(`Missing capture node for supervisor: ${supervisor}`);
        }
        // eslint-disable-next-line no-await-in-loop
        await appendConvocationPage(pdf, captureNode, index === 0);
      }
      pdf.save("convocations-surveillance-juin-2026.pdf");
    } catch (error) {
      console.error("Failed to generate all convocations PDF", error);
      window.alert("Impossible de générer les convocations. Veuillez réessayer.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-gray-800 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </div>

        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 md:text-3xl">
              <CalendarDays className="text-indigo-600" />
              Planning des Surveillances
            </h1>
            <p className="mt-1 text-gray-500">Session Juin 2026</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Chercher un surveillant(e)..."
              />
            </div>
            <button
              onClick={printMainPlanning}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>
            <button
              onClick={() => openConvocationMenu()}
              className="flex items-center justify-center gap-2 rounded-lg border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <FileText className="h-4 w-4" />
              Convocations
            </button>
          </div>
        </div>

        <div className="mb-6 flex w-fit space-x-1 rounded-lg bg-gray-200/50 p-1">
          <button
            onClick={() => setCurrentExam("bac")}
            className={`rounded-md px-6 py-2.5 text-sm transition-all ${
              currentExam === "bac"
                ? "bg-white font-semibold text-indigo-700 shadow shadow-gray-200"
                : "font-medium text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
            }`}
          >
            Baccalauréat
          </button>
          <button
            onClick={() => setCurrentExam("dnb")}
            className={`rounded-md px-6 py-2.5 text-sm transition-all ${
              currentExam === "dnb"
                ? "bg-white font-semibold text-indigo-700 shadow shadow-gray-200"
                : "font-medium text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
            }`}
          >
            DNB
          </button>
          <button
            onClick={() => setCurrentExam("recap")}
            className={`rounded-md px-6 py-2.5 text-sm transition-all ${
              currentExam === "recap"
                ? "bg-white font-semibold text-indigo-700 shadow shadow-gray-200"
                : "font-medium text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
            }`}
          >
            Récapitulatif
          </button>
        </div>

        {currentExam === "recap" ? (
          <div id="surveillance-planning-table" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {supervisors
              .filter((supervisor) => !normalizedSearch || supervisor.toLowerCase().includes(normalizedSearch))
              .map((supervisor) => {
                const shifts = supervisorShiftMap[supervisor];
                if (!shifts) return null;

                const totalShifts = shifts.bacShifts.length + shifts.dnbShifts.length;

                return (
                  <article key={supervisor} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-5">
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900">{supervisor}</h3>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
                        {totalShifts} créneau(x)
                      </span>
                    </div>

                    <div className="space-y-5">
                      {shifts.bacShifts.length > 0 ? (
                        <section>
                          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Baccalauréat</h4>
                          <div className="space-y-1.5">
                            {shifts.bacShifts.map((shift) => (
                              <div key={`bac-${supervisor}-${shift.col.date}-${shift.col.subject}-${shift.room}`} className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm text-slate-600">
                                <span>
                                  {shift.col.date} &nbsp;·&nbsp; {shift.col.time}
                                </span>
                                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                  {shift.room}
                                </span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}

                      {shifts.dnbShifts.length > 0 ? (
                        <section>
                          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">DNB</h4>
                          <div className="space-y-1.5">
                            {shifts.dnbShifts.map((shift) => (
                              <div key={`dnb-${supervisor}-${shift.col.date}-${shift.col.subject}-${shift.room}`} className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm text-slate-600">
                                <span>
                                  {shift.col.date} &nbsp;·&nbsp; {shift.col.time}
                                </span>
                                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                  {shift.room}
                                </span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}
                    </div>

                    <button
                      onClick={() => openConvocationMenu(supervisor)}
                      className="mt-6 w-full rounded-xl bg-indigo-100 px-4 py-2.5 font-medium text-indigo-700 transition hover:bg-indigo-200"
                    >
                      Voir convocation
                    </button>
                  </article>
                );
              })}
          </div>
        ) : (
          <div id="surveillance-planning-table" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
                  <tr>
                    <th className="sticky left-0 z-10 w-44 border-r border-gray-200 bg-white p-4" />
                    {scheduleData[currentExam].columns.map((col) => (
                      <th key={`${col.date}-${col.subject}`} className="min-w-[180px] border-r border-gray-100 p-4 align-top last:border-0">
                        <div className="flex flex-col items-center space-y-2 text-center">
                          <span className="text-xs font-semibold text-gray-500">{col.date}</span>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-bold ring-1 ring-inset ${col.bg} ${col.color} ${col.ring}`}
                          >
                            {col.subject}
                          </span>
                          <div className="mt-1 flex flex-col text-xs font-medium text-gray-600">
                            <span>{col.time}</span>
                            {col.endExtra ? <span className="text-gray-400">({col.endExtra})</span> : null}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scheduleData[currentExam].rows.map((row) => (
                    <tr key={row.room} className="group transition-colors hover:bg-gray-50/50">
                      <td className="sticky left-0 z-10 border-r border-gray-200 bg-white p-4 align-middle transition-colors group-hover:bg-gray-50/80">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{row.room}</span>
                          {row.note ? (
                            <span
                              className={`text-xs text-gray-500 ${
                                row.note === "Charlie Rispal" ? "font-normal italic" : "font-medium"
                              }`}
                            >
                              {row.note}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      {row.shifts.map((shift, shiftIndex) => (
                        <td key={`${row.room}-${shiftIndex}`} className="align-top border-r border-gray-100 p-3 last:border-0">
                          <div className="flex flex-col gap-1.5">
                            {shift.map((person) => {
                              const isMatch =
                                !normalizedSearch || person.toLowerCase().includes(normalizedSearch);

                              return (
                                <button
                                  key={`${row.room}-${person}-${shiftIndex}`}
                                  onClick={() => openConvocationMenu(person)}
                                  className={`flex w-full cursor-pointer items-center gap-2 rounded border p-2 text-left text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    isMatch
                                      ? normalizedSearch
                                        ? "scale-105 border-yellow-400 bg-yellow-100 ring-2 ring-yellow-400"
                                        : "border-gray-200 bg-white hover:border-indigo-300 hover:ring-1 hover:ring-indigo-200"
                                      : "border-gray-200 bg-white opacity-20 grayscale"
                                  }`}
                                >
                                  <User className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                                  <span className="truncate text-xs font-medium">{person}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {normalizedSearch && searchMatches === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <UserX className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-lg">Aucun surveillant(e) trouvé avec ce nom.</p>
          </div>
        ) : null}

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex h-full w-full items-start justify-center overflow-y-auto bg-gray-900/50 pb-10 pt-10 backdrop-blur-sm">
            <div className="relative mx-4 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex flex-col items-start justify-between gap-4 border-b border-gray-200 bg-gray-50/95 p-6 backdrop-blur sm:flex-row sm:items-center">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                    <FileBadge className="text-indigo-600" />
                    Édition des convocations
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Aperçu complet (avec signature/cachet), impression et téléchargement des convocations de surveillance.
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                  <select
                    value={selectedSupervisor}
                    onChange={(event) => setSelectedSupervisor(event.target.value)}
                    className="w-full min-w-[240px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 sm:w-auto"
                  >
                    <option value="">Sélectionner un(e) surveillant(e)...</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor} value={supervisor}>
                        {supervisor}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={printConvocation}
                    disabled={!selectedSupervisor}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    <Printer className="h-4 w-4" /> Imprimer
                  </button>
                  <button
                    onClick={downloadConvocationPdf}
                    disabled={!selectedSupervisor || isDownloadingPdf}
                    className="flex items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:border-indigo-200 disabled:bg-indigo-50/40 disabled:text-indigo-400"
                  >
                    <FileText className="h-4 w-4" /> {isDownloadingPdf ? "Génération..." : "Télécharger PDF"}
                  </button>
                  <button
                    onClick={downloadAllConvocationsPdf}
                    disabled={isDownloadingPdf}
                    className="flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-indigo-200 disabled:bg-indigo-50/40 disabled:text-indigo-400"
                  >
                    <FileBadge className="h-4 w-4" /> Tout télécharger
                  </button>
                  <button
                    onClick={closeConvocationMenu}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              <div className="max-h-[75vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 p-6 sm:p-8">
                {!selectedSupervisor ? (
                  <div className="mt-20 flex flex-col items-center text-center text-gray-400">
                    <AlertTriangle className="mb-3 h-12 w-12 text-gray-300" />
                    <p>Veuillez sélectionner un(e) surveillant(e) pour afficher sa convocation.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm">
                      <div className="font-semibold text-indigo-900">{selectedSupervisor}</div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-indigo-700">
                          {totalSelectedShifts} mission{totalSelectedShifts > 1 ? "s" : ""}
                        </span>
                        <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-blue-700">
                          Bac : {selectedBacShifts.length}
                        </span>
                        <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-emerald-700">
                          DNB : {selectedDnbShifts.length}
                        </span>
                      </div>
                    </div>

                    <ConvocationSheet
                      supervisor={selectedSupervisor}
                      bacShifts={selectedBacShifts}
                      dnbShifts={selectedDnbShifts}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div
          aria-hidden
          className="pointer-events-none fixed -left-[10000px] top-0 flex flex-col gap-4 bg-white opacity-0"
          style={{ width: `${A4_WIDTH_PX}px`, minHeight: `${A4_HEIGHT_PX}px` }}
        >
          {supervisors.map((supervisor) => {
            const shifts = supervisorShiftMap[supervisor];
            if (!shifts) return null;

            return (
              <div
                key={supervisor}
                id={`convocation-capture-${getSafeFilename(supervisor)}`}
                style={{ width: `${A4_WIDTH_PX}px`, minHeight: `${A4_HEIGHT_PX}px` }}
              >
                <ConvocationSheet
                  supervisor={supervisor}
                  bacShifts={shifts.bacShifts}
                  dnbShifts={shifts.dnbShifts}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
