import { useMemo } from "react";
import { createPortal } from "react-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../../../shared/components";
import { cn } from "../../../shared/lib";
import TodayBadge from "./TodayBadge";
import TypeBadge from "./TypeBadge";
import {
  roomColumns,
  roomSchedule,
  surveillanceSchedule,
  type RoomColumn,
} from "../data";
import { useDashboardContext } from "../context";
import {
  buildSupportSessionsByRoom,
  getBlockHighlight,
  getTypeVariant,
  isDayLabelToday,
  type RoomScheduleDay,
  type RoomSession,
} from "../utils";

const roomColumnDefinitions = roomColumns.map((room) => ({
  id: room,
  label: room,
}));

function BlockLabel({ session }: { session: RoomSession }) {
  const highlight = getBlockHighlight(session);
  if (!session.label) {
    return null;
  }
  const classes = [
    "inline-flex",
    "items-center",
    "gap-1",
    "rounded-full",
    "px-2",
    "py-0.5",
    "text-[10px]",
    "font-semibold",
    "uppercase",
    "tracking-wide",
  ];
  if (highlight) {
    classes.push(highlight.badgeBackground, highlight.badgeText);
  } else {
    classes.push("bg-slate-200", "text-slate-600");
  }
  return <span className={classes.join(" ")}>{session.label}</span>;
}

function SessionCard({ session }: { session: RoomSession }) {
  const highlight = getBlockHighlight(session);
  const variant = getTypeVariant(session.type);
  const classes = [
    "flex",
    "flex-col",
    "items-center",
    "gap-2",
    "rounded-lg",
    "border",
    "p-3",
    variant.cardBorder,
    variant.cardBackground,
  ];

  if (highlight) {
    classes.push(highlight.background, highlight.border);
  }
  if (session.highlight) {
    classes.push("ring-2", "ring-amber-300", "shadow-sm");
  }

  const showLabel = Boolean(session.label);
  const showBadge = Boolean(session.type);
  const headerNeeded = showLabel || showBadge;

  return (
    <div className={classes.join(" ")}>
      {headerNeeded ? (
        <div
          className={`flex w-full items-center ${
            showLabel && showBadge ? "justify-between" : "justify-start"
          } gap-2`}
        >
          {showLabel ? <BlockLabel session={session} /> : null}
          {showBadge ? <div>{session.type ? <TypeBadge type={session.type} compact /> : null}</div> : null}
        </div>
      ) : null}
      <div className="flex flex-col items-center gap-1 text-center">
        {session.time ? (
          <div className="text-xs font-semibold text-slate-700">{session.time}</div>
        ) : (
          <div className="text-xs italic text-slate-400">Horaire à confirmer</div>
        )}
        {session.teacher ? (
          <div className={`text-sm font-semibold ${variant.textColor}`}>{session.teacher}</div>
        ) : (
          <div className="text-xs italic text-slate-400">Surveillant à confirmer</div>
        )}
        {session.detail ? <div className="text-xs text-slate-600">{session.detail}</div> : null}
      </div>
    </div>
  );
}

const normalizeLabel = (value?: string): string => value?.toLowerCase() ?? "";

const extractStartHour = (time?: string): number | null => {
  if (!time) {
    return null;
  }
  const match = time.match(/(\d{1,2})h/);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
};

const extractStartMinutes = (time?: string): number | null => {
  if (!time) {
    return null;
  }
  const match = time.match(/(\d{1,2})h(\d{2})?/);
  if (!match) {
    return null;
  }
  const hours = Number.parseInt(match[1], 10);
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
  return hours * 60 + minutes;
};

const getSessionSortValue = (session: RoomSession): number => {
  const startMinutes = extractStartMinutes(session.time);
  if (startMinutes !== null) {
    return startMinutes;
  }
  const label = normalizeLabel(session.label);
  if (label.includes("matin")) {
    return 8 * 60;
  }
  if (label.includes("après") || label.includes("apres")) {
    return 13 * 60;
  }
  return Number.POSITIVE_INFINITY;
};

const isAfternoonSession = (session?: RoomSession): boolean => {
  if (!session) {
    return false;
  }
  const label = normalizeLabel(session.label);
  if (label.includes("après") || label.includes("apres")) {
    return true;
  }
  if (label.includes("matin")) {
    return false;
  }
  const startHour = extractStartHour(session.time);
  return startHour !== null && startHour >= 12;
};

const isMorningSession = (session?: RoomSession): boolean => {
  if (!session) {
    return false;
  }
  const label = normalizeLabel(session.label);
  if (label.includes("matin")) {
    return true;
  }
  if (label.includes("après") || label.includes("apres")) {
    return false;
  }
  const startHour = extractStartHour(session.time);
  return startHour !== null && startHour < 12;
};

