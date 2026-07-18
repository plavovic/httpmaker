"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import type { ColorMode } from "@/types/website";
import { EDITOR_THEME_STORAGE_KEY, isLightStudioTheme, readStoredEditorTheme, STUDIO_THEMES } from "@/utils/editorStorage";

import styles from "./dashboard.module.css";
import themeStyles from "./themes.module.css";
import actionStyles from "./dashboardActions.module.css";

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

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function DashboardClient({ user, initialProjects }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    setColorMode(readStoredEditorTheme());
    setThemeReady(true);
  }, []);

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

  const openRepositoryDialog = (project: DashboardProject) => {
    setRepositoryProject(project);
    setRepositoryUrl(project.repositoryUrl ?? "");
    setError("");
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
      setProjects((current) => current.map((project) => project.id === repositoryProject.id ? { ...project, repositoryUrl: body.project.repositoryUrl } : project));
      setRepositoryProject(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to link repository.");
    } finally {
      setBusyProjectId(null);
    }
  };

  if (!themeReady) return <main className={`${styles.shell} ${styles.loading}`} />;

  return (
    <main data-theme={isLightStudioTheme(colorMode) ? "light" : "dark"} data-color-theme={colorMode} className={`ide-shell studio-shell ${styles.shell} ${themeStyles.themed}`}>
      <header className={styles.toolbar}>
        <div className={styles.brand}>
          <span className={styles.mark}>H</span>
          <div><strong>HTTPMAKER</strong><small>Project workspace</small></div>
        </div>
        <div className={styles.toolbarActions}>
          <label className={themeStyles.themePicker}><span className="sr-only">Studio theme</span><select value={colorMode} onChange={(event) => changeTheme(event.target.value as ColorMode)}>{STUDIO_THEMES.map((theme) => <option style={{ backgroundColor: theme.appearance === "dark" ? "#18202b" : "#ffffff", color: theme.appearance === "dark" ? "#f4f7fb" : "#211d29" }} key={theme.value} value={theme.value}>{theme.label}</option>)}</select></label>
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
        <div className={styles.heading}>
          <div><span>WORKSPACE</span><h1>Your projects</h1><p>Continue building or start a fresh website.</p></div>
          <button type="button" className={`${styles.createButton} ${themeStyles.accentButton}`} onClick={() => setModalOpen(true)}>+ Create new project</button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.projectList}>
          <div className={`${styles.listHeader} ${actionStyles.row}`}><span>Project</span><span>Created</span><span>Last updated</span><span>Actions</span></div>
          {projects.length === 0 ? (
            <div className={styles.empty}><strong>No projects yet</strong><p>Create your first project to open the editor.</p></div>
          ) : projects.map((project) => (
            <div key={project.id} className={`${styles.projectRow} ${actionStyles.row}`} onClick={() => router.push(`/editor?projectId=${encodeURIComponent(project.id)}`)} role="link" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") router.push(`/editor?projectId=${encodeURIComponent(project.id)}`); }}>
              <span className={styles.projectName}><i>{project.name.slice(0, 1).toUpperCase()}</i><strong>{project.name}</strong></span>
              <time dateTime={project.createdAt}>{dateFormatter.format(new Date(project.createdAt))}</time>
              <time dateTime={project.updatedAt}>{dateFormatter.format(new Date(project.updatedAt))}</time>
              <span className={actionStyles.actions} onClick={(event) => event.stopPropagation()}>
                {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noreferrer" title="Open repository">Repo</a>}
                <button type="button" onClick={() => openRepositoryDialog(project)}>{project.repositoryUrl ? "Edit link" : "Link repository"}</button>
                <button type="button" className={actionStyles.deleteButton} disabled={busyProjectId === project.id} onClick={() => deleteDashboardProject(project)}>Delete</button>
                <span className={styles.openArrow}>→</span>
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
          <div><span>REPOSITORY</span><h2>Link repository</h2><p>Attach an HTTPS repository URL to {repositoryProject.name}.</p></div>
          <label>Repository URL<input autoFocus type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/repository" /></label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}><button type="button" onClick={() => setRepositoryProject(null)}>Cancel</button>{repositoryProject.repositoryUrl && <button type="button" onClick={() => setRepositoryUrl("")}>Remove link</button>}<button className={themeStyles.accentButton} type="submit" disabled={busyProjectId === repositoryProject.id}>{busyProjectId === repositoryProject.id ? "Saving…" : "Save link"}</button></div>
        </form>
      </div>}
    </main>
  );
}
