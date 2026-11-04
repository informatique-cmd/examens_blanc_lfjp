import { useState, useEffect, Fragment, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  FileText,
  GraduationCap,
  DoorOpen,
  Users,
  Shield,
  UploadCloud,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  ArrowRight,
  Eye,
  ExternalLink,
  Download,
  Layers,
  Search,
  LogOut,
  GitBranch,
  Github,
  Loader2,
  CheckCircle,
  ClipboardPaste,
  ChevronDown,
  Printer,
  Key,
  AlertTriangle,
  RefreshCw,
  Shuffle,
  Bell,
  Save,
  UserCheck,
} from "lucide-react";

import {
  useCmsData,
  exportCmsDataJson,
  importCmsDataJson,
  markProviseurSaved,
  clearPendingDeployment,
  type CmsAnnouncement,
  type CmsExam,
  type CmsRoom,
  type CmsTeacher,
  type CmsSurveillance,
  type CmsCandidate,
  type SiteInfo,
} from "../../../shared/services/cms-store";

import {
  useGitHubAuth,
  pushCmsChangesToGitHub,
  DEFAULT_GITHUB_TOKEN,
  resetToDefaultGitHubToken,
} from "../../../shared/services/github-service";

import AdminSidebar, { type AdminSection } from "../components/AdminSidebar";
import AdminDashboardSection from "../components/AdminDashboardSection";
import ConfigSection from "../components/ConfigSection";
import VitrinePublishSection from "../components/VitrinePublishSection";
import DataAmenagementsSection from "../components/DataAmenagementsSection";
import SecPochettesSection from "../components/SecPochettesSection";
import OrganizationSection from "../components/OrganizationSection";
import { PlanningRoomsSection, PlanningProfsSection } from "../components/PlanningSections";
import { ConvocElevesSection, ConvocProfsSection } from "../components/ConvocSections";
import ViewEdtSection from "../components/ViewEdtSection";
import CorrRepartitionSection from "../components/CorrRepartitionSection";
import ResultsSections from "../components/ResultsSections";
import DataElevesSection from "../components/DataElevesSection";
import DataSallesSection from "../components/DataSallesSection";
import DataProfsSection from "../components/DataProfsSection";
import CreneauxSection from "../components/CreneauxSection";
import SessionsExamensSection from "../components/SessionsExamensSection";

