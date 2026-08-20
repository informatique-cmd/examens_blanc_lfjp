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
    <div className="max-w-4xl space-y-6">
      {hasLogos ? (
        <div className="flex w-full flex-wrap items-center justify-center gap-4 sm:gap-6">
          {logos?.map((logo) => (
            <img
              key={logo.src}
              src={logo.src}
              alt={logo.alt ?? ""}
              className="h-24 w-auto rounded-lg border border-slate-200 bg-white object-contain shadow-sm sm:h-28"
              loading="lazy"
            />
          ))}
        </div>
      ) : null}
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {subtitle}
      </p>
      <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">{title}</h1>
      <p className="text-lg leading-relaxed text-slate-600 sm:text-xl">{description}</p>
    </div>
  );
}
