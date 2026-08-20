import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CalendarClock, ClipboardList, MapPin } from "lucide-react";

import TypeBadge from "./TypeBadge";
import { useDashboardContext, useMathExamData } from "../context";
import { downloadAttendanceList, downloadConvocationPdf } from "../services";
import type { TypeVariant } from "../data";
import {
  buildTeacherSchedule,
  formatDuration,
  parseDuration,
  type TeacherScheduleGroup,
} from "../utils";

const CalendarClockIcon = CalendarClock;
const MapPinIcon = MapPin;
const ClipboardListIcon = ClipboardList;
const AlertCircleIcon = AlertCircle;

type TeacherOption = {
  value: string;
  label: string;
};

function ConvocationMission({
  mission,
  typeVariants,
}: {
  mission: TeacherScheduleGroup["missions"][number];
  typeVariants: Record<string, TypeVariant>;
}) {
  const roomLabel = mission.room && mission.room.trim() !== "-" ? mission.room : "Salle à confirmer";
  const typeLabel = typeVariants[mission.type ?? ""]?.label ?? typeVariants.default.label;
  const duration = mission.duration ? formatDuration(parseDuration(mission.duration)) : "Durée à préciser";

  return (
    <li className="rounded-lg border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-800">
        <span className="inline-flex items-center gap-2">
          <CalendarClockIcon className="h-4 w-4 text-slate-500" />
          {mission.datetime}
        </span>
        <TypeBadge type={mission.type} compact />
      </div>
      <div className="mt-3 space-y-1 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <MapPinIcon className="mt-0.5 h-4 w-4 text-slate-400" />
          <span>
            <span className="font-semibold text-slate-700">Salle :</span> {roomLabel}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <ClipboardListIcon className="mt-0.5 h-4 w-4 text-slate-400" />
          <span>
            <span className="font-semibold text-slate-700">Épreuve / fonction :</span> {mission.mission}
          </span>
        </div>
        <div className="pl-6 text-xs uppercase tracking-wide text-slate-500">Fonction : {typeLabel}</div>
        <div className="pl-6 text-xs uppercase tracking-wide text-slate-500">Durée : {duration}</div>
      </div>
    </li>
  );
}

