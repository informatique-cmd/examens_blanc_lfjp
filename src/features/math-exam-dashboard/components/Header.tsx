import { useMathExamData } from "../context";

export default function Header() {
  const { header } = useMathExamData();

  return (
    <header className="space-y-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <img
            alt="Logo du Lycée Français Jacques Prévert de Saly"
            className="h-16 flex-shrink-0 rounded-lg border border-slate-200 bg-white object-contain shadow-sm"
            src="https://i.imgur.com/0YmGlXO.png"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Lycée Français Jacques Prévert de Saly
            </p>
            <h1 className="text-3xl font-bold text-slate-900">{header.title}</h1>
          </div>
        </div>
      </div>
      <p className="text-lg text-slate-600">{header.date}</p>
    </header>
  );
}
