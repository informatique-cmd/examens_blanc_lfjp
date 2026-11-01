import React from "react";

interface HomeHeroLogo {
  src: string;
  alt?: string;
}

interface HomeHeroProps {
  logos?: HomeHeroLogo[];
  subtitle: string;
  title: string;
  description: string;
}

export default function HomeHero({
  logos,
  subtitle,
  title,
  description,
}: HomeHeroProps) {
  const hasLogos = logos && logos.length > 0;

  return (
    <div className="max-w-4xl space-y-6 text-center mx-auto">
      {/* Logos Centered as before */}
      {hasLogos ? (
        <div className="flex w-full flex-wrap items-center justify-center gap-4 sm:gap-6">
          {logos?.map((logo, idx) => (
            <img
              key={logo.src || idx}
              src={logo.src}
              alt={logo.alt ?? "Logo Établissement"}
              className="h-20 sm:h-24 w-auto rounded-xl border border-slate-200 bg-white p-2 object-contain shadow-xs"
              loading="lazy"
            />
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
          {subtitle || "Lycée Français Jacques Prévert de Saly • Réseau AEFE"}
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          {title || "Organisation des Examens & Épreuves Blanches"}
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl mx-auto">
          {description || "Consultez en temps réel les sessions d'examens programmées, le calendrier des épreuves par créneau, les horaires officiels (+1/3 temps), la répartition des salles et les surveillants affectés."}
        </p>
      </div>
    </div>
  );
}
