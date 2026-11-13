import React from "react";

interface HomeHeroProps {
  subtitle?: string;
  title?: string;
  description?: string;
  schoolYear?: string;
  schoolName?: string;
  schoolCity?: string;
}

export default function HomeHero({
  subtitle,
  title,
  description,
  schoolYear = "2026-2027",
  schoolName = "Lycée Français Jacques Prévert",
  schoolCity = "Saly, Sénégal",
}: HomeHeroProps) {
  return (
    <div className="max-w-4xl space-y-5 text-center mx-auto">
      {/* Centered combined LFJP + AEFE institutional banner */}
      <div className="flex w-full items-center justify-center">
        <div className="px-5 py-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-center max-w-xl">
          <img
            src="/assets/aistudio/image_4a9bdc36.png"
            alt={`${schoolName} • Établissement partenaire AEFE`}
            className="h-20 sm:h-24 w-auto max-w-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo-lfjp-aefe.png";
            }}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Dynamic School Year & Institutional Kicker */}
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0F2A56]">
          <span className="text-[#c92a2a] font-extrabold">LFJP</span>
          <span className="text-slate-300">•</span>
          <span>{schoolCity}</span>
          <span className="text-slate-300">•</span>
          <span className="text-[#0F2A56] tabular-nums">Session {schoolYear}</span>
        </div>

        <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.16em] text-[#c92a2a]">
          {subtitle || `${schoolName} de ${schoolCity} • Réseau AEFE`}
        </p>

        <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0F2A56] tracking-tight leading-tight">
          {title || "Organisation des Examens Blancs — Lycée Français Jacques Prévert"}
        </h1>

        <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl mx-auto">
          {description ||
            "Retrouvez sur ce portail officiel le calendrier des épreuves, les consignes de la direction, votre affectation de salle et votre convocation individuelle."}
        </p>
      </div>
    </div>
  );
}
