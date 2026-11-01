import React, { type PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { School, Lock } from "lucide-react";

export default function HomeLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Institutional Header (Pure Public Brand, no admin buttons or diffusion badges) */}
      <header className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-90 transition group text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-sm shadow-2xs group-hover:bg-blue-800 transition">
              <School className="h-5 w-5" />
            </div>
            <div>
              <span className="font-black text-sm sm:text-base text-slate-900 tracking-tight block leading-tight">
                Lycée Français Jacques Prévert
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                Saly, Sénégal • Réseau des Établissements AEFE
              </span>
            </div>
          </Link>

          <span className="text-xs font-semibold text-slate-400 hidden sm:block">
            Année scolaire 2025-2026
          </span>
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
