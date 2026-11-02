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
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Key,
} from "lucide-react";
import type { SiteInfo, CmsExam } from "../../../shared/services/cms-store";

interface ConfigSectionProps {
  siteInfo: SiteInfo;
  onUpdateSiteInfo: (updates: Partial<SiteInfo>) => void;
  exams: CmsExam[];
  onTogglePublishExam: (id: string, isPublished: boolean) => void;
  onShowNotification: (msg: string) => void;
  onResetToDefaults?: () => void;
  onResetForNewSchoolYear?: (newYear: string, preserveCatalogs?: boolean) => void;
}

export default function ConfigSection({
  siteInfo,
  onUpdateSiteInfo,
  exams,
  onTogglePublishExam,
  onShowNotification,
  onResetToDefaults,
  onResetForNewSchoolYear,
}: ConfigSectionProps) {
  const [schoolName, setSchoolName] = useState(siteInfo.title || "Lycée Français Jacques Prévert");
  const [schoolCity, setSchoolCity] = useState("Saly, Sénégal");
  const [sessionYear, setSessionYear] = useState(siteInfo.schoolYear || "2025-2026");
  const [examType, setExamType] = useState<string>("DNB Blanc");
  const [customExamName, setCustomExamName] = useState<string>("");

  // Logo management state
  const [logos, setLogos] = useState<Array<{ src: string; alt?: string }>>(
    siteInfo.logos && siteInfo.logos.length > 0
      ? siteInfo.logos
      : [
          { src: "/assets/aistudio/logo-lfjp_62451311.png", alt: "Lycée Français Jacques Prévert - Saly, Sénégal" },
          { src: "https://aefe.fr/sites/default/files/asset/document/logo-aefe-bleu-et-orange_0.svg", alt: "Réseau AEFE" },
        ]
  );
  const [newLogoUrl, setNewLogoUrl] = useState<string>("");
  const [newLogoAlt, setNewLogoAlt] = useState<string>("");

  // Next school year reset state
  const [nextYearInput, setNextYearInput] = useState<string>(() => {
    const cur = siteInfo.schoolYear || "2025-2026";
    const parts = cur.split("-");
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      return `${Number(parts[0]) + 1}-${Number(parts[1]) + 1}`;
    }
    return "2026-2027";
  });
  const [preserveCatalogs, setPreserveCatalogs] = useState(true);
  const [confirmModal, setConfirmModal] = useState<"nextYear" | "factory" | null>(null);

  // Sync sessionYear with siteInfo prop if updated externally
  React.useEffect(() => {
    if (siteInfo.schoolYear) {
      setSessionYear(siteInfo.schoolYear);
    }
  }, [siteInfo.schoolYear]);

  // Sciences checkboxes
  const [sciencesConfig, setSciencesConfig] = useState({
    svt: true,
    pc: true,
    techno: true,
  });

  // Direction & Signature
  const [directorCiv, setDirectorCiv] = useState<string>("M. le Proviseur");
  const [directorName, setDirectorName] = useState<string>("Proviseur du LFJP");

  // Proviseur Auth Credentials (managed by SuperAdmin)
  const [proviseurEmail, setProviseurEmail] = useState<string>(
    siteInfo.proviseurAuth?.email || "proviseur@lfjpsaly.org"
  );
  const [proviseurPassword, setProviseurPassword] = useState<string>(
    siteInfo.proviseurAuth?.password || "ProviseurLFJP2026!"
  );
  const [proviseurName, setProviseurName] = useState<string>(
    siteInfo.proviseurAuth?.name || "M. le Proviseur"
  );
  const [showProviseurPassword, setShowProviseurPassword] = useState<boolean>(false);

  const handleSaveProviseurCredentials = () => {
    onUpdateSiteInfo({
      proviseurAuth: {
        email: proviseurEmail.trim(),
        password: proviseurPassword.trim(),
        name: proviseurName.trim(),
      },
    });
    onShowNotification("🔐 Identifiants de connexion du Proviseur mis à jour avec succès !");
  };

  // Alert banner state
  const [alertEnabled, setAlertEnabled] = useState(siteInfo.bannerAlert?.enabled ?? false);
  const [alertTitle, setAlertTitle] = useState(siteInfo.bannerAlert?.title || "Consigne officielle");
  const [alertMessage, setAlertMessage] = useState(
    siteInfo.bannerAlert?.message || "Présentez-vous 15 min avant l'épreuve avec votre convocation et pièce d'identité."
  );
  const [alertType, setAlertType] = useState<"info" | "warning" | "urgent" | "success">(
    siteInfo.bannerAlert?.type || "info"
  );

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide (PNG, JPEG, SVG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const next = [...logos, { src: dataUrl, alt: file.name.replace(/\.[^/.]+$/, "") }];
        setLogos(next);
        onUpdateSiteInfo({ logos: next });
        onShowNotification("Logo de l'école téléversé avec succès !");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddLogoByUrl = () => {
    if (!newLogoUrl.trim()) return;
    const next = [...logos, { src: newLogoUrl.trim(), alt: newLogoAlt.trim() || schoolName }];
    setLogos(next);
    onUpdateSiteInfo({ logos: next });
    setNewLogoUrl("");
    setNewLogoAlt("");
    onShowNotification("Nouveau logo ajouté par URL !");
  };

  const handleRemoveLogo = (index: number) => {
    const next = logos.filter((_, i) => i !== index);
    setLogos(next);
    onUpdateSiteInfo({ logos: next });
    onShowNotification("Logo retiré.");
  };

  const handleSetPresetLogo = (preset: "lfjp" | "aefe" | "both") => {
    let next: Array<{ src: string; alt?: string }> = [];
    if (preset === "lfjp") {
      next = [{ src: "/assets/aistudio/logo-lfjp_62451311.png", alt: "Lycée Français Jacques Prévert - Saly, Sénégal" }];
    } else if (preset === "aefe") {
      next = [{ src: "https://aefe.fr/sites/default/files/asset/document/logo-aefe-bleu-et-orange_0.svg", alt: "Agence pour l'Enseignement Français à l'Étranger (AEFE)" }];
    } else {
      next = [
        { src: "/assets/aistudio/logo-lfjp_62451311.png", alt: "Lycée Français Jacques Prévert - Saly, Sénégal" },
        { src: "https://aefe.fr/sites/default/files/asset/document/logo-aefe-bleu-et-orange_0.svg", alt: "Agence pour l'Enseignement Français à l'Étranger (AEFE)" },
      ];
    }
    setLogos(next);
    onUpdateSiteInfo({ logos: next });
    onShowNotification("Logos officiels LFJP & AEFE rétablis avec succès !");
  };

  const handleSaveParams = () => {
    onUpdateSiteInfo({
      title: schoolName,
      schoolYear: sessionYear,
      logos: logos,
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
              onChange={(e) => {
                const val = e.target.value;
                setSessionYear(val);
                onUpdateSiteInfo({ schoolYear: val });
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden font-bold text-[#002060]"
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

      {/* Card: Logo de l'École & Identité Visuelle */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#e67e22]" />
              <span>Logo de l'Établissement & En-tête Officiel</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Téléversez ou modifiez le logo du lycée affiché sur la vitrine publique, les convocations et les bordereaux.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            Identité Visuelle
          </span>
        </div>

        {/* Existing Logos Grid & Previews */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Logos actifs ({logos.length}) :
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {logos.map((logo, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <img
                      src={logo.src}
                      alt={logo.alt || "Logo"}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {logo.alt || `Logo ${idx + 1}`}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {logo.src.startsWith("data:") ? "Image importée locale" : logo.src}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLogo(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Supprimer ce logo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {logos.length === 0 && (
              <div className="col-span-full p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                Aucun logo configuré. Téléversez une image ou choisissez un modèle prédéfini ci-dessous.
              </div>
            )}
          </div>
        </div>

        {/* Add Logo: File Upload + URL Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          {/* File Upload */}
          <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#3498db] bg-slate-50/50 hover:bg-sky-50/30 transition text-center flex flex-col items-center justify-center">
            <Upload className="h-6 w-6 text-[#3498db] mb-1.5" />
            <p className="text-xs font-bold text-slate-800">
              Téléverser un fichier logo
            </p>
            <p className="text-[11px] text-slate-500 mb-2">
              Formats acceptés : PNG transparent, JPEG, SVG ou WebP
            </p>
            <label className="cursor-pointer px-4 py-2 rounded-lg bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-bold transition shadow-2xs">
              <span>Choisir un fichier sur votre appareil</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Add by URL */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Ou ajouter via un lien web direct (URL)
              </p>
              <p className="text-[11px] text-slate-500 mb-2">
                Entrez l'URL publique de l'image du lycée.
              </p>
              <div className="space-y-1.5">
                <input
                  type="url"
                  value={newLogoUrl}
                  onChange={(e) => setNewLogoUrl(e.target.value)}
                  placeholder="https://.../logo-ecole.png"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
                />
                <input
                  type="text"
                  value={newLogoAlt}
                  onChange={(e) => setNewLogoAlt(e.target.value)}
                  placeholder="Description du logo (ex: Lycée Français Jacques Prévert)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!newLogoUrl.trim()}
              onClick={handleAddLogoByUrl}
              className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ajouter ce logo</span>
            </button>
          </div>
        </div>

        {/* Quick presets */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium">
            Rétablir un modèle officiel en 1 clic :
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSetPresetLogo("lfjp")}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 transition"
            >
              LFJP Saly seul
            </button>
            <button
              type="button"
              onClick={() => handleSetPresetLogo("aefe")}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 transition"
            >
              Réseau AEFE seul
            </button>
            <button
              type="button"
              onClick={() => handleSetPresetLogo("both")}
              className="px-2.5 py-1 text-xs rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-700 transition"
            >
              LFJP + AEFE (Défaut officiel)
            </button>
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

      {/* Card: 🔐 Compte de Connexion du Proviseur (Direction) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Key className="h-4 w-4 text-emerald-600" />
              <span>Identifiants de Connexion du Proviseur (Espace Direction)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configurez l'adresse email et le mot de passe que le Chef d'Établissement utilise pour se connecter à l'espace d'administration.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Accès Direction
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email de connexion Proviseur
            </label>
            <input
              type="email"
              value={proviseurEmail}
              onChange={(e) => setProviseurEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
              placeholder="proviseur@lfjpsaly.org"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mot de passe Proviseur
            </label>
            <div className="relative">
              <input
                type={showProviseurPassword ? "text" : "password"}
                value={proviseurPassword}
                onChange={(e) => setProviseurPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden pr-16 font-mono"
                placeholder="Mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowProviseurPassword(!showProviseurPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 font-semibold"
              >
                {showProviseurPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom / Titre du Chef d'Établissement
            </label>
            <input
              type="text"
              value={proviseurName}
              onChange={(e) => setProviseurName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
              placeholder="M. le Proviseur"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            Ces identifiants permettent au Proviseur de se connecter via l'onglet <strong>Connexion Proviseur</strong> sans avoir besoin d'un compte GitHub.
          </p>
          <button
            type="button"
            onClick={handleSaveProviseurCredentials}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Enregistrer les identifiants Proviseur</span>
          </button>
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

      {/* Card 3: Réinitialisation pour Nouvelle Année Scolaire (Remise à zéro) */}
      <div className="bg-white rounded-xl border border-rose-200/80 shadow-xs p-6 space-y-5">
        <div className="border-b border-rose-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <RotateCcw className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Réinitialisation & Préparation pour la Nouvelle Année Scolaire
              </h3>
              <p className="text-[11px] text-slate-500">
                Passez à la session suivante ou remettez les données et configurations à zéro
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">
            Rentrée / Nouvelle Session
          </span>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 text-xs text-rose-900 space-y-2">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Comment utiliser la réinitialisation pour l'année prochaine ?</span>
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Pour préparer une nouvelle session d'examens (ex: passage de <strong>{sessionYear}</strong> à <strong>{nextYearInput}</strong>), cette opération vide les anciens élèves, leurs affectations de table et les créneaux passés afin de démarrer sur une base propre. Vous pouvez choisir de conserver vos salles et vos professeurs pour éviter de devoir les réimporter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nouvelle Année Scolaire cible :
            </label>
            <input
              type="text"
              value={nextYearInput}
              onChange={(e) => setNextYearInput(e.target.value)}
              placeholder="Ex: 2026-2027"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden font-bold text-slate-800"
            />
          </div>

          <div className="pt-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
              <input
                type="checkbox"
                checked={preserveCatalogs}
                onChange={(e) => setPreserveCatalogs(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="font-medium">
                Conserver le catalogue des salles et la liste des professeurs
              </span>
            </label>
            <p className="text-[10px] text-slate-400 mt-0.5 pl-6">
              Recommandé : évite de ressaisir les locaux et le personnel enseignant
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setConfirmModal("nextYear")}
            className="px-4 py-2.5 rounded-xl bg-[#002060] hover:bg-[#001746] text-white text-xs font-bold transition shadow-xs flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>✨ Réinitialiser pour l'Année {nextYearInput}</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmModal("factory")}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition border border-slate-300 hover:border-rose-300 flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Remise à zéro totale (Paramètres d'usine)</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  {confirmModal === "nextYear"
                    ? `Confirmer la bascule vers ${nextYearInput} ?`
                    : "Confirmer la remise à zéro totale ?"}
                </h4>
                <p className="text-xs text-slate-500">
                  Cette action réinitialise les données des examens
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {confirmModal === "nextYear"
                ? `Vous êtes sur le point de préparer la session ${nextYearInput}. Les listes de candidats, les affectations aux salles et les surveillances de l'année précédente seront vidées.${
                    preserveCatalogs
                      ? " Vos salles et vos professeurs seront préservés."
                      : " L'ensemble des données sera supprimé."
                  }`
                : "Attention : Toutes les données enregistrées dans votre navigateur seront réinitialisées à leurs valeurs d'origine avec le logo officiel du LFJP."}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirmModal === "nextYear") {
                    if (onResetForNewSchoolYear) {
                      onResetForNewSchoolYear(nextYearInput, preserveCatalogs);
                    }
                    onUpdateSiteInfo({ schoolYear: nextYearInput });
                    setSessionYear(nextYearInput);
                    onShowNotification(
                      `🎉 Année scolaire basculée sur ${nextYearInput} ! Données réinitialisées et vitrine synchronisée.`
                    );
                  } else {
                    if (onResetToDefaults) {
                      onResetToDefaults();
                    }
                    onShowNotification("🔄 Toutes les configurations ont été remises à zéro d'origine.");
                  }
                  setConfirmModal(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Oui, réinitialiser maintenant</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
