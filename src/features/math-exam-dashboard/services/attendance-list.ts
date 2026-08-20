import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { type TeacherDirectoryEntry } from "../data";
import { type TeacherScheduleGroup } from "../utils";

const createHiddenContainer = (): HTMLDivElement => {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "-10000px";
  container.style.left = "-10000px";
  container.style.width = "794px"; // A4 width at ~96 DPI
  container.style.padding = "48px";
  container.style.backgroundColor = "#ffffff";
  container.style.boxSizing = "border-box";
  container.style.fontFamily = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";
  container.style.lineHeight = "1.6";
  container.style.color = "#0f172a";
  container.style.boxShadow = "0 24px 48px rgba(15, 23, 42, 0.12)";
  container.style.borderRadius = "16px";
  container.style.border = "1px solid #e2e8f0";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "20px";
  container.style.textRendering = "optimizeLegibility";
  return container;
};

const createTitle = (text: string): HTMLHeadingElement => {
  const title = document.createElement("h1");
  title.textContent = text;
  title.style.margin = "0";
  title.style.fontSize = "26px";
  title.style.fontWeight = "700";
  title.style.color = "#0f172a";
  return title;
};

const createParagraph = (text: string): HTMLParagraphElement => {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  paragraph.style.margin = "0";
  paragraph.style.fontSize = "14px";
  paragraph.style.color = "#334155";
  return paragraph;
};

const createTableHeaderCell = (label: string): HTMLTableCellElement => {
  const cell = document.createElement("th");
  cell.textContent = label;
  cell.style.textAlign = "left";
  cell.style.padding = "12px";
  cell.style.fontSize = "13px";
  cell.style.fontWeight = "700";
  cell.style.color = "#1e293b";
  cell.style.borderBottom = "2px solid #cbd5e1";
  return cell;
};

const createTableCell = (): HTMLTableCellElement => {
  const cell = document.createElement("td");
  cell.style.padding = "12px";
  cell.style.fontSize = "13px";
  cell.style.color = "#0f172a";
  cell.style.verticalAlign = "top";
  cell.style.borderBottom = "1px solid #e2e8f0";
  return cell;
};

const formatTeacherName = (
  teacher: string,
  directory: Record<string, TeacherDirectoryEntry>,
): string => {
  const entry = directory[teacher];
  return entry ? `${entry.firstName} ${entry.lastName}` : teacher;
};

const formatMissionLines = (group: TeacherScheduleGroup): string[] =>
  group.missions.map((mission) => {
    const roomLabel = mission.room && mission.room.trim() !== "-" ? ` – ${mission.room}` : "";
    const datetime = mission.datetime?.trim() ?? "Horaire à préciser";
    const missionLabel = mission.mission?.trim() ?? "Mission à préciser";
    return `${datetime} • ${missionLabel}${roomLabel}`;
  });

const buildAttendanceListContent = (
  groups: TeacherScheduleGroup[],
  directory: Record<string, TeacherDirectoryEntry>,
): HTMLDivElement => {
  const container = createHiddenContainer();

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.flexDirection = "column";
  header.style.gap = "6px";

  const title = createTitle("Liste d'émargement des surveillants convoqués");
  const subtitle = createParagraph(
    "Épreuves de mathématiques – À faire signer lors de la remise des convocations aux surveillants.",
  );

  header.append(title, subtitle);

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.borderSpacing = "0";
  table.style.marginTop = "4px";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.append(
    createTableHeaderCell("Surveillant"),
    createTableHeaderCell("Missions convoquées"),
    createTableHeaderCell("Signature"),
  );
  thead.append(headRow);

  const tbody = document.createElement("tbody");

  const sortedGroups = [...groups].sort((a, b) => {
    const nameA = formatTeacherName(a.teacher, directory);
    const nameB = formatTeacherName(b.teacher, directory);
    return nameA.localeCompare(nameB, "fr", { sensitivity: "base" });
  });

  sortedGroups.forEach((group) => {
    const row = document.createElement("tr");

    const teacherCell = createTableCell();
    teacherCell.textContent = formatTeacherName(group.teacher, directory);

    const missionCell = createTableCell();
    missionCell.style.display = "flex";
    missionCell.style.flexDirection = "column";
    missionCell.style.gap = "6px";

    const missions = formatMissionLines(group);
    missions.forEach((line) => {
      const lineElement = document.createElement("div");
      lineElement.textContent = line;
      lineElement.style.whiteSpace = "pre-wrap";
      lineElement.style.color = "#334155";
      missionCell.append(lineElement);
    });

    const signatureCell = createTableCell();
    signatureCell.style.width = "160px";
    signatureCell.style.color = "#cbd5e1";
    signatureCell.textContent = "(Signature)";

    row.append(teacherCell, missionCell, signatureCell);
    tbody.append(row);
  });

  table.append(thead, tbody);

  const footerNote = document.createElement("div");
  footerNote.style.marginTop = "4px";
  footerNote.style.padding = "12px";
  footerNote.style.borderRadius = "12px";
  footerNote.style.background = "#f8fafc";
  footerNote.style.border = "1px dashed #cbd5e1";
  footerNote.style.fontSize = "12px";
  footerNote.style.color = "#475569";
  footerNote.textContent =
    "Cette liste facilite le suivi des convocations : chaque surveillant signe lors de la remise de son document.";

  container.append(header, table, footerNote);

  return container;
};

export async function downloadAttendanceList(
  groups: TeacherScheduleGroup[],
  directory: Record<string, TeacherDirectoryEntry>,
): Promise<void> {
  if (!groups.length) {
    throw new Error("Aucun surveillant convoqué");
  }

  const content = buildAttendanceListContent(groups, directory);
  document.body.appendChild(content);

  try {
    const canvas = await html2canvas(content, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const renderWidth = canvas.width;
    const renderHeight = canvas.height;
    const imgWidth = pageWidth;
    const imgHeight = (renderHeight * imgWidth) / renderWidth;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("emargement-surveillants.pdf");
  } finally {
    content.remove();
  }
}
