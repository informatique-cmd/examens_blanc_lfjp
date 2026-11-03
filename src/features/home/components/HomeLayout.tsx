import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

interface HomeLayoutProps {
  children?: React.ReactNode;
  schoolYear?: string;
}

export default function HomeLayout({ children, schoolYear = "2026-2027" }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Institutional Header */}
      <header className="bg-white border-b border-slate-200 shadow-2xs relative">
        {/* Subtle institutional tricolor top hairline */}
        <div className="h-1 w-full bg-gradient-to-r from-[#002060] via-[#002060] to-[#c92a2a]" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3.5 hover:opacity-95 transition group text-left"
          >
            <div className="h-12 w-12 bg-white rounded-xl border border-slate-200/80 p-1 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src="/assets/aistudio/logo-lfjp_62451311.png"
                alt="Lycée Français Jacques Prévert"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
                }}
              />
            </div>
            <div>
              <span className="font-black text-sm sm:text-base text-[#002060] tracking-tight block leading-tight">
                Lycée Français Jacques Prévert
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">
                Saly, Sénégal • Réseau des Établissements AEFE
              </span>
            </div>
          </Link>

          <div className="text-right flex flex-col items-end">
            <span className="text-xs sm:text-sm font-bold text-[#002060] block">
              Année scolaire {schoolYear}
            </span>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Portail Officiel des Examens
            </span>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center gap-8">
        {children}
      </main>

      {/* Institutional Footer (discreet admin access at the bottom) */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-bold text-slate-800">
              Lycée Français Jacques Prévert de Saly Portudal (Sénégal)
            </p>
            <p className="text-[11px] text-slate-500">
              Établissement homologué par le Ministère français de l'Éducation nationale • Conventionné AEFE
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="text-slate-400 hover:text-slate-700 font-medium text-[11px] flex items-center gap-1.5 transition"
              title="Accès réservé au secrétariat des examens et à la direction"
            >
              <Lock className="h-3 w-3 opacity-60" />
              <span>Espace Direction & Examens</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
