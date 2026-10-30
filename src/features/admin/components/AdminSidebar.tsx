import React from "react";
import { Link } from "react-router-dom";
import {
  Settings,
  FolderOpen,
  User,
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
  RotateCcw,
} from "lucide-react";

export type AdminSection =
  | "config"
  | "data-eleves"
  | "data-salles"
  | "data-profs"
  | "data-amenagements"
  | "sec-pochettes"
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
  schoolYear: string;
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
  schoolYear,
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
  ].includes(currentSection);

  const isResActive = [
    "res-import",
    "res-analyse",
    "res-releves",
    "res-datavis",
    "res-simul",
  ].includes(currentSection);

  return (
    <aside className="w-full lg:w-[260px] bg-[#2c3e50] text-[#bdc3c7] flex flex-col flex-shrink-0 min-h-[calc(100vh-65px)] lg:min-h-screen border-r border-[#1a252f] select-none text-[0.88rem]">
      {/* Sidebar Header */}
      <div className="p-4 bg-black/15 border-b border-white/10 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#3498db] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            LFJP
          </div>
          <h2 className="text-white font-bold text-[0.95rem] tracking-wide">
            Orga Examens
          </h2>
        </div>
        <p className="text-[11px] text-white/70">
          Session {schoolYear} • Saly Sénégal
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* 1. Configuration */}
        <button
          onClick={() => onSelectSection("config")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "config"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings className="h-4 w-4 shrink-0 text-white/80" />
          <span>⚙️ Configuration</span>
        </button>

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
              <span>📂 Données</span>
            </div>
            {openSubmenus.dataMenu ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            )}
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
                  <User className="h-3.5 w-3.5 text-sky-400" />
                  <span>👤 Élèves</span>
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
                  <span>🏫 Salles</span>
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
                  <span>🎓 Professeurs</span>
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
                <span>♿ Aménagements</span>
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
                <span>📁 Pochettes Surveillants</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Répartition */}
        <button
          onClick={() => onSelectSection("organization")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "organization"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <Grid className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>🧩 Répartition & Brassage</span>
        </button>

        {/* 4. Planning (Submenu) */}
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
              <span>📅 Planning</span>
            </div>
            {openSubmenus.planningMenu ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            )}
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
                <span>🏫 Vue par Salles</span>
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
                <span>🎓 Vue Professeurs</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Vers EDT */}
        <button
          onClick={() => onSelectSection("view-edt")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "view-edt"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <ArrowRightCircle className="h-4 w-4 shrink-0 text-teal-400" />
          <span>➡️ Vers EDT</span>
        </button>

        {/* 6. Convocations (Submenu) */}
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
              <Mail className="h-4 w-4 shrink-0 text-amber-400" />
              <span>📨 Convocations</span>
            </div>
            {openSubmenus.convocMenu ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            )}
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
                <GraduationCap className="h-3.5 w-3.5 text-sky-400" />
                <span>🎓 Convocations & Étiquettes</span>
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
                <span>👔 Ordres de Mission Profs</span>
              </button>
            </div>
          )}
        </div>

        {/* 7. Corrections */}
        <button
          onClick={() => onSelectSection("corr-repartition")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "corr-repartition"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <Package className="h-4 w-4 shrink-0 text-orange-400" />
          <span>📦 Corrections</span>
        </button>

        {/* 8. Résultats (Submenu) */}
        <div>
          <button
            onClick={() => onToggleSubmenu("resMenu")}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
              isResActive
                ? "text-white font-semibold bg-white/5"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>📊 Résultats</span>
            </div>
            {openSubmenus.resMenu ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            )}
          </button>

          {openSubmenus.resMenu && (
            <div className="bg-black/20 py-1 border-b border-white/5">
              <button
                onClick={() => onSelectSection("res-import")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "res-import"
                    ? "text-white font-bold bg-[#3498db]/40 border-l-2 border-[#3498db]"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <DownloadCloud className="h-3.5 w-3.5 text-sky-400" />
                <span>📥 Import Notes</span>
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
                <span>📊 Analyse Corrections</span>
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
                <span>📄 Relevés de Notes</span>
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
                <span>📈 DataVisualisation</span>
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
                <span>🔮 Simulation DNB / Bac</span>
              </button>
            </div>
          )}
        </div>

        {/* 9. Vitrine & Publications (Pilote central de publication) */}
        <button
          onClick={() => onSelectSection("vitrine-publish")}
          className={`w-full flex items-center justify-between px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "vitrine-publish"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Eye className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>📢 Vitrine & Publications</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold uppercase">
            Acteurs
          </span>
        </button>

        {/* 10. Déploiement Git & Vercel */}
        <button
          onClick={() => onSelectSection("deployment")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition border-b border-white/5 ${
            currentSection === "deployment"
              ? "bg-[#3498db] text-white font-bold border-l-4 border-white shadow-xs"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <UploadCloud className="h-4 w-4 shrink-0 text-sky-400" />
          <span>🚀 Déploiement Git & Vercel</span>
        </button>
      </nav>

      {/* Sidebar Footer: Save / Load / Reset / Direct Link to Showcase */}
      <div className="p-4 bg-black/20 border-t border-white/10 space-y-2 mt-auto">
        <Link
          to="/"
          target="_blank"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Ouvrir la Vitrine Publique ↗</span>
        </Link>

        <button
          onClick={onSaveProject}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#34495e] hover:bg-[#415b76] text-white text-xs font-semibold transition"
        >
          <Save className="h-3.5 w-3.5" />
          <span>💾 Sauvegarder Projet</span>
        </button>

        <label className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold cursor-pointer transition">
          <FolderInput className="h-3.5 w-3.5" />
          <span>📂 Charger Projet (.json)</span>
          <input
            type="file"
            accept=".json"
            onChange={onLoadProject}
            className="hidden"
          />
        </label>

        <button
          onClick={onResetDefaults}
          className="w-full text-center text-[11px] text-slate-400 hover:text-rose-400 pt-1 flex items-center justify-center gap-1 transition"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Réinitialiser aux valeurs initiales</span>
        </button>
      </div>
    </aside>
  );
}
