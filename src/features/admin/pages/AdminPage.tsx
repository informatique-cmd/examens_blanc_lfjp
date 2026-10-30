import { useState, useEffect, type FormEvent } from "react";
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
  RotateCcw,
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
  FileSpreadsheet,
} from "lucide-react";

import {
  useCmsData,
  exportCmsDataJson,
  importCmsDataJson,
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
    addRoom,
    updateRoom,
    deleteRoom,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addSurveillance,
    updateSurveillance,
    deleteSurveillance,
    duplicateSurveillance,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    setCandidates,
    resetToDefaults,
  } = useCmsData();

  // GitHub Auth & Sync hook
  const {
    isAuthenticated,
    user: githubUser,
    config: githubConfig,
    token: githubToken,
    login: loginGitHub,
    logout: logoutGitHub,
  } = useGitHubAuth();

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
  const [currentSection, setCurrentSection] = useState<AdminSection>("config");
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

  // Logout handler with immediate home redirect
  const handleLogout = () => {
    logoutGitHub();
    navigate("/");
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
      showNotification(`Connexion réussie ! Bienvenue ${result.user?.name || result.user?.login}.`);
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
      showNotification("Modifications publiées sur GitHub ! Vercel redéploie votre site en ligne.");
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white font-bold text-lg shadow-sm">
              LFJP
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Portail d'Administration
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Lycée Français Jacques Prévert de Saly • Réseau AEFE
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
              <span>Gestion des examens blancs & DNB</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Connexion avec GitHub</h2>
                <p className="text-xs text-slate-500">
                  Accès réservé aux administrateurs autorisés
                </p>
              </div>
            </div>

            {loginError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <p className="font-bold">Erreur d'authentification</p>
                <p className="mt-0.5">{loginError}</p>
              </div>
            )}

            <div className="mt-5 space-y-4">
              {/* Single direct GitHub button */}
              <button
                type="button"
                id="btn-login-github"
                onClick={handleStartGitHubConnect}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
              >
                <Github className="h-5 w-5" />
                <span>Se connecter avec GitHub</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  ou saisie de votre clé
                </span>
              </div>

              {hasOpenedGitHub && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span>Fenêtre GitHub ouverte</span>
                  </p>
                  <p className="text-slate-600">
                    Connectez-vous à votre compte sur GitHub, puis cliquez sur <strong>Generate token</strong> en bas pour générer votre clé. Collez-la ci-dessous :
                  </p>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Jeton d'accès personnel GitHub (Token)
                    </label>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800"
                    >
                      <ClipboardPaste className="h-3 w-3" />
                      <span>Coller depuis le presse-papier</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={loginTokenInput}
                      onChange={(e) => setLoginTokenInput(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      {showToken ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                  {DEFAULT_GITHUB_TOKEN && loginTokenInput !== DEFAULT_GITHUB_TOKEN && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setLoginTokenInput(DEFAULT_GITHUB_TOKEN)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900"
                      >
                        <Key className="h-3 w-3" />
                        <span>Insérer le jeton ({DEFAULT_GITHUB_TOKEN.slice(0, 7)}••••••••{DEFAULT_GITHUB_TOKEN.slice(-4)})</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Collapsible advanced repo configuration */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800"
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform ${showAdvancedConfig ? "rotate-180" : ""}`} />
                    <span>Paramètres du dépôt ({loginOwnerInput}/{loginRepoInput})</span>
                  </button>

                  {showAdvancedConfig && (
                    <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-600">Propriétaire</label>
                        <input
                          type="text"
                          value={loginOwnerInput}
                          onChange={(e) => setLoginOwnerInput(e.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Dépôt</label>
                        <input
                          type="text"
                          value={loginRepoInput}
                          onChange={(e) => setLoginRepoInput(e.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Branche</label>
                        <input
                          type="text"
                          value={loginBranchInput}
                          onChange={(e) => setLoginBranchInput(e.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || !loginTokenInput.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-800 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Vérification de l'accès...</span>
                    </>
                  ) : (
                    <span>Valider et accéder à l'administration</span>
                  )}
                </button>
              </form>
            </div>
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
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white font-bold text-sm shadow-xs">
            LFJP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Administration Examens LFJP</h1>
              <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                {cmsData.siteInfo.schoolYear}
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
          {/* GitHub User badge */}
          {githubUser && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
              <img
                src={githubUser.avatar_url}
                alt={githubUser.login}
                className="h-5 w-5 rounded-full border border-slate-300"
              />
              <span className="font-semibold text-slate-800">@{githubUser.login}</span>
            </div>
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

          {/* Bouton Config Jeton GitHub */}
          <button
            onClick={() => {
              setSyncResult(null);
              setIsSyncModalOpen(true);
            }}
            title="Modifier ou renouveler votre jeton d'accès GitHub"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-blue-700"
          >
            <Key className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden md:inline">Jeton GitHub</span>
          </button>

          {/* LE BOUTON UNIQUE DE SYNCHRONISATION GITHUB & VERCEL */}
          <button
            id="btn-single-sync-github-vercel"
            onClick={() => {
              setSyncResult(null);
              setIsSyncModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-800 active:scale-[0.98]"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Mettre à jour GitHub & Vercel</span>
          </button>

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
          schoolYear={cmsData.siteInfo.schoolYear || "2025-2026"}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl">
          {/* 1. CONFIGURATION */}
          {currentSection === "config" && (
            <ConfigSection
              siteInfo={cmsData.siteInfo}
              onUpdateSiteInfo={updateSiteInfo}
              exams={cmsData.exams}
              onTogglePublishExam={(id, pub) => updateExam(id, { isPublished: pub })}
              onShowNotification={showNotification}
            />
          )}

          {/* 2. VITRINE & PUBLICATIONS */}
          {currentSection === "vitrine-publish" && (
            <VitrinePublishSection
              siteInfo={cmsData.siteInfo}
              exams={cmsData.exams}
              announcements={cmsData.announcements}
              surveillances={cmsData.surveillances}
              onTogglePublishExam={(id, pub) => updateExam(id, { isPublished: pub })}
              onTogglePublishAnnouncement={(id, pub) => updateAnnouncement(id, { isPublished: pub })}
              onShowNotification={showNotification}
            />
          )}

          {/* 3. AMÉNAGEMENTS */}
          {currentSection === "data-amenagements" && (
            <DataAmenagementsSection
              candidates={cmsData.candidates}
              onUpdateCandidate={updateCandidate}
              onShowNotification={showNotification}
            />
          )}

          {/* 4. POCHETTES SURVEILLANTS */}
          {currentSection === "sec-pochettes" && (
            <SecPochettesSection
              rooms={cmsData.rooms}
              candidates={cmsData.candidates}
              surveillances={cmsData.surveillances}
              siteInfo={cmsData.siteInfo}
            />
          )}

          {/* 5. RÉPARTITION & BRASSAGE */}
          {currentSection === "organization" && (
            <OrganizationSection
              candidates={cmsData.candidates}
              rooms={cmsData.rooms}
              onSetCandidates={setCandidates}
              onShowNotification={showNotification}
            />
          )}

          {/* 6. PLANNING VUE PAR SALLES */}
          {currentSection === "planning-rooms" && (
            <PlanningRoomsSection
              rooms={cmsData.rooms}
              surveillances={cmsData.surveillances}
              exams={cmsData.exams}
              teachers={cmsData.teachers}
              onAddSurveillance={addSurveillance}
              onDeleteSurveillance={deleteSurveillance}
              onShowNotification={showNotification}
            />
          )}

          {/* 7. PLANNING VUE PROFESSEURS */}
          {currentSection === "planning-profs" && (
            <PlanningProfsSection
              teachers={cmsData.teachers}
              surveillances={cmsData.surveillances}
              onAddSurveillance={addSurveillance}
              onDeleteSurveillance={deleteSurveillance}
              onShowNotification={showNotification}
            />
          )}

          {/* 8. VERS EDT */}
          {currentSection === "view-edt" && (
            <ViewEdtSection
              rooms={cmsData.rooms}
              teachers={cmsData.teachers}
              surveillances={cmsData.surveillances}
              siteInfo={cmsData.siteInfo}
              onShowNotification={showNotification}
            />
          )}

          {/* 9. CONVOCATIONS ÉLÈVES */}
          {currentSection === "convoc-eleves" && (
            <ConvocElevesSection
              candidates={cmsData.candidates}
              siteInfo={cmsData.siteInfo}
            />
          )}

          {/* 10. CONVOCATIONS PROFESSEURS */}
          {currentSection === "convoc-profs" && (
            <ConvocProfsSection
              teachers={cmsData.teachers}
              surveillances={cmsData.surveillances}
              siteInfo={cmsData.siteInfo}
            />
          )}

          {/* 11. CORRECTIONS */}
          {currentSection === "corr-repartition" && (
            <CorrRepartitionSection
              teachers={cmsData.teachers}
              candidates={cmsData.candidates}
              onShowNotification={showNotification}
            />
          )}

          {/* 12. RÉSULTATS (IMPORT, ANALYSE, RELEVÉS, DATAVIS, SIMULATION) */}
          {["res-import", "res-analyse", "res-releves", "res-datavis", "res-simul"].includes(currentSection) && (
            <ResultsSections
              candidates={cmsData.candidates}
              siteInfo={cmsData.siteInfo}
              activeSub={currentSection as any}
              onShowNotification={showNotification}
            />
          )}
          {/* DÉPLOIEMENT VERCEL & GITHUB */}
          {(currentSection === "deployment" || activeTab === "deployment") && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Centre de Déploiement Vercel & Sauvegardes</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Contrôlez la synchronisation avec GitHub et le redéploiement mondial sur Vercel sans frais.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsAddingExam(true);
                      setActiveTab("programmations");
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nouvelle programmation</span>
                  </button>
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
                      onClick={() => {
                        setSyncResult(null);
                        setIsSyncModalOpen(true);
                      }}
                      className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-blue-800 active:scale-[0.98]"
                    >
                      <UploadCloud className="h-4 w-4" />
                      <span>Mettre à jour GitHub & Vercel maintenant</span>
                    </button>
                  </div>
                </div>

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

              {/* Quick Summary Cards */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Programmations summary */}
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Programmations d'examens (Accueil)</h3>
                    <button
                      onClick={() => setActiveTab("programmations")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Gérer tout →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {cmsData.callouts.slice(0, 5).map((callout) => (
                      <div
                        key={callout.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-800">{callout.title}</p>
                          <p className="text-xs text-slate-500">{callout.dateLabel}</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            callout.isPublished
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {callout.isPublished ? "Publié" : "Brouillon"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Backup & Export Panel */}
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
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
            </div>
          )}

          {/* TAB: PROGRAMMATIONS */}
          {activeTab === "programmations" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold text-emerald-800 uppercase">
                      Vitrine Publique en Direct
                    </span>
                    <span className="text-xs text-slate-500">
                      Gestion des examens blancs affichés sur la page d'accueil
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    Programmations d'Examens
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Publiez, masquez ou modifiez les examens en un clic. Chaque modification est reflétée instantanément sur la vitrine d'accueil.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCurrentSection("organization")}
                    className="flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-800 shadow-xs hover:bg-sky-100 transition"
                  >
                    <Shuffle className="h-4 w-4 text-sky-600" />
                    <span>Répartition & Brassage</span>
                  </button>
                  <button
                    onClick={() => setIsAddingExam(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nouvelle programmation</span>
                  </button>
                </div>
              </div>

              {/* Search filter */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une programmation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </div>

              {/* Add / Edit Exam Modal */}
              {(isAddingExam || editingExam) && (
                <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingExam ? "Modifier la programmation d'examen" : "Nouvelle programmation d'examen"}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAddingExam(false);
                        setEditingExam(null);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Annuler
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const title = (formData.get("title") as string) || "";
                      const targetLevel = (formData.get("targetLevel") as string) || "3ème (Brevet)";
                      const examType = (formData.get("examType") as string) || "DNB Blanc";
                      const period = (formData.get("period") as string) || "";
                      const status = (formData.get("status") as CmsExam["status"]) || "Prévu";
                      const description = (formData.get("description") as string) || "";
                      const isPublished = formData.get("isPublished") === "on";

                      if (editingExam) {
                        updateExam(editingExam.id, {
                          title,
                          targetLevel,
                          examType,
                          period,
                          status,
                          description,
                          isPublished,
                        });
                        showNotification("Programmation mise à jour ! Elle est synchronisée en temps réel.");
                      } else {
                        addExam({
                          title,
                          targetLevel,
                          examType,
                          period,
                          startsAt: "",
                          endsAt: "",
                          status,
                          description,
                          isPublished,
                        });
                        showNotification("Nouvelle programmation ajoutée !");
                      }
                      setIsAddingExam(false);
                      setEditingExam(null);
                    }}
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                  >
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">Intitulé de l'examen / session *</label>
                      <input
                        name="title"
                        required
                        defaultValue={editingExam?.title || ""}
                        placeholder="Ex: DNB Blanc n°2 (Épreuves écrites complètes)"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Niveau ciblé *</label>
                      <select
                        name="targetLevel"
                        defaultValue={editingExam?.targetLevel || "3ème"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="3ème">3ème (Collège - DNB)</option>
                        <option value="1ère">1ère (Lycée - Bac)</option>
                        <option value="Terminale">Terminale (Lycée - Bac)</option>
                        <option value="Tous niveaux">Tous niveaux</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Type d'examen *</label>
                      <select
                        name="examType"
                        defaultValue={editingExam?.examType || "DNB Blanc"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="DNB Blanc">DNB Blanc (Brevet)</option>
                        <option value="Baccalauréat blanc">Baccalauréat blanc</option>
                        <option value="Épreuve commune">Épreuve commune</option>
                        <option value="Épreuve orale">Épreuve orale / Grand Oral</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Dates / Période *</label>
                      <input
                        name="period"
                        required
                        defaultValue={editingExam?.period || ""}
                        placeholder="Ex: 14 au 16 mai 2026"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Statut de la session *</label>
                      <select
                        name="status"
                        defaultValue={editingExam?.status || "Prévu"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Prévu">Prévu</option>
                        <option value="En cours">En cours</option>
                        <option value="Terminé">Terminé</option>
                        <option value="Archivé">Archivé</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">Consignes & Détails (optionnel)</label>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={editingExam?.description || ""}
                        placeholder="Consignes matérielles, horaires de convocation, calculatrice autorisée ou interdite..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        id="isPublished"
                        name="isPublished"
                        defaultChecked={editingExam ? editingExam.isPublished !== false : true}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isPublished" className="text-sm font-semibold text-slate-800">
                        Publier immédiatement sur la vitrine publique du lycée (Accueil)
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingExam(false);
                          setEditingExam(null);
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                      >
                        {editingExam ? "Enregistrer les modifications" : "Créer la programmation"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Exams list with Live Publish/Unpublish Toggle */}
              <div className="space-y-3">
                {cmsData.exams
                  .filter((exam) =>
                    searchQuery
                      ? exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        exam.targetLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        exam.period.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((exam) => {
                    const isPub = exam.isPublished !== false;
                    return (
                      <div
                        key={exam.id}
                        className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 shadow-xs transition sm:flex-row sm:items-center ${
                          isPub
                            ? "border-slate-200 bg-white hover:border-slate-300"
                            : "border-dashed border-slate-300 bg-slate-50/70 opacity-75"
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 pr-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                              {exam.targetLevel || "Tous niveaux"}
                            </span>
                            <h3 className="text-base font-bold text-slate-900">{exam.title}</h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                isPub
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {isPub ? "● En ligne sur la Vitrine" : "○ Brouillon (Masqué)"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span>📅 {exam.period}</span>
                            <span>📌 {exam.examType}</span>
                            <span>Statut : {exam.status || "Prévu"}</span>
                          </div>
                          {exam.description && (
                            <p className="text-xs text-slate-600 line-clamp-1">{exam.description}</p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Toggle Publish / Unpublish */}
                          <button
                            onClick={() => {
                              updateExam(exam.id, { isPublished: !isPub });
                              showNotification(
                                isPub
                                  ? `« ${exam.title} » est maintenant masqué de la vitrine.`
                                  : `« ${exam.title} » est maintenant publié en direct sur la vitrine !`
                              );
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              isPub
                                ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                          >
                            {isPub ? "Masquer" : "Publier"}
                          </button>

                          <button
                            onClick={() => setCurrentSection("organization")}
                            title="Lancer l'organisation et le brassage pour cet examen"
                            className="flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-100"
                          >
                            <Shuffle className="h-3.5 w-3.5 text-sky-600" />
                            <span>Répartition</span>
                          </button>

                          <button
                            onClick={() => setEditingExam(exam)}
                            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Modifier</span>
                          </button>

                          <button
                            onClick={() => {
                              const copy = duplicateExam(exam.id);
                              if (copy) {
                                setEditingExam(copy);
                                showNotification(`Examen dupliqué : « ${copy.title} »`);
                              }
                            }}
                            title="Dupliquer pour une autre session"
                            className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Dupliquer</span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Supprimer définitivement l'examen « ${exam.title} » ?`)) {
                                deleteExam(exam.id);
                                showNotification("Examen supprimé de la vitrine.");
                              }
                            }}
                            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: ANCIEN ASSISTANT (REMPLACÉ PAR SECTIONS AUTHENTIQUES) */}
          {false && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-indigo-100 border border-indigo-300 px-2 py-0.5 text-[11px] font-bold text-indigo-800 uppercase">
                      Méthode Frédéric Vedrenne (Orga-DNB)
                    </span>
                    <span className="text-xs text-slate-500">
                      Organisation, Brassage anti-triche & Imprimerie Officielle
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    Assistant Logistique des Examens Blancs
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Suivez les 5 étapes types de la direction pour préparer l'examen blanc de A à Z.
                  </p>
                </div>

                <Link
                  to="/orga-dnb"
                  target="_blank"
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  <Printer className="h-4 w-4" />
                  <span>Ouvrir l'Espace d'Impression Grand Format</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </Link>
              </div>

              {/* 5-Step Workflow Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Paramètres & Horaires</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Définition des épreuves officielles, calcul automatique du tiers-temps (+1/3 temps d'épreuve) et choix du mode de brassage.
                  </p>
                  <button
                    onClick={() => setActiveTab("programmations")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-2 block"
                  >
                    Gérer les programmations →
                  </button>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <DoorOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Salles & Jauges</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Mobilisation des salles, contrôle de la capacité globale et marquage des salles dédiées aux aménagements Tiers-Temps.
                  </p>
                  <button
                    onClick={() => setActiveTab("rooms")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-2 block"
                  >
                    Configurer les salles ({cmsData.rooms.length} salles) →
                  </button>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Élèves & Import Pronote</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Importation de masse par simple copier-coller de Pronote (Nom, Prénom, Division, Aménagement Tiers-Temps).
                  </p>
                  <button
                    onClick={() => setActiveTab("candidates")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-2 block"
                  >
                    Voir les candidats ({cmsData.candidates.length} inscrits) →
                  </button>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      4
                    </span>
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Professeurs & Surveillances</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Importation de la liste des professeurs, répartition des missions de surveillance par salle et décompte des heures.
                  </p>
                  <button
                    onClick={() => setActiveTab("teachers")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-2 block"
                  >
                    Voir les professeurs ({cmsData.teachers.length} enseignants) →
                  </button>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-indigo-50/60 to-white">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      5
                    </span>
                    <Printer className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Moteur de Répartition & Imprimerie Officielle
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Déclenche l'algorithme de placement (isolement des Tiers-Temps + alternance inter-classes) et génère en 1 clic :
                    les <strong>Feuilles d'Émargement officielles</strong>, les <strong>Étiquettes de table (Chevalets)</strong>,
                    les <strong>Listes d'Affichage Portes de Salle</strong> et les <strong>Convocations A4</strong>.
                  </p>
                  <Link
                    to="/orga-dnb"
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                  >
                    <span>Lancer le Moteur & Imprimer les Documents</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SITE INFO */}
          {activeTab === "siteInfo" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Identité & Textes du site</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Personnalisez le titre général, la description de présentation, l'année scolaire et le bandeau d'alerte.
                </p>
              </div>

              <form onSubmit={handleSaveSiteInfo} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="space-y-4">
                  <h3 className="border-b pb-2 text-base font-bold text-slate-900">En-tête & Présentation</h3>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Année scolaire en cours</label>
                    <input
                      value={siteInfoForm.schoolYear}
                      onChange={(e) => setSiteInfoForm({ ...siteInfoForm, schoolYear: e.target.value })}
                      placeholder="Ex: 2025-2026"
                      className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Sous-titre au-dessus du grand titre</label>
                    <input
                      value={siteInfoForm.subtitle}
                      onChange={(e) => setSiteInfoForm({ ...siteInfoForm, subtitle: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Grand titre principal</label>
                    <input
                      value={siteInfoForm.title}
                      onChange={(e) => setSiteInfoForm({ ...siteInfoForm, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Texte explicatif de présentation</label>
                    <textarea
                      rows={4}
                      value={siteInfoForm.description}
                      onChange={(e) => setSiteInfoForm({ ...siteInfoForm, description: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">URL du Logo (AEFE ou LFJP)</label>
                    <input
                      value={siteInfoForm.logos[0]?.src || ""}
                      onChange={(e) => {
                        const newLogos = [...siteInfoForm.logos];
                        newLogos[0] = { src: e.target.value, alt: "Logo de l'AEFE" };
                        setSiteInfoForm({ ...siteInfoForm, logos: newLogos });
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <h3 className="border-b pb-2 text-base font-bold text-slate-900">Bandeau d'information / Alerte générale</h3>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bannerEnabled"
                      checked={siteInfoForm.bannerAlert.enabled}
                      onChange={(e) =>
                        setSiteInfoForm({
                          ...siteInfoForm,
                          bannerAlert: { ...siteInfoForm.bannerAlert, enabled: e.target.checked },
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="bannerEnabled" className="text-sm font-semibold text-slate-800">
                      Afficher un bandeau d'alerte en haut de la page d'accueil
                    </label>
                  </div>

                  {siteInfoForm.bannerAlert.enabled && (
                    <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700">Titre du bandeau</label>
                        <input
                          value={siteInfoForm.bannerAlert.title}
                          onChange={(e) =>
                            setSiteInfoForm({
                              ...siteInfoForm,
                              bannerAlert: { ...siteInfoForm.bannerAlert, title: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700">Message détaillé</label>
                        <textarea
                          rows={2}
                          value={siteInfoForm.bannerAlert.message}
                          onChange={(e) =>
                            setSiteInfoForm({
                              ...siteInfoForm,
                              bannerAlert: { ...siteInfoForm.bannerAlert, message: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Type d'alerte / Couleur</label>
                        <select
                          value={siteInfoForm.bannerAlert.type}
                          onChange={(e) =>
                            setSiteInfoForm({
                              ...siteInfoForm,
                              bannerAlert: {
                                ...siteInfoForm.bannerAlert,
                                type: e.target.value as SiteInfo["bannerAlert"]["type"],
                              },
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="info">Information (Bleu)</option>
                          <option value="warning">Important / Attention (Ambre)</option>
                          <option value="urgent">Urgent / Alerte (Rouge)</option>
                          <option value="success">Succès / Confirmation (Vert)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4" />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </form>

              {/* Announcements Section */}
              <div className="mt-8 border-t border-slate-200 pt-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Annonces & Consignes officielles</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Publiez des consignes relatives au matériel, aux horaires ou aux protocoles d'examen.
                    </p>
                  </div>
                <button
                  onClick={() => setIsAddingAnnouncement(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter une consigne</span>
                </button>
              </div>

              {/* Add/Edit modal */}
              {(isAddingAnnouncement || editingAnnouncement) && (
                <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingAnnouncement ? "Modifier l'annonce" : "Nouvelle consigne ou annonce"}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAddingAnnouncement(false);
                        setEditingAnnouncement(null);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Annuler
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const title = formData.get("title") as string;
                      const content = formData.get("content") as string;
                      const priority = formData.get("priority") as CmsAnnouncement["priority"];
                      const target = formData.get("target") as CmsAnnouncement["target"];
                      const date = formData.get("date") as string;
                      const isPublished = formData.get("isPublished") === "on";

                      if (editingAnnouncement) {
                        updateAnnouncement(editingAnnouncement.id, {
                          title,
                          content,
                          priority,
                          target,
                          date,
                          isPublished,
                        });
                        showNotification("Annonce mise à jour !");
                      } else {
                        addAnnouncement({
                          title,
                          content,
                          priority,
                          target,
                          date: date || new Date().toISOString().split("T")[0],
                          isPublished,
                        });
                        showNotification("Nouvelle annonce publiée !");
                      }
                      setIsAddingAnnouncement(false);
                      setEditingAnnouncement(null);
                    }}
                    className="mt-4 space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Titre de l'annonce *</label>
                      <input
                        name="title"
                        required
                        defaultValue={editingAnnouncement?.title || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Texte de la consigne *</label>
                      <textarea
                        name="content"
                        rows={3}
                        required
                        defaultValue={editingAnnouncement?.content || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Priorité *</label>
                        <select
                          name="priority"
                          defaultValue={editingAnnouncement?.priority || "information"}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="information">Information générale</option>
                          <option value="important">Important</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Public cible *</label>
                        <select
                          name="target"
                          defaultValue={editingAnnouncement?.target || "all"}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="all">Tous</option>
                          <option value="bac">Baccalauréat</option>
                          <option value="dnb">DNB</option>
                          <option value="teachers">Enseignants</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Date d'émission</label>
                        <input
                          name="date"
                          type="date"
                          defaultValue={editingAnnouncement?.date || new Date().toISOString().split("T")[0]}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="annPublished"
                        name="isPublished"
                        defaultChecked={editingAnnouncement ? editingAnnouncement.isPublished : true}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="annPublished" className="text-sm font-semibold text-slate-800">
                        Publier immédiatement cette consigne
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAnnouncement(false);
                          setEditingAnnouncement(null);
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* List */}
              <div className="space-y-3">
                {cmsData.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 uppercase">
                          {ann.priority}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            ann.isPublished
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ann.isPublished ? "Visible" : "Brouillon"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{ann.content}</p>
                      <p className="text-xs text-slate-400">
                        Date : {ann.date} • Cible : {ann.target}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingAnnouncement(ann)}
                        className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer l'annonce « ${ann.title} » ?`)) {
                            deleteAnnouncement(ann.id);
                            showNotification("Annonce supprimée.");
                          }
                        }}
                        className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}



          {/* DONNÉES: SALLES */}
          {(currentSection === "data-salles" || activeTab === "rooms") && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Salles d'examen & Capacités</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Définissez les salles mobilisées pour les épreuves et leurs capacités.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingRoom(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter une salle</span>
                </button>
              </div>

              {/* Add/Edit Room */}
              {(isAddingRoom || editingRoom) && (
                <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingRoom ? "Modifier la salle" : "Ajouter une salle"}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAddingRoom(false);
                        setEditingRoom(null);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Annuler
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const name = formData.get("name") as string;
                      const capacity = Number(formData.get("capacity")) || 0;
                      const building = formData.get("building") as string;
                      const notes = formData.get("notes") as string;

                      if (editingRoom) {
                        updateRoom(editingRoom.id, { name, capacity, building, notes });
                        showNotification("Salle mise à jour !");
                      } else {
                        addRoom({ name, capacity, building, notes });
                        showNotification("Nouvelle salle ajoutée !");
                      }
                      setIsAddingRoom(false);
                      setEditingRoom(null);
                    }}
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Nom de la salle *</label>
                      <input
                        name="name"
                        required
                        defaultValue={editingRoom?.name || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Capacité (places) *</label>
                      <input
                        name="capacity"
                        type="number"
                        min="1"
                        required
                        defaultValue={editingRoom?.capacity || 24}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Bâtiment</label>
                      <input
                        name="building"
                        defaultValue={editingRoom?.building || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Aménagements / Notes</label>
                      <input
                        name="notes"
                        defaultValue={editingRoom?.notes || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingRoom(false);
                          setEditingRoom(null);
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cmsData.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">{room.name}</h3>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                          {room.capacity} places
                        </span>
                      </div>
                      {room.building && <p className="mt-1 text-xs text-slate-500">🏢 {room.building}</p>}
                      {room.notes && (
                        <p className="mt-2.5 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                          {room.notes}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                      <button
                        onClick={() => setEditingRoom(room)}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer la salle « ${room.name} » ?`)) {
                            deleteRoom(room.id);
                            showNotification("Salle supprimée.");
                          }
                        }}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DONNÉES: PROFESSEURS */}
          {(currentSection === "data-profs" || activeTab === "teachers") && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Enseignants & Équipe pédagogique</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Gestion des enseignants mobilisés pour la surveillance et les jurys d'examen.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBatchImportingTeachers(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Import groupé (Pronote/CSV)</span>
                  </button>
                  <button
                    onClick={() => setIsAddingTeacher(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un enseignant</span>
                  </button>
                </div>
              </div>

              {/* Batch Import Teachers Modal */}
              {isBatchImportingTeachers && (
                <div className="rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Import groupé des professeurs (Pronote / CSV / Excel)
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Collez directement la liste des enseignants depuis Pronote, STSWeb ou un tableau Excel.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsBatchImportingTeachers(false);
                        setBatchImportTeachersText("");
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Annuler
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900">
                      <div className="font-bold mb-1">Formats reconnus :</div>
                      <ul className="list-disc pl-4 space-y-0.5 text-indigo-800">
                        <li>Copier-coller tabulaire depuis Pronote (Colonnes : Nom | Prénom | Matière/Discipline | Email)</li>
                        <li>Format CSV ou point-virgule : <code className="bg-white/80 px-1 py-0.5 rounded font-mono">DUPONT; Jean; Mathématiques; jean.dupont@lfjpsaly.org</code></li>
                        <li>Format simple : <code className="bg-white/80 px-1 py-0.5 rounded font-mono">Mme MARTIN Sophie - Histoire-Géo</code></li>
                      </ul>
                    </div>

                    <textarea
                      value={batchImportTeachersText}
                      onChange={(e) => setBatchImportTeachersText(e.target.value)}
                      placeholder={"Collez ici votre liste de professeurs...\nExemple :\nDUPONT\tJean\tMathématiques\tjean.dupont@lfjpsaly.org\nMARTIN\tSophie\tHistoire-Géographie\tsophie.martin@lfjpsaly.org\nDIALLO\tIbrahima\tSciences Physiques\tibrahima.diallo@lfjpsaly.org"}
                      rows={8}
                      className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                    />

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-500">
                        {batchImportTeachersText.trim().split("\n").filter((l) => l.trim()).length} ligne(s) détectée(s)
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsBatchImportingTeachers(false);
                            setBatchImportTeachersText("");
                          }}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={handleBatchImportTeachers}
                          disabled={!batchImportTeachersText.trim()}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Importer les professeurs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add/Edit Teacher */}
              {(isAddingTeacher || editingTeacher) && (
                <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingTeacher ? "Modifier l'enseignant" : "Ajouter un enseignant"}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAddingTeacher(false);
                        setEditingTeacher(null);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Annuler
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const civility = formData.get("civility") as CmsTeacher["civility"];
                      const firstName = formData.get("firstName") as string;
                      const lastName = formData.get("lastName") as string;
                      const subject = formData.get("subject") as string;
                      const email = formData.get("email") as string;

                      if (editingTeacher) {
                        updateTeacher(editingTeacher.id, { civility, firstName, lastName, subject, email });
                        showNotification("Enseignant mis à jour !");
                      } else {
                        addTeacher({ civility, firstName, lastName, subject, email });
                        showNotification("Enseignant ajouté !");
                      }
                      setIsAddingTeacher(false);
                      setEditingTeacher(null);
                    }}
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Civilité *</label>
                      <select
                        name="civility"
                        defaultValue={editingTeacher?.civility || "Madame"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Madame">Madame</option>
                        <option value="Monsieur">Monsieur</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Discipline *</label>
                      <input
                        name="subject"
                        required
                        defaultValue={editingTeacher?.subject || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Prénom *</label>
                      <input
                        name="firstName"
                        required
                        defaultValue={editingTeacher?.firstName || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Nom *</label>
                      <input
                        name="lastName"
                        required
                        defaultValue={editingTeacher?.lastName || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">Email académique</label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={editingTeacher?.email || ""}
                        placeholder="prenom.nom@lfjpsaly.org"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingTeacher(false);
                          setEditingTeacher(null);
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-4">Enseignant</th>
                      <th className="p-4">Discipline</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cmsData.teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="p-4 font-bold text-slate-900">
                          {t.civility} {t.firstName} {t.lastName}
                        </td>
                        <td className="p-4 text-slate-700">{t.subject}</td>
                        <td className="p-4 text-slate-500 text-xs">{t.email || "-"}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingTeacher(t)}
                              className="rounded p-1 text-slate-600 hover:text-blue-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer ${t.firstName} ${t.lastName} ?`)) {
                                  deleteTeacher(t.id);
                                  showNotification("Enseignant supprimé.");
                                }
                              }}
                              className="rounded p-1 text-slate-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Surveillances Planning Section */}
              <div className="mt-10 border-t border-slate-200 pt-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Planning des surveillances</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Affectation des créneaux de surveillance par épreuve, salle et horaire.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/convocations"
                    target="_blank"
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100 transition"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Émargements & Ordres de mission</span>
                  </Link>
                  <button
                    onClick={() => setIsAddingSurveillance(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter une surveillance</span>
                  </button>
                </div>
              </div>

              {/* Add/Edit Surveillance */}
              {(isAddingSurveillance || editingSurveillance) && (
                <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingSurveillance ? "Modifier l'affectation" : "Nouvelle affectation de surveillance"}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAddingSurveillance(false);
                        setEditingSurveillance(null);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Annuler
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const examTitle = formData.get("examTitle") as string;
                      const teacherName = formData.get("teacherName") as string;
                      const roomName = formData.get("roomName") as string;
                      const date = formData.get("date") as string;
                      const timeSlot = formData.get("timeSlot") as string;
                      const mission = formData.get("mission") as string;

                      if (editingSurveillance) {
                        updateSurveillance(editingSurveillance.id, {
                          examTitle,
                          teacherName,
                          roomName,
                          date,
                          timeSlot,
                          mission,
                        });
                        showNotification("Surveillance mise à jour !");
                      } else {
                        addSurveillance({
                          examTitle,
                          teacherName,
                          roomName,
                          date,
                          timeSlot,
                          mission,
                        });
                        showNotification("Surveillance affectée !");
                      }
                      setIsAddingSurveillance(false);
                      setEditingSurveillance(null);
                    }}
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Épreuve *</label>
                      <input
                        name="examTitle"
                        required
                        defaultValue={editingSurveillance?.examTitle || ""}
                        placeholder="Ex: Baccalauréat blanc 1ère et Terminale"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Enseignant *</label>
                      <input
                        name="teacherName"
                        required
                        defaultValue={editingSurveillance?.teacherName || ""}
                        placeholder="Ex: M. Bastien Capel"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Salle *</label>
                      <input
                        name="roomName"
                        required
                        defaultValue={editingSurveillance?.roomName || ""}
                        placeholder="Ex: Salle S12"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Mission *</label>
                      <input
                        name="mission"
                        required
                        defaultValue={editingSurveillance?.mission || "Surveillance principale"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Date *</label>
                      <input
                        name="date"
                        type="date"
                        required
                        defaultValue={editingSurveillance?.date || "2026-04-07"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Créneau horaire *</label>
                      <input
                        name="timeSlot"
                        required
                        defaultValue={editingSurveillance?.timeSlot || "08h00 - 12h00"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingSurveillance(false);
                          setEditingSurveillance(null);
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-4">Épreuve</th>
                      <th className="p-4">Surveillant</th>
                      <th className="p-4">Salle</th>
                      <th className="p-4">Horaire</th>
                      <th className="p-4">Mission</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cmsData.surveillances.map((surv) => (
                      <tr key={surv.id} className="hover:bg-slate-50/70">
                        <td className="p-4 font-bold text-slate-900">{surv.examTitle}</td>
                        <td className="p-4 text-slate-800">{surv.teacherName}</td>
                        <td className="p-4 text-slate-700">{surv.roomName}</td>
                        <td className="p-4 text-slate-600">{surv.date} · {surv.timeSlot}</td>
                        <td className="p-4 text-slate-600">{surv.mission}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingSurveillance(surv)}
                              title="Modifier l'affectation"
                              className="rounded p-1 text-slate-600 hover:text-blue-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const copy = duplicateSurveillance(surv.id);
                                if (copy) {
                                  setEditingSurveillance(copy);
                                  showNotification("Affectation de surveillance dupliquée.");
                                }
                              }}
                              title="Dupliquer cette surveillance"
                              className="rounded p-1 text-slate-600 hover:text-indigo-700"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer cette affectation ?`)) {
                                  deleteSurveillance(surv.id);
                                  showNotification("Affectation supprimée.");
                                }
                              }}
                              title="Supprimer l'affectation"
                              className="rounded p-1 text-slate-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

          {/* DONNÉES: ÉLÈVES */}
          {(currentSection === "data-eleves" || activeTab === "candidates") && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Candidats & Convocations</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Gestion des élèves, classes, convocations en salle et aménagements d'épreuves.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/convocations"
                    target="_blank"
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100 transition"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimer les Convocations A4</span>
                  </Link>
                  <button
                    onClick={() => setIsBatchImportingCandidates(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                  >
                    <ClipboardPaste className="h-4 w-4 text-slate-500" />
                    <span>Import groupé CSV</span>
                  </button>
                  <button
                    onClick={() => setIsAddingCandidate(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un élève</span>
                  </button>
                </div>
              </div>

              {/* Batch Import Candidates Modal */}
              {isBatchImportingCandidates && (
                <div className="rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Importation groupée de candidats (CSV ou Presse-Papier)</h3>
                      <p className="text-xs text-slate-500">Collez votre liste d'élèves (un élève par ligne, champs séparés par des points-virgules ou virgules)</p>
                    </div>
                    <button
                      onClick={() => setIsBatchImportingCandidates(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Fermer
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-slate-600">
                      <strong>Format attendu par ligne :</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">Nom; Prénom; Classe; Salle; Heure (optionnel); Aménagement (optionnel)</code>
                    </p>
                    <textarea
                      rows={6}
                      value={batchImportText}
                      onChange={(e) => setBatchImportText(e.target.value)}
                      placeholder={`Exemple :\nDiop; Awa; 1ère G1; Salle S12; 07h45; Standard\nNdiaye; Mamadou; Terminale G1; Salle S14; 07h45; Standard\nDupont; Paul; 3ème A; Salle S04 (Tiers-Temps); 07h30; Tiers-temps accordé`}
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsBatchImportingCandidates(false)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => {
                          const lines = batchImportText.split("\n").filter((l: string) => l.trim().length > 0);
                          let count = 0;
                          for (const line of lines) {
                            const parts = line.split(/[;,]/).map((p: string) => p.trim());
                            if (parts.length >= 2) {
                              const [lastName, firstName, className, roomName, convocationTime, accommodation] = parts;
                              addCandidate({
                                lastName: lastName || "Élève",
                                firstName: firstName || "",
                                className: className || "Terminale G1",
                                examName: "Baccalauréat / DNB blanc",
                                roomName: roomName || "Salle S12",
                                convocationTime: convocationTime || "07h45",
                                accommodation: accommodation || "Aucun",
                              });
                              count++;
                            }
                          }
                          setIsBatchImportingCandidates(false);
                          setBatchImportText("");
                          showNotification(`${count} candidat(s) importé(s) avec succès !`);
                        }}
                        className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                      >
                        Importer tous les candidats
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add/Edit Candidate */}
              {(isAddingCandidate || editingCandidate) && (
                <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingCandidate ? "Modifier l'élève" : "Ajouter un élève"}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAddingCandidate(false);
                        setEditingCandidate(null);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Annuler
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const firstName = formData.get("firstName") as string;
                      const lastName = formData.get("lastName") as string;
                      const className = formData.get("className") as string;
                      const examName = formData.get("examName") as string;
                      const roomName = formData.get("roomName") as string;
                      const convocationTime = formData.get("convocationTime") as string;
                      const accommodation = formData.get("accommodation") as string;

                      if (editingCandidate) {
                        updateCandidate(editingCandidate.id, {
                          firstName,
                          lastName,
                          className,
                          examName,
                          roomName,
                          convocationTime,
                          accommodation,
                        });
                        showNotification("Fiche élève mise à jour !");
                      } else {
                        addCandidate({
                          firstName,
                          lastName,
                          className,
                          examName,
                          roomName,
                          convocationTime,
                          accommodation,
                        });
                        showNotification("Élève ajouté !");
                      }
                      setIsAddingCandidate(false);
                      setEditingCandidate(null);
                    }}
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Prénom *</label>
                      <input
                        name="firstName"
                        required
                        defaultValue={editingCandidate?.firstName || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Nom *</label>
                      <input
                        name="lastName"
                        required
                        defaultValue={editingCandidate?.lastName || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Classe *</label>
                      <input
                        name="className"
                        required
                        defaultValue={editingCandidate?.className || "Terminale G1"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Examen associé *</label>
                      <input
                        name="examName"
                        required
                        defaultValue={editingCandidate?.examName || "Bac blanc 2026"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Salle *</label>
                      <input
                        name="roomName"
                        required
                        defaultValue={editingCandidate?.roomName || "Salle S12"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Heure de convocation</label>
                      <input
                        name="convocationTime"
                        defaultValue={editingCandidate?.convocationTime || "07h45"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">Aménagement / Tiers-temps</label>
                      <input
                        name="accommodation"
                        defaultValue={editingCandidate?.accommodation || "Aucun"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCandidate(false);
                          setEditingCandidate(null);
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-4">Candidat</th>
                      <th className="p-4">Classe</th>
                      <th className="p-4">Examen</th>
                      <th className="p-4">Salle & Heure</th>
                      <th className="p-4">Aménagement</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cmsData.candidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-50/70">
                        <td className="p-4 font-bold text-slate-900">
                          {cand.lastName} {cand.firstName}
                        </td>
                        <td className="p-4 text-slate-700">{cand.className}</td>
                        <td className="p-4 text-slate-700">{cand.examName}</td>
                        <td className="p-4 text-slate-600">
                          {cand.roomName} ({cand.convocationTime})
                        </td>
                        <td className="p-4">
                          {cand.accommodation && cand.accommodation !== "Aucun" ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              {cand.accommodation}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Standard</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingCandidate(cand)}
                              className="rounded p-1 text-slate-600 hover:text-blue-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer ${cand.firstName} ${cand.lastName} ?`)) {
                                  deleteCandidate(cand.id);
                                  showNotification("Candidat supprimé.");
                                }
                              }}
                              className="rounded p-1 text-slate-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
