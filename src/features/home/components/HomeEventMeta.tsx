import type { LucideIcon } from "lucide-react";

interface HomeEventMetaProps {
  icon: LucideIcon;
  label: string;
  description?: string;
}

export default function HomeEventMeta({ icon: Icon, label, description }: HomeEventMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-slate-600">
      <Icon className="h-5 w-5 text-sky-600" aria-hidden="true" />
      <span className="text-base font-medium sm:text-lg">{label}</span>
      {description ? (
        <span className="text-sm text-slate-500 sm:text-base">{description}</span>
      ) : null}
    </div>
  );
}
