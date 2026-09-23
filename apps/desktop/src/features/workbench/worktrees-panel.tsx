import { useTranslation } from "react-i18next";
import type { WorkspaceRecord, WorktreeRecord } from "../../../contracts/desktop-state";
import { PlusIcon, WorktreeIcon } from "../../ui/icons";

interface WorktreesPanelProps {
  readonly rootWorkspace: WorkspaceRecord;
  readonly activeWorktrees: readonly WorktreeRecord[];
  readonly workspaces: readonly WorkspaceRecord[];
  readonly selectedWorkspace: WorkspaceRecord;
  readonly onOpenWorkspace: (workspaceId: string) => void;
  readonly onNewWorktree: () => void;
}

export function WorktreesPanel({
  rootWorkspace,
  activeWorktrees,
  workspaces,
  selectedWorkspace,
  onOpenWorkspace,
  onNewWorktree,
}: WorktreesPanelProps) {
  const { t } = useTranslation();
  const knownWorkspaces = new Set(workspaces.map((workspace) => workspace.id));
  const currentWorkspaceId = selectedWorkspace.id;
  return (
    <section
      aria-label={t("workbench.worktrees")}
      className="worktrees-panel"
      data-testid="worktrees-panel"
    >
      <header className="worktrees-panel__header">
        <div>
          <h2>{t("workbench.worktrees")}</h2>
          <p>{t("workbench.worktreeDescription")}</p>
        </div>
        <button className="button" onClick={onNewWorktree} type="button">
          <PlusIcon /> {t("workbench.newWorktree")}
        </button>
      </header>
      <div className="worktrees-panel__list">
        <button
          aria-current={currentWorkspaceId === rootWorkspace.id ? "true" : undefined}
          className="worktrees-panel__item"
          onClick={() => onOpenWorkspace(rootWorkspace.id)}
          type="button"
        >
          <WorktreeIcon />
          <span>
            <strong className="worktrees-panel__name">{rootWorkspace.name}</strong>
            <span className="worktrees-panel__meta">
              {rootWorkspace.branchName ?? t("workbench.projectCheckout")}
            </span>
            <span className="worktrees-panel__meta">{rootWorkspace.path}</span>
          </span>
          {currentWorkspaceId === rootWorkspace.id ? <span>{t("workbench.current")}</span> : null}
        </button>
        {activeWorktrees.map((worktree) => {
          const workspaceId = worktree.linkedWorkspaceId;
          const available =
            worktree.status === "ready" &&
            workspaceId !== undefined &&
            knownWorkspaces.has(workspaceId);
          return (
            <button
              aria-current={currentWorkspaceId === workspaceId ? "true" : undefined}
              className="worktrees-panel__item"
              disabled={!available}
              key={worktree.id}
              onClick={() => {
                if (workspaceId) onOpenWorkspace(workspaceId);
              }}
              type="button"
            >
              <WorktreeIcon />
              <span>
                <strong className="worktrees-panel__name">{worktree.name}</strong>
                <span className="worktrees-panel__meta">
                  {worktree.branchName ?? t("workbench.worktree")}
                </span>
                <span className="worktrees-panel__meta">{worktree.path}</span>
                {!available ? (
                  <span className="worktrees-panel__meta">
                    {t("workbench.checkoutUnavailable")}
                  </span>
                ) : null}
              </span>
              {currentWorkspaceId === workspaceId ? <span>{t("workbench.current")}</span> : null}
            </button>
          );
        })}
      </div>
      {activeWorktrees.length === 0 ? <p>{t("workbench.noAdditionalWorktrees")}</p> : null}
    </section>
  );
}
