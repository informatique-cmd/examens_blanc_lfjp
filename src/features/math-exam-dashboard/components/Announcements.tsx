import { useMemo } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";

import TodayBadge from "./TodayBadge";
import TypeBadge from "./TypeBadge";
import {
  buildDaySchedule,
  getBlockHighlight,
  isDayLabelToday,
  type DaySchedule,
  type DayScheduleEntry,
  type DaySlot,
} from "../utils";
import { useDashboardContext, useMathExamData } from "../context";

const ClockIcon = Clock;

function DaySession({ entry }: { entry: DayScheduleEntry }) {
  const isTeacherDefined = Boolean(entry.teacher);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>{entry.room}</span>
        <TypeBadge type={entry.type} compact />
      </div>
      <div className="mt-2 text-sm text-slate-700">
        {isTeacherDefined ? (
          <span className="font-semibold text-slate-900">{entry.teacher}</span>
        ) : (
          <span className="italic text-slate-400">Surveillant à confirmer</span>
        )}
      </div>
      {entry.detail ? <p className="text-xs text-slate-500">{entry.detail}</p> : null}
    </div>
  );
}

function SlotCard({ slot }: { slot: DaySlot }) {
  const highlight = getBlockHighlight({
    label: slot.label ?? undefined,
    time: slot.time ?? undefined,
  });
  const classes = ["rounded-lg", "border", "border-slate-200", "bg-slate-50", "p-3"];
  if (highlight) {
    classes.push(highlight.background, highlight.border);
  }
  const labelNeeded = slot.label && (!slot.time || slot.label !== slot.time);
  return (
    <div className={classes.join(" ")}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-slate-700">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-slate-500" />
          {slot.time ?? slot.label ?? "Horaire à confirmer"}
        </div>
        {labelNeeded && slot.label ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              highlight ? `${highlight.badgeBackground} ${highlight.badgeText}` : "bg-slate-200 text-slate-600"
            }`}
          >
            {slot.label}
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {slot.entries.length ? (
          slot.entries.map((entry, index) => <DaySession key={index} entry={entry} />)
        ) : (
          <p className="text-xs italic text-slate-400">Aucune surveillance prévue.</p>
        )}
      </div>
    </div>
  );
}

function DayCard({ schedule }: { schedule: DaySchedule }) {
  const isToday = isDayLabelToday(schedule.day);
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-lg font-semibold text-slate-900">{schedule.day}</h4>
        {isToday ? <TodayBadge /> : null}
      </div>
      <div className="mt-4 space-y-4">
        {schedule.slots.length ? (
          schedule.slots.map((slot) => <SlotCard key={slot.key} slot={slot} />)
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Aucun créneau planifié pour cette journée.
          </div>
        )}
      </div>
    </article>
  );
}

export default function Announcements() {
  const { activeView, container } = useDashboardContext();
  const { roomSchedule, surveillanceSchedule } = useMathExamData();
  const daySchedule = useMemo(
    () => buildDaySchedule(roomSchedule, surveillanceSchedule),
    [roomSchedule, surveillanceSchedule],
  );

  if (!container) {
    return null;
  }

  return createPortal(
    <section
      id="day-view"
      data-view-section="day"
      role="tabpanel"
      aria-labelledby="day-tab"
      tabIndex={activeView === "day" ? 0 : -1}
      aria-hidden={activeView === "day" ? "false" : "true"}
      className={`${activeView === "day" ? "" : "hidden"} space-y-6`}
    >
      <div>
        <h3 className="text-xl font-semibold text-slate-900">Planning condensé par jour</h3>
        <p className="text-sm text-slate-500">
          Retrouvez une vue globale de chaque journée, organisée par créneaux horaires comme dans un emploi du temps.
        </p>
      </div>
      <div className="space-y-4">
        {daySchedule.length ? (
          daySchedule.map((schedule) => <DayCard key={schedule.day} schedule={schedule} />)
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Aucune journée planifiée.
          </div>
        )}
      </div>
    </section>,
    container,
  );
}
