import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  FolderOpen,
  Users,
  School,
  GraduationCap,
  Accessibility,
  FolderArchive,
  Grid,
  Calendar,
  Layers,
  ArrowRightCircle,
  Mail,
  Award,
  Package,
  BarChart3,
  DownloadCloud,
  FileSpreadsheet,
  FileCheck2,
  PieChart,
  Sparkles,
  Eye,
  UploadCloud,
  Save,
  FolderInput,
  ChevronDown,
  ChevronRight,
  Clock,
  ClipboardList,
  Shuffle,
  Printer,
  CalendarRange,
  FileText,
} from "lucide-react";

export type AdminSection =
  | "dashboard"
  | "config"
  | "data-eleves"
  | "data-salles"
  | "data-profs"
  | "data-amenagements"
  | "sec-pochettes"
  | "sessions-examens"
  | "creneaux-epreuves"
  | "organization"
  | "planning-rooms"
  | "planning-profs"
  | "view-edt"
  | "convoc-eleves"
  | "convoc-profs"
  | "corr-repartition"
  | "res-import"
  | "res-analyse"
  | "res-releves"
  | "res-datavis"
  | "res-simul"
  | "vitrine-publish"
  | "deployment";

interface AdminSidebarProps {
  currentSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  openSubmenus: Record<string, boolean>;
  onToggleSubmenu: (key: string) => void;
  onSaveProject: () => void;
  onLoadProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDefaults: () => void;
  candidatesCount: number;
  roomsCount: number;
  teachersCount: number;
  examsCount: number;
  examSlotsCount?: number;
  schoolYear: string;
  role?: "proviseur" | "superadmin";
  onProviseurSave?: () => void;
}

