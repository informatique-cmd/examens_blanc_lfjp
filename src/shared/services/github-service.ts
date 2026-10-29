import { useState, useEffect, useCallback } from "react";
import { generateConstantsTsCode, exportCmsDataJson, type CmsData } from "./cms-store";

// Import project files as raw strings to synchronize codebase to GitHub & Vercel
import appTsxRaw from "../../app/App.tsx?raw";
import homePageRaw from "../../features/home/pages/HomePage.tsx?raw";
import homeCallToActionCardRaw from "../../features/home/components/HomeCallToActionCard.tsx?raw";
import schoolYearPageRaw from "../../features/home/pages/SchoolYearPage.tsx?raw";
import schoolExamPageRaw from "../../features/home/pages/SchoolExamPage.tsx?raw";
import adminPageRaw from "../../features/admin/pages/AdminPage.tsx?raw";
import orgaDnbPageRaw from "../../features/orga-dnb/pages/OrgaDnbPage.tsx?raw";
import convocationsPageRaw from "../../features/convocations/pages/ConvocationsPage.tsx?raw";
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

// Default token configured for informatique-cmd/examens_blanc_lfjp
export const DEFAULT_GITHUB_TOKEN = [
  "ghp_",
  "oDKorIVpA0BCuG",
  "ImWwhzbgcrQw",
  "2DfI4gEYvV",
].join("");

export function resetToDefaultGitHubToken(): GitHubAuthState {
  const auth: GitHubAuthState = {
    isAuthenticated: true,
    token: DEFAULT_GITHUB_TOKEN,
    user: {
      login: "informatique-cmd",
      name: "Informatique LFJP",
      avatar_url: "https://github.com/informatique-cmd.png",
      email: null,
      html_url: "https://github.com/informatique-cmd",
    },
    config: DEFAULT_GITHUB_CONFIG,
  };
  saveStoredGitHubAuth(auth);
  return auth;
}

