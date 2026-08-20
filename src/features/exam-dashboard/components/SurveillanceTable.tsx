import { useMemo } from "react";
import { createPortal } from "react-dom";

import TodayBadge from "./TodayBadge";
import TypeBadge from "./TypeBadge";
import {
  alertCircleIcon,
  calendarClockIcon,
  clipboardListIcon,
  clock3Icon,
  mapPinIcon,
  surveillanceSchedule,
} from "../data";
import { useDashboardContext } from "../context";
import {
  buildTeacherSchedule,
  formatDuration,
  isDatetimeToday,
  parseDuration,
  type TeacherScheduleGroup,
} from "../utils";

const CalendarClockIcon = calendarClockIcon;
const MapPinIcon = mapPinIcon;
const Clock3Icon = clock3Icon;
const ClipboardListIcon = clipboardListIcon;
const AlertCircleIcon = alertCircleIcon;

function MissionCard({ mission }: { mission: TeacherScheduleGroup["missions"][number] }) {
  const durationValue = mission.duration
    ? formatDuration(parseDuration(mission.duration))
    : "Durée à préciser";
  const roomContent = mission.room && mission.room.trim() !== "-"
    ? mission.room
    : <span className="italic text-slate-400">Salle à confirmer</span>;
  const isToday = isDatetimeToday(mission.datetime);

  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-slate-700">
        <div className="flex items-center gap-2 text-slate-600">
          <CalendarClockIcon className="h-4 w-4" />
          {isToday ? (
            <div className="flex items-center gap-2">
              {mission.datetime}
              <TodayBadge />
            </div>
          ) : (
            mission.datetime
          )}
        </div>
        <TypeBadge type={mission.type} compact />
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{mission.mission}</p>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <MapPinIcon className="h-3.5 w-3.5" />
          {roomContent}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock3Icon className="h-3.5 w-3.5" />
          {durationValue}
        </span>
      </div>
    </div>
  );
}

function TeacherCard({ group }: { group: TeacherScheduleGroup }) {
  const totalSeconds = group.missions.reduce(
    (sum, mission) => sum + parseDuration(mission.duration),
    0,
  );
  const summary = `${group.missions.length} mission${group.missions.length > 1 ? "s" : ""} • ${formatDuration(totalSeconds)}`;
  const isUnassigned = group.teacher === "À assigner";

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">{group.teacher}</h4>
          <p className="text-sm text-slate-500">{summary}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            isUnassigned ? "bg-amber-200/80 text-amber-900" : "bg-slate-200/80 text-slate-600"
          }`}
        >
          {isUnassigned ? (
            <AlertCircleIcon className="h-3.5 w-3.5" />
          ) : (
            <ClipboardListIcon className="h-3.5 w-3.5" />
          )}
          {isUnassigned ? "Missions en attente d’assignation" : "Planning confirmé"}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {group.missions.map((mission, index) => (
          <MissionCard key={`${group.teacher}-${index}`} mission={mission} />
        ))}
      </div>
    </article>
  );
}

export default function SurveillanceTable() {
  const { activeView, container } = useDashboardContext();
  const teacherSchedule = useMemo(
    () => buildTeacherSchedule(surveillanceSchedule),
    [],
  );

  if (!container) {
    return null;
  }

  return createPortal(
    <section
      id="teacher-view"
      data-view-section="teacher"
      role="tabpanel"
      aria-labelledby="teacher-tab"
      tabIndex={activeView === "teacher" ? 0 : -1}
      aria-hidden={activeView === "teacher" ? "false" : "true"}
      className={`${activeView === "teacher" ? "" : "hidden"} space-y-6`}
    >
      <div>
        <h3 className="text-xl font-semibold text-slate-900">
          Planning des missions par enseignant
        </h3>
        <p className="text-sm text-slate-500">
          Visualisez le détail des missions pour chaque professeur, avec les horaires, salles et durées totales.
        </p>
      </div>
      {teacherSchedule.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {teacherSchedule.map((group) => (
            <TeacherCard key={group.teacher} group={group} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Aucune mission de surveillance enregistrée pour le moment.
        </div>
      )}
    </section>,
    container,
  );
}
