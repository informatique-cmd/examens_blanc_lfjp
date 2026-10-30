import React, { useState } from "react";
import {
  ArrowRightCircle,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  Calendar,
  School,
  Users,
} from "lucide-react";
import type { CmsRoom, CmsTeacher, CmsSurveillance, SiteInfo } from "../../../shared/services/cms-store";

interface ViewEdtSectionProps {
  rooms: CmsRoom[];
  teachers: CmsTeacher[];
  surveillances: CmsSurveillance[];
  siteInfo: SiteInfo;
  onShowNotification: (msg: string) => void;
}

export default function ViewEdtSection({
  rooms,
  teachers,
  surveillances,
  siteInfo,
  onShowNotification,
}: ViewEdtSectionProps) {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<"edt" | "pronote" | "csv">("edt");

  // Generate export text
  const generatedExport = `--- EXPORT CONTRAINTES EDT / INDEX ÉDUCATION ---
Établissement: ${siteInfo.title || "LFJP"}
Session: ${siteInfo.schoolYear || "2025-2026"}
Date: ${new Date().toLocaleDateString("fr-FR")}

[SALLES OCCUPÉES / INDISPONIBILITÉS]
${rooms.map((r) => `SALLE;${r.name};CAPACITE;${r.capacity};BATIMENT;${r.building || "Principal"}`).join("\n")}

[ENSEIGNANTS MOBILISÉS / SURVEILLANCES]
${surveillances.map((s) => `SURVEILLANCE;${s.teacherName};SALLE;${s.roomName};DATE;${s.date};HORAIRE;${s.timeSlot}`).join("\n")}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedExport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowNotification("📋 Export copié dans le presse-papier !");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedExport], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `export-edt-${siteInfo.schoolYear || "2026"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onShowNotification("Fichier d'export EDT téléchargé.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
              Passerelle EDT / Pronote
            </span>
            <span className="text-xs text-slate-500">
              Blocage des créneaux & indisponibilités
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            ➡️ Vers EDT (Index Éducation & UnDeuxTemps)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Génération des contraintes d'occupation des salles et de mobilisation des enseignants pour les logiciels d'emploi du temps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copié !" : "Copier le texte"}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger l'Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Aperçu des données formatées pour l'import :
          </h3>
          <span className="text-xs text-slate-400 font-mono">Format texte UTF-8</span>
        </div>

        <textarea
          readOnly
          value={generatedExport}
          rows={14}
          className="w-full p-4 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-hidden"
        />
      </div>
    </div>
  );
}
