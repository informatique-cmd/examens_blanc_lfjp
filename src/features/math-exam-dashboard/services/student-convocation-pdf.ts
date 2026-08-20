import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import type { RoomScheduleDay, StudentDistributionEntry } from "../data";

interface StudentExamSession {
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
  memo: string;
}

const CONVOCATION_BATCH_SIZE = 10;

const sanitizeFilename = (value: string): string => {
  const normalized = value.normalize("NFD").replace(/[^\p{Letter}\p{Number}]+/gu, "-");
  const trimmed = normalized.replace(/^-+|-+$/g, "");
  return trimmed.length ? trimmed.toLowerCase() : "convocation";
};

const parseTimeRange = (time?: string): { startTime: string; endTime: string } => {
  if (!time) {
    return { startTime: "", endTime: "" };
  }
  const [start, end] = time.split("-").map((value) => value.trim());
  return { startTime: start ?? "", endTime: end ?? "" };
};

const examDateLabelMap: Record<string, string> = {
  "Mardi 03/02": "Mardi 3 février 2026",
  "Mercredi 04/02": "Mercredi 4 février 2026",
};

const formatExamDate = (dayLabel: string): string => examDateLabelMap[dayLabel] ?? dayLabel;

const createParagraph = (text: string): HTMLParagraphElement => {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  paragraph.style.margin = "0";
  paragraph.style.fontSize = "14px";
  paragraph.style.lineHeight = "1.6";
  paragraph.style.color = "#0f172a";
  return paragraph;
};

const createInfoLine = (label: string, value: string): HTMLParagraphElement => {
  const paragraph = document.createElement("p");
  paragraph.style.margin = "0";
  paragraph.style.fontSize = "14px";
  paragraph.style.color = "#1e293b";
  paragraph.innerHTML = `<strong>${label}</strong> ${value}`;
  return paragraph;
};

const createBaseContainer = (): HTMLDivElement => {
  const container = document.createElement("div");
  container.style.width = "794px";
  container.style.minHeight = "1123px";
  container.style.margin = "0 auto";
  container.style.padding = "48px";
  container.style.background = "#ffffff";
  container.style.boxSizing = "border-box";
  container.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
  container.style.color = "#0f172a";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "20px";
  return container;
};

const createExamSessionItem = (session: StudentExamSession): HTMLLIElement => {
  const item = document.createElement("li");
  item.style.display = "flex";
  item.style.flexDirection = "column";
  item.style.gap = "4px";
  item.style.padding = "12px";
  item.style.borderRadius = "12px";
  item.style.border = "1px solid #e2e8f0";
  item.style.backgroundColor = "#f8fafc";

  const title = document.createElement("p");
  title.textContent = `${session.date} · ${session.subject}`;
  title.style.margin = "0";
  title.style.fontWeight = "600";
  title.style.color = "#1d4ed8";

  const timeRoom = document.createElement("p");
  timeRoom.textContent = `Horaire : ${session.startTime} - ${session.endTime} · Salle ${session.room}`;
  timeRoom.style.margin = "0";
  timeRoom.style.color = "#0f172a";

  const memo = document.createElement("p");
  memo.textContent = session.memo;
  memo.style.margin = "0";
  memo.style.fontSize = "13px";
  memo.style.color = "#475569";

  item.append(title, timeRoom, memo);
  return item;
};

const buildStudentExamSessions = (
  student: StudentDistributionEntry,
  roomSchedule: RoomScheduleDay[],
): StudentExamSession[] => {
  const sessions: StudentExamSession[] = [];

  roomSchedule.forEach((day) => {
    const roomSessions = day.rooms[student.room] ?? [];
    roomSessions.forEach((session) => {
      const { startTime, endTime } = parseTimeRange(session.time);
      sessions.push({
        date: formatExamDate(day.day),
        startTime,
        endTime,
        subject: session.label ?? "Épreuve",
        room: student.room,
        memo: session.detail
          ? `${session.detail}. Arrivez 30 minutes avant le début de l'épreuve.`
          : "Arrivez 30 minutes avant le début de l'épreuve.",
      });
    });
  });

  return sessions;
};

