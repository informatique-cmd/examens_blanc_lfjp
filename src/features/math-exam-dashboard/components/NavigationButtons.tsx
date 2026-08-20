import { Link } from "react-router-dom";
import { Home } from "lucide-react";

interface BackToHomeButtonProps {
  to?: string;
}

export function BackToHomeButton({ to = "/" }: BackToHomeButtonProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:border-slate-300 hover:bg-slate-100"
    >
      <Home className="h-4 w-4" aria-hidden="true" />
      Accueil
    </Link>
  );
}
