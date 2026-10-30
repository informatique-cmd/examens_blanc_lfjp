import React, { useState } from "react";
import {
  Save,
  Check,
  Eye,
  AlertCircle,
  Clock,
  Sparkles,
  Building,
  UserCheck,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import type { SiteInfo, CmsExam } from "../../../shared/services/cms-store";

interface ConfigSectionProps {
  siteInfo: SiteInfo;
  onUpdateSiteInfo: (updates: Partial<SiteInfo>) => void;
  exams: CmsExam[];
  onTogglePublishExam: (id: string, isPublished: boolean) => void;
  onShowNotification: (msg: string) => void;
}

export default function ConfigSection({
  siteInfo,
  onUpdateSiteInfo,
  exams,
  onTogglePublishExam,
  onShowNotification,
}: ConfigSectionProps) {
  const [schoolName, setSchoolName] = useState(siteInfo.title || "Lycée Français Jacques Prévert");
  const [schoolCity, setSchoolCity] = useState("Saly, Sénégal");
  const [sessionYear, setSessionYear] = useState(siteInfo.schoolYear || "2025-2026");
  const [examType, setExamType] = useState<string>("DNB Blanc");
  const [customExamName, setCustomExamName] = useState<string>("");

  // Sciences checkboxes
  const [sciencesConfig, setSciencesConfig] = useState({
    svt: true,
    pc: true,
    techno: true,
  });

  // Direction & Signature
  const [directorCiv, setDirectorCiv] = useState<string>("M. le Proviseur");
  const [directorName, setDirectorName] = useState<string>("Proviseur du LFJP");

  // Alert banner state
  const [alertEnabled, setAlertEnabled] = useState(siteInfo.bannerAlert?.enabled ?? false);
  const [alertTitle, setAlertTitle] = useState(siteInfo.bannerAlert?.title || "Consigne officielle");
  const [alertMessage, setAlertMessage] = useState(
    siteInfo.bannerAlert?.message || "Présentez-vous 15 min avant l'épreuve avec votre convocation et pièce d'identité."
  );
  const [alertType, setAlertType] = useState<"info" | "warning" | "urgent" | "success">(
    siteInfo.bannerAlert?.type || "info"
  );

  const handleSaveParams = () => {
    onUpdateSiteInfo({
      title: schoolName,
      schoolYear: sessionYear,
      bannerAlert: {
        enabled: alertEnabled,
        title: alertTitle,
        message: alertMessage,
        type: alertType,
      },
    });
    onShowNotification("⚙️ Configuration enregistrée et synchronisée avec la vitrine !");
  };

  // Standard exam slots with auto tier-temps (+1/3)
  const defaultExamSubjects = [
    {
      id: "fr-1",
      name: "Français (Grammaire, Dictée & Compréhension)",
      durationStd: 90,
      standardHours: "08h00 - 09h30",
      tiersTempsHours: "08h00 - 10h00 (+30 min)",
    },
    {
      id: "fr-2",
      name: "Français (Rédaction / Expression écrite)",
      durationStd: 90,
      standardHours: "09h45 - 11h15",
      tiersTempsHours: "09h45 - 11h45 (+30 min)",
    },
    {
      id: "maths",
      name: "Mathématiques",
      durationStd: 120,
      standardHours: "13h30 - 15h30",
      tiersTempsHours: "13h30 - 16h10 (+40 min)",
    },
    {
      id: "hg-emc",
      name: "Histoire-Géographie & EMC",
      durationStd: 120,
      standardHours: "08h00 - 10h00",
      tiersTempsHours: "08h00 - 10h40 (+40 min)",
    },
    {
      id: "sciences",
      name: `Sciences (${sciencesConfig.svt ? "SVT " : ""}${sciencesConfig.pc ? "Physique " : ""}${sciencesConfig.techno ? "Techno" : ""})`,
      durationStd: 60,
      standardHours: "10h15 - 11h15",
      tiersTempsHours: "10h15 - 11h35 (+20 min)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
              Module Central
            </span>
            <span className="text-xs text-slate-500">
              Paramètres généraux & Identité officielle
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            ⚙️ Configuration des Examens & Publication
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Configurez l'établissement, les épreuves, les horaires (+1/3 temps) et publiez directement vers la vitrine officielle des acteurs.
          </p>
        </div>

        <button
          onClick={handleSaveParams}
          className="px-5 py-2.5 rounded-xl bg-[#27ae60] hover:bg-[#219653] text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Save className="h-4 w-4" />
          <span>Enregistrer les paramètres</span>
        </button>
      </div>

      {/* Card 1: Paramètres & Logo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building className="h-4 w-4 text-[#3498db]" />
            <span>Paramètres de l'Établissement & Type d'Évaluation</span>
          </h3>
          <span className="text-[11px] text-slate-400">Identité LFJP</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom de l'établissement
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
              placeholder="Ex: Lycée Français Jacques Prévert"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ville d'exercice
            </label>
            <input
              type="text"
              value={schoolCity}
              onChange={(e) => setSchoolCity(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
              placeholder="Ex: Saly, Sénégal"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Session / Année scolaire
            </label>
            <input
              type="text"
              value={sessionYear}
              onChange={(e) => setSessionYear(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
              placeholder="Ex: 2025-2026"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Type d'évaluation
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
            >
              <option value="DNB Blanc">DNB Blanc (Collège 3ème)</option>
              <option value="DNB Officiel">DNB Officiel (Brevet)</option>
              <option value="Bac Blanc 1ère">Bac Blanc 1ère (Français EAF)</option>
              <option value="Bac Blanc Terminale">Bac Blanc Terminale</option>
              <option value="Devoir Commun">Devoir Commun</option>
              <option value="CUSTOM">✏️ Intitulé personnalisé...</option>
            </select>

            {examType === "CUSTOM" && (
              <input
                type="text"
                value={customExamName}
                onChange={(e) => setCustomExamName(e.target.value)}
                placeholder="Saisissez l'intitulé de l'examen..."
                className="w-full mt-2 px-3 py-2 text-xs border border-dashed border-[#3498db] rounded-lg bg-sky-50 focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Matières Sciences au DNB (cocher les 2 ou 3 épreuves)
            </label>
            <div className="flex items-center gap-4 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sciencesConfig.svt}
                  onChange={(e) =>
                    setSciencesConfig((prev) => ({ ...prev, svt: e.target.checked }))
                  }
                  className="rounded text-[#3498db] focus:ring-[#3498db]"
                />
                <span className="font-semibold text-slate-800">SVT</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sciencesConfig.pc}
                  onChange={(e) =>
                    setSciencesConfig((prev) => ({ ...prev, pc: e.target.checked }))
                  }
                  className="rounded text-[#3498db] focus:ring-[#3498db]"
                />
                <span className="font-semibold text-slate-800">Physique-Chimie</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sciencesConfig.techno}
                  onChange={(e) =>
                    setSciencesConfig((prev) => ({ ...prev, techno: e.target.checked }))
                  }
                  className="rounded text-[#3498db] focus:ring-[#3498db]"
                />
                <span className="font-semibold text-slate-800">Technologie</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Direction & Signature */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#27ae60]" />
            <span>Direction & Signature Officielle</span>
          </h3>
          <span className="text-[11px] text-slate-400">Pour convocations & PV</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Titre de Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                "M. le Proviseur",
                "Mme la Proviseure",
                "M. le Principal",
                "Mme la Principale",
              ].map((civ) => (
                <button
                  key={civ}
                  type="button"
                  onClick={() => setDirectorCiv(civ)}
                  className={`p-2 rounded-lg border text-xs text-center font-medium transition ${
                    directorCiv === civ
                      ? "border-[#3498db] bg-sky-50 text-[#2980b9] font-bold ring-1 ring-[#3498db]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {civ}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom & Prénom du signataire
            </label>
            <input
              type="text"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
              placeholder="Ex: Chef d'établissement du LFJP"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Ce titre apparaîtra au bas des convocations officielles et sur les feuilles d'émargement des surveillants.
            </p>
          </div>
        </div>
      </div>

      {/* Card 3: Horaires des Épreuves & Calcul Tiers-Temps (+1/3 temps) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#8e44ad]" />
              <span>Horaires Officiels & Aménagements Tiers-Temps (+1/3 temps)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Calcul automatique de la majoration de temps pour les candidats bénéficiant de PAP/PPS.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
            Automatisé +1/3
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="p-3">Discipline / Épreuve</th>
                <th className="p-3 text-center">Durée Standard</th>
                <th className="p-3">Horaires Standard</th>
                <th className="p-3">Horaires Tiers-Temps (+1/3 temps)</th>
                <th className="p-3 text-center">Statut Vitrine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {defaultExamSubjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70">
                  <td className="p-3 font-semibold text-slate-900">{sub.name}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {sub.durationStd} min
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-mono text-[11px]">
                    {sub.standardHours}
                  </td>
                  <td className="p-3 text-purple-700 font-mono text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200">
                      {sub.tiersTempsHours}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ Configuré
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 4: Bannière d'Alerte & Publications Vitrine */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-emerald-600" />
            <span>Bannière Officielle & Publication sur la Vitrine</span>
          </h3>
          <span className="text-[11px] text-slate-400">Diffusion publique</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 font-bold text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={alertEnabled}
                onChange={(e) => setAlertEnabled(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span>Activer la bannière d'information de direction sur la vitrine</span>
            </label>

            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as any)}
              className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="info">ℹ️ Information générale (Bleu)</option>
              <option value="warning">⚠️ Vigilance (Orange)</option>
              <option value="urgent">🚨 Urgent (Rouge)</option>
              <option value="success">✅ Validé / Réussite (Vert)</option>
            </select>
          </div>

          {alertEnabled && (
            <div className="space-y-2 pt-2">
              <input
                type="text"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="Titre de la consigne (ex: Consigne d'appel et d'émargement)"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                rows={2}
                placeholder="Message à afficher à l'ensemble des acteurs..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Quick Exam Publishing Toggles */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-800 mb-2">
            Sessions d'Examens configurées et statut de publication :
          </h4>
          <div className="space-y-2">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{exam.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                      {exam.targetLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{exam.period}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onTogglePublishExam(exam.id, exam.isPublished === false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    exam.isPublished !== false
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>{exam.isPublished !== false ? "Publié sur la Vitrine" : "Masqué (Brouillon)"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