export default function AdminPage() {
  const {
    data: cmsData,
    updateSiteInfo,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    addExam,
    updateExam,
    deleteExam,
    duplicateExam,
    addExamSlot,
    updateExamSlot,
    deleteExamSlot,
    addRoom,
    updateRoom,
    deleteRoom,
    setRooms,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    setTeachers,
    addSurveillance,
    updateSurveillance,
    deleteSurveillance,
    duplicateSurveillance,
    setSurveillances,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    setCandidates,
    resetToDefaults,
    resetForNewSchoolYear,
    markProviseurSaved,
    clearPendingDeployment,
  } = useCmsData();

  // Active role-based session: 'proviseur' | 'superadmin'
  const [adminSession, setAdminSession] = useState<{
    role: "proviseur" | "superadmin";
    email: string;
    name: string;
  } | null>(() => {
    try {
      const raw = sessionStorage.getItem("lfjp_admin_active_session");
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  });

  // Login tabs: 'proviseur' | 'superadmin'
  const [authTab, setAuthTab] = useState<"proviseur" | "superadmin">("proviseur");

  // Proviseur Login state
  const [proviseurEmailInput, setProviseurEmailInput] = useState<string>("proviseur@lfjpsaly.org");
  const [proviseurPasswordInput, setProviseurPasswordInput] = useState<string>("");
  const [showProviseurLoginPass, setShowProviseurLoginPass] = useState<boolean>(false);
  const [proviseurLoginError, setProviseurLoginError] = useState<string | null>(null);

  // Proviseur Save confirmation modal
  const [proviseurSaveModalOpen, setProviseurSaveModalOpen] = useState<boolean>(false);

  // GitHub Auth & Sync hook (SuperAdmin)
  const {
    isAuthenticated: isGitHubAuthenticated,
    user: githubUser,
    config: githubConfig,
    token: githubToken,
    login: loginGitHub,
    logout: logoutGitHub,
  } = useGitHubAuth();

  // Overall authentication check
  const isAuthenticated = Boolean(adminSession);

  // Navigation hook for redirect
  const navigate = useNavigate();

  // Login form state
  const [loginTokenInput, setLoginTokenInput] = useState(DEFAULT_GITHUB_TOKEN || githubToken || "");
  const [loginOwnerInput, setLoginOwnerInput] = useState(githubConfig.owner || "informatique-cmd");
  const [loginRepoInput, setLoginRepoInput] = useState(githubConfig.repo || "examens_blanc_lfjp");
  const [loginBranchInput, setLoginBranchInput] = useState(githubConfig.branch || "main");
  const [showToken, setShowToken] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [hasOpenedGitHub, setHasOpenedGitHub] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  // Sync / Push modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<string>("");
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    commitSha?: string;
    commitUrl?: string;
    error?: string;
  } | null>(null);
  const [commitMessageInput, setCommitMessageInput] = useState(
    `Mise à jour des programmations d'examens LFJP (${new Date().toLocaleDateString("fr-FR")})`
  );
  const [modalNewToken, setModalNewToken] = useState(DEFAULT_GITHUB_TOKEN || "");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [dashboardTokenInput, setDashboardTokenInput] = useState(githubToken || DEFAULT_GITHUB_TOKEN || "");
  const [showDashboardPassword, setShowDashboardPassword] = useState(false);
  const [isUpdatingTokenInModal, setIsUpdatingTokenInModal] = useState(false);
  const [tokenUpdateError, setTokenUpdateError] = useState<string | null>(null);
  const [tokenUpdateSuccess, setTokenUpdateSuccess] = useState<string | null>(null);

  // Navigation state matching target site
  const [currentSection, setCurrentSection] = useState<AdminSection>("dashboard");
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    dataMenu: true,
    planningMenu: false,
    convocMenu: false,
    resMenu: false,
  });
  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setActiveTab = (tab: any) => {
    if (tab === "programmations") setCurrentSection("config");
    else if (tab === "candidates") setCurrentSection("data-eleves");
    else if (tab === "rooms") setCurrentSection("data-salles");
    else if (tab === "teachers") setCurrentSection("data-profs");
    else if (tab === "orga_perdir") setCurrentSection("organization");
    else if (tab === "siteInfo") setCurrentSection("config");
    else if (tab === "deployment") setCurrentSection("deployment");
    else setCurrentSection(tab);
  };
  const activeTab: any = currentSection;
  const [notification, setNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Teacher batch import
  const [isBatchImportingTeachers, setIsBatchImportingTeachers] = useState(false);
  const [batchImportTeachersText, setBatchImportTeachersText] = useState("");

  // Modals for CRUD
  const [editingAnnouncement, setEditingAnnouncement] = useState<CmsAnnouncement | null>(null);
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);

  const [editingExam, setEditingExam] = useState<CmsExam | null>(null);
  const [isAddingExam, setIsAddingExam] = useState(false);

  const [editingRoom, setEditingRoom] = useState<CmsRoom | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);

  const [editingTeacher, setEditingTeacher] = useState<CmsTeacher | null>(null);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);

  const [editingSurveillance, setEditingSurveillance] = useState<CmsSurveillance | null>(null);
  const [isAddingSurveillance, setIsAddingSurveillance] = useState(false);

  const [editingCandidate, setEditingCandidate] = useState<CmsCandidate | null>(null);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [isBatchImportingCandidates, setIsBatchImportingCandidates] = useState(false);
  const [batchImportText, setBatchImportText] = useState("");

  // Form local state for Site Info
  const [siteInfoForm, setSiteInfoForm] = useState(cmsData.siteInfo);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };
  useEffect(() => {
    if (githubToken) {
      setModalNewToken(githubToken);
      setDashboardTokenInput(githubToken);
    } else if (DEFAULT_GITHUB_TOKEN) {
      setModalNewToken(DEFAULT_GITHUB_TOKEN);
      setDashboardTokenInput(DEFAULT_GITHUB_TOKEN);
    }
  }, [githubToken]);

  // Logout handler with immediate session reset
  const handleLogout = () => {
    try {
      sessionStorage.removeItem("lfjp_admin_active_session");
    } catch {
      // ignore
    }
    setAdminSession(null);
    logoutGitHub();
    showNotification("Vous avez été déconnecté de l'espace d'administration.");
  };

  // Proviseur Email/Password Login
  const handleProviseurLogin = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setProviseurLoginError(null);

    const configured = cmsData.siteInfo.proviseurAuth || {
      email: "proviseur@lfjpsaly.org",
      password: "ProviseurLFJP2026!",
      name: "M. le Proviseur",
    };

    const emailMatch =
      proviseurEmailInput.trim().toLowerCase() === configured.email.trim().toLowerCase();
    const passMatch = proviseurPasswordInput.trim() === configured.password.trim();

    if (!emailMatch || !passMatch) {
      setProviseurLoginError(
        "Identifiants incorrects. Veuillez vérifier l'adresse email et le mot de passe Direction."
      );
      return;
    }

    const newSession = {
      role: "proviseur" as const,
      email: configured.email,
      name: configured.name || "M. le Proviseur",
    };
    try {
      sessionStorage.setItem("lfjp_admin_active_session", JSON.stringify(newSession));
    } catch {
      // ignore
    }
    setAdminSession(newSession);
    setCurrentSection("sessions-examens");
    showNotification(`Connexion réussie ! Bienvenue ${newSession.name}.`);
  };

  // Proviseur Save Changes
  const handleProviseurSave = () => {
    markProviseurSaved("Mise à jour des examens effectuée par le Proviseur");
    setProviseurSaveModalOpen(true);
    showNotification("💾 Modifications enregistrées avec succès !");
  };

  // Open GitHub OAuth / Token page in popup/tab
  const handleStartGitHubConnect = () => {
    setHasOpenedGitHub(true);
    setLoginError(null);
    window.open(
      "https://github.com/settings/tokens/new?scopes=repo&description=LFJP+Admin+CMS",
      "_blank"
    );
  };

  // Paste token from clipboard
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setLoginTokenInput(text.trim());
          showNotification("Jeton collé depuis le presse-papier !");
        }
      }
    } catch {
      // Ignore if permission denied
    }
  };

  const handleSaveDashboardToken = async () => {
    const tokenToUse = (dashboardTokenInput || DEFAULT_GITHUB_TOKEN).trim();
    setIsLoggingIn(true);
    const loginRes = await loginGitHub(tokenToUse, githubConfig);
    setIsLoggingIn(false);
    if (loginRes.success) {
      setModalNewToken(tokenToUse);
      showNotification("Jeton GitHub validé et enregistré avec succès !");
    } else {
      showNotification("Attention : validation GitHub échouée (" + (loginRes.error || "Erreur") + ")");
    }
  };

  // Handle GitHub Login
  const handleLoginSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const tokenToUse = loginTokenInput.trim();
    if (!tokenToUse) {
      setLoginError("Veuillez saisir ou coller votre jeton GitHub.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    const result = await loginGitHub(tokenToUse, {
      owner: loginOwnerInput.trim() || "informatique-cmd",
      repo: loginRepoInput.trim() || "examens_blanc_lfjp",
      branch: loginBranchInput.trim() || "main",
    });

    setIsLoggingIn(false);
    if (!result.success) {
      setLoginError(result.error || "Impossible de se connecter à GitHub avec cette clé.");
    } else {
      const newSession = {
        role: "superadmin" as const,
        email: result.user?.login || "admin",
        name: result.user?.name || result.user?.login || "SuperAdmin Technique",
      };
      try {
        sessionStorage.setItem("lfjp_admin_active_session", JSON.stringify(newSession));
      } catch {
        // ignore
      }
      setAdminSession(newSession);
      setCurrentSection("config");
      showNotification(`Connexion réussie ! Bienvenue ${newSession.name}.`);
    }
  };

  // Handle Push to GitHub & Vercel
  const handlePushToGitHub = async () => {
    setIsSyncing(true);
    setSyncStep("Initialisation de la synchronisation...");
    setSyncResult(null);
    setTokenUpdateError(null);
    setTokenUpdateSuccess(null);

    const tokenToPass = (modalNewToken || dashboardTokenInput || githubToken || DEFAULT_GITHUB_TOKEN).trim();

    const res = await pushCmsChangesToGitHub({
      cmsData,
      commitMessage: commitMessageInput,
      overrideToken: tokenToPass,
      onProgress: (status) => setSyncStep(status),
    });

    setIsSyncing(false);
    setSyncResult(res);
    if (res.success) {
      clearPendingDeployment();
      showNotification("Modifications publiées sur GitHub ! Vercel redéploie votre site en ligne.");
    }
  };

  // Handle direct Push to GitHub & Vercel without opening any modal window
  const handlePushToGitHubDirect = async () => {
    setIsSyncing(true);
    setSyncStep("Connexion au dépôt GitHub & commit...");
    setSyncResult(null);
    showNotification("🚀 Déploiement en cours : commit & push direct vers GitHub et Vercel...");

    const tokenToPass = (dashboardTokenInput || githubToken || DEFAULT_GITHUB_TOKEN).trim();
    const now = new Date();
    const commitMsg = `Mise à jour examens LFJP (${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})`;

    const res = await pushCmsChangesToGitHub({
      cmsData,
      commitMessage: commitMsg,
      overrideToken: tokenToPass,
      onProgress: (status) => setSyncStep(status),
    });

    setIsSyncing(false);
    setSyncResult(res);
    if (res.success) {
      clearPendingDeployment();
      showNotification("✅ Déploiement réussi ! Site vitrine mis à jour en ligne sur Vercel.");
    } else {
      showNotification(`❌ Erreur de déploiement : ${res.error || "Échec"}`);
    }
  };

  // Open GitHub page to generate token with repo scope prefilled
  const handleOpenGitHubTokenPage = () => {
    window.open(
      "https://github.com/settings/tokens/new?scopes=repo&description=LFJP+Admin+CMS+Deploy",
      "_blank"
    );
  };

  // Paste token from clipboard into modal
  const handlePasteModalToken = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setModalNewToken(text.trim());
          setTokenUpdateError(null);
          showNotification("Jeton collé depuis le presse-papier !");
        }
      }
    } catch {
      // Ignore
    }
  };

  // Update token and immediately retry deployment
  const handleUpdateTokenAndRetry = async () => {
    const tokenToUse = modalNewToken.trim();
    if (!tokenToUse) {
      setTokenUpdateError("Veuillez coller votre nouveau jeton GitHub.");
      return;
    }

    setIsUpdatingTokenInModal(true);
    setTokenUpdateError(null);
    setTokenUpdateSuccess(null);

    const loginRes = await loginGitHub(tokenToUse, githubConfig);
    setIsUpdatingTokenInModal(false);

    if (!loginRes.success) {
      setTokenUpdateError(
        loginRes.error || "Jeton GitHub invalide ou permissions insuffisantes sur le dépôt."
      );
      return;
    }

    setTokenUpdateSuccess("Jeton validé avec succès ! Déploiement en cours...");
    setModalNewToken(tokenToUse);
    setDashboardTokenInput(tokenToUse);
    showNotification("Jeton GitHub mis à jour avec succès !");

    // Automatically trigger push to GitHub & Vercel
    await handlePushToGitHub();
  };

  // Handle Batch Import of Teachers (Pronote / Excel format)
  const handleBatchImportTeachers = () => {
    if (!batchImportTeachersText.trim()) return;
    const lines = batchImportTeachersText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let count = 0;
    lines.forEach((line) => {
      const parts = line.includes("\t")
        ? line.split("\t")
        : line.includes(";")
        ? line.split(";")
        : line.split(",");

      if (parts.length >= 2) {
        const first = parts[0].trim();
        const second = parts[1].trim();
        if (first.toLowerCase() === "nom" || first.toLowerCase() === "enseignant") return;

        let civility: "Madame" | "Monsieur" = "Madame";
        let lastName = first;
        let firstName = second;
        let subject = "Enseignement général";
        let email = "";

        if (first.toLowerCase().includes("m.") || first.toLowerCase().includes("monsieur")) {
          civility = "Monsieur";
          lastName = second;
          firstName = parts[2]?.trim() || "";
          subject = parts[3]?.trim() || "Enseignement";
          email = parts[4]?.trim() || "";
        } else if (first.toLowerCase().includes("mme") || first.toLowerCase().includes("madame")) {
          civility = "Madame";
          lastName = second;
          firstName = parts[2]?.trim() || "";
          subject = parts[3]?.trim() || "Enseignement";
          email = parts[4]?.trim() || "";
        } else {
          subject = parts[2]?.trim() || "Enseignement";
          email = parts[3]?.trim() || "";
        }

        addTeacher({
          civility,
          lastName: lastName.toUpperCase(),
          firstName: firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "",
          subject,
          email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@lfjpsaly.org`,
        });
        count++;
      }
    });

    if (count > 0) {
      showNotification(`${count} enseignants importés avec succès !`);
      setBatchImportTeachersText("");
      setIsBatchImportingTeachers(false);
    } else {
      alert("Format non reconnu. Utilisez le format 'Nom; Prénom; Discipline; Email'.");
    }
  };

  // Handle Save Site Info
  const handleSaveSiteInfo = (e: FormEvent) => {
    e.preventDefault();
    updateSiteInfo(siteInfoForm);
    showNotification("Informations générales du site enregistrées avec succès !");
  };

  // Download JSON helper
  const handleDownloadJson = () => {
    const json = exportCmsDataJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lfjp-cms-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("Fichier de sauvegarde téléchargé !");
  };

  // Import JSON helper
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const res = importCmsDataJson(content);
      if (res.success) {
        showNotification("Données CMS restaurées avec succès !");
      } else {
        alert("Erreur lors de l'importation : " + res.error);
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: "programmations" as const, label: "1. Programmations (Vitrine)", icon: Calendar },
    { id: "candidates" as const, label: "2. Candidats & Pronote", icon: GraduationCap },
    { id: "teachers" as const, label: "3. Professeurs & Surveillances", icon: Users },
    { id: "rooms" as const, label: "4. Salles & Capacités", icon: DoorOpen },
    { id: "siteInfo" as const, label: "5. Vitrine & Bannières", icon: FileText },
    { id: "deployment" as const, label: "6. Déploiement Vercel & Git", icon: UploadCloud },
  ];

  // -------------------------------------------------------------
  // GITHUB LOGIN PAGE (When user is not authenticated)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12 text-slate-800">
        <div className="w-full max-w-md">
          {/* School Badge & Header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200 p-1 shadow-xs">
              <img
                src="/assets/aistudio/logo-lfjp_62451311.png"
                alt="LFJP Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
                }}
              />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Portail d'Administration
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Lycée Français Jacques Prévert de Saly • Réseau AEFE
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
              <span>Session {cmsData.siteInfo.schoolYear || "2025-2026"}</span>
            </div>
          </div>

          {/* Login Card with Role Tabs */}
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-lg">
            {/* Role Selection Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
              <button
                type="button"
                id="tab-login-proviseur"
                onClick={() => {
                  setAuthTab("proviseur");
                  setLoginError(null);
                  setProviseurLoginError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  authTab === "proviseur"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>👔 Proviseur (Direction)</span>
              </button>
              <button
                type="button"
                id="tab-login-superadmin"
                onClick={() => {
                  setAuthTab("superadmin");
                  setLoginError(null);
                  setProviseurLoginError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  authTab === "superadmin"
                    ? "bg-white text-blue-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Shield className="h-4 w-4 text-blue-600" />
                <span>🛠️ SuperAdmin (DSI)</span>
              </button>
            </div>

            {/* TAB 1: PROVISEUR EMAIL & PASSWORD */}
            {authTab === "proviseur" ? (
              <form onSubmit={handleProviseurLogin} className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Espace Direction & Examens</h2>
                    <p className="text-[11px] text-slate-500">
                      Connectez-vous avec vos identifiants Chef d'Établissement
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Adresse Email</label>
                  <input
                    type="email"
                    value={proviseurEmailInput}
                    onChange={(e) => setProviseurEmailInput(e.target.value)}
                    placeholder="proviseur@lfjpsaly.org"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Mot de passe</label>
                    <button
                      type="button"
                      onClick={() => setShowProviseurLoginPass(!showProviseurLoginPass)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                    >
                      {showProviseurLoginPass ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                  <input
                    type={showProviseurLoginPass ? "text" : "password"}
                    value={proviseurPasswordInput}
                    onChange={(e) => setProviseurPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>

                {proviseurLoginError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    {proviseurLoginError}
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-submit-proviseur-login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.99]"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Accéder à l'Espace Proviseur</span>
                </button>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Fonctionnalités Proviseur :</span>
                  </p>
                  <p>
                    Sessions d'examen, créneaux, import Pronote (élèves, professeurs, salles, aménagements), répartition et brassage, planning EDT, convocations et bouton de mise à jour instantanée.
                  </p>
                </div>
              </form>
            ) : (
              /* TAB 2: SUPERADMIN GITHUB ACCESS */
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Github className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Administration Technique (DSI)</h2>
                    <p className="text-[11px] text-slate-500">
                      Accès complet avec jeton GitHub et déploiements Vercel
                    </p>
                  </div>
                </div>

                {loginError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    <p className="font-bold">Erreur d'authentification</p>
                    <p className="mt-0.5">{loginError}</p>
                  </div>
                )}

                {/* Single direct GitHub button */}
                <button
                  type="button"
                  id="btn-login-github"
                  onClick={handleStartGitHubConnect}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
                >
                  <Github className="h-4 w-4" />
                  <span>Se connecter avec GitHub</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    ou saisie de votre clé
                  </span>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        Jeton personnel GitHub (Token)
                      </label>
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800"
                      >
                        <ClipboardPaste className="h-3 w-3" />
                        <span>Coller</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={loginTokenInput}
                        onChange={(e) => setLoginTokenInput(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600"
                      >
                        {showToken ? "Masquer" : "Afficher"}
                      </button>
                    </div>
                    {DEFAULT_GITHUB_TOKEN && loginTokenInput !== DEFAULT_GITHUB_TOKEN && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setLoginTokenInput(DEFAULT_GITHUB_TOKEN)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 hover:text-blue-900"
                        >
                          <Key className="h-3 w-3" />
                          <span>Insérer jeton LFJP configuré</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn || !loginTokenInput.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-800 disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Vérification de l'accès...</span>
                      </>
                    ) : (
                      <span>Accéder à l'Administration Complète</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              ← Retour au site public des examens
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED ADMIN CMS DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3 shadow-xs print:hidden">
        <div
          onClick={() => setCurrentSection("dashboard")}
          className="flex items-center gap-3 cursor-pointer group"
          title="Retourner au Tableau de Bord"
        >
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 p-0.5 shadow-2xs group-hover:scale-105 group-hover:border-blue-400 transition">
            <img
              src="/assets/aistudio/logo-lfjp_62451311.png"
              alt="LFJP Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">Administration Examens LFJP</h1>
              <span className="rounded-full bg-blue-100 border border-blue-300 px-2.5 py-0.5 text-xs font-bold text-[#002060]">
                Année scolaire {cmsData.siteInfo.schoolYear || "2026-2027"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-mono text-slate-700">
                <GitBranch className="h-3 w-3 text-blue-600" />
                {githubConfig.owner}/{githubConfig.repo}
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">Branche : {githubConfig.branch}</span>
            </div>
          </div>
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-3">
          {/* User badge */}
          {adminSession?.role === "proviseur" ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-950 font-bold shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>👔 Direction : {adminSession.name || "Proviseur"}</span>
            </div>
          ) : (
            githubUser ? (
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                <img
                  src={githubUser.avatar_url}
                  alt={githubUser.login}
                  className="h-5 w-5 rounded-full border border-slate-300"
                />
                <span className="font-semibold text-slate-800">@{githubUser.login}</span>
                <span className="rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-bold">SuperAdmin</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-900 font-bold">
                <span>⚡ SuperAdmin</span>
              </div>
            )
          )}

          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-blue-700"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Voir le site</span>
            <ExternalLink className="h-3 w-3 opacity-50" />
          </Link>

          <Link
            to="/convocations"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-xs transition hover:bg-indigo-100"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Portail Convocations</span>
            <ExternalLink className="h-3 w-3 opacity-50" />
          </Link>

          {/* Bouton Espace Impression Grand Format */}
          <Link
            to="/orga-dnb"
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 shadow-xs transition hover:bg-sky-100"
            title="Module d'impression grand format des listes d'émargement et étiquettes"
          >
            <Printer className="h-3.5 w-3.5 text-sky-600" />
            <span className="hidden sm:inline">Espace Impression</span>
          </Link>

          {/* Actions spécifiques selon le profil */}
          {adminSession?.role === "proviseur" ? (
            <button
              id="btn-proviseur-save-header"
              onClick={handleProviseurSave}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.98]"
              title="Enregistrer toutes les modifications dans l'application"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer & Mettre à jour</span>
            </button>
          ) : null}

          {/* Bouton Déconnexion avec redirection automatique vers l'accueil */}
          <button
            id="btn-logout-admin"
            onClick={handleLogout}
            title="Se déconnecter et retourner au site"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* SuperAdmin Notification Banner: Pending Deployment from Proviseur */}
      {adminSession?.role === "superadmin" && cmsData.siteInfo.pendingDeployment && (
        <div className="border-b border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/70 to-orange-50 px-6 py-3 shadow-xs">
          <div className="mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-7xl">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">
                  🔔 Notification Direction : Le Proviseur ({cmsData.siteInfo.pendingDeployment.savedBy}) a enregistré des modifications prêtes pour déploiement en ligne !
                </p>
                <p className="text-[11px] text-amber-800">
                  Dernier enregistrement : {new Date(cmsData.siteInfo.pendingDeployment.savedAt).toLocaleString("fr-FR")} — « {cmsData.siteInfo.pendingDeployment.notes} »
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSyncResult(null);
                  setIsSyncModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700 active:scale-95"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Déployer maintenant sur GitHub & Vercel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proviseur Save Confirmation Modal */}
      {proviseurSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4 shadow-xs">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Modifications enregistrées avec succès !
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Vos programmations, examens, créneaux et répartitions ont été sauvegardés.
              <br /><br />
              <span className="block rounded-xl bg-blue-50 border border-blue-200 p-3 text-blue-900 font-medium text-left">
                📢 <strong>Notification envoyée au Super-Administrateur</strong> :
                Les enregistrements effectués seront déployés en ligne par le Super-Administrateur, qui recevra un avis sur son espace pour lancer le déploiement officiel sur GitHub & Vercel.
              </span>
            </p>
            <button
              onClick={() => setProviseurSaveModalOpen(false)}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700"
            >
              Compris, continuer
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: METTRE À JOUR VERCEL / GITHUB (COMMIT & PUSH DIRECT)  */}
      {/* ------------------------------------------------------------- */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Synchroniser et déployer sur Vercel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Commit et push direct sur GitHub • Vercel redéploie automatiquement
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSyncing && setIsSyncModalOpen(false)}
                disabled={isSyncing}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 disabled:opacity-30"
              >
                Fermer
              </button>
            </div>

            {/* If currently syncing */}
            {isSyncing && (
              <div className="my-6 space-y-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-6 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <div>
                  <p className="font-bold text-slate-900">{syncStep}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Communication avec l'API GitHub et validation du commit...
                  </p>
                </div>
              </div>
            )}

            {/* If sync finished with success */}
            {syncResult?.success && (
              <div className="my-6 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
                <div className="flex items-center gap-3 text-emerald-800">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="font-bold text-base">Modifications publiées avec succès !</p>
                    <p className="text-xs text-emerald-700">
                      Le commit a été envoyé sur la branche <code>{githubConfig.branch}</code> de GitHub.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs space-y-1.5">
                  <p className="text-slate-600 font-semibold">Statut du déploiement Vercel :</p>
                  <p className="text-slate-500">
                    ✓ Vercel a détecté le nouveau commit via son webhook GitHub et est en train de compiler le site.
                  </p>
                  <p className="text-slate-500">
                    ✓ Vos modifications seront visibles en direct sur le site en ligne d'ici 30 à 60 secondes.
                  </p>
                  {syncResult.commitUrl && (
                    <a
                      href={syncResult.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                    >
                      <span>Voir le commit sur GitHub ({syncResult.commitSha?.slice(0, 7)})</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsSyncModalOpen(false)}
                    className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-800"
                  >
                    Terminé
                  </button>
                </div>
              </div>
            )}

            {/* If sync error */}
            {syncResult && !syncResult.success && (
              <div className="my-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-800 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-rose-900">
                      Échec du commit : Jeton GitHub invalide ou expiré (Bad credentials)
                    </p>
                    <p className="mt-1 text-rose-700">{syncResult.error}</p>
                    <p className="mt-2 text-slate-700">
                      GitHub a refusé l'authentification avec la clé actuelle. Pour que la synchronisation et le déploiement automatique sur Vercel fonctionnent, vous devez remplacer votre jeton d'accès GitHub par un nouveau jeton valide avec la permission <code>repo</code> en écriture.
                    </p>
                  </div>
                </div>

                {/* Direct action helper */}
                <div className="rounded-xl border border-rose-200 bg-white p-3.5 space-y-2 text-slate-700">
                  <p className="font-bold text-slate-900 text-xs">
                    Comment résoudre cette erreur en 1 minute ?
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                    <li>
                      Cliquez sur le bouton ci-dessous pour ouvrir la page GitHub de création de jeton.
                    </li>
                    <li>
                      Vérifiez que la permission <strong>repo</strong> est bien cochée et choisissez une expiration (ex: 90 jours ou <em>No expiration</em>).
                    </li>
                    <li>
                      Cliquez sur <strong>Generate token</strong> tout en bas sur GitHub, puis copiez la clé générée (commençant par <code>ghp_...</code>).
                    </li>
                    <li>
                      Collez-la ci-dessous et cliquez sur <strong>Mettre à jour & Déployer</strong>.
                    </li>
                  </ol>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleOpenGitHubTokenPage}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-slate-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>1. Ouvrir GitHub pour générer un nouveau jeton</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Token Update Section (always open and accessible) */}
            {!isSyncing && (
              <div className="my-4 rounded-2xl border-2 border-blue-200 bg-blue-50/70 p-4 text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-700 flex-shrink-0" />
                    <span className="font-bold text-slate-900 text-sm">
                      Jeton d'accès GitHub (Token personnel)
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    ✓ Jeton intégré au code
                  </span>
                </div>

                <p className="text-slate-600 text-xs">
                  Ce jeton permet au site de pousser vos modifications sur <code>{githubConfig.owner}/{githubConfig.repo}</code> afin que Vercel redéploie le site en ligne.
                </p>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">
                      Jeton actif (vous pouvez le visualiser ou le remplacer ici) :
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900"
                    >
                      {showModalPassword ? "Masquer le jeton" : "Afficher en clair"}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showModalPassword ? "text" : "password"}
                        value={modalNewToken}
                        onChange={(e) => {
                          setModalNewToken(e.target.value);
                          setTokenUpdateError(null);
                        }}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handlePasteModalToken}
                      className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      title="Coller depuis le presse-papier"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      <span>Coller</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalNewToken(DEFAULT_GITHUB_TOKEN);
                        setDashboardTokenInput(DEFAULT_GITHUB_TOKEN);
                        resetToDefaultGitHubToken();
                        setTokenUpdateError(null);
                        showNotification("Jeton par défaut réactivé !");
                      }}
                      className="flex items-center justify-center gap-1 rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                      title="Réinsérer le jeton LFJP"
                    >
                      <span>Jeton par défaut</span>
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingTokenInModal || !modalNewToken.trim()}
                      onClick={handleUpdateTokenAndRetry}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-800 disabled:opacity-50"
                    >
                      {isUpdatingTokenInModal ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Validation...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Valider & Sauvegarder</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {tokenUpdateError && (
                  <div className="rounded-xl border border-rose-300 bg-rose-100/90 p-2.5 text-[11px] font-semibold text-rose-800">
                    {tokenUpdateError}
                  </div>
                )}
                {tokenUpdateSuccess && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-100/90 p-2.5 text-[11px] font-semibold text-emerald-800">
                    {tokenUpdateSuccess}
                  </div>
                )}
              </div>
            )}

            {/* Form when not syncing */}
            {!isSyncing && !syncResult?.success && (
              <div className="my-5 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2 text-slate-700">
                  <p className="font-bold text-slate-900">Que va-t-il se passer quand vous cliquez ?</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li>
                      Toutes vos modifications (programmations, épreuves, textes, surveillances) sont encodées.
                    </li>
                    <li>
                      Un <strong>commit automatique</strong> est envoyé directement sur votre dépôt GitHub :{" "}
                      <strong className="font-mono">{githubConfig.owner}/{githubConfig.repo}</strong> (branche <span className="font-mono">{githubConfig.branch}</span>).
                    </li>
                    <li>
                      <strong>Vercel prend en compte directement les modifications</strong> et redéploie le site sans que vous n'ayez rien d'autre à faire.
                    </li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Message de commit (optionnel)
                  </label>
                  <input
                    type="text"
                    value={commitMessageInput}
                    onChange={(e) => setCommitMessageInput(e.target.value)}
                    placeholder="Ex: Mise à jour des épreuves de mathématiques et oraux"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsSyncModalOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handlePushToGitHub}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-700"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Lancer le commit & déployer sur Vercel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Layout Container with Target Site Sidebar */}
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#f4f6f9]">
        {/* Authentic Sidebar matching target site */}
        <AdminSidebar
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
          openSubmenus={openSubmenus}
          onToggleSubmenu={toggleSubmenu}
          onSaveProject={handleDownloadJson}
          onLoadProject={handleImportJson}
          onResetDefaults={() => {
            if (confirm("Voulez-vous vraiment réinitialiser toutes les données aux valeurs officielles du lycée ?")) {
              resetToDefaults();
              showNotification("Données réinitialisées aux valeurs initiales.");
            }
          }}
          candidatesCount={cmsData.candidates.length}
          roomsCount={cmsData.rooms.length}
          teachersCount={cmsData.teachers.length}
          examsCount={cmsData.exams.length}
          examSlotsCount={cmsData.examSlots?.length || 0}
          schoolYear={cmsData.siteInfo.schoolYear || "2025-2026"}
          role={adminSession?.role}
          onProviseurSave={handleProviseurSave}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl">
          {/* Chronological Workflow Stepper Bar */}
          <div className="mb-6 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto print:hidden">
            <div className="flex items-center gap-1.5 min-w-max text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2">
                Workflow chronologique :
              </span>
              {[
                { id: "dashboard", label: "0. Tableau de Bord", icon: "📊" },
                { id: "config", label: "1. Paramètres & Logo", icon: "⚙️" },
                { id: "data-eleves", label: "2. Données Pronote", icon: "📂" },
                { id: "sessions-examens", label: "3. Sessions", icon: "📋" },
                { id: "creneaux-epreuves", label: "4. Créneaux", icon: "🕒" },
                { id: "organization", label: "5. Répartition & Brassage", icon: "🧩" },
                { id: "planning-rooms", label: "6. Plannings", icon: "📅" },
                { id: "view-edt", label: "7. Vers EDT", icon: "➡️" },
                { id: "convoc-eleves", label: "8. Convocations", icon: "📨" },
                { id: "corr-repartition", label: "9. Corrections & Notes", icon: "📦" },
                { id: "vitrine-publish", label: "10. Vitrine", icon: "📢" },
                { id: "deployment", label: "11. Déploiement", icon: "🚀" },
              ].map((step, idx) => {
                const isActive =
                  currentSection === step.id ||
                  (step.id === "data-eleves" &&
                    ["data-eleves", "data-salles", "data-profs", "data-amenagements", "sec-pochettes"].includes(currentSection)) ||
                  (step.id === "planning-rooms" && ["planning-rooms", "planning-profs"].includes(currentSection)) ||
                  (step.id === "convoc-eleves" && ["convoc-eleves", "convoc-profs"].includes(currentSection)) ||
                  (step.id === "corr-repartition" &&
                    ["corr-repartition", "res-import", "res-analyse", "res-releves", "res-datavis", "res-simul"].includes(currentSection));

                return (
                  <Fragment key={step.id}>
                    {idx > 0 && <span className="text-slate-300 font-bold">➔</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentSection(step.id as AdminSection)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                        isActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span>{step.icon}</span>
                      <span>{step.label}</span>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </div>

          {/* 0. TABLEAU DE BORD CENTRAL */}
          {currentSection === "dashboard" && (
            <AdminDashboardSection
              siteInfo={cmsData.siteInfo}
              candidates={cmsData.candidates}
              rooms={cmsData.rooms}
              teachers={cmsData.teachers}
              exams={cmsData.exams}
              examSlots={cmsData.examSlots || []}
              surveillances={cmsData.surveillances}
              announcements={cmsData.announcements}
              onNavigateSection={(sec) => setCurrentSection(sec)}
            />
          )}

          {/* 1. CONFIGURATION & LOGO */}
          {currentSection === "config" && (
            <ConfigSection
              siteInfo={cmsData.siteInfo}
              onUpdateSiteInfo={updateSiteInfo}
              exams={cmsData.exams}
              onTogglePublishExam={(id, pub) => updateExam(id, { isPublished: pub })}
              onShowNotification={showNotification}
              onResetForNewSchoolYear={resetForNewSchoolYear}
              announcements={cmsData.announcements}
              onAddAnnouncement={addAnnouncement}
              onUpdateAnnouncement={updateAnnouncement}
              onDeleteAnnouncement={deleteAnnouncement}
            />
          )}

          {/* 2. DONNÉES PRONOTE : ÉLÈVES */}
          {currentSection === "data-eleves" && (
            <DataElevesSection
              candidates={cmsData.candidates}
              onAddCandidate={addCandidate}
              onUpdateCandidate={updateCandidate}
              onDeleteCandidate={deleteCandidate}
              onSetCandidates={setCandidates}
              onShowNotification={showNotification}
            />
          )}

          {/* 2. DONNÉES PRONOTE : SALLES */}
          {currentSection === "data-salles" && (
            <DataSallesSection
              rooms={cmsData.rooms}
              onAddRoom={addRoom}
              onUpdateRoom={updateRoom}
              onDeleteRoom={deleteRoom}
              onSetRooms={setRooms}
              onShowNotification={showNotification}
            />
          )}

          {/* 2. DONNÉES PRONOTE : PROFESSEURS */}
          {currentSection === "data-profs" && (
            <DataProfsSection
              teachers={cmsData.teachers}
              onAddTeacher={addTeacher}
              onUpdateTeacher={updateTeacher}
              onDeleteTeacher={deleteTeacher}
              onSetTeachers={setTeachers}
              onShowNotification={showNotification}
            />
          )}

          {/* 2. AMÉNAGEMENTS */}
          {currentSection === "data-amenagements" && (
            <DataAmenagementsSection
              candidates={cmsData.candidates}
              onUpdateCandidate={updateCandidate}
              onShowNotification={showNotification}
            />
          )}

          {/* 2. POCHETTES SURVEILLANTS */}
          {currentSection === "sec-pochettes" && (
            <SecPochettesSection
              rooms={cmsData.rooms}
              candidates={cmsData.candidates}
              surveillances={cmsData.surveillances}
              siteInfo={cmsData.siteInfo}
            />
          )}

          {/* 3. SESSIONS D'EXAMENS */}
          {currentSection === "sessions-examens" && (
            <SessionsExamensSection
              exams={cmsData.exams}
              examSlots={cmsData.examSlots || []}
              onAddExam={addExam}
              onUpdateExam={updateExam}
              onDeleteExam={deleteExam}
              onNavigateToSlots={() => {
                setCurrentSection("creneaux-epreuves");
              }}
              onShowNotification={showNotification}
            />
          )}

          {/* 4. CRÉNEAUX DES ÉPREUVES */}
          {currentSection === "creneaux-epreuves" && (
            <CreneauxSection
              examSlots={cmsData.examSlots || []}
              exams={cmsData.exams}
              rooms={cmsData.rooms}
              surveillances={cmsData.surveillances}
              onAddExamSlot={addExamSlot}
              onUpdateExamSlot={updateExamSlot}
              onDeleteExamSlot={deleteExamSlot}
              onShowNotification={showNotification}
            />
          )}

          {/* 5. RÉPARTITION & BRASSAGE (ÉLÈVES + SURVEILLANTS) */}
          {currentSection === "organization" && (
            <OrganizationSection
              candidates={cmsData.candidates}
              rooms={cmsData.rooms}
              teachers={cmsData.teachers}
              examSlots={cmsData.examSlots || []}
              surveillances={cmsData.surveillances}
              onSetCandidates={setCandidates}
              onSetSurveillances={setSurveillances}
              onShowNotification={showNotification}
            />
          )}

          {/* 5. PLANNING VUE PAR SALLES */}
          {currentSection === "planning-rooms" && (
            <PlanningRoomsSection
              rooms={cmsData.rooms}
              surveillances={cmsData.surveillances}
              exams={cmsData.exams}
              teachers={cmsData.teachers}
              examSlots={cmsData.examSlots || []}
              candidates={cmsData.candidates}
              onAddSurveillance={addSurveillance}
              onDeleteSurveillance={deleteSurveillance}
              onShowNotification={showNotification}
            />
          )}

          {/* 5. PLANNING VUE PROFESSEURS */}
          {currentSection === "planning-profs" && (
            <PlanningProfsSection
              teachers={cmsData.teachers}
              surveillances={cmsData.surveillances}
              examSlots={cmsData.examSlots || []}
              onAddSurveillance={addSurveillance}
              onDeleteSurveillance={deleteSurveillance}
              onShowNotification={showNotification}
            />
          )}

          {/* 6. VERS EDT */}
          {currentSection === "view-edt" && (
            <ViewEdtSection
              rooms={cmsData.rooms}
              teachers={cmsData.teachers}
              surveillances={cmsData.surveillances}
              siteInfo={cmsData.siteInfo}
              onShowNotification={showNotification}
            />
          )}

          {/* 7. CONVOCATIONS ÉLÈVES */}
          {currentSection === "convoc-eleves" && (
            <ConvocElevesSection
              candidates={cmsData.candidates}
              siteInfo={cmsData.siteInfo}
            />
          )}

          {/* 7. CONVOCATIONS PROFESSEURS */}
          {currentSection === "convoc-profs" && (
            <ConvocProfsSection
              teachers={cmsData.teachers}
              surveillances={cmsData.surveillances}
              siteInfo={cmsData.siteInfo}
            />
          )}

          {/* 8. CORRECTIONS */}
          {currentSection === "corr-repartition" && (
            <CorrRepartitionSection
              teachers={cmsData.teachers}
              candidates={cmsData.candidates}
              onShowNotification={showNotification}
            />
          )}

          {/* 8. RÉSULTATS (IMPORT, ANALYSE, RELEVÉS, DATAVIS, SIMULATION) */}
          {["res-import", "res-analyse", "res-releves", "res-datavis", "res-simul"].includes(currentSection) && (
            <ResultsSections
              candidates={cmsData.candidates}
              siteInfo={cmsData.siteInfo}
              activeSub={currentSection as any}
              onShowNotification={showNotification}
            />
          )}

          {/* 9. VITRINE & PUBLICATIONS */}
          {currentSection === "vitrine-publish" && (
            <VitrinePublishSection
              siteInfo={cmsData.siteInfo}
              exams={cmsData.exams}
              announcements={cmsData.announcements}
              surveillances={cmsData.surveillances}
              examSlots={cmsData.examSlots || []}
              callouts={cmsData.callouts}
              onTogglePublishExam={(id, pub) => updateExam(id, { isPublished: pub })}
              onTogglePublishAnnouncement={(id, pub) => updateAnnouncement(id, { isPublished: pub })}
              onAddAnnouncement={addAnnouncement}
              onUpdateAnnouncement={updateAnnouncement}
              onDeleteAnnouncement={deleteAnnouncement}
              onAddExam={addExam}
              onUpdateExam={updateExam}
              onDeleteExam={deleteExam}
              onShowNotification={showNotification}
            />
          )}

          {/* 10. DÉPLOIEMENT VERCEL & GITHUB */}
          {(currentSection === "deployment" || activeTab === "deployment") && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Centre de Déploiement Vercel & Sauvegardes</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Contrôlez la synchronisation avec GitHub et le redéploiement mondial sur Vercel sans frais.
                  </p>
                </div>
              </div>

              {/* Status & Token Management Card */}
              <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Connexion GitHub & Déploiement Vercel
                        </h3>
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          ✓ Jeton configuré dans le code
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Dépôt : <code className="font-semibold text-blue-800">{githubConfig.owner}/{githubConfig.repo}</code> (branche <code className="text-blue-800">{githubConfig.branch}</code>) • Déploiement automatique sans frais
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handlePushToGitHubDirect}
                      disabled={isSyncing}
                      className="flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white shadow transition active:scale-[0.98]"
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>{syncStep || "Déploiement en cours..."}</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          <span>Mettre à jour GitHub & Vercel maintenant</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Real-time Status / Notification when syncing directly */}
                {isSyncing && (
                  <div className="p-3 bg-blue-100 border border-blue-300 rounded-xl text-xs text-blue-900 flex items-center gap-2 animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0 text-blue-700" />
                    <span><strong>Déploiement direct en cours :</strong> {syncStep}</span>
                  </div>
                )}
                {syncResult && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                    syncResult.success ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-rose-50 border-rose-300 text-rose-900"
                  }`}>
                    <div className="flex items-center gap-2">
                      {syncResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      )}
                      <span>
                        {syncResult.success
                          ? "Déploiement direct réussi ! Commit envoyé sur GitHub (branche main). Vercel redéploie le site en ligne."
                          : `Échec du déploiement : ${syncResult.error || "Erreur de synchronisation"}`}
                      </span>
                    </div>
                    {syncResult.commitSha && (
                      <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-emerald-200">
                        SHA : {syncResult.commitSha.substring(0, 7)}
                      </span>
                    )}
                  </div>
                )}

                <div className="border-t border-blue-100 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs">
                    <Key className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-700 whitespace-nowrap">Jeton GitHub :</span>
                    <input
                      type={showDashboardPassword ? "text" : "password"}
                      value={dashboardTokenInput}
                      onChange={(e) => setDashboardTokenInput(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="flex-1 font-mono text-xs text-slate-800 outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDashboardPassword(!showDashboardPassword)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 whitespace-nowrap"
                    >
                      {showDashboardPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDashboardToken}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Enregistrer ce jeton</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetToDefaultGitHubToken();
                        setDashboardTokenInput(DEFAULT_GITHUB_TOKEN);
                        setModalNewToken(DEFAULT_GITHUB_TOKEN);
                        showNotification("Jeton par défaut réactivé avec succès !");
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      title="Réinitialiser avec le jeton du code"
                    >
                      Jeton par défaut
                    </button>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Programmations</span>
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{cmsData.callouts.length}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {cmsData.callouts.filter((c) => c.isPublished).length} cartes publiées sur l'accueil
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Épreuves prévues</span>
                    <Layers className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{cmsData.exams.length}</p>
                  <p className="mt-1 text-xs text-slate-500">Bac, DNB et Épreuves orales</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Salles disponibles</span>
                    <DoorOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{cmsData.rooms.length}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {cmsData.rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0)} places totales
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Surveillances</span>
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{cmsData.surveillances.length}</p>
                  <p className="mt-1 text-xs text-slate-500">Créneaux enseignants affectés</p>
                </div>
              </div>

              {/* Backup & Export Panel */}
              <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Sauvegarde & Restauration Locale</h3>
                  <span className="text-xs text-slate-400">Format JSON</span>
                </div>
                <p className="text-xs text-slate-600">
                    Vous pouvez à tout moment exporter l'intégralité des données en fichier JSON ou restaurer une version précédente.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={handleDownloadJson}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4 text-emerald-600" />
                      <span>Télécharger JSON</span>
                    </button>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50">
                      <UploadCloud className="h-4 w-4 text-blue-600" />
                      <span>Importer JSON</span>
                      <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                    </label>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Dépôt GitHub :</span>
                      <span className="font-mono text-slate-700">{githubConfig.owner}/{githubConfig.repo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compte connecté :</span>
                      <span className="font-semibold text-slate-800">@{githubUser?.login}</span>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </main>
      </div>
    </div>
  );
}
