import { useState, useEffect, useCallback } from "react";
import { generateConstantsTsCode, exportCmsDataJson, type CmsData } from "./cms-store";

// Import project files as raw strings to synchronize codebase to GitHub & Vercel
import appTsxRaw from "../../app/App.tsx?raw";
import homePageRaw from "../../features/home/pages/HomePage.tsx?raw";
import schoolYearPageRaw from "../../features/home/pages/SchoolYearPage.tsx?raw";
import schoolExamPageRaw from "../../features/home/pages/SchoolExamPage.tsx?raw";
import adminPageRaw from "../../features/admin/pages/AdminPage.tsx?raw";
import cmsStoreRaw from "./cms-store.ts?raw";
import githubServiceRaw from "./github-service.ts?raw";

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  html_url: string;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
}

export interface GitHubAuthState {
  isAuthenticated: boolean;
  token: string;
  user: GitHubUser | null;
  config: GitHubConfig;
}

const STORAGE_KEY = "lfjp_github_auth";

export const DEFAULT_GITHUB_CONFIG: GitHubConfig = {
  owner: "informatique-cmd",
  repo: "examens_blanc_lfjp",
  branch: "main",
};

export function getStoredGitHubAuth(): GitHubAuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        isAuthenticated: false,
        token: "",
        user: null,
        config: DEFAULT_GITHUB_CONFIG,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      isAuthenticated: Boolean(parsed.token && parsed.user),
      token: parsed.token || "",
      user: parsed.user || null,
      config: {
        owner: parsed.config?.owner || DEFAULT_GITHUB_CONFIG.owner,
        repo: parsed.config?.repo || DEFAULT_GITHUB_CONFIG.repo,
        branch: parsed.config?.branch || DEFAULT_GITHUB_CONFIG.branch,
      },
    };
  } catch {
    return {
      isAuthenticated: false,
      token: "",
      user: null,
      config: DEFAULT_GITHUB_CONFIG,
    };
  }
}

export function saveStoredGitHubAuth(auth: GitHubAuthState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch (err) {
    console.error("Erreur lors de la sauvegarde de l'authentification GitHub", err);
  }
}

export function clearStoredGitHubAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Erreur lors de la déconnexion GitHub", err);
  }
}

/**
 * Encode string to UTF-8 base64 safely in browser
 */
function utf8ToBase64(str: string): string {
  return window.btoa(unescape(encodeURIComponent(str)));
}

/**
 * Commit a file to GitHub repository using GitHub Contents REST API
 */
async function commitFileToGitHub({
  owner,
  repo,
  branch,
  path,
  content,
  message,
  token,
}: {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  content: string;
  message: string;
  token: string;
}): Promise<{ commitSha: string; commitUrl: string }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // 1. Get current file SHA if file exists on target branch
  let existingSha: string | undefined = undefined;
  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
        repo
      )}/contents/${path}?ref=${encodeURIComponent(branch)}`,
      { headers }
    );
    if (getRes.ok) {
      const data = await getRes.json();
      existingSha = data.sha;
    }
  } catch {
    // File might not exist yet, which is fine
  }

  // 2. Put file contents (creates or updates file in a new commit)
  const putRes = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: utf8ToBase64(content),
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    }
  );

  if (!putRes.ok) {
    const errData = await putRes.json().catch(() => ({}));
    throw new Error(
      errData.message || `Échec de l'envoi vers GitHub (Statut HTTP ${putRes.status})`
    );
  }

  const putData = await putRes.json();
  return {
    commitSha: putData.commit?.sha || "",
    commitUrl: putData.commit?.html_url || `https://github.com/${owner}/${repo}/commits/${branch}`,
  };
}

/**
 * Verify GitHub token and retrieve user profile & repo permissions
 */
