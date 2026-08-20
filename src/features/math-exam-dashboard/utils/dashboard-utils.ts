import type {
  AccommodationGroup,
  DashboardTab,
  KeyFigure,
  RoomColumn,
  RoomScheduleDay,
  RoomSession,
  SurveillanceMission,
  TypeVariant,
} from "../data";

export type DashboardView = DashboardTab["id"];

export interface TeacherScheduleGroup {
  teacher: string;
  missions: SurveillanceMission[];
}

export interface BlockHighlight {
  background: string;
  border: string;
  badgeBackground: string;
  badgeText: string;
}

export interface DayScheduleEntry {
  room: string;
  teacher?: string;
  detail?: string;
  type?: SurveillanceMission["type"];
  highlight?: boolean | null;
  time?: string;
  label?: string;
}

export interface DaySlot {
  key: string;
  time: string | null;
  label: string | null;
  entries: DayScheduleEntry[];
}

export interface DaySchedule {
  day: string;
  slots: DaySlot[];
}

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

export const normalizeTeacherName = (name: string): string =>
  isNonEmptyString(name) ? name.trim() : "À assigner";

const extractTeacherAssignments = (rawTeacher: string): string[] => {
  const normalizedTeacher = normalizeTeacherName(rawTeacher);
  const hasMultipleTeachers = rawTeacher.includes(",");

  if (!hasMultipleTeachers) {
    return [normalizedTeacher];
  }

  const teacherList = rawTeacher
    .split(",")
    .map((entry) => normalizeTeacherName(entry))
    .filter((entry) => entry !== "À assigner");

  if (!teacherList.length) {
    return [normalizedTeacher];
  }

  return Array.from(new Set(teacherList));
};

export const withFallback = <T>(value: T | null | undefined, fallback: T): T =>
  value == null || (typeof value === "string" && value === "") ? fallback : value;

export const parseDuration = (duration: string | undefined | null): number => {
  if (!duration) {
    return 0;
  }
  const [hours = 0, minutes = 0, seconds = 0] = duration.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

export const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (hours) {
    parts.push(`${hours}\u202fh`);
  }
  if (minutes) {
    parts.push(`${minutes}\u202fmin`);
  }
  return parts.length ? parts.join(" ") : "0 min";
};

export const getTypeVariant = (
  typeVariants: Record<string, TypeVariant>,
  type?: string,
): TypeVariant => typeVariants[type ?? ""] ?? typeVariants.default;

export const buildTeacherSchedule = (
  schedule: SurveillanceMission[],
): TeacherScheduleGroup[] => {
  const groups = new Map<string, SurveillanceMission[]>();
  schedule.forEach((mission) => {
    const teacherAssignments = extractTeacherAssignments(mission.teacher);

    teacherAssignments.forEach((teacher) => {
      const current = groups.get(teacher) ?? [];
      current.push({ ...mission, teacher });
      groups.set(teacher, current);
    });
  });

  return Array.from(groups.entries())
    .map(([teacher, missions]) => ({ teacher, missions }))
    .sort((a, b) => {
      if (a.teacher === "À assigner") {
        return 1;
      }
      if (b.teacher === "À assigner") {
        return -1;
      }
      return a.teacher.localeCompare(b.teacher, "fr", { sensitivity: "base" });
    });
};

const extractStartHour = (time: string | null | undefined): number | null => {
  if (!time) {
    return null;
  }
  const match = time.match(/(\d{1,2})h/);
  if (!match) {
    return null;
  }
  return Number(match[1]);
};

