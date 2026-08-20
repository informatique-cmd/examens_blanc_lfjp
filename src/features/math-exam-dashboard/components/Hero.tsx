import { AlertTriangle, Info } from "lucide-react";

import { useMathExamData } from "../context";
import type { AccommodationGroup, KeyFigure } from "../utils";

const InfoIcon = Info;
const AlertTriangleIcon = AlertTriangle;

function KeyFigureItem({ figure }: { figure: KeyFigure }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-4xl font-semibold text-blue-600">
        {figure.value}
        {figure.unit ? <span className="ml-1 text-2xl text-blue-500">{figure.unit}</span> : null}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-600">{figure.label}</p>
      {figure.extra ? (
        <p className="mt-1 text-xs text-slate-400">{figure.extra}</p>
      ) : null}
    </div>
  );
}

function KeyFiguresCard({ figures }: { figures: KeyFigure[] }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-slate-50 p-6 shadow-lg ring-1 ring-blue-100/60">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl"
      />
      <div className="relative mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
          <InfoIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Informations Clés</h3>
          <p className="text-sm text-slate-500">
            Un aperçu rapide des indicateurs de suivi de l'examen blanc.
          </p>
        </div>
      </div>
      <div className="relative mt-auto grid grid-cols-2 gap-3">
        {figures.map((figure) => (
          <KeyFigureItem key={`${figure.label}-${figure.value}`} figure={figure} />
        ))}
      </div>
    </article>
  );
}

function normalizeAccommodationStudent(student: AccommodationGroup["students"][number]) {
  return typeof student === "string" ? { name: student } : student;
}

function AccommodationCard({ group }: { group: AccommodationGroup }) {
  const { Icon, bg, color } = group.icon;
  return (
    <article className="relative flex h-full flex-col rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-slate-100 p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-slate-200/50 blur-3xl"
      />
      <div className="relative flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
          <Icon className={`${color} h-6 w-6`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
          <p className="text-sm text-slate-500">{group.description}</p>
        </div>
      </div>
      <div className="relative mt-6 flex flex-1 flex-col">
        <div className="flex flex-wrap gap-2">
          {group.students.map((student) => {
            const normalizedStudent = normalizeAccommodationStudent(student);
            const hasDetails = Boolean(normalizedStudent.details?.trim());
            const tooltipId = hasDetails
              ? `accommodation-tooltip-${group.title.replace(/[^a-zA-Z0-9]+/g, "-")}-${normalizedStudent.name.replace(/[^a-zA-Z0-9]+/g, "-")}`
              : undefined;

            return (
              <span key={`${group.title}-${normalizedStudent.name}`} className="group relative inline-flex">
                <span
                  className="rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
                  title={normalizedStudent.details ?? undefined}
                  tabIndex={hasDetails ? 0 : -1}
                  aria-describedby={tooltipId}
                >
                  {normalizedStudent.name}
                </span>
                {hasDetails ? (
                  <span
                    id={tooltipId}
                    role="tooltip"
                    className="pointer-events-none absolute left-1/2 top-[calc(100%+0.35rem)] z-10 w-64 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-50 opacity-0 shadow-xl ring-1 ring-black/5 transition duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                  >
                    {normalizedStudent.details}
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
        {group.note ? (
          <div
            className={`mt-6 flex items-start gap-3 rounded-2xl bg-amber-50/80 p-4 text-sm font-medium text-amber-800 shadow-inner ring-1 ring-amber-100 ${
              group.noteClasses ?? ""
            }`}
          >
            <AlertTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
            <span>{group.note}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function Hero() {
  const { keyFigures, accommodationGroups } = useMathExamData();

  return (
    <section aria-labelledby="overview-title" className="space-y-4">
      <h2 id="overview-title" className="sr-only">
        Informations générales
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KeyFiguresCard figures={keyFigures} />
        {accommodationGroups.map((group) => (
          <AccommodationCard key={group.title} group={group} />
        ))}
      </div>
    </section>
  );
}
