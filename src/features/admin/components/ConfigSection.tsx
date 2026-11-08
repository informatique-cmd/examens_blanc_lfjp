import React, { useState } from "react";
import {
  Save,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Sparkles,
  Building,
  UserCheck,
  FileText,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Key,
  X,
  Bell,
  CheckSquare,
  Square,
  Flame,
  Download,
  FolderDown,
  FolderUp,
  Bookmark,
  GraduationCap,
} from "lucide-react";
import {
  type SiteInfo,
  type CmsExam,
  type CmsAnnouncement,
  type SavedConfigSnapshot,
  getSavedConfigSnapshots,
  saveConfigSnapshot,
  deleteConfigSnapshot,
  restoreConfigSnapshot,
  DEFAULT_SCHOOL_LEVELS,
} from "../../../shared/services/cms-store";

export interface StandardSlotItem {
  id: string;
  name: string;
  durationStd: number;
  standardHours: string;
  tiersTempsHours: string;
}

export interface ScienceSubjectItem {
  id: string;
  name: string;
  enabled: boolean;
}

interface ConfigSectionProps {
  siteInfo: SiteInfo;
  onUpdateSiteInfo: (updates: Partial<SiteInfo>) => void;
  exams: CmsExam[];
  onTogglePublishExam: (id: string, isPublished: boolean) => void;
  onShowNotification: (msg: string) => void;
  onResetForNewSchoolYear?: (newYear: string, preserveCatalogs?: boolean) => void;
  announcements?: CmsAnnouncement[];
  onAddAnnouncement?: (item: Omit<CmsAnnouncement, "id">) => void;
  onUpdateAnnouncement?: (id: string, updates: Partial<CmsAnnouncement>) => void;
  onDeleteAnnouncement?: (id: string) => void;
}

const DEFAULT_STANDARD_SLOTS: StandardSlotItem[] = [
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
    name: "Sciences (SVT & Physique-Chimie)",
    durationStd: 60,
    standardHours: "10h15 - 11h15",
    tiersTempsHours: "10h15 - 11h35 (+20 min)",
  },
];

const DEFAULT_EVALUATION_TYPES: string[] = [
  "DNB Blanc (Collège 3ème)",
  "DNB Officiel (Brevet)",
  "Bac Blanc 1ère (Français EAF)",
  "Bac Blanc Terminale",
  "Devoir Commun",
  "Grand Oral Blanc",
];

const DEFAULT_SCIENCES_SUBJECTS: ScienceSubjectItem[] = [
  { id: "svt", name: "SVT (Sciences de la Vie et de la Terre)", enabled: true },
  { id: "pc", name: "Physique-Chimie", enabled: true },
  { id: "techno", name: "Technologie", enabled: true },
];

