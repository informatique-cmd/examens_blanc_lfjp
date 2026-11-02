import React from "react";

interface HomeHeroLogo {
  src: string;
  alt?: string;
}

interface HomeHeroProps {
  logos?: HomeHeroLogo[];
  subtitle?: string;
  title?: string;
  description?: string;
  schoolYear?: string;
}

export default function HomeHero({
  logos,
  subtitle,
  title,
  description,
  schoolYear = "2025-2026",
}: HomeHeroProps) {
  // If logos not supplied or empty, fallback to official LFJP + AEFE
  const displayLogos =
    logos && logos.length > 0
      ? logos
      : [
          {
            src: "/assets/aistudio/logo-lfjp_62451311.png",
            alt: "Lycée Français Jacques Prévert - Saly, Sénégal",
          },
          {
            src: "https://aefe.fr/sites/default/files/asset/document/logo-aefe-bleu-et-orange_0.svg",
            alt: "Agence pour l'Enseignement Français à l'Étranger",
          },
        ];

  return (
    <div className="max-w-4xl space-y-5 text-center mx-auto">
      {/* Centered combined LFJP + AEFE institutional banner */}
      <div className="flex w-full items-center justify-center">
        <div className="px-5 py-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-center max-w-xl transition hover:shadow-xs">
          <img
            src="/assets/aistudio/image_4a9bdc36.png"
            alt="Lycée Français Jacques Prévert • Établissement partenaire AEFE"
            className="h-20 sm:h-24 md:h-28 w-auto max-w-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo-lfjp-aefe.png";
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {/* Dynamic School Year & Institutional Kicker */}
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#002060]">
          <span className="text-red-600 font-black">LFJP</span>
          <span className="text-slate-300">•</span>
          <span>Saly Portudal, Sénégal</span>
          <span className="text-slate-300">•</span>
          <span className="text-[#002060]">Session {schoolYear}</span>
        </div>

        <p className="text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-red-600">
          {subtitle || "Lycée Français Jacques Prévert • Réseau AEFE"}
        </p>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#002060] tracking-tight leading-tight">
          {title || "Organisation des Examens & Épreuves Blanches"}
        </h1>

        <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl mx-auto">
          {description ||
            "Portail officiel d'information : consultez les calendriers d'épreuves, les créneaux officiels (+1/3 temps), la répartition nominative des salles, les surveillances et téléchargez directement votre convocation individuelle."}
        </p>
      </div>
    </div>
  );
}