function RoomCell({ sessions }: { sessions: RoomSession[] }) {
  if (!sessions.length) {
    return <TableCell className="text-center" />;
  }

  const hasMultipleSessions = sessions.length > 1;
  const [singleSession] = sessions;

  let verticalAlignment = "justify-center";
  if (!hasMultipleSessions && singleSession) {
    if (isAfternoonSession(singleSession)) {
      verticalAlignment = "justify-end";
    } else if (isMorningSession(singleSession)) {
      verticalAlignment = "justify-start";
    }
  }

  const shouldReserveMorningSpace =
    !hasMultipleSessions && singleSession && isAfternoonSession(singleSession);

  const containerClasses = cn(
    "flex h-full flex-col",
    hasMultipleSessions || shouldReserveMorningSpace ? "items-stretch gap-3" : "items-center",
    verticalAlignment,
  );

  return (
    <TableCell className="min-w-[11rem] px-4 py-3 text-center align-top sm:min-w-0 sm:px-6 sm:py-4">
      <div className={containerClasses}>
        {shouldReserveMorningSpace ? (
          <div aria-hidden className="invisible">
            <SessionCard session={singleSession} />
          </div>
        ) : null}
        {sessions.map((session, index) => (
          <SessionCard key={index} session={session} />
        ))}
      </div>
    </TableCell>
  );
}

function RoomRow({ day }: { day: RoomScheduleDay }) {
  const isToday = isDayLabelToday(day.day);
  const stickyShadow = isToday
    ? "shadow-[inset_-16px_0_16px_-16px_rgba(217,119,6,0.45)]"
    : "shadow-[inset_-16px_0_16px_-16px_rgba(15,23,42,0.25)]";
  return (
    <TableRow
      className={cn(
        "hover:[&>td:first-child]:bg-slate-50",
        isToday && "bg-amber-50/70 hover:[&>td:first-child]:bg-amber-50",
      )}
    >
      <TableCell
        className={cn(
          "sticky left-0 z-10 whitespace-nowrap bg-slate-50 font-semibold text-slate-900",
          "align-top px-4 py-3 text-left sm:px-6 sm:py-4",
          stickyShadow,
          isToday && "bg-amber-100/60 text-amber-900",
        )}
      >
        <div className="flex flex-col gap-2">
          <span>{day.day}</span>
          {isToday ? <TodayBadge /> : null}
        </div>
      </TableCell>
      {roomColumnDefinitions.map((column) => (
        <RoomCell key={column.id} sessions={day.rooms[column.id] ?? []} />
      ))}
    </TableRow>
  );
}

interface RoomDayEntry {
  day: string;
  isToday: boolean;
  sessions: RoomSession[];
}