export default function ConvocationGenerator() {
  const { activeView, container } = useDashboardContext();
  const { surveillanceSchedule, teacherDirectoryByShortName, typeVariants } =
    useMathExamData();

  const scheduleByTeacher = useMemo(
    () => buildTeacherSchedule(surveillanceSchedule),
    [surveillanceSchedule],
  );

  const assignedTeacherGroups = useMemo(() => {
    return scheduleByTeacher.filter(
      (group) => group.teacher && group.teacher !== "À assigner" && group.missions.length > 0,
    );
  }, [scheduleByTeacher]);

  const teacherOptions = useMemo<TeacherOption[]>(() => {
    return assignedTeacherGroups.map((group) => {
      const entry = teacherDirectoryByShortName[group.teacher];
      const label = entry ? `${entry.firstName} ${entry.lastName}` : group.teacher;
      return { value: group.teacher, label };
    });
  }, [assignedTeacherGroups]);

  const defaultTeacher = teacherOptions[0]?.value ?? "";
  const [selectedTeacher, setSelectedTeacher] = useState<string>(defaultTeacher);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isGeneratingAttendanceList, setIsGeneratingAttendanceList] = useState(false);

  useEffect(() => {
    if (!teacherOptions.length) {
      setSelectedTeacher("");
      return;
    }
    const exists = teacherOptions.some((option) => option.value === selectedTeacher);
    if (!exists) {
      setSelectedTeacher(defaultTeacher);
    }
  }, [defaultTeacher, selectedTeacher, teacherOptions]);

  const selectedGroup = useMemo(() => {
    return scheduleByTeacher.find((group) => group.teacher === selectedTeacher) ?? null;
  }, [scheduleByTeacher, selectedTeacher]);

  const totalDuration = useMemo(() => {
    if (!selectedGroup) {
      return 0;
    }
    return selectedGroup.missions.reduce(
      (sum, mission) => sum + parseDuration(mission.duration),
      0,
    );
  }, [selectedGroup]);

  if (!container) {
    return null;
  }

  const hasMissions = Boolean(selectedGroup && selectedGroup.missions.length);
  const teacherEntry = selectedGroup
    ? teacherDirectoryByShortName[selectedGroup.teacher]
    : undefined;
  const salutation = teacherEntry?.civility ?? "Madame, Monsieur";
  const teacherDisplayName = teacherEntry
    ? `${teacherEntry.firstName} ${teacherEntry.lastName}`
    : selectedGroup?.teacher ?? "";
  const invitationSentence = teacherEntry
    ? teacherEntry.gender === "female"
      ? "Vous êtes conviée"
      : "Vous êtes convié"
    : "Vous êtes convié(e)";

  const handleDownload = async () => {
    if (!selectedGroup || !hasMissions || isGeneratingPdf || isGeneratingAll) {
      return;
    }
    try {
      setIsGeneratingPdf(true);
      await downloadConvocationPdf(selectedGroup, teacherEntry, typeVariants);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Impossible de générer la convocation. Veuillez réessayer.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadAll = async () => {
    if (isGeneratingAll || isGeneratingPdf || isGeneratingAttendanceList) {
      return;
    }
    if (!assignedTeacherGroups.length) {
      alert("Aucune convocation disponible pour le téléchargement.");
      return;
    }
    try {
      setIsGeneratingAll(true);
      for (const group of assignedTeacherGroups) {
        const entry = teacherDirectoryByShortName[group.teacher];
        await downloadConvocationPdf(group, entry, typeVariants);
      }
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Impossible de générer la convocation. Veuillez réessayer.");
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleDownloadAttendanceList = async () => {
    if (isGeneratingAttendanceList || isGeneratingAll || isGeneratingPdf) {
      return;
    }
    if (!assignedTeacherGroups.length) {
      alert("Aucune convocation disponible pour le téléchargement.");
      return;
    }
    try {
      setIsGeneratingAttendanceList(true);
      await downloadAttendanceList(assignedTeacherGroups, teacherDirectoryByShortName);
    } catch (error) {
      console.error("Attendance list generation failed", error);
      alert("Impossible de générer la feuille d'émargement. Veuillez réessayer.");
    } finally {
      setIsGeneratingAttendanceList(false);
    }
  };

  return createPortal(
    <section
      id="convocation-view"
      data-view-section="convocation"
      role="tabpanel"
      aria-labelledby="convocation-tab"
      tabIndex={activeView === "convocation" ? 0 : -1}
      aria-hidden={activeView === "convocation" ? "false" : "true"}
      className={`${activeView === "convocation" ? "" : "hidden"} space-y-6`}
    >
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900">Générateur de convocation</h3>
        <p className="text-sm text-slate-500">
          Sélectionnez un surveillant pour obtenir une convocation prête à être envoyée avec toutes les informations clés.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="convocation-teacher" className="text-sm font-medium text-slate-700">
          Surveillant
        </label>
        <select
          id="convocation-teacher"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={selectedTeacher}
          onChange={(event) => setSelectedTeacher(event.target.value)}
        >
          {teacherOptions.length === 0 ? (
            <option value="" disabled>
              Aucun surveillant disponible
            </option>
          ) : null}
          {teacherOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {selectedGroup && hasMissions ? (
        <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/70 p-6">
          <div className="space-y-1 text-sm text-slate-600">
            <p className="text-slate-500">{salutation},</p>
            <p>
              {invitationSentence} à assurer les surveillances suivantes pour le baccalauréat blanc. Merci de prendre
              connaissance des informations ci-dessous.
            </p>
          </div>
          <ul className="space-y-3">
            {selectedGroup.missions.map((mission) => (
              <ConvocationMission
                key={`${mission.datetime}-${mission.mission}`}
                mission={mission}
                typeVariants={typeVariants}
              />
            ))}
          </ul>
          <div className="rounded-lg bg-white/70 p-4 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-700">Durée totale d'engagement :</span>{" "}
              {formatDuration(totalDuration)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Merci d'arriver 15 minutes avant le début de chaque épreuve pour la mise en place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!hasMissions || isGeneratingPdf || isGeneratingAll || isGeneratingAttendanceList}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Télécharger la convocation de {teacherDisplayName}
            </button>
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={isGeneratingAll || isGeneratingPdf || isGeneratingAttendanceList}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors duration-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
            >
              Télécharger toutes les convocations
            </button>
            <button
              type="button"
              onClick={handleDownloadAttendanceList}
              disabled={isGeneratingAttendanceList || isGeneratingAll || isGeneratingPdf}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
            >
              Télécharger la feuille d'émargement
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
          <AlertCircleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">
            Aucun surveillant n'a encore été assigné. Complétez le tableau des surveillances pour activer la génération des
            convocations.
          </p>
        </div>
      )}
    </section>,
    container,
  );
}
