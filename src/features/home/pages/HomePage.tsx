import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Calculator,
  FileCheck2,
  GraduationCap,
  Mic,
  AlertCircle,
  Info,
  CheckCircle2,
  Lock,
  type LucideIcon,
} from "lucide-react";

import HomeCallToActionCard from "../components/HomeCallToActionCard";
import HomeEventMeta from "../components/HomeEventMeta";
import HomeHero from "../components/HomeHero";
import HomeLayout from "../components/HomeLayout";
import type { HomeCalloutCategory } from "../constants";
import { supabase } from "../../../shared/lib/supabase";
import { useCmsData } from "../../../shared/services/cms-store";

interface PublishedSchoolYear {
  id: string;
  label: string;
}

export default function HomePage() {
  const { data: cmsData } = useCmsData();
  const [publishedYears, setPublishedYears] = useState<PublishedSchoolYear[]>([]);

  useEffect(() => {
    if (!supabase) {
      if (cmsData.siteInfo.schoolYear) {
        setPublishedYears([{ id: "annee-courante", label: cmsData.siteInfo.schoolYear }]);
      }
      return;
    }

    const client = supabase;
    async function loadYears() {
      try {
        const { data } = await client
          .from("school_years")
          .select("id, label")
          .eq("is_published", true)
          .order("label", { ascending: false });

        if (data && data.length > 0) {
          setPublishedYears(data);
        } else if (cmsData.siteInfo.schoolYear) {
          setPublishedYears([{ id: "annee-courante", label: cmsData.siteInfo.schoolYear }]);
        }
      } catch {
        if (cmsData.siteInfo.schoolYear) {
          setPublishedYears([{ id: "annee-courante", label: cmsData.siteInfo.schoolYear }]);
        }
      }
    }

    void loadYears();
  }, [cmsData.siteInfo.schoolYear]);

  const calloutEntries = cmsData.callouts
    .filter((entry) => entry.isPublished)
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const iconByCategory: Record<HomeCalloutCategory, LucideIcon> = {
    general: GraduationCap,
    math: Calculator,
    oral: Mic,
    surveillance: FileCheck2,
  };

  const defaultIconBackground = "bg-gradient-to-br from-sky-500 to-indigo-500";
  const oralDnbIconBackground = "bg-gradient-to-r from-blue-600 via-white to-red-600 text-slate-900";

  const alertBannerConfig = {
    info: {
      bg: "bg-sky-50 border-sky-200 text-sky-900",
      icon: <Info className="h-5 w-5 text-sky-600 flex-shrink-0" />,
    },
    warning: {
      bg: "bg-amber-50 border-amber-200 text-amber-900",
      icon: <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
    },
    urgent: {
      bg: "bg-rose-50 border-rose-200 text-rose-900",
      icon: <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />,
    },
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />,
    },
  };

  return (
    <HomeLayout>
      <HomeHero
        logos={cmsData.siteInfo.logos}
        subtitle={cmsData.siteInfo.subtitle}
        title={cmsData.siteInfo.title}
        description={cmsData.siteInfo.description}
      />

      {cmsData.siteInfo.bannerAlert?.enabled ? (
        <div
          className={`flex w-full max-w-5xl items-center gap-3 rounded-2xl border p-4 text-left shadow-sm ${
            alertBannerConfig[cmsData.siteInfo.bannerAlert.type || "info"].bg
          }`}
        >
          {alertBannerConfig[cmsData.siteInfo.bannerAlert.type || "info"].icon}
          <div>
            <p className="font-semibold">{cmsData.siteInfo.bannerAlert.title}</p>
            <p className="text-sm opacity-90">{cmsData.siteInfo.bannerAlert.message}</p>
          </div>
        </div>
      ) : null}

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
        {calloutEntries.map((entry) => {
          const Icon = iconByCategory[entry.category] || GraduationCap;
          return (
            <HomeCallToActionCard
              key={entry.id || entry.to}
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

      <footer className="mt-12 flex w-full max-w-5xl flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 text-xs text-slate-400 sm:flex-row">
        <p>Lycée Français Jacques Prévert — Saly, Sénégal • Réseau AEFE</p>
        <div>
          <Link
            to="/admin"
            title="Espace réservé à l'administration"
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition"
          >
            <Lock className="h-3 w-3 opacity-60" />
            <span>Accès administration</span>
          </Link>
        </div>
      </footer>
    </HomeLayout>
  );
}