export default function ConfigSection({
  siteInfo,
  onUpdateSiteInfo,
  exams,
  onTogglePublishExam,
  onShowNotification,
  onResetForNewSchoolYear,
  announcements = [],
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
}: ConfigSectionProps) {
  // 1. School Information
  const [schoolName, setSchoolName] = useState(siteInfo.title || "Lycée Français Jacques Prévert");
  const [schoolCity, setSchoolCity] = useState("Saly, Sénégal");
  const [sessionYear, setSessionYear] = useState(siteInfo.schoolYear || "2025-2026");

  // 2. Evaluation Types (CRUD)
  const [evalTypes, setEvalTypes] = useState<string[]>(
    siteInfo.evaluationTypes && siteInfo.evaluationTypes.length > 0
      ? siteInfo.evaluationTypes
      : DEFAULT_EVALUATION_TYPES
  );
  const [newEvalType, setNewEvalType] = useState("");
  const [editingEvalTypeIndex, setEditingEvalTypeIndex] = useState<number | null>(null);
  const [editingEvalTypeValue, setEditingEvalTypeValue] = useState("");

  // 2b. School Levels (CRUD)
  const [schoolLevels, setSchoolLevels] = useState<string[]>(
    siteInfo.schoolLevels && siteInfo.schoolLevels.length > 0
      ? siteInfo.schoolLevels
      : DEFAULT_SCHOOL_LEVELS
  );
  const [newSchoolLevel, setNewSchoolLevel] = useState("");
  const [editingSchoolLevelIndex, setEditingSchoolLevelIndex] = useState<number | null>(null);
  const [editingSchoolLevelValue, setEditingSchoolLevelValue] = useState("");

  // 3. Sciences Subjects (CRUD + Cocher/Décocher)
  const [sciencesSubjects, setSciencesSubjects] = useState<ScienceSubjectItem[]>(
    siteInfo.sciencesSubjects && siteInfo.sciencesSubjects.length > 0
      ? siteInfo.sciencesSubjects
      : DEFAULT_SCIENCES_SUBJECTS
  );
  const [newScienceName, setNewScienceName] = useState("");
  const [editingScienceId, setEditingScienceId] = useState<string | null>(null);
  const [editingScienceName, setEditingScienceName] = useState("");

  // 4. Standard Exam Slots & Tiers-Temps (CRUD)
  const [slots, setSlots] = useState<StandardSlotItem[]>(
    siteInfo.standardSlots && siteInfo.standardSlots.length > 0
      ? siteInfo.standardSlots
      : DEFAULT_STANDARD_SLOTS
  );
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotFormName, setSlotFormName] = useState("");
  const [slotFormDuration, setSlotFormDuration] = useState(90);
  const [slotFormStdHours, setSlotFormStdHours] = useState("08h00 - 09h30");
  const [slotFormTTHours, setSlotFormTTHours] = useState("08h00 - 10h00 (+30 min)");

  // Helper auto calculation for tiers-temps
  const calculateTTHours = (stdHours: string, durationMin: number) => {
    try {
      const match = stdHours.match(/(\d{1,2})[h:](\d{2})\s*-\s*(\d{1,2})[h:](\d{2})/);
      if (!match) return stdHours;
      const startH = parseInt(match[1], 10);
      const startM = parseInt(match[2], 10);
      const ttExtraMin = Math.round(durationMin / 3);
      const totalMin = startH * 60 + startM + durationMin + ttExtraMin;
      const endH = Math.floor(totalMin / 60) % 24;
      const endM = totalMin % 60;
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${pad(startH)}h${pad(startM)} - ${pad(endH)}h${pad(endM)} (+${ttExtraMin} min)`;
    } catch {
      return stdHours;
    }
  };

  // 5. Official Banner & Consignes (Announcements) CRUD
  const [alertEnabled, setAlertEnabled] = useState(siteInfo.bannerAlert?.enabled ?? false);
  const [alertTitle, setAlertTitle] = useState(siteInfo.bannerAlert?.title || "Consigne officielle de direction");
  const [alertMessage, setAlertMessage] = useState(
    siteInfo.bannerAlert?.message || "Présentez-vous 15 min avant l'épreuve avec votre convocation et pièce d'identité."
  );
  const [alertType, setAlertType] = useState<"info" | "warning" | "urgent" | "success">(
    siteInfo.bannerAlert?.type || "info"
  );

  // Announcement Modal
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPriority, setAnnPriority] = useState<"information" | "important" | "urgent">("information");
  const [annTarget, setAnnTarget] = useState<"all" | "bac" | "dnb" | "teachers">("all");
  const [annIsPublished, setAnnIsPublished] = useState(true);

  // 6. Logos
  const [logos, setLogos] = useState<Array<{ src: string; alt?: string }>>(
    siteInfo.logos && siteInfo.logos.length > 0
      ? siteInfo.logos
      : [
          { src: "/assets/aistudio/logo-lfjp_62451311.png", alt: "Lycée Français Jacques Prévert - Saly, Sénégal" },
          { src: "https://aefe.fr/sites/default/files/asset/document/logo-aefe-bleu-et-orange_0.svg", alt: "Réseau AEFE" },
        ]
  );
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [newLogoAlt, setNewLogoAlt] = useState("");

  // 7. Proviseur Credentials
  const [proviseurEmail, setProviseurEmail] = useState(siteInfo.proviseurAuth?.email || "proviseur@lfjpsaly.org");
  const [proviseurPassword, setProviseurPassword] = useState(siteInfo.proviseurAuth?.password || "ProviseurLFJP2026!");
  const [proviseurName, setProviseurName] = useState(siteInfo.proviseurAuth?.name || "M. le Proviseur");
  const [showProviseurPassword, setShowProviseurPassword] = useState(false);

  // 8. Next School Year Reset
  const [nextYearInput, setNextYearInput] = useState<string>(() => {
    const cur = siteInfo.schoolYear || "2025-2026";
    const parts = cur.split("-");
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      return `${Number(parts[0]) + 1}-${Number(parts[1]) + 1}`;
    }
    return "2026-2027";
  });
  const [preserveCatalogs, setPreserveCatalogs] = useState(true);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // 9. Saved Configuration Snapshots
  const [snapshots, setSnapshots] = useState<SavedConfigSnapshot[]>(() => getSavedConfigSnapshots());
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

  const handleCreateSnapshot = () => {
    if (!newSnapshotName.trim()) {
      alert("Veuillez saisir un nom pour cette configuration (ex: Bac Blanc Décembre 2026).");
      return;
    }
    const snap = saveConfigSnapshot(newSnapshotName.trim());
    setSnapshots(getSavedConfigSnapshots());
    setNewSnapshotName("");
    setIsSnapshotModalOpen(false);
    onShowNotification(`💾 Configuration « ${snap.name} » sauvegardée avec succès !`);
  };

  const handleRestoreSnapshot = (id: string) => {
    const snap = snapshots.find((s) => s.id === id);
    if (!snap) return;
    const confirmRestore = confirm(
      `Êtes-vous sûr de vouloir charger la configuration « ${snap.name} » ?\n\nCela va restaurer ${snap.examsCount} examens, ${snap.candidatesCount} élèves et ${snap.slotsCount} créneaux.`
    );
    if (!confirmRestore) return;

    const restored = restoreConfigSnapshot(id);
    if (restored) {
      onShowNotification(`🔄 Configuration « ${snap.name} » restaurée avec succès !`);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    const snap = snapshots.find((s) => s.id === id);
    if (!snap) return;
    if (!confirm(`Supprimer définitivement la sauvegarde « ${snap.name} » ?`)) return;
    const updated = deleteConfigSnapshot(id);
    setSnapshots(updated);
    onShowNotification(`Sauvegarde supprimée.`);
  };

  const handleExportSnapshot = (snap: SavedConfigSnapshot) => {
    const json = JSON.stringify(snap.data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lfjp-config-${snap.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${snap.createdAt.split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowNotification(`Fichier de configuration téléchargé !`);
  };

  // Save all main settings
  const handleSaveAll = () => {
    onUpdateSiteInfo({
      title: schoolName.trim(),
      schoolYear: sessionYear.trim(),
      logos,
      bannerAlert: {
        enabled: alertEnabled,
        title: alertTitle.trim(),
        message: alertMessage.trim(),
        type: alertType,
      },
      evaluationTypes: evalTypes,
      schoolLevels: schoolLevels,
      sciencesSubjects: sciencesSubjects,
      standardSlots: slots,
      proviseurAuth: {
        email: proviseurEmail.trim(),
        password: proviseurPassword.trim(),
        name: proviseurName.trim(),
      },
    });
    onShowNotification("⚙️ Tous les paramètres ont été enregistrés et synchronisés avec le site vitrine !");
  };

  // Evaluation Type Handlers
  const handleAddEvalType = () => {
    if (!newEvalType.trim()) return;
    const updated = [...evalTypes, newEvalType.trim()];
    setEvalTypes(updated);
    onUpdateSiteInfo({ evaluationTypes: updated });
    setNewEvalType("");
    onShowNotification("Type d'évaluation ajouté !");
  };

  const handleSaveEditingEvalType = (idx: number) => {
    if (!editingEvalTypeValue.trim()) return;
    const updated = [...evalTypes];
    updated[idx] = editingEvalTypeValue.trim();
    setEvalTypes(updated);
    onUpdateSiteInfo({ evaluationTypes: updated });
    setEditingEvalTypeIndex(null);
    setEditingEvalTypeValue("");
    onShowNotification("Type d'évaluation modifié !");
  };

  const handleDeleteEvalType = (idx: number) => {
    const updated = evalTypes.filter((_, i) => i !== idx);
    setEvalTypes(updated);
    onUpdateSiteInfo({ evaluationTypes: updated });
    onShowNotification("Type d'évaluation supprimé.");
  };

  // School Level Handlers
  const handleAddSchoolLevel = () => {
    if (!newSchoolLevel.trim()) return;
    const updated = [...schoolLevels, newSchoolLevel.trim()];
    setSchoolLevels(updated);
    onUpdateSiteInfo({ schoolLevels: updated });
    setNewSchoolLevel("");
    onShowNotification("Niveau scolaire ajouté !");
  };

  const handleSaveEditingSchoolLevel = (idx: number) => {
    if (!editingSchoolLevelValue.trim()) return;
    const updated = [...schoolLevels];
    updated[idx] = editingSchoolLevelValue.trim();
    setSchoolLevels(updated);
    onUpdateSiteInfo({ schoolLevels: updated });
    setEditingSchoolLevelIndex(null);
    setEditingSchoolLevelValue("");
    onShowNotification("Niveau scolaire modifié !");
  };

  const handleDeleteSchoolLevel = (idx: number) => {
    const updated = schoolLevels.filter((_, i) => i !== idx);
    setSchoolLevels(updated);
    onUpdateSiteInfo({ schoolLevels: updated });
    onShowNotification("Niveau scolaire supprimé.");
  };

  // Sciences Handlers
  const handleToggleScience = (id: string) => {
    const updated = sciencesSubjects.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setSciencesSubjects(updated);
    onUpdateSiteInfo({ sciencesSubjects: updated });
    onShowNotification("Statut de la matière scientifique mis à jour !");
  };

  const handleAddScience = () => {
    if (!newScienceName.trim()) return;
    const newId = `sci-${Date.now()}`;
    const updated = [...sciencesSubjects, { id: newId, name: newScienceName.trim(), enabled: true }];
    setSciencesSubjects(updated);
    onUpdateSiteInfo({ sciencesSubjects: updated });
    setNewScienceName("");
    onShowNotification("Matière scientifique ajoutée !");
  };

  const handleSaveEditingScience = (id: string) => {
    if (!editingScienceName.trim()) return;
    const updated = sciencesSubjects.map((s) => (s.id === id ? { ...s, name: editingScienceName.trim() } : s));
    setSciencesSubjects(updated);
    onUpdateSiteInfo({ sciencesSubjects: updated });
    setEditingScienceId(null);
    setEditingScienceName("");
    onShowNotification("Matière scientifique renommée !");
  };

  const handleDeleteScience = (id: string) => {
    const updated = sciencesSubjects.filter((s) => s.id !== id);
    setSciencesSubjects(updated);
    onUpdateSiteInfo({ sciencesSubjects: updated });
    onShowNotification("Matière scientifique supprimée.");
  };

  // Standard Slots Handlers
  const openNewSlotModal = () => {
    setEditingSlotId(null);
    setSlotFormName("");
    setSlotFormDuration(90);
    setSlotFormStdHours("08h00 - 09h30");
    setSlotFormTTHours("08h00 - 10h00 (+30 min)");
    setIsSlotModalOpen(true);
  };

  const openEditSlotModal = (slot: StandardSlotItem) => {
    setEditingSlotId(slot.id);
    setSlotFormName(slot.name);
    setSlotFormDuration(slot.durationStd);
    setSlotFormStdHours(slot.standardHours);
    setSlotFormTTHours(slot.tiersTempsHours);
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = () => {
    if (!slotFormName.trim()) return;
    let updated: StandardSlotItem[];
    if (editingSlotId) {
      updated = slots.map((s) =>
        s.id === editingSlotId
          ? {
              ...s,
              name: slotFormName.trim(),
              durationStd: Number(slotFormDuration) || 60,
              standardHours: slotFormStdHours.trim(),
              tiersTempsHours: slotFormTTHours.trim(),
            }
          : s
      );
      onShowNotification("Horaire officiel modifié !");
    } else {
      const newSlot: StandardSlotItem = {
        id: `slot-${Date.now()}`,
        name: slotFormName.trim(),
        durationStd: Number(slotFormDuration) || 60,
        standardHours: slotFormStdHours.trim(),
        tiersTempsHours: slotFormTTHours.trim(),
      };
      updated = [...slots, newSlot];
      onShowNotification("Nouvel horaire officiel ajouté !");
    }
    setSlots(updated);
    onUpdateSiteInfo({ standardSlots: updated });
    setIsSlotModalOpen(false);
  };

  const handleDeleteSlot = (id: string) => {
    const updated = slots.filter((s) => s.id !== id);
    setSlots(updated);
    onUpdateSiteInfo({ standardSlots: updated });
    onShowNotification("Horaire officiel supprimé.");
  };

  // Announcement Handlers
  const openNewAnnouncementModal = () => {
    setEditingAnnId(null);
    setAnnTitle("");
    setAnnContent("");
    setAnnPriority("information");
    setAnnTarget("all");
    setAnnIsPublished(true);
    setIsAnnModalOpen(true);
  };

  const openEditAnnouncementModal = (ann: CmsAnnouncement) => {
    setEditingAnnId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnPriority(ann.priority);
    setAnnTarget(ann.target);
    setAnnIsPublished(ann.isPublished);
    setIsAnnModalOpen(true);
  };

  const handleSaveAnnouncement = () => {
    if (!annTitle.trim() || !annContent.trim()) return;
    if (editingAnnId) {
      if (onUpdateAnnouncement) {
        onUpdateAnnouncement(editingAnnId, {
          title: annTitle.trim(),
          content: annContent.trim(),
          priority: annPriority,
          target: annTarget,
          isPublished: annIsPublished,
        });
      }
      onShowNotification("Consigne officielle mise à jour !");
    } else {
      if (onAddAnnouncement) {
        onAddAnnouncement({
          title: annTitle.trim(),
          content: annContent.trim(),
          priority: annPriority,
          target: annTarget,
          isPublished: annIsPublished,
          date: new Date().toISOString().split("T")[0],
        });
      }
      onShowNotification("Nouvelle consigne officielle publiée !");
    }
    setIsAnnModalOpen(false);
  };

  const handleTogglePublishAnnouncement = (ann: CmsAnnouncement) => {
    if (onUpdateAnnouncement) {
      onUpdateAnnouncement(ann.id, { isPublished: !ann.isPublished });
      onShowNotification(
        !ann.isPublished
          ? "Consigne publiée sur le site vitrine !"
          : "Consigne dépubliée (mise en brouillon)."
      );
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (onDeleteAnnouncement) {
      onDeleteAnnouncement(id);
      onShowNotification("Consigne supprimée.");
    }
  };

  // Logos handlers
  const handleRemoveLogo = (idx: number) => {
    const next = logos.filter((_, i) => i !== idx);
    setLogos(next);
    onUpdateSiteInfo({ logos: next });
    onShowNotification("Logo retiré.");
  };

  const handleAddLogoByUrl = () => {
    if (!newLogoUrl.trim()) return;
    const next = [...logos, { src: newLogoUrl.trim(), alt: newLogoAlt.trim() || schoolName }];
    setLogos(next);
    onUpdateSiteInfo({ logos: next });
    setNewLogoUrl("");
    setNewLogoAlt("");
    onShowNotification("Logo ajouté !");
  };

  const handleResetSchoolLogos = () => {
    const defaultLogos = [
      { src: "/assets/aistudio/logo-lfjp_62451311.png", alt: "Lycée Français Jacques Prévert - Saly, Sénégal" },
      { src: "https://aefe.fr/sites/default/files/asset/document/logo-aefe-bleu-et-orange_0.svg", alt: "Agence pour l'Enseignement Français à l'Étranger (AEFE)" },
    ];
    setLogos(defaultLogos);
    onUpdateSiteInfo({ logos: defaultLogos });
    onShowNotification("Logos officiels LFJP & AEFE rétablis !");
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Header with Global Save */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
              Module Central
            </span>
            <span className="text-xs text-slate-500">
              Identité de l'établissement & Paramètres officiels
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            ⚙️ Configuration des Examens & Vitrine
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Gérez les horaires officiels (+1/3 temps), les consignes, les types d'évaluations et préparez la nouvelle année scolaire.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <Save className="h-4 w-4" />
          <span>Enregistrer les paramètres</span>
        </button>
      </div>

      {/* 1. Établissement & Année scolaire */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building className="h-4 w-4 text-[#002060]" />
            <span>Identité de l'Établissement & Année Scolaire</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">LFJP Saly</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom officiel de l'établissement
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              placeholder="Lycée Français Jacques Prévert"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ville et Pays d'exercice
            </label>
            <input
              type="text"
              value={schoolCity}
              onChange={(e) => setSchoolCity(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              placeholder="Saly, Sénégal"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Session / Année scolaire active
            </label>
            <input
              type="text"
              value={sessionYear}
              onChange={(e) => {
                const val = e.target.value;
                setSessionYear(val);
                onUpdateSiteInfo({ schoolYear: val });
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-bold text-[#002060]"
              placeholder="Ex: 2026-2027"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              S'affiche instantanément sur le site vitrine et les convocations
            </p>
          </div>
        </div>
      </div>

      {/* 2. Type d'Évaluation (CRUD Complet) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Types d'Évaluation (Ajouter, Modifier, Supprimer)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Définissez les catégories d'épreuves officielles proposées dans l'établissement.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
            {evalTypes.length} type(s)
          </span>
        </div>

        {/* Add Type Form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newEvalType}
            onChange={(e) => setNewEvalType(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddEvalType()}
            placeholder="Ajouter un type d'évaluation (ex: Épreuves Communes 2nde)..."
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={handleAddEvalType}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Types List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {evalTypes.map((type, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition group"
            >
              {editingEvalTypeIndex === idx ? (
                <div className="flex items-center gap-1.5 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingEvalTypeValue}
                    onChange={(e) => setEditingEvalTypeValue(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-blue-500 rounded bg-white"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEditingEvalType(idx)}
                    className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    title="Valider"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingEvalTypeIndex(null)}
                    className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400"
                    title="Annuler"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-semibold text-xs text-slate-800 truncate mr-2">{type}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEvalTypeIndex(idx);
                        setEditingEvalTypeValue(type);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Modifier ce type d'évaluation"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvalType(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Supprimer ce type"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2b. Niveaux Scolaires de l'Établissement (CRUD) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              <span>Niveaux Scolaires de l'Établissement (Ajouter, Modifier, Supprimer)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Définissez les divisions et niveaux scolaires ciblés pour les examens et épreuves (3ème, 1ère, Terminale, etc.).
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
            {schoolLevels.length} niveau(x)
          </span>
        </div>

        {/* Add Level Form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newSchoolLevel}
            onChange={(e) => setNewSchoolLevel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSchoolLevel()}
            placeholder="Ajouter un niveau scolaire (ex: 3ème (DNB Collège), Seconde générale)..."
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={handleAddSchoolLevel}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Levels List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {schoolLevels.map((lvl, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition group"
            >
              {editingSchoolLevelIndex === idx ? (
                <div className="flex items-center gap-1.5 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingSchoolLevelValue}
                    onChange={(e) => setEditingSchoolLevelValue(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-indigo-500 rounded bg-white"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEditingSchoolLevel(idx)}
                    className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    title="Valider"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingSchoolLevelIndex(null)}
                    className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400"
                    title="Annuler"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-semibold text-xs text-slate-800 truncate mr-2">{lvl}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSchoolLevelIndex(idx);
                        setEditingSchoolLevelValue(lvl);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                      title="Modifier ce niveau scolaire"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSchoolLevel(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Supprimer ce niveau"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Matières Scientifiques (CRUD + Cocher/Décocher) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-600" />
              <span>Matières Scientifiques (DNB & Épreuves)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cochez les matières retenues pour la session, modifiez leurs intitulés ou ajoutez-en de nouvelles.
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            {sciencesSubjects.filter((s) => s.enabled).length} active(s)
          </span>
        </div>

        {/* Add Science Form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newScienceName}
            onChange={(e) => setNewScienceName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddScience()}
            placeholder="Ajouter une discipline scientifique (ex: Sciences de l'Ingénieur)..."
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={handleAddScience}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Sciences List with Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {sciencesSubjects.map((subject) => (
            <div
              key={subject.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition ${
                subject.enabled
                  ? "border-amber-300 bg-amber-50/50"
                  : "border-slate-200 bg-slate-50 opacity-70"
              }`}
            >
              {editingScienceId === subject.id ? (
                <div className="flex items-center gap-1.5 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingScienceName}
                    onChange={(e) => setEditingScienceName(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-amber-500 rounded bg-white"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEditingScience(subject.id)}
                    className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    title="Valider"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingScienceId(null)}
                    className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400"
                    title="Annuler"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <label className="flex items-center gap-2 cursor-pointer min-w-0 mr-2">
                    <input
                      type="checkbox"
                      checked={subject.enabled}
                      onChange={() => handleToggleScience(subject.id)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4 shrink-0"
                    />
                    <span className={`text-xs font-semibold truncate ${subject.enabled ? "text-slate-900" : "text-slate-500"}`}>
                      {subject.name}
                    </span>
                  </label>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingScienceId(subject.id);
                        setEditingScienceName(subject.name);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded transition"
                      title="Modifier l'intitulé"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteScience(subject.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Supprimer cette discipline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Horaires Officiels & Aménagements Tiers-Temps (+1/3 temps) (CRUD) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span>Horaires Officiels des Épreuves & Calcul Tiers-Temps (+1/3 temps)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ajoutez, modifiez ou supprimez les créneaux types et majorez automatiquement le temps pour les candidats PAP/PPS.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewSlotModal}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter un horaire officiel</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="p-3">Discipline / Épreuve</th>
                <th className="p-3 text-center">Durée Standard</th>
                <th className="p-3">Horaires Standard</th>
                <th className="p-3">Horaires Tiers-Temps (+1/3 temps)</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {slots.map((slot) => (
                <tr key={slot.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3 font-bold text-slate-900">{slot.name}</td>
                  <td className="p-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">
                      {slot.durationStd} min
                    </span>
                  </td>
                  <td className="p-3 text-slate-800 font-mono text-[11px] font-semibold">
                    {slot.standardHours}
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                      {slot.tiersTempsHours}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditSlotModal(slot)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Modifier cet horaire"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Supprimer cet horaire"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bannière Officielle & Consignes de Direction (CRUD + Publier/Dépublier) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              <span>Bannière Officielle & Consignes de Direction</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rédigez les consignes impératives, publiez ou dépubliez-les en un clic vers la vitrine publique.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewAnnouncementModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter une consigne</span>
          </button>
        </div>

        {/* Global Alert Banner Configuration */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="flex items-center gap-2 font-bold text-xs text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={alertEnabled}
                onChange={(e) => setAlertEnabled(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span>Activer la bannière d'alerte prioritaire en tête de la vitrine</span>
            </label>

            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as any)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium"
            >
              <option value="info">ℹ️ Information générale (Bleu)</option>
              <option value="warning">⚠️ Vigilance (Orange)</option>
              <option value="urgent">🚨 Urgent (Rouge)</option>
              <option value="success">✅ Validé / Réussite (Vert)</option>
            </select>
          </div>

          {alertEnabled && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <input
                type="text"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="Titre de la consigne (ex: Consigne d'appel et d'émargement)"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                rows={2}
                placeholder="Message à afficher à l'ensemble des acteurs..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          )}
        </div>

        {/* Announcements List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Consignes & Communiqués enregistrés ({announcements.length}) :
          </h4>

          {announcements.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              Aucune consigne rédigée pour le moment. Cliquez sur "Ajouter une consigne" ci-dessus.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-4 rounded-xl border transition space-y-2 ${
                    ann.isPublished
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-slate-200 bg-slate-50/70 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{ann.title}</p>
                      <p className="text-[10px] text-slate-400">
                        Cible : {ann.target === "all" ? "Tous" : ann.target === "teachers" ? "Professeurs" : "Élèves"} • Date : {ann.date}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        ann.isPublished
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {ann.isPublished ? "✓ Publié" : "Brouillon"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleTogglePublishAnnouncement(ann)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                        ann.isPublished
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {ann.isPublished ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{ann.isPublished ? "Dépublier" : "Publier sur Vitrine"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditAnnouncementModal(ann)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Modifier cette consigne"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Supprimer cette consigne"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Logo & Identité Visuelle */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#e67e22]" />
              <span>Logos Officiels de l'Établissement (LFJP & AEFE)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ces visuels s'affichent sur le bandeau supérieur, les convocations d'examen et les documents officiels.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetSchoolLogos}
            className="px-3 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Rétablir logos LFJP + AEFE
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {logos.map((logo, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0">
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
                  <p className="text-[10px] text-slate-400 truncate">{logo.src}</p>
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
        </div>
      </div>

      {/* 7. Identifiants Proviseur */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Key className="h-4 w-4 text-emerald-600" />
              <span>Identifiants de Connexion du Proviseur (Espace Direction)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Permet au Proviseur de se connecter avec son email et mot de passe sans passer par GitHub.
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden pr-16 font-mono"
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
              Nom / Titre officiel
            </label>
            <input
              type="text"
              value={proviseurName}
              onChange={(e) => setProviseurName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              placeholder="M. le Proviseur"
            />
          </div>
        </div>
      </div>

      {/* 8. Réinitialisation pour la Nouvelle Année Scolaire (UNIQUE BOUTON CONSERVÉ) */}
      <div className="bg-white rounded-2xl border-2 border-blue-200/90 shadow-sm p-6 space-y-5">
        <div className="border-b border-blue-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#002060]">
              <RotateCcw className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Réinitialisation pour une Nouvelle Année Scolaire
              </h3>
              <p className="text-[11px] text-slate-500">
                Basculez facilement vers la prochaine rentrée scolaire en conservant ou vidant les catalogues
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#002060] text-white">
            Session Suivante
          </span>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-2">
          <p className="font-semibold text-[#002060] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Comment fonctionne la réinitialisation pour la nouvelle année ?</span>
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Pour préparer une nouvelle année d'examens (ex: passage à <strong>{nextYearInput}</strong>), cette opération réinitialise les candidats de l'année précédente, leurs places et les créneaux passés. Vous pouvez conserver vos salles et vos professeurs pour ne pas avoir à les réimporter.
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002060] focus:outline-hidden font-bold text-[#002060]"
            />
          </div>

          <div className="pt-2 sm:pt-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
              <input
                type="checkbox"
                checked={preserveCatalogs}
                onChange={(e) => setPreserveCatalogs(e.target.checked)}
                className="rounded border-slate-300 text-[#002060] focus:ring-[#002060] h-4 w-4"
              />
              <span className="font-semibold">
                Conserver le catalogue des salles et la liste des professeurs
              </span>
            </label>
            <p className="text-[10px] text-slate-400 mt-0.5 pl-6">
              Évite de ressaisir les locaux et le personnel enseignant
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#002060] hover:bg-[#001746] text-white text-xs font-bold transition shadow-md flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>✨ Réinitialiser pour une nouvelle année scolaire ({nextYearInput})</span>
          </button>
        </div>
      </div>

      {/* 9. Profils & Sauvegardes de Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Bookmark className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Sauvegardes & Profils de Configuration
              </h3>
              <p className="text-[11px] text-slate-500">
                Enregistrez des copies de secours de vos examens, créneaux et répartitions pour pouvoir les restaurer à tout moment
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSnapshotModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Sauvegarder la configuration actuelle</span>
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <Bookmark className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Aucune sauvegarde enregistrée</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Cliquez sur le bouton ci-dessus pour immortaliser votre programmation actuelle (épreuves, créneaux, surveillants, candidats et salles).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{snap.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Enregistrée le {new Date(snap.createdAt).toLocaleDateString("fr-FR")} à {new Date(snap.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {snap.schoolYear}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-lg text-center text-[10px] text-slate-600 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">{snap.examsCount}</span>
                    <span>Examens</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">{snap.slotsCount}</span>
                    <span>Créneaux</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">{snap.candidatesCount}</span>
                    <span>Candidats</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestoreSnapshot(snap.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restaurer</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleExportSnapshot(snap)}
                      title="Télécharger cette configuration au format JSON"
                      className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSnapshot(snap.id)}
                      title="Supprimer cette sauvegarde"
                      className="p-1.5 rounded-lg border border-slate-300 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Save Snapshot */}
      {isSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Bookmark className="h-5 w-5" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Sauvegarder la Configuration Actuelle
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSnapshotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 text-[11px]">
                Donnez un nom mémorable à cette configuration pour la retrouver facilement plus tard (ex: <em>Bac Blanc Décembre 2026 - Version Finale</em>).
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nom de la configuration :
                </label>
                <input
                  type="text"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  placeholder="Ex: Session Bac Blanc Décembre 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSnapshotModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateSnapshot}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer la configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Slot Edit/Add */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm">
                {editingSlotId ? "Modifier l'Horaire Officiel" : "Ajouter un Horaire Officiel"}
              </h4>
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Discipline / Épreuve
                </label>
                <input
                  type="text"
                  value={slotFormName}
                  onChange={(e) => setSlotFormName(e.target.value)}
                  placeholder="Ex: Français (Écrit), Mathématiques..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Durée Standard (min)
                  </label>
                  <input
                    type="number"
                    value={slotFormDuration}
                    onChange={(e) => {
                      const dur = Number(e.target.value) || 0;
                      setSlotFormDuration(dur);
                      setSlotFormTTHours(calculateTTHours(slotFormStdHours, dur));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Horaires Standard
                  </label>
                  <input
                    type="text"
                    value={slotFormStdHours}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSlotFormStdHours(val);
                      setSlotFormTTHours(calculateTTHours(val, slotFormDuration));
                    }}
                    placeholder="08h00 - 10h00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Horaires Tiers-Temps (+1/3 temps)
                </label>
                <input
                  type="text"
                  value={slotFormTTHours}
                  onChange={(e) => setSlotFormTTHours(e.target.value)}
                  placeholder="08h00 - 10h40 (+40 min)"
                  className="w-full px-3 py-2 border border-purple-300 bg-purple-50 rounded-lg font-mono font-bold text-purple-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Calculé automatiquement avec la majoration de +1/3 de temps.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveSlot}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
              >
                Enregistrer l'horaire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Announcement Edit/Add */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm">
                {editingAnnId ? "Modifier la Consigne" : "Rédiger une Nouvelle Consigne"}
              </h4>
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Titre de la consigne
                </label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Ex: Heure de convocation et sacs à l'entrée..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Niveau d'importance
                  </label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="information">Information générale</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent / Impératif</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Public cible
                  </label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="all">Tous les usagers</option>
                    <option value="dnb">Élèves de 3ème (DNB)</option>
                    <option value="bac">Élèves de Bac (1ère / Tale)</option>
                    <option value="teachers">Professeurs surveillants</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Texte de la consigne
                </label>
                <textarea
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  rows={4}
                  placeholder="Détaillez les consignes officielles..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
                <input
                  type="checkbox"
                  checked={annIsPublished}
                  onChange={(e) => setAnnIsPublished(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-800">
                  Publier immédiatement sur le site vitrine
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveAnnouncement}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Enregistrer la consigne
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation Reset Nouvelle Année */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-blue-700">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Confirmer la bascule vers {nextYearInput} ?
                </h4>
                <p className="text-xs text-slate-500">
                  Préparation de la nouvelle session d'examens
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Vous êtes sur le point de basculer vers l'année scolaire <strong>{nextYearInput}</strong>. Les anciens candidats et leurs affectations de tables seront réinitialisés pour faire place à la nouvelle cohorte.
              {preserveCatalogs
                ? " Vos salles et vos professeurs seront préservés."
                : " L'ensemble des données sera vidé."}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onResetForNewSchoolYear) {
                    onResetForNewSchoolYear(nextYearInput, preserveCatalogs);
                  }
                  onUpdateSiteInfo({ schoolYear: nextYearInput });
                  setSessionYear(nextYearInput);
                  onShowNotification(
                    `🎉 Année scolaire basculée sur ${nextYearInput} ! Données réinitialisées et vitrine synchronisée.`
                  );
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#002060] hover:bg-[#001746] rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Confirmer et réinitialiser</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
