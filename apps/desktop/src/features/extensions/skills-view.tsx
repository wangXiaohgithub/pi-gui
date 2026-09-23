import { useMemo, useState } from "react";
import type { RuntimeSkillRecord, RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import type { WorkspaceRecord } from "../../../contracts/desktop-state";
import { RefreshIcon } from "../../ui/icons";
import { titleCase } from "../../lib/string-utils";
import { useTranslation } from "react-i18next";

interface SkillsViewProps {
  readonly workspace?: WorkspaceRecord;
  readonly runtime?: RuntimeSnapshot;
  readonly onRefresh: () => void;
  readonly onOpenSkillFolder: (filePath: string) => void;
  readonly onToggleSkill: (filePath: string, enabled: boolean) => void;
  readonly onTrySkill: (skill: RuntimeSkillRecord) => void;
}

export function SkillsView({
  workspace,
  runtime,
  onRefresh,
  onOpenSkillFolder,
  onToggleSkill,
  onTrySkill,
}: SkillsViewProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedSkillPath, setSelectedSkillPath] = useState<string | undefined>();
  const skills = runtime?.skills ?? [];
  const filteredSkills = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return skills;
    }

    return skills.filter((skill) =>
      [skill.name, skill.description, skill.source, skill.slashCommand].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query, skills]);
  const selectedSkill =
    filteredSkills.find((skill) => skill.filePath === selectedSkillPath) ?? filteredSkills[0];

  if (!workspace) {
    return (
      <section className="canvas canvas--empty">
        <div className="empty-panel">
          <div className="session-header__eyebrow">{t("skills.title")}</div>
          <h1>{t("settings.selectWorkspace.title")}</h1>
          <p>
            Skills are discovered from the selected workspace plus your user-level skill
            directories.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="canvas">
      <div className="conversation skills-view">
        <header className="view-header">
          <div>
            <h1 className="view-header__title">{t("skills.title")}</h1>
            <p className="view-header__body">{t("skills.description")}</p>
          </div>
          <div className="view-header__actions">
            <button className="button button--secondary" type="button" onClick={onRefresh}>
              <RefreshIcon />
              <span>{t("common.refresh")}</span>
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() =>
                onTrySkill({
                  name: "new-skill",
                  description: t("skills.newDescription"),
                  filePath: "",
                  baseDir: workspace.path,
                  source: "project",
                  enabled: true,
                  disableModelInvocation: false,
                  slashCommand: "/skill:new-skill",
                })
              }
            >
              {t("skills.new")}
            </button>
          </div>
        </header>

        <div className="skills-toolbar">
          <input
            aria-label={t("skills.search")}
            className="skills-search"
            placeholder={t("skills.search")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </div>

        <div className="skills-layout">
          <div className="skills-grid" data-testid="skills-list">
            {filteredSkills.length === 0 ? (
              <SkillsEmptyState message={t("skills.emptyWorkspace")} />
            ) : (
              filteredSkills.map((skill) => (
                <button
                  className={`skill-card ${selectedSkill?.filePath === skill.filePath ? "skill-card--active" : ""}`}
                  key={skill.filePath}
                  type="button"
                  onClick={() => {
                    setSelectedSkillPath(skill.filePath);
                  }}
                >
                  <span className="skill-card__title-row">
                    <span className="skill-card__title">{titleCase(skill.name)}</span>
                    <span
                      className={`skill-card__badge ${skill.enabled ? "skill-card__badge--enabled" : ""}`}
                    >
                      {skill.enabled ? t("common.enabled") : t("common.disabled")}
                    </span>
                  </span>
                  <span className="skill-card__description">{skill.description}</span>
                  <span className="skill-card__meta">
                    <span>{skill.source}</span>
                    <span>{skill.slashCommand}</span>
                    {skill.disableModelInvocation ? <span>{t("skills.slashOnly")}</span> : null}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="skill-detail">
            {selectedSkill ? (
              <>
                <div className="skill-detail__header">
                  <div>
                    <h2>{titleCase(selectedSkill.name)}</h2>
                    <div className="skill-detail__slash">{selectedSkill.slashCommand}</div>
                  </div>
                  <span
                    className={`skill-detail__status ${selectedSkill.enabled ? "skill-detail__status--enabled" : ""}`}
                  >
                    {selectedSkill.enabled ? t("common.enabled") : t("common.disabled")}
                  </span>
                </div>
                <p className="skill-detail__description">{selectedSkill.description}</p>
                <div className="skill-detail__meta-list">
                  <div>
                    <div className="skill-detail__meta-label">{t("skills.source")}</div>
                    <div className="skill-detail__description">{selectedSkill.source}</div>
                  </div>
                  <div>
                    <div className="skill-detail__meta-label">{t("skills.path")}</div>
                    <div className="skill-detail__path">{selectedSkill.filePath}</div>
                  </div>
                </div>
                <div className="skill-detail__actions">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => onOpenSkillFolder(selectedSkill.filePath)}
                  >
                    {t("sidebar.openFolder")}
                  </button>
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => onToggleSkill(selectedSkill.filePath, !selectedSkill.enabled)}
                  >
                    {selectedSkill.enabled ? t("common.disable") : t("common.enable")}
                  </button>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => onTrySkill(selectedSkill)}
                  >
                    {t("skills.try")}
                  </button>
                </div>
              </>
            ) : (
              <SkillsEmptyState message={t("skills.emptyDetails")} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SkillsEmptyState({ message }: { readonly message: string }) {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <h2>{t("skills.empty")}</h2>
      <p>{message}</p>
    </div>
  );
}
