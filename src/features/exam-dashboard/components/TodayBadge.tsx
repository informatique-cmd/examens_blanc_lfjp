import { todayIcon } from "../data";

const TodayIcon = todayIcon;

export default function TodayBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
      <TodayIcon className="h-3.5 w-3.5 text-amber-700" />
      Aujourd'hui
    </span>
  );
}