function RoomDayRows({ entry }: { entry: RoomDayEntry }) {
  const { day, isToday, sessions } = entry;

  if (!sessions.length) {
    return (
      <TableRow className="border-t border-slate-100 text-sm text-slate-600">
        <TableCell
          className={cn(
            "w-40 align-top bg-slate-50 font-semibold text-slate-900",
            isToday && "bg-amber-100/60 text-amber-900",
          )}
        >
          <div className="flex flex-col gap-1">
            <span>{day}</span>
            {isToday ? <TodayBadge /> : null}
          </div>
        </TableCell>
        <TableCell colSpan={3} className="align-top text-sm italic text-slate-400">
          Aucune surveillance programmée.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {sessions.map((session, index) => {
        const highlight = getBlockHighlight(session);
        const variant = getTypeVariant(session.type);
        return (
          <TableRow
            key={`${day}-${index}`}
            className={cn(
              "border-t border-slate-100 text-sm text-slate-600",
              highlight && `${highlight.background} ${highlight.border}`,
            )}
          >
            {index === 0 ? (
              <TableCell
                rowSpan={sessions.length}
                className={cn(
                  "w-40 align-top bg-slate-50 font-semibold text-slate-900",
                  isToday && "bg-amber-100/60 text-amber-900",
                )}
              >
                <div className="flex flex-col gap-1">
                  <span>{day}</span>
                  {isToday ? <TodayBadge /> : null}
                </div>
              </TableCell>
            ) : null}
            <TableCell className="align-top">
              <div className="flex flex-col gap-1">
                {session.time ? (
                  <span className="text-sm font-medium text-slate-900">{session.time}</span>
                ) : (
                  <span className="text-sm italic text-slate-400">Horaire à confirmer</span>
                )}
                {session.label ? <BlockLabel session={session} /> : null}
              </div>
            </TableCell>
            <TableCell className="align-top">
              {session.teacher ? (
                <span className={cn("text-sm font-semibold", variant.textColor)}>
                  {session.teacher}
                </span>
              ) : (
                <span className="text-sm italic text-slate-400">Surveillant à confirmer</span>
              )}
            </TableCell>
            <TableCell className="align-top">
              <div className="flex items-start gap-2">
                {session.type ? <TypeBadge type={session.type} compact /> : null}
                <span className="text-sm text-slate-600">
                  {session.detail ?? "Détail à préciser"}
                </span>
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

function RoomOrganisationCard({
  room,
  days,
}: {
  room: string;
  days: RoomDayEntry[];
}) {
  const hasContent = days.some((entry) => entry.sessions.length);

  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h4 className="text-lg font-semibold text-slate-900">{room}</h4>
        <p className="text-sm text-slate-500">
          {hasContent
            ? "Organisation détaillée des surveillances prévues dans cette salle."
            : "Aucune surveillance n'est planifiée pour cette salle."}
        </p>
      </header>
      <div className="-mx-4 overflow-x-auto px-4">
        <Table className="min-w-full">
          <TableHead>
            <TableRow>
              <TableHeaderCell scope="col">Jour</TableHeaderCell>
              <TableHeaderCell scope="col">Créneau</TableHeaderCell>
              <TableHeaderCell scope="col">Surveillant</TableHeaderCell>
              <TableHeaderCell scope="col">Épreuve / Détail</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {days.map((entry) => (
              <RoomDayRows key={entry.day} entry={entry} />
            ))}
          </TableBody>
        </Table>
      </div>
    </article>
  );
}

export default function RoomsStatus() {
  const { activeView, container } = useDashboardContext();
  const supportSessions = useMemo(
    () => buildSupportSessionsByRoom(surveillanceSchedule),
    [],
  );
  const schedule = useMemo<RoomScheduleDay[]>(() => {
    const baseMap = new Map(roomSchedule.map((day) => [day.day, day] as const));
    const baseOrder = roomSchedule.map((day) => day.day);
    const supportOnlyDays = Array.from(supportSessions.keys()).filter(
      (day) => !baseMap.has(day),
    );
    const dayOrder = [...baseOrder, ...supportOnlyDays];
    return dayOrder.map((dayLabel) => {
      const baseDay = baseMap.get(dayLabel);
      const supportForDay = supportSessions.get(dayLabel);
      const rooms = roomColumns.reduce(
        (acc, room) => {
          const baseSessions = baseDay?.rooms[room] ?? [];
          const extraSessions = supportForDay?.get(room) ?? [];
          const combined = [...baseSessions, ...extraSessions];
          combined.sort((a, b) => getSessionSortValue(a) - getSessionSortValue(b));
          acc[room] = combined;
          return acc;
        },
        {} as Record<RoomColumn, RoomSession[]>,
      );
      return { day: dayLabel, rooms } as RoomScheduleDay;
    });
  }, [supportSessions]);
  const perRoomSchedule = useMemo(
    () =>
      roomColumnDefinitions.map((column) => ({
        room: column.label,
        days: schedule.map((day) => ({
          day: day.day,
          isToday: isDayLabelToday(day.day),
          sessions: day.rooms[column.id] ?? [],
        })),
      })),
    [schedule],
  );

  if (!container) {
    return null;
  }

  return createPortal(
    <section
      id="room-view"
      data-view-section="room"
      role="tabpanel"
      aria-labelledby="room-tab"
      tabIndex={activeView === "room" ? 0 : -1}
      aria-hidden={activeView === "room" ? "false" : "true"}
      className={`${activeView === "room" ? "" : "hidden"} space-y-6`}
    >
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900">Occupation des salles</h3>
        <p className="text-sm text-slate-500">
          Visualisez la disponibilité des salles par créneau pour garantir une répartition fluide des épreuves.
        </p>
      </div>
      <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto rounded-xl">
          <Table className="min-w-[64rem] lg:min-w-full">
            <TableHead>
              <TableRow>
                <TableHeaderCell
                  scope="col"
                  className="sticky left-0 z-20 bg-slate-100 px-4 py-3 text-slate-900 shadow-[inset_-16px_0_16px_-16px_rgba(15,23,42,0.3)] sm:px-6"
                >
                  Jour
                </TableHeaderCell>
                {roomColumnDefinitions.map((column) => (
                  <TableHeaderCell
                    key={column.id}
                    scope="col"
                    className="min-w-[11rem] whitespace-nowrap px-4 py-3 align-bottom sm:min-w-0 sm:px-6"
                  >
                    {column.label}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {schedule.length ? (
                schedule.map((day) => <RoomRow key={day.day} day={day} />)
              ) : (
                <TableRow>
                  <TableCell colSpan={roomColumns.length + 1} className="text-center text-sm text-slate-500">
                    Aucune salle programmée pour le moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent md:hidden" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent md:hidden" aria-hidden />
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Organisation détaillée par salle</h3>
        <p className="text-sm text-slate-500">
          Retrouvez les missions planifiées, les horaires et les surveillants associés pour chaque salle mobilisée.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          {perRoomSchedule.map((room) => (
            <RoomOrganisationCard key={room.room} room={room.room} days={room.days} />
          ))}
        </div>
      </div>
    </section>,
    container,
  );
}
