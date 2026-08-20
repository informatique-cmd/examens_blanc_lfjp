import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface HomeCallToActionCardProps {
  to: string;
  icon: LucideIcon;
  iconLabel: string;
  title: string;
  subtitle?: string;
  footerLabel: string;
  meta?: ReactNode;
  iconBackgroundClassName?: string;
}

export default function HomeCallToActionCard({
  to,
  icon: Icon,
  iconLabel,
  title,
  subtitle,
  footerLabel,
  meta,
  iconBackgroundClassName = "bg-gradient-to-br from-sky-500 to-indigo-500",
}: HomeCallToActionCardProps) {
  const isExternal = to.startsWith("http://") || to.startsWith("https://");

  const cardContent = (
    <>
      <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-sky-200/60 blur-3xl transition-opacity duration-300 group-hover:opacity-60" />
      <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-indigo-200/70 blur-3xl transition-opacity duration-300 group-hover:opacity-60" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl ${iconBackgroundClassName} text-white shadow-lg`}>
          <Icon className="h-10 w-10 flex-shrink-0" strokeWidth={1.6} aria-hidden="true" />
        </div>

        <div className="space-y-3">
          {subtitle ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {subtitle}
            </p>
          ) : null}
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
          {meta}
        </div>
      </div>

      <div className="relative mt-6 flex items-center gap-3 text-sky-700">
        <span className="text-sm font-semibold uppercase tracking-wide">{footerLabel}</span>
        <span className="text-lg" aria-hidden="true">
          →
        </span>
      </div>
    </>
  );

  const className =
    "group relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl sm:p-10";

  if (isExternal) {
    return (
      <a href={to} className={className} aria-label={iconLabel}>
        {cardContent}
      </a>
    );
  }

  return (
    <Link to={to} className={className} aria-label={iconLabel}>
      {cardContent}
    </Link>
  );
}
