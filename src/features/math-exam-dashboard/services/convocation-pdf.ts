import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import {
  formatDuration,
  parseDuration,
  type TeacherScheduleGroup,
} from "../utils";
import type { TeacherDirectoryEntry, TypeVariant } from "../data";

const typeBadgeStyles: Record<string, { background: string; text: string; border: string }> = {
  mathematiques: {
    background: "#dbeafe",
    text: "#1d4ed8",
    border: "rgba(37, 99, 235, 0.35)",
  },
  support: {
    background: "#fef3c7",
    text: "#b45309",
    border: "rgba(217, 119, 6, 0.35)",
  },
  default: {
    background: "#e2e8f0",
    text: "#1e293b",
    border: "rgba(100, 116, 139, 0.3)",
  },
};

const sanitizeFilename = (value: string): string => {
  const normalized = value.normalize("NFD").replace(/[^\p{Letter}\p{Number}]+/gu, "-");
  const trimmed = normalized.replace(/^-+|-+$/g, "");
  return trimmed.length ? trimmed.toLowerCase() : "convocation";
};

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
  container.style.gap = "24px";
  container.style.textRendering = "optimizeLegibility";
  return container;
};

const createSectionTitle = (text: string): HTMLHeadingElement => {
  const title = document.createElement("h2");
  title.textContent = text;
  title.style.fontSize = "20px";
  title.style.fontWeight = "600";
  title.style.color = "#1d4ed8";
  title.style.margin = "0";
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

const createMissionCard = (
  mission: TeacherScheduleGroup["missions"][number],
  index: number,
  typeVariants: Record<string, TypeVariant>,
): HTMLDivElement => {
  const card = document.createElement("div");
  card.style.padding = "16px";
  card.style.borderRadius = "12px";
  card.style.border = "1px solid #cbd5f5";
  card.style.background = "linear-gradient(135deg, #f8fafc, #eef2ff)";
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.gap = "8px";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.gap = "16px";

  const title = document.createElement("h3");
  title.style.margin = "0";
  title.style.fontSize = "16px";
  title.style.fontWeight = "600";
  title.style.color = "#1e3a8a";
  title.textContent = `Mission ${index + 1}`;

  const typeBadge = document.createElement("span");
  typeBadge.style.display = "inline-flex";
  typeBadge.style.alignItems = "center";
  typeBadge.style.padding = "4px 10px";
  typeBadge.style.borderRadius = "9999px";
  typeBadge.style.fontSize = "12px";
  typeBadge.style.fontWeight = "600";
  typeBadge.style.letterSpacing = "0.02em";

  const variant = typeVariants[mission.type ?? ""] ?? typeVariants.default;
  const badgeStyle = typeBadgeStyles[mission.type ?? ""] ?? typeBadgeStyles.default;
  typeBadge.textContent = variant.label;
  typeBadge.style.backgroundColor = badgeStyle.background;
  typeBadge.style.color = badgeStyle.text;
  typeBadge.style.border = `1px solid ${badgeStyle.border}`;

  header.append(title, typeBadge);

  const detailList = document.createElement("ul");
  detailList.style.margin = "0";
  detailList.style.padding = "0";
  detailList.style.listStyle = "none";
  detailList.style.display = "flex";
  detailList.style.flexDirection = "column";
  detailList.style.gap = "4px";

  const createDetailItem = (label: string, value: string): HTMLLIElement => {
    const item = document.createElement("li");
    item.style.fontSize = "13px";
    item.style.color = "#1f2937";
    item.textContent = `${label} ${value}`;
    return item;
  };

  const roomLabel = mission.room && mission.room.trim() !== "-" ? mission.room : "Salle à confirmer";
  const durationLabel = mission.duration
    ? formatDuration(parseDuration(mission.duration))
    : "Durée à préciser";

  detailList.append(
    createDetailItem("Date et horaire :", mission.datetime ?? "À préciser"),
    createDetailItem("Salle :", roomLabel),
    createDetailItem("Épreuve / fonction :", mission.mission ?? "À préciser"),
    createDetailItem("Durée estimée :", durationLabel),
  );

  card.append(header, detailList);
  return card;
};

const buildConvocationContent = (
  group: TeacherScheduleGroup,
  teacherEntry: TeacherDirectoryEntry | undefined,
  typeVariants: Record<string, TypeVariant>,
): HTMLDivElement => {
  const container = createHiddenContainer();

  const header = document.createElement("header");
  header.style.display = "flex";
  header.style.flexDirection = "column";
  header.style.gap = "6px";

  const title = document.createElement("h1");
  title.textContent = "Convocation aux surveillances";
  title.style.margin = "0";
  title.style.fontSize = "26px";
  title.style.fontWeight = "700";
  title.style.color = "#0f172a";

  const subtitle = document.createElement("p");
  subtitle.textContent = "Bac blanc de mathématiques – Lycée Français Jacques Prévert de Saly";
  subtitle.style.margin = "0";
  subtitle.style.fontSize = "14px";
  subtitle.style.color = "#475569";

  header.append(title, subtitle);

  const salutation = teacherEntry?.civility ?? "Madame, Monsieur";
  const teacherName = teacherEntry
    ? `${teacherEntry.firstName} ${teacherEntry.lastName}`
    : group.teacher;
  const invitationSentence = teacherEntry
    ? teacherEntry.gender === "female"
      ? "Vous êtes conviée"
      : "Vous êtes convié"
    : "Vous êtes convié(e)";

  const introduction = document.createElement("div");
  introduction.style.display = "flex";
  introduction.style.flexDirection = "column";
  introduction.style.gap = "8px";

  introduction.append(
    createParagraph(`${salutation} ${teacherName},`),
    createParagraph(
      `${invitationSentence} à assurer les surveillances suivantes dans le cadre du baccalauréat blanc. ` +
        "Vous trouverez ci-dessous les informations détaillées pour chaque mission.",
    ),
  );

  const missionSection = document.createElement("section");
  missionSection.style.display = "flex";
  missionSection.style.flexDirection = "column";
  missionSection.style.gap = "12px";

  missionSection.append(createSectionTitle("Missions"));

  group.missions.forEach((mission, index) => {
    missionSection.append(createMissionCard(mission, index, typeVariants));
  });

  const totalDuration = group.missions.reduce(
    (sum, mission) => sum + parseDuration(mission.duration),
    0,
  );

  const summary = document.createElement("section");
  summary.style.padding = "18px";
  summary.style.borderRadius = "12px";
  summary.style.backgroundColor = "#dbeafe";
  summary.style.border = "1px solid rgba(37, 99, 235, 0.3)";
  summary.style.display = "flex";
  summary.style.flexDirection = "column";
  summary.style.gap = "6px";

  const summaryTitle = document.createElement("h2");
  summaryTitle.textContent = "Récapitulatif";
  summaryTitle.style.margin = "0";
  summaryTitle.style.fontSize = "18px";
  summaryTitle.style.fontWeight = "600";
  summaryTitle.style.color = "#1d4ed8";

  const summaryParagraph = createParagraph(
    `${group.missions.length} mission${group.missions.length > 1 ? "s" : ""} – Charge totale estimée : ${formatDuration(
      totalDuration,
    )}.`,
  );

  summary.append(summaryTitle, summaryParagraph);

  const closing = document.createElement("p");
  closing.textContent =
    "Merci pour votre disponibilité. N'hésitez pas à contacter l'administration en cas de question relative à cette convocation.";
  closing.style.margin = "0";
  closing.style.fontSize = "14px";
  closing.style.color = "#334155";

  container.append(header, introduction, missionSection, summary, closing);

  return container;
};

export async function downloadConvocationPdf(
  group: TeacherScheduleGroup,
  teacherEntry: TeacherDirectoryEntry | undefined,
  typeVariants: Record<string, TypeVariant>,
): Promise<void> {
  if (!group || group.missions.length === 0) {
    throw new Error("Aucune mission sélectionnée");
  }

  const content = buildConvocationContent(group, teacherEntry, typeVariants);
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
    const ratio = Math.min(pageWidth / renderWidth, pageHeight / renderHeight);
    const width = renderWidth * ratio;
    const height = renderHeight * ratio;
    const offsetX = (pageWidth - width) / 2;
    const offsetY = (pageHeight - height) / 2;

    pdf.addImage(imgData, "PNG", offsetX, offsetY, width, height);

    const filename = `convocation-${sanitizeFilename(group.teacher)}.pdf`;
    pdf.save(filename);
  } finally {
    content.remove();
  }
}