export async function verifyAndLoginGitHub(
  token: string,
  config: Partial<GitHubConfig> = {}
): Promise<{ success: boolean; user?: GitHubUser; error?: string }> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { success: false, error: "Veuillez saisir votre jeton d'accès GitHub." };
  }

  const targetConfig: GitHubConfig = {
    owner: (config.owner || DEFAULT_GITHUB_CONFIG.owner).trim(),
    repo: (config.repo || DEFAULT_GITHUB_CONFIG.repo).trim(),
    branch: (config.branch || DEFAULT_GITHUB_CONFIG.branch).trim(),
  };

  try {
    // 1. Check user token validity
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (userRes.status === 401) {
      return {
        success: false,
        error: "Jeton d'accès GitHub invalide ou révoqué. Veuillez vérifier vos identifiants.",
      };
    }

    if (!userRes.ok) {
      return {
        success: false,
        error: `Erreur d'authentification GitHub (Code ${userRes.status}).`,
      };
    }

    const userData = await userRes.json();
    const user: GitHubUser = {
      login: userData.login,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
      email: userData.email || null,
      html_url: userData.html_url,
    };

    // 2. Test access to the specified repository
    const repoRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(targetConfig.owner)}/${encodeURIComponent(
        targetConfig.repo
      )}`,
      {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (repoRes.status === 404) {
      return {
        success: false,
        error: `Le dépôt "${targetConfig.owner}/${targetConfig.repo}" est introuvable ou votre compte n'a pas les droits d'accès.`,
      };
    }

    if (!repoRes.ok) {
      return {
        success: false,
        error: `Accès au dépôt refusé (Code ${repoRes.status}). Vérifiez les permissions de votre jeton.`,
      };
    }

    // Save successful auth
    const authState: GitHubAuthState = {
      isAuthenticated: true,
      token: cleanToken,
      user,
      config: targetConfig,
    };
    saveStoredGitHubAuth(authState);

    return { success: true, user };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur de connexion réseau avec GitHub";
    return { success: false, error: errorMsg };
  }
}

/**
 * Pushes CMS changes directly to GitHub:
 * 1. Updates `src/features/home/constants.ts` (triggers instant Vercel redeployment)
 * 2. Updates `public/cms-data.json` (persists complete dynamic data in Git for free)
 */
export async function pushCmsChangesToGitHub({
  cmsData,
  commitMessage,
  onProgress,
}: {
  cmsData: CmsData;
  commitMessage?: string;
  onProgress?: (status: string) => void;
}): Promise<{
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  error?: string;
}> {
  const auth = getStoredGitHubAuth();
  if (!auth.isAuthenticated || !auth.token) {
    return {
      success: false,
      error: "Vous devez être connecté avec votre compte GitHub pour synchroniser avec Vercel.",
    };
  }

  const { owner, repo, branch } = auth.config;
  const msg =
    commitMessage ||
    `feat(cms): mise à jour du contenu des examens LFJP (${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})`;

  try {
    onProgress?.("Génération des fichiers de configuration...");
    const tsCode = generateConstantsTsCode(cmsData);
    const jsonCode = exportCmsDataJson(cmsData);

    onProgress?.("Sauvegarde de la base de données dans public/cms-data.json...");
    await commitFileToGitHub({
      owner,
      repo,
      branch,
      path: "public/cms-data.json",
      content: jsonCode,
      message: `data(cms): sauvegarde des données JSON LFJP`,
      token: auth.token,
    });

    onProgress?.("Synchronisation des constantes src/features/home/constants.ts...");
    const constantsResult = await commitFileToGitHub({
      owner,
      repo,
      branch,
      path: "src/features/home/constants.ts",
      content: tsCode,
      message: msg,
      token: auth.token,
    });

    onProgress?.("Synchronisation du CMS Admin src/features/admin/pages/AdminPage.tsx...");
    await commitFileToGitHub({
      owner,
      repo,
      branch,
      path: "src/features/admin/pages/AdminPage.tsx",
      content: adminPageRaw,
      message: "feat(admin): ajout du panneau d'administration CMS LFJP",
      token: auth.token,
    });

    onProgress?.("Synchronisation des services CMS & GitHub...");
    await commitFileToGitHub({
      owner,
      repo,
      branch,
      path: "src/shared/services/cms-store.ts",
      content: cmsStoreRaw,
      message: "feat(cms): magasin de données CMS autonome",
      token: auth.token,
    });

    await commitFileToGitHub({
      owner,
      repo,
      branch,
      path: "src/shared/services/github-service.ts",
      content: githubServiceRaw,
      message: "feat(github): synchronisation automatique GitHub et Vercel",
      token: auth.token,
    });

    onProgress?.("Synchronisation de la navigation et des pages...");
    await commitFileToGitHub({
      owner,
      repo,
      branch,
      path: "src/app/App.tsx",
      content: appTsxRaw,
      message: "feat(router): configuration des routes d'administration",
      token: auth.token,
    });

    await commitFileToGitHub({
      owner,
      repo,
      branch,
      path: "src/features/home/pages/HomePage.tsx",
      content: homePageRaw,
      message: "feat(home): intégration du bouton administration et du CMS",
      token: auth.token,
    });

    await commitFileToGitHub({
      owner,
      repo,
      branch,
      path: "src/features/home/pages/SchoolYearPage.tsx",
      content: schoolYearPageRaw,
      message: "feat(years): affichage autonome sans dépendance payante",
      token: auth.token,
    });

    await commitFileToGitHub({
      owner,
      repo,
      branch,
      path: "src/features/home/pages/SchoolExamPage.tsx",
      content: schoolExamPageRaw,
      message: "feat(exams): affichage autonome des épreuves",
      token: auth.token,
    });

    await commitFileToGitHub({
      owner,
      repo,
      branch,
      path: "vercel.json",
      content: JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/index.html" }] }, null, 2),
      message: "chore(vercel): configuration des routes SPA",
      token: auth.token,
    });

    onProgress?.("Synchronisation réussie ! Vercel redéploie le site automatiquement.");

    return {
      success: true,
      commitSha: constantsResult.commitSha,
      commitUrl: constantsResult.commitUrl,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue lors du commit GitHub";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * React hook for GitHub Authentication and synchronization
 */
export function useGitHubAuth() {
  const [authState, setAuthState] = useState<GitHubAuthState>(getStoredGitHubAuth());

  useEffect(() => {
    setAuthState(getStoredGitHubAuth());
  }, []);

  const login = useCallback(async (token: string, config?: Partial<GitHubConfig>) => {
    const res = await verifyAndLoginGitHub(token, config);
    if (res.success) {
      setAuthState(getStoredGitHubAuth());
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    clearStoredGitHubAuth();
    setAuthState(getStoredGitHubAuth());
  }, []);

  const updateConfig = useCallback((newConfig: Partial<GitHubConfig>) => {
    const current = getStoredGitHubAuth();
    const updated: GitHubAuthState = {
      ...current,
      config: {
        ...current.config,
        ...newConfig,
      },
    };
    saveStoredGitHubAuth(updated);
    setAuthState(updated);
  }, []);

  return {
    ...authState,
    login,
    logout,
    updateConfig,
  };
}
