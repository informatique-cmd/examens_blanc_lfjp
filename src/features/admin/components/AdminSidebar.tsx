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
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
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
  onSuperadminSave?: () => void;
  isSyncing?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  visibleModules?: Record<string, boolean>;
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
  onSuperadminSave,
  isSyncing = false,
  isCollapsed = false,
  onToggleCollapse,
  visibleModules,
}: AdminSidebarProps) {
  const isModuleVisible = (key: string) => {
    if (role !== "proviseur") return true;
    if (visibleModules && key in visibleModules) {
      return visibleModules[key] !== false;
    }
    return !["view-edt", "resMenu"].includes(key);
  };
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

  const isResActive = [
    "res-import",
    "res-analyse",
    "res-releves",
    "res-datavis",
    "res-simul",
  ].includes(currentSection);

  const isConvocActive = [
    "convoc-eleves",
    "convoc-profs",
  ].includes(currentSection);

  const isPublishDeployActive = [
    "vitrine-publish",
    "deployment",
  ].includes(currentSection);

  return (
    <aside
      className={`w-full ${
        isCollapsed ? "lg:w-[72px]" : "lg:w-[260px]"
      } bg-[#0F2A56] text-slate-300 flex flex-col flex-shrink-0 min-h-[calc(100vh-65px)] lg:min-h-screen border-r border-[#091b38] select-none text-[0.86rem] transition-all duration-200 print:hidden`}
    >
      {/* Sidebar Header */}
      <div className="p-3 bg-black/20 border-b border-white/10 flex items-center justify-between gap-2">
        {!isCollapsed ? (
          <div
            onClick={() => onSelectSection("dashboard")}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition min-w-0"
            title="Accéder au Tableau de Bord"
          >
            <img
              src="/assets/aistudio/logo-lfjp_62451311.png"
              alt="LFJP Logo"
              className="w-8 h-8 object-contain bg-white rounded-lg p-0.5 shadow-2xs shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
              }}
            />
            <div className="min-w-0 text-left">
              <h2 className="text-white font-bold text-[0.92rem] tracking-wide truncate">
                Orga Examens
              </h2>
              <p className="text-[10px] text-white/70 truncate">
                {schoolYear} • LFJP Saly
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={() => onSelectSection("dashboard")}
            className="mx-auto cursor-pointer hover:opacity-90 transition py-0.5"
            title="Tableau de bord LFJP"
          >
            <img
              src="/assets/aistudio/logo-lfjp_62451311.png"
              alt="LFJP Logo"
              className="w-8 h-8 object-contain bg-white rounded-lg p-0.5 shadow-2xs"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
              }}
            />
          </div>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Agrandir le menu (Ctrl+B)" : "Réduire le menu (Ctrl+B)"}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition shrink-0 cursor-pointer"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-sky-400" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
        {/* 0. Tableau de Bord */}
        {isModuleVisible("dashboard") && (
        <button
          onClick={() => onSelectSection("dashboard")}
          title="00. Tableau de Bord"
          className={`w-full flex items-center rounded-xl ${
            isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
          } text-left transition ${
            currentSection === "dashboard"
              ? "bg-[#1D4ED8] text-white font-bold shadow-xs"
              : "hover:bg-white/10 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="h-4 w-4 shrink-0 text-sky-300" />
            {!isCollapsed && <span>Tableau de Bord</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/15 text-white">
              Accueil
            </span>
          )}
        </button>
        )}

        {/* 1. Configuration & Logo (SuperAdmin) */}
        {role === "superadmin" && (
          <button
            onClick={() => onSelectSection("config")}
            title="01. Paramètres & Accès"
            className={`w-full flex items-center rounded-xl ${
              isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
            } text-left transition ${
              currentSection === "config"
                ? "bg-[#1D4ED8] text-white font-bold shadow-xs"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="h-4 w-4 shrink-0 text-slate-300" />
              {!isCollapsed && <span>Paramètres & Accès</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-blue-200 font-mono">
                01
              </span>
            )}
          </button>
        )}

        {/* 2. Données Pronote (Submenu) */}
        {isModuleVisible("dataMenu") && (
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                onSelectSection("data-eleves");
              } else {
                onToggleSubmenu("dataMenu");
              }
            }}
            title="02. Données Pronote (Élèves, Salles, Professeurs)"
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-3"
            } text-left transition border-b border-white/5 ${
              isDataActive
                ? "text-white font-semibold bg-white/5"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
              {!isCollapsed && <span>Données Pronote</span>}
            </div>
            {!isCollapsed && (
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
            )}
          </button>

          {!isCollapsed && openSubmenus.dataMenu && (
            <div className="bg-black/20 py-1 border-b border-white/5">
              <button
                onClick={() => onSelectSection("data-eleves")}
                className={`w-full flex items-center justify-between pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "data-eleves"
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
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
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
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
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
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
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
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
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <FolderArchive className="h-3.5 w-3.5 text-amber-300" />
                <span>Pochettes Surveillants</span>
              </button>
            </div>
          )}
        </div>
        )}

        {/* 3. Sessions d'Examens */}
        {isModuleVisible("sessions-examens") && (
        <button
          onClick={() => onSelectSection("sessions-examens")}
          title="03. Sessions d'Examens"
          className={`w-full flex items-center rounded-xl ${
            isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
          } text-left transition ${
            currentSection === "sessions-examens"
              ? "bg-[#1D4ED8] text-white font-bold shadow-xs"
              : "hover:bg-white/10 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ClipboardList className="h-4 w-4 shrink-0 text-amber-400" />
            {!isCollapsed && <span>Sessions d'Examens</span>}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-blue-200 font-mono">
                03
              </span>
              {typeof examsCount === "number" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-slate-200 tabular-nums">
                  {examsCount}
                </span>
              )}
            </div>
          )}
        </button>
        )}

        {/* 4. Créneaux des Épreuves */}
        {isModuleVisible("creneaux-epreuves") && (
        <button
          onClick={() => onSelectSection("creneaux-epreuves")}
          title="04. Créneaux des Épreuves"
          className={`w-full flex items-center rounded-xl ${
            isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
          } text-left transition ${
            currentSection === "creneaux-epreuves"
              ? "bg-[#1D4ED8] text-white font-bold shadow-xs"
              : "hover:bg-white/10 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-cyan-400" />
            {!isCollapsed && <span>Créneaux des Épreuves</span>}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-blue-200 font-mono">
                04
              </span>
              {typeof examSlotsCount === "number" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-slate-200 tabular-nums">
                  {examSlotsCount}
                </span>
              )}
            </div>
          )}
        </button>
        )}

        {/* 5. Répartition & Brassage */}
        {isModuleVisible("organization") && (
        <button
          onClick={() => onSelectSection("organization")}
          title="05. Répartition & Brassage"
          className={`w-full flex items-center rounded-xl ${
            isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
          } text-left transition ${
            currentSection === "organization"
              ? "bg-[#1D4ED8] text-white font-bold shadow-xs"
              : "hover:bg-white/10 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Shuffle className="h-4 w-4 shrink-0 text-teal-400" />
            {!isCollapsed && <span>Répartition & Brassage</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-blue-200 font-mono">
              05
            </span>
          )}
        </button>
        )}

        {/* 6. Plannings Surveillances (Submenu) */}
        {isModuleVisible("planningMenu") && (
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                onSelectSection("planning-rooms");
              } else {
                onToggleSubmenu("planningMenu");
              }
            }}
            title="06. Plannings Surveillances (Salles & Enseignants)"
            className={`w-full flex items-center rounded-xl ${
              isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
            } text-left transition ${
              isPlanningActive
                ? "text-white font-semibold bg-white/10"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 shrink-0 text-indigo-300" />
              {!isCollapsed && <span>Plannings Surveillances</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-blue-200 font-mono">
                  06
                </span>
                {openSubmenus.planningMenu ? (
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                )}
              </div>
            )}
          </button>

          {!isCollapsed && openSubmenus.planningMenu && (
            <div className="bg-black/20 py-1 border-b border-white/5">
              <button
                onClick={() => onSelectSection("planning-rooms")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "planning-rooms"
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
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
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                <span>Vue Professeurs</span>
              </button>
            </div>
          )}
        </div>
        )}

        {/* 7. Vers EDT */}
        {isModuleVisible("view-edt") && (
        <button
          onClick={() => onSelectSection("view-edt")}
          title="07. Vers EDT & Cours Impactés"
          className={`w-full flex items-center rounded-xl ${
            isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
          } text-left transition ${
            currentSection === "view-edt"
              ? "bg-[#1D4ED8] text-white font-bold shadow-xs"
              : "hover:bg-white/10 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CalendarRange className="h-4 w-4 shrink-0 text-orange-400" />
            {!isCollapsed && <span>Vers EDT & Cours Impactés</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-blue-200 font-mono">
              07
            </span>
          )}
        </button>
        )}

        {/* 8. Corrections & Notes (Submenu) */}
        {isModuleVisible("resMenu") && (
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                onSelectSection("corr-repartition");
              } else {
                onToggleSubmenu("resMenu");
              }
            }}
            title="08. Corrections & Notes"
            className={`w-full flex items-center rounded-xl ${
              isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
            } text-left transition ${
              isResActive || currentSection === "corr-repartition"
                ? "text-white font-semibold bg-white/10"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="h-4 w-4 shrink-0 text-cyan-400" />
              {!isCollapsed && <span>Corrections & Notes</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-blue-200 font-mono">
                  08
                </span>
                {openSubmenus.resMenu ? (
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                )}
              </div>
            )}
          </button>

          {!isCollapsed && openSubmenus.resMenu && (
            <div className="bg-black/20 py-1 border-b border-white/5">
              <button
                onClick={() => onSelectSection("corr-repartition")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "corr-repartition"
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
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
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
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
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
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
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
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
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
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
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                <span>Simulation DNB / Bac</span>
              </button>
            </div>
          )}
        </div>
        )}

        {/* 9. Convocations & Ordres de Mission */}
        {isModuleVisible("convocMenu") && (
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                onSelectSection("convoc-eleves");
              } else {
                onToggleSubmenu("convocMenu");
              }
            }}
            title="09. Convocations & Ordres de Mission"
            className={`w-full flex items-center rounded-xl ${
              isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
            } text-left transition ${
              isConvocActive
                ? "text-white font-semibold bg-white/10"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Printer className="h-4 w-4 shrink-0 text-emerald-400" />
              {!isCollapsed && <span>Convocations & Ordres</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-blue-200 font-mono">
                  09
                </span>
                {openSubmenus.convocMenu ? (
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                )}
              </div>
            )}
          </button>

          {!isCollapsed && openSubmenus.convocMenu && (
            <div className="bg-black/20 py-1 border-b border-white/5">
              <button
                onClick={() => onSelectSection("convoc-eleves")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "convoc-eleves"
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-sky-400" />
                <span>Convocations Élèves A4</span>
              </button>

              <button
                onClick={() => onSelectSection("convoc-profs")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition ${
                  currentSection === "convoc-profs"
                    ? "text-white font-bold bg-[#1D4ED8]/70 rounded-lg"
                    : "text-[#bdc3c7] hover:text-white hover:bg-white/5"
                }`}
              >
                <Award className="h-3.5 w-3.5 text-amber-400" />
                <span>Ordres de Mission Profs</span>
              </button>
            </div>
          )}
        </div>
        )}

        {/* 10. Vitrine Publique & Déploiement Git / Vercel (Combiné Étape 10) */}
        {isModuleVisible("publishDeployMenu") && (
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                onSelectSection("vitrine-publish");
              } else {
                onToggleSubmenu("publishDeployMenu");
              }
            }}
            title="10. Vitrine & Déploiement Vercel"
            className={`w-full flex items-center rounded-xl ${
              isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
            } text-left transition ${
              isPublishDeployActive
                ? "text-white font-semibold bg-white/10"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UploadCloud className="h-4 w-4 shrink-0 text-sky-400" />
              {!isCollapsed && (
                <span>{role === "proviseur" ? "Vitrine & Publications" : "Vitrine & Déploiement"}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-blue-200 font-mono">
                  10
                </span>
                {openSubmenus.publishDeployMenu ? (
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                )}
              </div>
            )}
          </button>

          {!isCollapsed && openSubmenus.publishDeployMenu && (
            <div className="bg-black/20 py-1 rounded-lg my-1">
              <button
                onClick={() => onSelectSection("vitrine-publish")}
                className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition rounded-lg ${
                  currentSection === "vitrine-publish"
                    ? "text-white font-bold bg-[#1D4ED8]/70"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                <span>Vitrine & Publications</span>
              </button>

              {role === "superadmin" && (
                <button
                  onClick={() => onSelectSection("deployment")}
                  className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-xs transition rounded-lg ${
                    currentSection === "deployment"
                      ? "text-white font-bold bg-[#1D4ED8]/70"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Save className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Enregistrer & Mettre à jour</span>
                </button>
              )}
            </div>
          )}
        </div>
        )}
      </nav>

      {/* Sidebar Footer: Save / Load / Reset / Direct Link to Showcase / Collapse Toggle */}
      <div className="p-3 bg-black/20 border-t border-white/10 space-y-2 mt-auto">
        {role === "proviseur" && onProviseurSave && (
          <button
            type="button"
            id="btn-proviseur-sidebar-save"
            onClick={onProviseurSave}
            disabled={isSyncing}
            title="Enregistrer toutes les modifications et déployer en direct sur le site en ligne (Vercel)"
            className={`w-full flex items-center justify-center gap-2 ${
              isCollapsed ? "py-2 px-1" : "py-2.5 px-3"
            } rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md border border-emerald-400/30 cursor-pointer disabled:opacity-50`}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                {!isCollapsed && <span>Envoi en cours...</span>}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Enregistrer & Mettre à jour</span>}
              </>
            )}
          </button>
        )}

        {role === "superadmin" && onSuperadminSave && (
          <button
            type="button"
            id="btn-superadmin-sidebar-save"
            onClick={onSuperadminSave}
            disabled={isSyncing}
            title="Enregistrer et déployer directement sur GitHub & Vercel en 1 clic"
            className={`w-full flex items-center justify-center gap-2 ${
              isCollapsed ? "py-2 px-1" : "py-2.5 px-3"
            } rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md border border-emerald-400/30 cursor-pointer disabled:opacity-50`}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                {!isCollapsed && <span>Envoi en cours...</span>}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Enregistrer & Mettre à jour</span>}
              </>
            )}
          </button>
        )}

        <Link
          to="/"
          target="_blank"
          title="Ouvrir la Vitrine Publique"
          className={`w-full flex items-center justify-center gap-2 ${
            isCollapsed ? "py-2 px-1" : "py-2 px-3"
          } rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition shadow-xs`}
        >
          <Eye className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          {!isCollapsed && <span>Vitrine Publique ↗</span>}
        </Link>

        <button
          onClick={onSaveProject}
          title="Sauvegarder Projet (.json)"
          className={`w-full flex items-center justify-center gap-2 ${
            isCollapsed ? "py-2 px-1" : "py-2 px-3"
          } rounded-lg bg-[#34495e] hover:bg-[#415b76] text-white text-xs font-semibold transition cursor-pointer`}
        >
          <Save className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          {!isCollapsed && <span>Sauvegarder (.json)</span>}
        </button>

        <label
          title="Charger Projet (.json)"
          className={`w-full flex items-center justify-center gap-2 ${
            isCollapsed ? "py-2 px-1" : "py-2 px-3"
          } rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold cursor-pointer transition`}
        >
          <FolderInput className="h-3.5 w-3.5 text-amber-300 shrink-0" />
          {!isCollapsed && <span>Charger (.json)</span>}
          <input
            type="file"
            accept=".json"
            onChange={onLoadProject}
            className="hidden"
          />
        </label>

        {/* Explicit Collapse / Expand Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center px-1" : "justify-between px-3"
            } py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer`}
          >
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 text-sky-400 shrink-0" />
              ) : (
                <PanelLeftClose className="h-4 w-4 text-slate-400 shrink-0" />
              )}
              {!isCollapsed && <span>Réduire le menu</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-slate-400">Ctrl+B</span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