const capitalizeWord = (value: string): string => {
  if (!isNonEmptyString(value)) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export const getBlockHighlight = (
  session: Pick<RoomSession, "label" | "time">,
): BlockHighlight | null => {
  const normalizedLabel = withFallback(session.label, "").toLowerCase();
  const startHour = extractStartHour(session.time);
  if (normalizedLabel.includes("matin") || (startHour !== null && startHour < 12)) {
    return {
      background: "bg-sky-50",
      border: "border-sky-200",
      badgeBackground: "bg-sky-200/70",
      badgeText: "text-sky-900",
    };
  }
  if (
    normalizedLabel.includes("après") ||
    normalizedLabel.includes("apres") ||
    (startHour !== null && startHour >= 12)
  ) {
    return {
      background: "bg-rose-50",
      border: "border-rose-200",
      badgeBackground: "bg-rose-200/70",
      badgeText: "text-rose-900",
    };
  }
  return null;
};

const parseDayParts = (label: string): { day: number; month: number } | null => {
  const match = label.match(/(\d{1,2})\/(\d{1,2})/);
  if (!match) {
    return null;
  }
  return { day: Number(match[1]), month: Number(match[2]) };
};

const parseDatetimeParts = (datetime: string): { day: number; month: number } | null =>
  parseDayParts(datetime);

const isTodayFromParts = (parts: { day: number; month: number } | null): boolean => {
  if (!parts) {
    return false;
  }
  const now = new Date();
  return now.getDate() === parts.day && now.getMonth() + 1 === parts.month;
};

export const isDayLabelToday = (label: string): boolean =>
  isTodayFromParts(parseDayParts(label));

export const isDatetimeToday = (datetime: string): boolean =>
  isTodayFromParts(parseDatetimeParts(datetime));

interface SupportMissionEntry {
  dayLabel: string;
  timeRange: string | null;
  teacher: string;
  detail: string;
  type: SurveillanceMission["type"];
  roomLabel: string;
  blockLabel: string;
  rooms: RoomColumn[];
}

const supportRoomNumberMap: Record<string, RoomColumn> = {
  "9": "S9 PRIO / EPS",
  "10": "S10",
  "11": "S11",
  "12": "S12",
  "13": "S13",
  "14": "S14",
  "15": "S15",
  "16": "S16",
};

const extractSupportRooms = (value: string): RoomColumn[] => {
  if (!isNonEmptyString(value)) {
    return [];
  }
  const matches = value.match(/\d{1,2}/g);
  if (!matches) {
    return [];
  }
  return matches
    .map((match) => supportRoomNumberMap[match])
    .filter((room): room is RoomColumn => Boolean(room));
};

const parseSupportMission = (
  mission: SurveillanceMission,
): SupportMissionEntry | null => {
  if (mission.type !== "support" || !isNonEmptyString(mission.datetime)) {
    return null;
  }
  const match = mission.datetime.match(
    /([A-Za-zÀ-ÿ]+)\s+(\d{1,2}\/\d{1,2})\s+à\s+(\d{1,2})h(\d{2})/i,
  );
  if (!match) {
    return null;
  }
  const [, rawDayName, datePart, hourPart, minutePart] = match;
  const startHour = hourPart.padStart(2, "0");
  const startMinute = minutePart.padStart(2, "0");
  const dayLabel = `${capitalizeWord(rawDayName)} ${datePart}`;
  const startTime = `${startHour}h${startMinute}`;
  const durationSeconds = parseDuration(mission.duration);
  let endTime: string | null = null;
  if (durationSeconds) {
    const startTotalMinutes = Number(startHour) * 60 + Number(startMinute);
    const endTotalMinutes = startTotalMinutes + Math.round(durationSeconds / 60);
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    endTime = `${String(endHour).padStart(2, "0")}h${String(endMinute).padStart(2, "0")}`;
  }
  const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;
  return {
    dayLabel,
    timeRange,
    teacher: normalizeTeacherName(mission.teacher),
    detail: mission.mission,
    type: mission.type,
    roomLabel: "Support",
    blockLabel: "Support",
    rooms: extractSupportRooms(mission.room),
  };
};

export const buildDaySchedule = (
  schedule: RoomScheduleDay[],
  missions: SurveillanceMission[],
): DaySchedule[] => {
  const dayMap = new Map<string, { day: string; slots: DaySlot[]; slotMap: Map<string, DaySlot> }>();
  const dayOrder: string[] = [];

  const ensureDayEntry = (day: string) => {
    if (!dayMap.has(day)) {
      dayMap.set(day, { day, slots: [], slotMap: new Map() });
      dayOrder.push(day);
    }
    return dayMap.get(day)!;
  };

  const addSlotEntry = (
    day: string,
    slotKey: { key: string; time: string | null; label: string | null },
    entry: DayScheduleEntry,
  ) => {
    const dayEntry = ensureDayEntry(day);
    if (!dayEntry.slotMap.has(slotKey.key)) {
      const slot: DaySlot = {
        key: slotKey.key,
        time: slotKey.time,
        label: slotKey.label,
        entries: [],
      };
      dayEntry.slotMap.set(slotKey.key, slot);
      dayEntry.slots.push(slot);
    }
    dayEntry.slotMap.get(slotKey.key)!.entries.push(entry);
  };

  schedule.forEach(({ day, rooms }) => {
    (Object.entries(rooms) as [string, RoomSession[]][]).forEach(([room, sessions]) => {
      sessions.forEach((session) => {
        const key = session.time ?? session.label ?? "Horaire à confirmer";
        addSlotEntry(
          day,
          { key, time: session.time ?? null, label: session.label ?? null },
          {
            room,
            teacher: session.teacher,
            detail: session.detail,
            type: session.type,
            highlight: session.highlight ?? null,
            time: session.time,
            label: session.label,
          },
        );
      });
    });
  });

  missions
    .map(parseSupportMission)
    .filter((entry): entry is SupportMissionEntry => Boolean(entry))
    .forEach((support) => {
      const key = support.timeRange ?? support.blockLabel ?? "Support";
      addSlotEntry(
        support.dayLabel,
        { key, time: support.timeRange, label: support.blockLabel },
        {
          room: support.roomLabel,
          teacher: support.teacher,
          detail: support.detail,
          type: support.type,
          highlight: null,
          time: support.timeRange ?? undefined,
          label: support.blockLabel,
        },
      );
    });

  return dayOrder.map((day) => {
    const { slots } = dayMap.get(day)!;
    slots.sort((a, b) => {
      const hourA = extractStartHour(a.time);
      const hourB = extractStartHour(b.time);
      if (hourA !== null && hourB !== null) {
        return hourA - hourB;
      }
      if (hourA !== null) {
        return -1;
      }
      if (hourB !== null) {
        return 1;
      }
      return withFallback(a.label, "").localeCompare(withFallback(b.label, ""), "fr", {
        sensitivity: "base",
      });
    });
    return { day, slots };
  });
};

export const buildSupportSessionsByRoom = (
  missions: SurveillanceMission[],
): Map<string, Map<RoomColumn, RoomSession[]>> => {
  const supportSessions = new Map<string, Map<RoomColumn, RoomSession[]>>();

  missions
    .map(parseSupportMission)
    .filter((entry): entry is SupportMissionEntry => Boolean(entry))
    .forEach((entry) => {
      if (!entry.rooms.length) {
        return;
      }
      const daySessions = supportSessions.get(entry.dayLabel) ?? new Map<RoomColumn, RoomSession[]>();
      entry.rooms.forEach((room) => {
        const sessions = daySessions.get(room) ?? [];
        sessions.push({
          time: entry.timeRange ?? undefined,
          teacher: entry.teacher,
          detail: entry.detail,
          type: entry.type,
          label: entry.blockLabel,
        });
        daySessions.set(room, sessions);
      });
      supportSessions.set(entry.dayLabel, daySessions);
    });

  return supportSessions;
};

export type {
  AccommodationGroup,
  DashboardTab,
  KeyFigure,
  RoomScheduleDay,
  RoomSession,
  SurveillanceMission,
  TypeVariant,
};
