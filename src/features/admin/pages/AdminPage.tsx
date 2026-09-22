import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Bell,
  GraduationCap,
  DoorOpen,
  Users,
  Shield,
  UploadCloud,
  Plus,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
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
} from "lucide-react";

import {
  useCmsData,
  exportCmsDataJson,
  importCmsDataJson,
  type CmsCallout,
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
} from "../../../shared/services/github-service";

type ActiveTab =
  | "overview"
  | "programmations"
  | "siteInfo"
  | "announcements"
  | "exams"
  | "rooms"
  | "teachers"
  | "surveillances"
  | "candidates";

export default function AdminPage() {
  const {
    data: cmsData,
    updateSiteInfo,
    addCallout,
    updateCallout,
    deleteCallout,
    reorderCallout,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    addExam,
    updateExam,
    deleteExam,
    addRoom,
    updateRoom,
    deleteRoom,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addSurveillance,
    updateSurveillance,
    deleteSurveillance,
    addCandidate,
    updateCandidate,
    deleteCandidate,
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
  const [loginTokenInput, setLoginTokenInput] = useState(githubToken || "");
  const [loginOwnerInput, setLoginOwnerInput] = useState(githubConfig.owner || "informatique-cmd");
  const [loginRepoInput, setLoginRepoInput] = useState(githubConfig.repo || "examens_blanc_lfjp");
  const [loginBranchInput, setLoginBranchInput] = useState(githubConfig.branch || "main");
  const [showToken, setShowToken] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [hasOpenedGitHub, setHasOpenedGitHub] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

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

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [notification, setNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals for CRUD
  const [editingCallout, setEditingCallout] = useState<CmsCallout | null>(null);
  const [isAddingCallout, setIsAddingCallout] = useState(false);

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

  // Form local state for Site Info
  const [siteInfoForm, setSiteInfoForm] = useState(cmsData.siteInfo);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
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

    const res = await pushCmsChangesToGitHub({
      cmsData,
      commitMessage: commitMessageInput,
      onProgress: (status) => setSyncStep(status),
    });

    setIsSyncing(false);
    setSyncResult(res);
    if (res.success) {
      showNotification("Modifications publiées sur GitHub ! Vercel redéploie votre site en ligne.");
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

  // Navigation tabs (single update button is in the top bar)
  const tabs = [
    { id: "overview" as const, label: "Tableau de bord", icon: LayoutDashboard },
    { id: "programmations" as const, label: "Programmations", icon: Calendar },
    { id: "siteInfo" as const, label: "Identité du site", icon: FileText },
    { id: "announcements" as const, label: "Annonces & Consignes", icon: Bell },
    { id: "exams" as const, label: "Épreuves", icon: Layers },
    { id: "rooms" as const, label: "Salles d'examen", icon: DoorOpen },
    { id: "teachers" as const, label: "Enseignants", icon: Users },
    { id: "surveillances" as const, label: "Surveillances", icon: Shield },
    { id: "candidates" as const, label: "Candidats", icon: GraduationCap },
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
              <div className="my-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                <p className="font-bold text-sm">Échec du commit</p>
                <p className="mt-1">{syncResult.error}</p>
                <p className="mt-2 text-slate-600">
                  Vérifiez que votre jeton d'accès GitHub possède bien la permission <code>repo</code> en écriture.
                </p>
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

      {/* Main Layout Container */}
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* Sidebar Navigation Tabs */}
        <aside className="w-full border-b border-slate-200 bg-white p-4 lg:w-64 lg:min-h-[calc(100vh-65px)] lg:border-b-0 lg:border-r">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Gestion du contenu
          </p>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>100% Gratuit (Sans Supabase)</span>
              </div>
              <p className="mt-1 text-slate-500">
                Votre dépôt GitHub stocke vos données gratuitement. Vercel héberge le site en production sans frais.
              </p>
              <button
                onClick={() => {
                  if (confirm("Voulez-vous vraiment réinitialiser toutes les données aux valeurs officielles du lycée ?")) {
                    resetToDefaults();
                    showNotification("Données réinitialisées aux valeurs initiales.");
                  }
                }}
                className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Réinitialiser par défaut</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8">
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Tableau de bord de gestion</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Gérez l'ensemble des examens blancs, plannings, épreuves et consignes du LFJP pour l'année {cmsData.siteInfo.schoolYear}.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsAddingCallout(true);
                      setActiveTab("programmations");
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nouvelle programmation</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white font-bold text-sm shadow-xs">
                    LFJP
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      Dépôt GitHub connecté : {githubConfig.owner}/{githubConfig.repo}
                    </p>
                    <p className="text-xs text-slate-600">
                      Branche de publication : <code className="font-semibold text-blue-700">{githubConfig.branch}</code> • Synchronisation Vercel directe sans service payant
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Synchronisé avec Vercel</span>
                  </span>
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
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Programmations d'examens (Accueil)</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Ajoutez, modifiez, réordonnez ou supprimez les cartes d'examens affichées sur la page d'accueil.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAddingCallout(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter une programmation</span>
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

              {/* Add / Edit Form Modal */}
              {(isAddingCallout || editingCallout) && (
                <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingCallout ? "Modifier la programmation" : "Nouvelle programmation d'examen"}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAddingCallout(false);
                        setEditingCallout(null);
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
                      const subtitle = formData.get("subtitle") as string;
                      const dateLabel = formData.get("dateLabel") as string;
                      const date = formData.get("date") as string;
                      const to = formData.get("to") as string;
                      const footerLabel = formData.get("footerLabel") as string;
                      const iconLabel = formData.get("iconLabel") as string;
                      const category = formData.get("category") as CmsCallout["category"];
                      const isPublished = formData.get("isPublished") === "on";

                      if (editingCallout) {
                        updateCallout(editingCallout.id, {
                          title,
                          subtitle,
                          dateLabel,
                          date,
                          to,
                          footerLabel,
                          iconLabel,
                          category,
                          isPublished,
                        });
                        showNotification("Programmation mise à jour ! Pensez à cliquer sur 'Pousser vers Vercel'.");
                      } else {
                        addCallout({
                          title,
                          subtitle,
                          dateLabel,
                          date,
                          to,
                          footerLabel,
                          iconLabel: iconLabel || `Accéder à ${title}`,
                          category,
                          isPublished,
                        });
                        showNotification("Nouvelle programmation ajoutée !");
                      }
                      setIsAddingCallout(false);
                      setEditingCallout(null);
                    }}
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                  >
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">Titre de l'épreuve / examen *</label>
                      <input
                        name="title"
                        required
                        defaultValue={editingCallout?.title || ""}
                        placeholder="Ex: Baccalauréat blanc 1ère et Terminale"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Sous-titre (optionnel)</label>
                      <input
                        name="subtitle"
                        defaultValue={editingCallout?.subtitle || ""}
                        placeholder="Ex: Session Avril 2026"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Catégorie / Style d'icône *</label>
                      <select
                        name="category"
                        defaultValue={editingCallout?.category || "general"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="general">Général / Baccalauréat</option>
                        <option value="math">Mathématiques</option>
                        <option value="oral">Épreuve orale / Grand Oral</option>
                        <option value="surveillance">Surveillance & Planning</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Texte de la date affiché *</label>
                      <input
                        name="dateLabel"
                        required
                        defaultValue={editingCallout?.dateLabel || ""}
                        placeholder="Ex: 7 au 10 avril 2026"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Date de tri chronologique (AAAA-MM-JJ) *</label>
                      <input
                        name="date"
                        type="date"
                        required
                        defaultValue={editingCallout?.date || "2026-04-07"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Lien vers la page / URL *</label>
                      <input
                        name="to"
                        required
                        defaultValue={editingCallout?.to || "/examens-blancs"}
                        placeholder="/examens-blancs ou /examens-blancs/..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Libellé du bouton au bas de la carte</label>
                      <input
                        name="footerLabel"
                        defaultValue={editingCallout?.footerLabel || "Accéder à l'organisation complète"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        id="isPublished"
                        name="isPublished"
                        defaultChecked={editingCallout ? editingCallout.isPublished : true}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isPublished" className="text-sm font-semibold text-slate-800">
                        Publier cette programmation sur la page d'accueil
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCallout(false);
                          setEditingCallout(null);
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                      >
                        {editingCallout ? "Enregistrer les modifications" : "Ajouter la programmation"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Callouts list */}
              <div className="space-y-3">
                {cmsData.callouts
                  .filter((c) =>
                    searchQuery
                      ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.dateLabel.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((callout, idx) => (
                    <div
                      key={callout.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => reorderCallout(callout.id, "up")}
                            disabled={idx === 0}
                            title="Monter"
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => reorderCallout(callout.id, "down")}
                            disabled={idx === cmsData.callouts.length - 1}
                            title="Descendre"
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{callout.title}</h3>
                            {callout.subtitle && (
                              <span className="text-xs font-semibold text-slate-500">· {callout.subtitle}</span>
                            )}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                callout.isPublished
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {callout.isPublished ? "Publiée" : "Brouillon (Masquée)"}
                            </span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {callout.category}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span>📅 {callout.dateLabel}</span>
                            <span>🔗 {callout.to}</span>
                            <span>Bouton : « {callout.footerLabel} »</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            updateCallout(callout.id, { isPublished: !callout.isPublished });
                            showNotification(
                              callout.isPublished ? "Programmation masquée." : "Programmation publiée sur l'accueil !"
                            );
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            callout.isPublished
                              ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          {callout.isPublished ? "Dépublier" : "Publier"}
                        </button>
                        <button
                          onClick={() => setEditingCallout(callout)}
                          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer la programmation « ${callout.title} » ?`)) {
                              deleteCallout(callout.id);
                              showNotification("Programmation supprimée.");
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
            </div>
          )}

          {/* TAB: ANNOUNCEMENTS */}
          {activeTab === "announcements" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Annonces & Consignes officielles</h2>
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
          )}

          {/* TAB: EXAMS */}
          {activeTab === "exams" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Épreuves & Calendrier officiel</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Définition des sessions d'examens, niveaux scolaires associés et état d'avancement.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingExam(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter une épreuve</span>
                </button>
              </div>

              {/* Add / Edit Exam */}
              {(isAddingExam || editingExam) && (
                <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingExam ? "Modifier l'épreuve" : "Ajouter une épreuve"}
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
                      const title = formData.get("title") as string;
                      const examType = formData.get("examType") as string;
                      const targetLevel = formData.get("targetLevel") as string;
                      const period = formData.get("period") as string;
                      const description = formData.get("description") as string;
                      const status = formData.get("status") as CmsExam["status"];

                      if (editingExam) {
                        updateExam(editingExam.id, {
                          title,
                          examType,
                          targetLevel,
                          period,
                          description,
                          status,
                        });
                        showNotification("Épreuve mise à jour !");
                      } else {
                        addExam({
                          title,
                          examType,
                          targetLevel,
                          period,
                          startsAt: "",
                          endsAt: "",
                          description,
                          status,
                        });
                        showNotification("Épreuve ajoutée !");
                      }
                      setIsAddingExam(false);
                      setEditingExam(null);
                    }}
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                  >
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">Intitulé de l'épreuve *</label>
                      <input
                        name="title"
                        required
                        defaultValue={editingExam?.title || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Type d'examen *</label>
                      <input
                        name="examType"
                        required
                        defaultValue={editingExam?.examType || "Baccalauréat blanc"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Niveau ciblé *</label>
                      <input
                        name="targetLevel"
                        required
                        defaultValue={editingExam?.targetLevel || "Terminale"}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Période / Date *</label>
                      <input
                        name="period"
                        required
                        defaultValue={editingExam?.period || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Statut *</label>
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
                      <label className="text-xs font-bold text-slate-700">Description</label>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={editingExam?.description || ""}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
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
                      <th className="p-4">Type</th>
                      <th className="p-4">Niveau</th>
                      <th className="p-4">Période</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cmsData.exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-50/70">
                        <td className="p-4 font-bold text-slate-900">{exam.title}</td>
                        <td className="p-4 text-slate-700">{exam.examType}</td>
                        <td className="p-4 text-slate-700">{exam.targetLevel}</td>
                        <td className="p-4 text-slate-600">{exam.period}</td>
                        <td className="p-4">
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                            {exam.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingExam(exam)}
                              className="rounded p-1 text-slate-600 hover:text-blue-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer l'épreuve « ${exam.title} » ?`)) {
                                  deleteExam(exam.id);
                                  showNotification("Épreuve supprimée.");
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

          {/* TAB: ROOMS */}
          {activeTab === "rooms" && (
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

          {/* TAB: TEACHERS */}
          {activeTab === "teachers" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Enseignants & Équipe pédagogique</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Gestion des enseignants mobilisés pour la surveillance et les jurys d'examen.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingTeacher(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter un enseignant</span>
                </button>
              </div>

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
            </div>
          )}

          {/* TAB: SURVEILLANCES */}
          {activeTab === "surveillances" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Planning des surveillances</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Affectation des créneaux de surveillance par épreuve, salle et horaire.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingSurveillance(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter une surveillance</span>
                </button>
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
                              className="rounded p-1 text-slate-600 hover:text-blue-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer cette affectation ?`)) {
                                  deleteSurveillance(surv.id);
                                  showNotification("Affectation supprimée.");
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

          {/* TAB: CANDIDATES */}
          {activeTab === "candidates" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Candidats & Convocations</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Gestion des élèves, classes, convocations en salle et aménagements d'épreuves.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingCandidate(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter un élève</span>
                </button>
              </div>

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