const createConvocationContent = (
  student: StudentDistributionEntry,
  roomSchedule: RoomScheduleDay[],
): HTMLDivElement => {
  const container = createBaseContainer();

  const header = document.createElement("header");
  header.style.display = "flex";
  header.style.flexDirection = "column";
  header.style.gap = "6px";

  const title = document.createElement("h1");
  title.textContent = "Convocation au DNB blanc – Février 2026";
  title.style.margin = "0";
  title.style.fontSize = "22px";
  title.style.fontWeight = "700";
  title.style.color = "#1d4ed8";

  const subtitle = document.createElement("p");
  subtitle.textContent = "Lycée Français Jacques Prévert de Saly";
  subtitle.style.margin = "0";
  subtitle.style.color = "#475569";
  subtitle.style.fontSize = "14px";

  header.append(title, subtitle);

  const infoCard = document.createElement("div");
  infoCard.style.display = "flex";
  infoCard.style.flexDirection = "column";
  infoCard.style.gap = "6px";
  infoCard.style.padding = "16px";
  infoCard.style.borderRadius = "12px";
  infoCard.style.border = "1px solid #e2e8f0";
  infoCard.style.backgroundColor = "#f1f5f9";

  infoCard.append(
    createInfoLine("Élève :", student.student),
    createInfoLine("Classe :", student.className),
    createInfoLine("Salle principale :", student.room),
  );

  const intro = createParagraph(
    "Veuillez trouver ci-dessous le détail des épreuves prévues pour le DNB blanc des 3 et 4 février.",
  );

  const sessions = buildStudentExamSessions(student, roomSchedule);
  const list = document.createElement("ul");
  list.style.margin = "0";
  list.style.padding = "0";
  list.style.listStyle = "none";
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "10px";

  sessions.forEach((session) => {
    list.append(createExamSessionItem(session));
  });

  const reminder = document.createElement("div");
  reminder.style.display = "flex";
  reminder.style.flexDirection = "column";
  reminder.style.gap = "8px";
  reminder.style.padding = "14px";
  reminder.style.borderRadius = "12px";
  reminder.style.border = "1px solid #cbd5f5";
  reminder.style.backgroundColor = "#eef2ff";

  reminder.append(
    createParagraph("Rappel :"),
    createParagraph("• Apportez votre pièce d'identité et votre matériel autorisé."),
    createParagraph("• Soyez présent(e) 30 minutes avant chaque épreuve."),
    createParagraph("• Consultez la vie scolaire en cas de question.")
  );

  container.append(header, infoCard, intro, list, reminder);

  return container;
};

const appendConvocationPage = async (
  pdf: jsPDF,
  student: StudentDistributionEntry,
  roomSchedule: RoomScheduleDay[],
  isFirstPage: boolean,
): Promise<void> => {
  const container = createConvocationContent(student, roomSchedule);
  container.style.position = "absolute";
  container.style.top = "-10000px";
  container.style.left = "-10000px";
  document.body.append(container);

  // Use a lighter capture for the "toutes les convocations" batch to keep memory
  // usage low while preserving readability in the PDF output.
  const canvas = await html2canvas(container, { scale: 1 });
  const imageData = canvas.toDataURL("image/jpeg", 0.85);

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  if (!isFirstPage) {
    pdf.addPage();
  }

  pdf.addImage(imageData, "JPEG", 0, 0, pdfWidth, pdfHeight);
  container.remove();
};

const pauseBetweenChunks = (): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, 100);
  });

const processStudentsInChunks = async (
  students: StudentDistributionEntry[],
  chunkSize: number,
  callback: (chunk: StudentDistributionEntry[], chunkIndex: number) => Promise<void>,
): Promise<void> => {
  for (let startIndex = 0; startIndex < students.length; startIndex += chunkSize) {
    const chunk = students.slice(startIndex, startIndex + chunkSize);
    const chunkIndex = startIndex / chunkSize + 1;

    // eslint-disable-next-line no-await-in-loop
    await callback(chunk, chunkIndex);

    if (startIndex + chunkSize < students.length) {
      // Yield to avoid blocking the main thread when generating long batches
      // eslint-disable-next-line no-await-in-loop
      await pauseBetweenChunks();
    }
  }
};

export async function downloadDnbStudentConvocation(
  student: StudentDistributionEntry,
  roomSchedule: RoomScheduleDay[],
): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  await appendConvocationPage(pdf, student, roomSchedule, true);
  pdf.save(`convocation-${sanitizeFilename(student.student)}.pdf`);
}

export async function downloadDnbStudentConvocationsForClass(
  students: StudentDistributionEntry[],
  className: string,
  roomSchedule: RoomScheduleDay[],
): Promise<void> {
  if (!students.length) {
    throw new Error("Aucun élève pour cette classe");
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  for (const [index, student] of students.entries()) {
    // eslint-disable-next-line no-await-in-loop
    await appendConvocationPage(pdf, student, roomSchedule, index === 0);
  }
  pdf.save(`convocations-${sanitizeFilename(className)}.pdf`);
}

export async function downloadAllDnbStudentConvocations(
  students: StudentDistributionEntry[],
  roomSchedule: RoomScheduleDay[],
): Promise<void> {
  if (!students.length) {
    throw new Error("Aucun élève disponible");
  }

  await processStudentsInChunks(
    students,
    CONVOCATION_BATCH_SIZE,
    async (chunk, chunkIndex) => {
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      for (const [index, student] of chunk.entries()) {
        // eslint-disable-next-line no-await-in-loop
        await appendConvocationPage(pdf, student, roomSchedule, index === 0);
      }
      pdf.save(`convocations-dnb-blanc-fevrier-${chunkIndex}.pdf`);
    },
  );
}
