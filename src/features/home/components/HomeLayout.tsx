import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

interface HomeLayoutProps {
  children?: React.ReactNode;
  schoolYear?: string;
  schoolName?: string;
  schoolCity?: string;
  hideChromeOnPrint?: boolean;
}

export default function HomeLayout({
  children,
  schoolYear = "2026-2027",
  schoolName = "Lycée Français Jacques Prévert",
  schoolCity = "Saly, Sénégal",
  hideChromeOnPrint = false,
}: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-[#0F2A56] print:bg-white">
      {/* Top Institutional Header */}
      <header className={`bg-white border-b border-slate-200 shadow-2xs relative ${hideChromeOnPrint ? "print:hidden" : ""}`}>
        {/* Subtle institutional tricolor top hairline */}
        <div className="h-1 w-full bg-gradient-to-r from-[#0F2A56] via-[#1D4ED8] to-[#c92a2a]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3.5 hover:opacity-95 transition group text-left min-w-0"
          >
            <div className="h-11 w-11 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src="/assets/aistudio/logo-lfjp_62451311.png"
                alt={schoolName}
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
                }}
              />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-base text-[#0F2A56] tracking-tight block leading-tight truncate">
                {schoolName}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block truncate">
                {schoolCity} • Réseau des Établissements AEFE
              </span>
            </div>
          </Link>

          <div className="text-right flex flex-col items-end shrink-0">
            <span className="text-xs sm:text-sm font-bold text-[#0F2A56] block tabular-nums">
              Année scolaire {schoolYear}
            </span>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Portail Officiel des Examens
            </span>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className={`flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col items-center gap-7 ${hideChromeOnPrint ? "print:p-0 print:max-w-none print:gap-0" : ""}`}>
        {children}
      </main>

      {/* Institutional Footer (discreet admin access at the bottom) */}
      <footer className={`bg-white border-t border-slate-200 mt-auto py-7 ${hideChromeOnPrint ? "print:hidden" : ""}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-bold text-[#0F2A56]">
              {schoolName} — {schoolCity}
            </p>
            <p className="text-[11px] text-slate-500">
              Établissement homologué par le Ministère français de l&apos;Éducation nationale • Conventionné AEFE
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="text-slate-500 hover:text-[#0F2A56] font-semibold text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
              title="Accès réservé au secrétariat des examens et à la direction"
            >
              <Lock className="h-3 w-3 opacity-75" />
              <span>Espace Direction &amp; Examens</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
