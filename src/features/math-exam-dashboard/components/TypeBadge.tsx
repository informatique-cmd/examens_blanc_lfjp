import { useMathExamData } from "../context";
import type { SurveillanceMission } from "../utils";
import { getTypeVariant } from "../utils";

export default function TypeBadge({
  type,
  compact = false,
}: {
  type?: SurveillanceMission["type"] | string;
  compact?: boolean;
}) {
  const { typeVariants } = useMathExamData();

  if (!type) {
    return null;
  }
  const variant = getTypeVariant(typeVariants, type);
  const textClasses = compact
    ? "text-[10px] font-semibold tracking-wide uppercase"
    : "text-xs font-semibold";
  const padding = compact ? "px-2 py-0.5" : "px-2.5 py-1";
  const Icon = variant.icon;
  const iconSize = compact ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${padding} ${textClasses} ${variant.badgeClasses}`}
    >
      <Icon className={`${iconSize} ${variant.iconColor}`} />
      {variant.label}
    </span>
  );
}
