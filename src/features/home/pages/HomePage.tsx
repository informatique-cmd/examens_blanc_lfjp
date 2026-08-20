import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Calculator,
  FileCheck2,
  GraduationCap,
  Mic,
  type LucideIcon,
} from "lucide-react";

import HomeCallToActionCard from "../components/HomeCallToActionCard";
import HomeEventMeta from "../components/HomeEventMeta";
import HomeHero from "../components/HomeHero";
import HomeLayout from "../components/HomeLayout";
import type { HomeCalloutEntry } from "../constants";
import { HOME_CALLOUT_ENTRIES, HOME_PAGE_CONTENT } from "../constants";
import { supabase } from "../../../shared/lib/supabase";

interface PublishedSchoolYear {
  id: string;
  label: string;
}

export default function HomePage() {
  const [publishedYears, setPublishedYears] = useState<PublishedSchoolYear[]>([]);

  useEffect(() => {
    if (!supabase) return;

    void supabase
      .from("school_years")
      .select("id, label")
      .eq("is_published", true)
      .order("label", { ascending: false })
      .then(({ data }) => {
        setPublishedYears(data ?? []);
      });
  }, []);

  const calloutEntries = [...HOME_CALLOUT_ENTRIES].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const iconByCategory: Record<HomeCalloutEntry["category"], LucideIcon> = {
    general: GraduationCap,
    math: Calculator,
    oral: Mic,
    surveillance: FileCheck2,
  };

  const defaultIconBackground = "bg-gradient-to-br from-sky-500 to-indigo-500";
  const oralDnbIconBackground = "bg-gradient-to-r from-blue-600 via-white to-red-600 text-slate-900";

  return (
    <HomeLayout>
      <HomeHero
        logos={HOME_PAGE_CONTENT.logos}
        subtitle={HOME_PAGE_CONTENT.subtitle}
        title={HOME_PAGE_CONTENT.title}
        description={HOME_PAGE_CONTENT.description}
      />

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
        {calloutEntries.map((entry) => {
          const Icon = iconByCategory[entry.category];
          return (
            <HomeCallToActionCard
              key={entry.to}
              to={entry.to}
              icon={Icon}
              iconLabel={entry.iconLabel}
              subtitle={entry.subtitle}
              title={entry.title}
              footerLabel={entry.footerLabel}
              meta={<HomeEventMeta icon={CalendarDays} label={entry.dateLabel} description="" />}
              iconBackgroundClassName={
                entry.to === "/examens-blancs/oraux-dnb-2026-05-20" ||
                entry.to === "/surveillances-bac-dnb"
                  ? oralDnbIconBackground
                  : defaultIconBackground
              }
            />
          );
        })}
      </div>

      {publishedYears.length > 0 ? (
        <section className="w-full max-w-5xl space-y-4 text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Données publiées</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Années scolaires disponibles</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedYears.map((year) => (
              <Link to={`/annees/${year.id}`} key={year.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 transition hover:border-emerald-400 hover:bg-emerald-100">
                <p className="text-sm font-semibold text-emerald-700">Année publiée</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{year.label}</h3>
                <p className="mt-3 text-sm font-semibold text-emerald-800">Voir les examens →</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </HomeLayout>
  );
}
