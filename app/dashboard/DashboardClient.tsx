"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent } from "react";

import type { ColorMode } from "@/types/website";
import { EDITOR_THEME_STORAGE_KEY, isLightStudioTheme, readStoredEditorTheme } from "@/utils/editorStorage";
import StudioThemePicker from "@/components/editor/StudioThemePicker";

import styles from "./dashboard.module.css";
import themeStyles from "./themes.module.css";
import actionStyles from "./dashboardActions.module.css";
import repositoryStyles from "./repositoryControls.module.css";
import commitStyles from "./commitDetails.module.css";

type DashboardProject = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  repositoryUrl: string | null;
};

type Props = {
  user: { name: string; email: string; image: string | null };
  initialProjects: DashboardProject[];
};

type InstallationRepository = {
  id: number;
  full_name: string;
  html_url: string;
  private: boolean;
};

type LatestCommit = {
  sha: string;
  message: string;
  url: string;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function DashboardClient({ user, initialProjects }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const [colorMode, setColorMode] = useState<ColorMode>("sky");
  const [themeReady, setThemeReady] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState(user.image);
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState(initialProjects);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [repositoryProject, setRepositoryProject] = useState<DashboardProject | null>(null);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repositories, setRepositories] = useState<InstallationRepository[]>([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [toast, setToast] = useState("");
  const [latestCommits, setLatestCommits] = useState<Record<string, LatestCommit | null>>({});
  const workspaceOwner = user.name.trim() || "Your";
  const workspaceTitle = workspaceOwner === "Your" ? "Your workspace" : `${workspaceOwner}${workspaceOwner.toLowerCase().endsWith("s") ? "’" : "’s"} workspace`;

  useEffect(() => {
    setColorMode(readStoredEditorTheme());
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    const linkedProjects = projects.filter((project) => project.repositoryUrl);

    void Promise.all(linkedProjects.map(async (project) => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/github/test-commit`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error();
        setLatestCommits((current) => ({ ...current, [project.id]: body.commit }));
      } catch {
        if (!controller.signal.aborted) setLatestCommits((current) => ({ ...current, [project.id]: null }));
      }
    }));

    return () => controller.abort();
  }, [projects]);

  const changeTheme = (next: ColorMode) => {
    setColorMode(next);
    try {
      localStorage.setItem(EDITOR_THEME_STORAGE_KEY, next);
    } catch {
      // Theme switching still works when storage is unavailable.
    }
  };

  const createProject = async (event: FormEvent) => {
    event.preventDefault();
    if (!projectName.trim() || creating) return;
    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to create project.");
      router.push(`/editor?projectId=${encodeURIComponent(body.project.id)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create project.");
      setCreating(false);
    }
  };

  const uploadProfileImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setError("Choose an image smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      setUploading(true);
      setError("");
      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Unable to update profile picture.");
        setProfileImage(body.image);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to update profile picture.");
      } finally {
        setUploading(false);
        event.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteDashboardProject = async (project: DashboardProject) => {
    if (busyProjectId || !window.confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
    setBusyProjectId(project.id);
    setError("");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Unable to delete project.");
      }
      setProjects((current) => current.filter(({ id }) => id !== project.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete project.");
    } finally {
      setBusyProjectId(null);
    }
  };

  const openRepositoryDialog = async (project: DashboardProject) => {
    setRepositoryProject(project);
    setRepositoryUrl(project.repositoryUrl ?? "");
    setError("");
    setNotice("");
    setRepositoriesLoading(true);
    try {
      const response = await fetch("/api/github/test-repositories");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to load repositories.");
      setRepositories(body.repositories);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load repositories.");
    } finally {
      setRepositoriesLoading(false);
    }
  };

  const saveRepository = async (event: FormEvent) => {
    event.preventDefault();
    if (!repositoryProject || busyProjectId) return;
    setBusyProjectId(repositoryProject.id);
    setError("");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(repositoryProject.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl: repositoryUrl.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to link repository.");
      setLatestCommits((current) => {
        const next = { ...current };
        delete next[repositoryProject.id];
        return next;
      });
      setProjects((current) => current.map((project) => project.id === repositoryProject.id ? { ...project, repositoryUrl: body.project.repositoryUrl } : project));
      setRepositoryProject(null);
      setNotice("Repository linked successfully.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to link repository.");
    } finally {
      setBusyProjectId(null);
    }
  };

  const createTestCommit = async (project: DashboardProject) => {
    if (busyProjectId || !project.repositoryUrl) return;
    if (!window.confirm(`Commit httpmaker-website.zip to ${project.repositoryUrl}?`)) return;
    setBusyProjectId(project.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/github/test-commit`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to create test commit.");
      setToast("Project ZIP committed successfully");
      setLatestCommits((current) => ({ ...current, [project.id]: body.commit }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create test commit.");
    } finally {
      setBusyProjectId(null);
    }
  };

  const copyCommitSha = async (commit: LatestCommit) => {
    try {
      await navigator.clipboard.writeText(commit.sha);
      setError("");
      setToast("Commit SHA copied");
    } catch {
      setNotice("");
      setError("Unable to copy the commit SHA.");
    }
  };

  const moveCursorGlow = (event: PointerEvent<HTMLElement>) => {
    const glow = cursorGlowRef.current;
    if (!glow || event.pointerType === "touch") return;
    glow.style.opacity = "1";
    glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
  };

  if (!themeReady) return <main className={`${styles.shell} ${styles.loading}`} />;

  return (
    <main data-theme={isLightStudioTheme(colorMode) ? "light" : "dark"} data-color-theme={colorMode} className={`ide-shell studio-shell ${styles.shell} ${themeStyles.themed} ${actionStyles.sharp}`} onPointerMove={moveCursorGlow} onPointerLeave={() => { if (cursorGlowRef.current) cursorGlowRef.current.style.opacity = "0"; }}>
      {toast && <div className={commitStyles.toast} role="status" aria-live="polite"><span aria-hidden="true">✓</span>{toast}</div>}
      <div ref={cursorGlowRef} className={actionStyles.cursorGlow} aria-hidden="true" />
      <header className={styles.toolbar}>
        <div className={styles.brand}>
          <span className={actionStyles.logo} aria-label="HTTPMAKER"><span aria-hidden="true">{'{'}</span>HTTPMAKER</span>
        </div>
        <div className={styles.toolbarActions}>
          <StudioThemePicker value={colorMode} onChange={changeTheme} />
          <button type="button" className={`${styles.createButton} ${themeStyles.accentButton}`} onClick={() => setModalOpen(true)}>Create new project</button>
          <div className={styles.profileWrap}>
            <button type="button" className={styles.avatarButton} onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
              {profileImage ? <img src={profileImage} alt="" /> : <span>{user.name.slice(0, 1).toUpperCase()}</span>}
            </button>
            {profileOpen && <div className={styles.profileMenu}>
              <div className={styles.profileSummary}><strong>{user.name}</strong><span>{user.email}</span></div>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : "Change profile picture"}</button>
              <button type="button" disabled>Account settings <small>Coming soon</small></button>
              <button type="button" disabled>Preferences <small>Coming soon</small></button>
              <button type="button" onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</button>
            </div>}
          </div>
          <input ref={fileInputRef} className={styles.fileInput} type="file" accept="image/*" onChange={uploadProfileImage} />
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={`${styles.heading} ${actionStyles.heroHeading}`}>
          <div><h1>{workspaceTitle}</h1><p>Continue or start the journey.</p></div>
          <button type="button" className={`${styles.createButton} ${themeStyles.accentButton}`} onClick={() => setModalOpen(true)}>+ Create new project</button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}
        <div className={styles.projectList}>
          <div className={`${styles.listHeader} ${actionStyles.row}`}><span>Project</span><span>Created</span><span>Last updated</span><span>Actions</span></div>
          {projects.length === 0 ? (
            <div className={styles.empty}><strong>No projects yet</strong><p>Create your first project to open the editor.</p></div>
          ) : projects.map((project) => (
            <div key={project.id} className={`${styles.projectRow} ${actionStyles.row}`}>
              <div className={styles.projectName}>
                <i>{project.name.slice(0, 1).toUpperCase()}</i>
                <div className={commitStyles.projectDetails}>
                  <strong>{project.name}</strong>
                  {project.repositoryUrl && <div className={commitStyles.commitBox}>
                    {latestCommits[project.id] === undefined ? <span className={commitStyles.commitMuted}>Loading latest commit...</span> : latestCommits[project.id] === null ? <span className={commitStyles.commitMuted}>Latest commit unavailable</span> : <>
                      <div className={commitStyles.commitText}>
                        <code title={latestCommits[project.id]!.sha}>{latestCommits[project.id]!.sha.slice(0, 7)}</code>
                        <span title={latestCommits[project.id]!.message}>{latestCommits[project.id]!.message}</span>
                      </div>
                      <div className={commitStyles.commitActions} onClick={(event) => event.stopPropagation()}>
                        <button type="button" onClick={() => copyCommitSha(latestCommits[project.id]!)}>Copy SHA</button>
                        <a href={latestCommits[project.id]!.url} target="_blank" rel="noreferrer">View on GitHub</a>
                      </div>
                    </>}
                  </div>}
                </div>
              </div>
              <time dateTime={project.createdAt}>{dateFormatter.format(new Date(project.createdAt))}</time>
              <time dateTime={project.updatedAt}>{dateFormatter.format(new Date(project.updatedAt))}</time>
              <span className={actionStyles.actions} onClick={(event) => event.stopPropagation()}>
                <details className={actionStyles.optionsMenu}>
                  <summary>Options<span aria-hidden="true">⌄</span></summary>
                  <div>
                    <button type="button" disabled={!project.repositoryUrl || busyProjectId === project.id} title={project.repositoryUrl ? "Commit the project ZIP" : "Link a repository first"} onClick={() => createTestCommit(project)}>{busyProjectId === project.id ? "Committing..." : "Commit ZIP"}</button>
                    <button type="button" onClick={() => openRepositoryDialog(project)}>{project.repositoryUrl ? "Edit repository link" : "Link repository"}</button>
                    <button type="button" className={actionStyles.deleteButton} disabled={busyProjectId === project.id} onClick={() => deleteDashboardProject(project)}>Delete</button>
                  </div>
                </details>
                <button type="button" className={actionStyles.loadButton} onClick={() => router.push(`/editor?projectId=${encodeURIComponent(project.id)}`)}>Load</button>
              </span>
            </div>
          ))}
        </div>
      </section>

      {modalOpen && <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <form className={styles.modal} onSubmit={createProject}>
          <div><span>NEW PROJECT</span><h2>Create a website</h2><p>Name your project. You can change this later.</p></div>
          <label>Project name<input autoFocus maxLength={100} value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="My new website" required /></label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}><button type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className={themeStyles.accentButton} type="submit" disabled={creating}>{creating ? "Creating…" : "Create project"}</button></div>
        </form>
      </div>}
      {repositoryProject && <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setRepositoryProject(null); }}>
        <form className={styles.modal} onSubmit={saveRepository}>
          <div><span>REPOSITORY</span><h2>Link repository</h2><p>Choose a repository available to the GitHub App for {repositoryProject.name}.</p></div>
          <label className={repositoryStyles.field}>Repository
            <span className={repositoryStyles.selectWrap}>
              <select className={repositoryStyles.select} autoFocus value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} disabled={repositoriesLoading}>
                <option value="">{repositoriesLoading ? "Loading repositories..." : "No repository selected"}</option>
                {repositories.map((repository) => <option key={repository.id} value={repository.html_url}>{repository.full_name}{repository.private ? " (private)" : ""}</option>)}
              </select>
              <span className={repositoryStyles.chevron} aria-hidden="true" />
            </span>
            <span className={repositoryStyles.hint}>Only repositories available to your GitHub App installation are shown.</span>
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}><button type="button" onClick={() => setRepositoryProject(null)}>Cancel</button>{repositoryProject.repositoryUrl && <button type="button" onClick={() => setRepositoryUrl("")}>Remove link</button>}<button className={themeStyles.accentButton} type="submit" disabled={busyProjectId === repositoryProject.id}>{busyProjectId === repositoryProject.id ? "Saving…" : "Save link"}</button></div>
        </form>
      </div>}
    </main>
  );
}