export default function AdminSidebar({
  currentSection,
  onSelectSection,
  openSubmenus,
  onToggleSubmenu,
  onSaveProject,
  onLoadProject,
  onResetDefaults,
  candidatesCount,
  roomsCount,
  teachersCount,
  examsCount,
  examSlotsCount = 0,
  schoolYear,
  role = "superadmin",
  onProviseurSave,
}: AdminSidebarProps) {
  const isDataActive = [
    "data-eleves",
    "data-salles",
    "data-profs",
    "data-amenagements",
    "sec-pochettes",
  ].includes(currentSection);

  const isPlanningActive = [
    "planning-rooms",
    "planning-profs",
  ].includes(currentSection);

  const isConvocActive = [
    "convoc-eleves",
    "convoc-profs",
    "vitrine-publish",
  ].includes(currentSection);

  const isResActive = [
    "res-import",
    "res-analyse",
    "res-releves",
    "res-datavis",
    "res-simul",
  ].includes(currentSection);

  return (
    <aside className="w-full lg:w-[260px] bg-[#2c3e50] text-[#bdc3c7] flex flex-col flex-shrink-0 min-h-[calc(100vh-65px)] lg:min-h-screen border-r border-[#1a252f] select-none text-[0.88rem] print:hidden">
      {/* Sidebar Header */}
      <div
        onClick={() => onSelectSection("dashboard")}
        className="p-4 bg-black/15 border-b border-white/10 text-center cursor-pointer hover:bg-black/25 transition"
        title="Accéder au Tableau de Bord"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <img
            src="/assets/aistudio/logo-lfjp_62451311.png"
            alt="LFJP Logo"
            className="w-8 h-8 object-contain bg-white rounded-lg p-0.5 shadow-2xs"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
            }}
          />
          <h2 className="text-white font-bold text-[0.95rem] tracking-wide">
            Orga Examens
          </h2>
        </div>
        <p className="text-[11px] text-white/80">
          Session <span className="font-bold text-amber-300">{schoolYear}</span> • Saly Sénégal
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* 0. Tableau de Bord */}
        <button
          onClick={() => onSelectSection("dashboard")}
          className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "dashboard"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="h-4 w-4 shrink-0 text-sky-400" />
            <span>Tableau de Bord</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/15 text-white">
            Accueil
          </span>
        </button>

        {/* 1. Configuration & Logo (SuperAdmin) */}
        {role === "superadmin" && (
          <button
            onClick={() => onSelectSection("config")}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
              currentSection === "config"
                ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="h-4 w-4 shrink-0 text-slate-300" />
              <span>Paramètres & Accès</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono">
              01
            </span>
          </button>
        )}

        {/* 2. Données (Submenu) */}
        <div>
          <button
            onClick={() => onToggleSubmenu("dataMenu")}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
              isDataActive
                ? "text-white font-semibold bg-white/5"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Données Pronote</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-mono">
                02
              </span>
              {openSubmenus.dataMenu ? (
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              )}
            </div>
          </button>

          {openSubmenus.dataMenu && (
            <div className="bg-black/20 py-1 border-b border-white/5">
              <button
                onClick={() => onSelectSection("data-eleves")}
                className={`w-full flex items-center justify-between pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "data-eleves"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-sky-400" />
                  <span>Élèves</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                  {candidatesCount}
                </span>
              </button>

              <button
                onClick={() => onSelectSection("data-salles")}
                className={`w-full flex items-center justify-between pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "data-salles"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <School className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Salles</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                  {roomsCount}
                </span>
              </button>

              <button
                onClick={() => onSelectSection("data-profs")}
                className={`w-full flex items-center justify-between pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "data-profs"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Professeurs</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                  {teachersCount}
                </span>
              </button>

              <button
                onClick={() => onSelectSection("data-amenagements")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "data-amenagements"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <Accessibility className="h-3.5 w-3.5 text-purple-400" />
                <span>Aménagements (PAP/PPS)</span>
              </button>

              <button
                onClick={() => onSelectSection("sec-pochettes")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "sec-pochettes"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <FolderArchive className="h-3.5 w-3.5 text-amber-300" />
                <span>Pochettes Surveillants</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Sessions d'Examens */}
        <button
          onClick={() => onSelectSection("sessions-examens")}
          className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "sessions-examens"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ClipboardList className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Sessions d'Examens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-200 font-mono">
              03
            </span>
            {typeof examsCount === "number" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                {examsCount}
              </span>
            )}
          </div>
        </button>

        {/* 4. Créneaux des Épreuves */}
        <button
          onClick={() => onSelectSection("creneaux-epreuves")}
          className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "creneaux-epreuves"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>Créneaux des Épreuves</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 font-mono">
              04
            </span>
            {typeof examSlotsCount === "number" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                {examSlotsCount}
              </span>
            )}
          </div>
        </button>

        {/* 5. Répartition & Brassage */}
        <button
          onClick={() => onSelectSection("organization")}
          className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "organization"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Shuffle className="h-4 w-4 shrink-0 text-teal-400" />
            <span>Répartition & Brassage</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-200 font-mono">
            05
          </span>
        </button>

        {/* 6. Planning (Submenu) */}
        <div>
          <button
            onClick={() => onToggleSubmenu("planningMenu")}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
              isPlanningActive
                ? "text-white font-semibold bg-white/5"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 shrink-0 text-indigo-400" />
              <span>Plannings Surveillances</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 font-mono">
                06
              </span>
              {openSubmenus.planningMenu ? (
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              )}
            </div>
          </button>

          {openSubmenus.planningMenu && (
            <div className="bg-black/20 py-1 border-b border-white/5">
              <button
                onClick={() => onSelectSection("planning-rooms")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "planning-rooms"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <School className="h-3.5 w-3.5 text-emerald-400" />
                <span>Vue par Salles</span>
              </button>

              <button
                onClick={() => onSelectSection("planning-profs")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "planning-profs"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                <span>Vue Professeurs</span>
              </button>
            </div>
          )}
        </div>

        {/* 7. Vers EDT */}
        <button
          onClick={() => onSelectSection("view-edt")}
          className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "view-edt"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CalendarRange className="h-4 w-4 shrink-0 text-orange-400" />
            <span>Vers EDT & Cours Impactés</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/30 text-orange-200 font-mono">
            07
          </span>
        </button>

        {/* 8. Corrections & Résultats (Submenu) */}
        <div>
          <button
            onClick={() => onToggleSubmenu("resMenu")}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
              isResActive || currentSection === "corr-repartition"
                ? "text-white font-semibold bg-white/5"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>Corrections & Notes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono">
                08
              </span>
              {openSubmenus.resMenu ? (
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              )}
            </div>
          </button>

          {openSubmenus.resMenu && (
            <div className="bg-black/20 py-1 border-b border-white/5">
              <button
                onClick={() => onSelectSection("corr-repartition")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "corr-repartition"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <Package className="h-3.5 w-3.5 text-orange-400" />
                <span>Répartition Copies</span>
              </button>

              <button
                onClick={() => onSelectSection("res-import")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "res-import"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <DownloadCloud className="h-3.5 w-3.5 text-sky-400" />
                <span>Import Notes</span>
              </button>

              <button
                onClick={() => onSelectSection("res-analyse")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "res-analyse"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>Analyse Corrections</span>
              </button>

              <button
                onClick={() => onSelectSection("res-releves")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "res-releves"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <FileCheck2 className="h-3.5 w-3.5 text-amber-400" />
                <span>Relevés de Notes</span>
              </button>

              <button
                onClick={() => onSelectSection("res-datavis")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "res-datavis"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <PieChart className="h-3.5 w-3.5 text-purple-400" />
                <span>DataVisualisation</span>
              </button>

              <button
                onClick={() => onSelectSection("res-simul")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "res-simul"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                <span>Simulation DNB / Bac</span>
              </button>
            </div>
          )}
        </div>

        {/* 10. Convocations & Vitrine (Submenu Combiné Étapes 10 & 11) */}
        <div>
          <button
            onClick={() => onToggleSubmenu("convocMenu")}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
              isConvocActive
                ? "text-white font-semibold bg-white/5"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Printer className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>Convocations & Vitrine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/30 text-cyan-200 font-mono">
                10
              </span>
              {openSubmenus.convocMenu ? (
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              )}
            </div>
          </button>

          {openSubmenus.convocMenu && (
            <div className="bg-black/20 py-1 border-b border-white/5">
              <button
                onClick={() => onSelectSection("convoc-eleves")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "convoc-eleves"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-sky-400" />
                <span>Convocations & Étiquettes A4</span>
              </button>

              <button
                onClick={() => onSelectSection("convoc-profs")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "convoc-profs"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <Award className="h-3.5 w-3.5 text-amber-400" />
                <span>Ordres de Mission Profs</span>
              </button>

              <button
                onClick={() => onSelectSection("vitrine-publish")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "vitrine-publish"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                <span>Vitrine & Publications</span>
              </button>
            </div>
          )}
        </div>

        {/* 11. Déploiement Git & Vercel (SuperAdmin) */}
        {role === "superadmin" && (
          <button
            onClick={() => onSelectSection("deployment")}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
              currentSection === "deployment"
                ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UploadCloud className="h-4 w-4 shrink-0 text-sky-400" />
              <span>Déploiement Git & Vercel</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono">
              11
            </span>
          </button>
        )}
      </nav>

      {/* Sidebar Footer: Save / Load / Reset / Direct Link to Showcase */}
      <div className="p-4 bg-black/20 border-t border-white/10 space-y-2 mt-auto">
        {role === "proviseur" && onProviseurSave && (
          <button
            type="button"
            onClick={onProviseurSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md border border-emerald-400/30"
          >
            <Save className="h-4 w-4" />
            <span>Enregistrer & Mettre à jour</span>
          </button>
        )}

        <Link
          to="/"
          target="_blank"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition shadow-xs"
        >
          <Eye className="h-3.5 w-3.5 text-emerald-400" />
          <span>Ouvrir la Vitrine Publique ↗</span>
        </Link>

        <button
          onClick={onSaveProject}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#34495e] hover:bg-[#415b76] text-white text-xs font-semibold transition"
        >
          <Save className="h-3.5 w-3.5 text-emerald-400" />
          <span>Sauvegarder Projet (.json)</span>
        </button>

        <label className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold cursor-pointer transition">
          <FolderInput className="h-3.5 w-3.5 text-amber-300" />
          <span>Charger Projet (.json)</span>
          <input
            type="file"
            accept=".json"
            onChange={onLoadProject}
            className="hidden"
          />
        </label>
      </div>
    </aside>
  );
}