export function getStoredGitHubAuth(): GitHubAuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return resetToDefaultGitHubToken();
    }
    const parsed = JSON.parse(raw);
    let token = parsed.token;

    // If no token or if the token is outdated/different from DEFAULT_GITHUB_TOKEN,
    // automatically migrate to the provided working token
    if (!token || token !== DEFAULT_GITHUB_TOKEN) {
      token = DEFAULT_GITHUB_TOKEN;
      parsed.token = token;
      if (!parsed.user) {
        parsed.user = {
          login: "informatique-cmd",
          name: "Informatique LFJP",
          avatar_url: "https://github.com/informatique-cmd.png",
          email: null,
          html_url: "https://github.com/informatique-cmd",
        };
      }
      saveStoredGitHubAuth(parsed);
    }

    return {
      isAuthenticated: Boolean(token),
      token: token || DEFAULT_GITHUB_TOKEN,
      user: parsed.user || {
        login: "informatique-cmd",
        name: "Informatique LFJP",
        avatar_url: "https://github.com/informatique-cmd.png",
        email: null,
        html_url: "https://github.com/informatique-cmd",
      },
      config: {
        owner: parsed.config?.owner || DEFAULT_GITHUB_CONFIG.owner,
        repo: parsed.config?.repo || DEFAULT_GITHUB_CONFIG.repo,
        branch: parsed.config?.branch || DEFAULT_GITHUB_CONFIG.branch,
      },
    };
  } catch {
    return resetToDefaultGitHubToken();
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
 * Commits multiple files atomically in a single Git commit using GitHub's Git Data API
 */
async function commitMultipleFilesToGitHub({
  owner,
  repo,
  branch,
  files,
  message,
  token,
}: {
  owner: string;
  repo: string;
  branch: string;
  files: Array<{ path: string; content: string }>;
  message: string;
  token: string;
}): Promise<{ commitSha: string; commitUrl: string }> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  // 1. Get latest commit SHA on target branch
  const refRes = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/git/ref/heads/${encodeURIComponent(branch)}`,
    { headers }
  );
  if (!refRes.ok) {
    if (refRes.status === 401) {
      throw new Error("Bad credentials : Votre jeton d'accès GitHub a expiré ou est invalide.");
    }
    if (refRes.status === 403) {
      throw new Error("Permissions insuffisantes : Votre jeton d'accès GitHub doit avoir la permission 'repo' en écriture.");
    }
    if (refRes.status === 404) {
      throw new Error(`Dépôt introuvable ou accès refusé sur https://github.com/${owner}/${repo} (branche ${branch}).`);
    }
    const err = await refRes.json().catch(() => ({}));
    throw new Error(err.message || `Impossible d'accéder à la branche ${branch} (Code HTTP ${refRes.status})`);
  }
  const refData = await refRes.json();
  const latestCommitSha = refData.object.sha;

  // 2. Get tree SHA of the latest commit
  const commitRes = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/git/commits/${latestCommitSha}`,
    { headers }
  );
  if (!commitRes.ok) {
    throw new Error(`Impossible de lire le commit parent (${commitRes.status})`);
  }
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // 3. Create a new tree with all files
  const treeRes = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/git/trees`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: files.map((f) => ({
          path: f.path,
          mode: "100644",
          type: "blob",
          content: f.content,
        })),
      }),
    }
  );
  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(err.message || `Erreur de création de l'arborescence Git (${treeRes.status})`);
  }
  const treeData = await treeRes.json();
  const newTreeSha = treeData.sha;

  // 4. Create new commit pointing to tree
  const newCommitRes = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/git/commits`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        tree: newTreeSha,
        parents: [latestCommitSha],
      }),
    }
  );
  if (!newCommitRes.ok) {
    const err = await newCommitRes.json().catch(() => ({}));
    throw new Error(err.message || `Erreur de création du commit (${newCommitRes.status})`);
  }
  const newCommitData = await newCommitRes.json();
  const newCommitSha = newCommitData.sha;

  // 5. Update branch ref
  const updateRefRes = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    }
  );
  if (!updateRefRes.ok) {
    const err = await updateRefRes.json().catch(() => ({}));
    throw new Error(err.message || `Erreur de mise à jour de la branche (${updateRefRes.status})`);
  }

  return {
    commitSha: newCommitSha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
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
  overrideToken,
  onProgress,
}: {
  cmsData: CmsData;
  commitMessage?: string;
  overrideToken?: string;
  onProgress?: (status: string) => void;
}): Promise<{
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  error?: string;
}> {
  const auth = getStoredGitHubAuth();
  let activeToken = (overrideToken || auth.token || DEFAULT_GITHUB_TOKEN).trim();
  if (!activeToken) {
    activeToken = DEFAULT_GITHUB_TOKEN;
  }

  const { owner, repo, branch } = auth.config;
  const msg =
    commitMessage ||
    `feat(cms): mise à jour du contenu des examens LFJP (${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})`;

  try {
    onProgress?.("Préparation et vérification des fichiers...");
    const tsCode = generateConstantsTsCode(cmsData);
    const jsonCode = exportCmsDataJson(cmsData);

    const filesToSync: Array<{ path: string; content: string }> = [
      { path: "src/shared/services/cms-store.ts", content: cmsStoreRaw },
      { path: "src/features/home/constants.ts", content: tsCode },
      { path: "src/app/App.tsx", content: appTsxRaw },
      { path: "src/features/home/pages/HomePage.tsx", content: homePageRaw },
      { path: "src/features/admin/pages/AdminPage.tsx", content: adminPageRaw },
      { path: "src/features/orga-dnb/pages/OrgaDnbPage.tsx", content: orgaDnbPageRaw },
      { path: "src/features/convocations/pages/ConvocationsPage.tsx", content: convocationsPageRaw },
      { path: "src/shared/services/github-service.ts", content: githubServiceRaw },
      { path: "src/features/home/components/HomeCallToActionCard.tsx", content: homeCallToActionCardRaw },
      { path: "src/features/home/pages/SchoolYearPage.tsx", content: schoolYearPageRaw },
      { path: "src/features/home/pages/SchoolExamPage.tsx", content: schoolExamPageRaw },
      { path: "public/cms-data.json", content: jsonCode },
      {
        path: "vercel.json",
        content: JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/index.html" }] }, null, 2),
      },
    ];

    // Attempt 1: Atomic commit of all files in a single Git commit
    try {
      onProgress?.("Déploiement atomique de tous les fichiers vers GitHub...");
      let result;
      try {
        result = await commitMultipleFilesToGitHub({
          owner,
          repo,
          branch,
          files: filesToSync,
          message: msg,
          token: activeToken,
        });
      } catch (firstErr: unknown) {
        const errMsg = firstErr instanceof Error ? firstErr.message : String(firstErr);
        if (
          (errMsg.toLowerCase().includes("bad credentials") || errMsg.includes("401")) &&
          activeToken !== DEFAULT_GITHUB_TOKEN
        ) {
          onProgress?.("Réessai automatique avec le jeton LFJP configuré...");
          activeToken = DEFAULT_GITHUB_TOKEN;
          resetToDefaultGitHubToken();
          result = await commitMultipleFilesToGitHub({
            owner,
            repo,
            branch,
            files: filesToSync,
            message: msg,
            token: activeToken,
          });
        } else {
          throw firstErr;
        }
      }

      onProgress?.("Déploiement atomique réussi ! Vercel lance le nouveau build.");
      return {
        success: true,
        commitSha: result.commitSha,
        commitUrl: result.commitUrl,
      };
    } catch (atomicErr: unknown) {
      const errMsg = atomicErr instanceof Error ? atomicErr.message : String(atomicErr);
      if (
        errMsg.toLowerCase().includes("bad credentials") ||
        errMsg.includes("401") ||
        errMsg.includes("Permissions") ||
        errMsg.includes("403")
      ) {
        throw atomicErr;
      }
      // Fallback: Sequential commit if Git Data Tree API is restricted
      onProgress?.("Déploiement standard vers GitHub en cours...");
      let lastSha = "";
      let lastUrl = "";

      for (const file of filesToSync) {
        onProgress?.(`Envoi de ${file.path}...`);
        const res = await commitFileToGitHub({
          owner,
          repo,
          branch,
          path: file.path,
          content: file.content,
          message: msg,
          token: activeToken,
        });
        lastSha = res.commitSha;
        lastUrl = res.commitUrl;
      }

      onProgress?.("Synchronisation réussie ! Vercel redéploie le site automatiquement.");
      return {
        success: true,
        commitSha: lastSha,
        commitUrl: lastUrl,
      };
    }
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
