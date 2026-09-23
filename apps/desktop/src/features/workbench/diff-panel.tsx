import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  DiffPanelFileRequest,
  DiffPanelSelection,
  FileWorkbenchContext,
} from "./diff-panel-types";
import type { PiDesktopApi } from "../../../contracts/ipc";
import type {
  AvailableReview,
  ReviewCoverage,
  ReviewFileEntry,
  ReviewFileResult,
  ReviewIssue,
  ReviewResult,
  ReviewScope,
} from "../../../contracts/review";
import { InlineDiff } from "../../ui/diff-inline";
import { RefreshIcon } from "../../ui/icons";
import { extensionToLanguage } from "../../ui/syntax-highlight";

interface DiffPanelProps {
  readonly workspaceId: string;
  readonly sessionId: string;
  readonly api: PiDesktopApi;
  readonly sessionStatus: string | undefined;
  readonly fileRequest?: DiffPanelFileRequest | null;
  readonly contexts: readonly FileWorkbenchContext[];
  readonly selection: DiffPanelSelection;
  readonly onSelectionChange: (selection: DiffPanelSelection) => void;
  readonly onOpenFile: (file: {
    readonly workspaceId: string;
    readonly path: string;
  }) => void | Promise<void>;
}

export function DiffPanel({
  workspaceId,
  sessionId,
  api,
  sessionStatus,
  fileRequest,
  contexts,
  selection,
  onSelectionChange,
  onOpenFile,
}: DiffPanelProps) {
  const { t } = useTranslation();
  const scopeKey = JSON.stringify(selection.scope);
  const requestedScope = useMemo(() => selection.scope, [scopeKey]);
  const queryKey = JSON.stringify([workspaceId, sessionId, selection.workspaceId, scopeKey]);
  const activeQueryKey = useRef(queryKey);
  activeQueryKey.current = queryKey;
  const [loaded, setLoaded] = useState<{
    readonly queryKey: string;
    readonly result: ReviewResult;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileResult, setFileResult] = useState<ReviewFileResult | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [actionIssue, setActionIssue] = useState<ReviewIssue | null>(null);
  const [busyFiles, setBusyFiles] = useState<ReadonlySet<string>>(new Set());
  const [baseDraft, setBaseDraft] = useState(
    selection.scope.kind === "branch" ? (selection.scope.baseRef ?? "") : "",
  );
  const requestNonce = useRef(0);
  const fileNonce = useRef(0);
  const fileListRef = useRef<HTMLDivElement | null>(null);
  const selectedCheckout = contexts.find(
    (context) => context.workspace.id === selection.workspaceId,
  );
  const checkoutAvailable = selectedCheckout !== undefined;
  const result = loaded?.queryKey === queryKey ? loaded.result : null;
  const review = result?.state === "available" ? result : null;
  const reviewRef = useRef(review);
  reviewRef.current = review;
  const selectedFile = review?.files.find((file) => file.path === selection.selectedPath);
  const stale = actionIssue?.state === "stale" || fileResult?.state === "stale";

  useEffect(() => {
    setBaseDraft(requestedScope.kind === "branch" ? (requestedScope.baseRef ?? "") : "");
  }, [requestedScope]);

  const refresh = useCallback(() => {
    const nonce = ++requestNonce.current;
    fileNonce.current += 1;
    setLoading(true);
    setFileResult(null);
    setFileLoading(false);
    setActionIssue(null);
    setBusyFiles(new Set());
    if (!checkoutAvailable) {
      setLoaded({
        queryKey,
        result: {
          state: "unavailable",
          code: "checkout-unavailable",
          message: t("review.checkoutUnavailableMessage"),
        },
      });
      setLoading(false);
      return;
    }
    void api
      .getReview({
        target: { workspaceId, sessionId },
        checkoutId: selection.workspaceId,
        scope: requestedScope,
      })
      .then(
        (next) => {
          if (requestNonce.current !== nonce || activeQueryKey.current !== queryKey) return;
          setLoaded({ queryKey, result: next });
          setLoading(false);
        },
        (error: unknown) => {
          if (requestNonce.current !== nonce || activeQueryKey.current !== queryKey) return;
          setLoaded({
            queryKey,
            result: { state: "failed", code: "review-read-failed", message: errorMessage(error) },
          });
          setLoading(false);
        },
      );
  }, [
    api,
    checkoutAvailable,
    queryKey,
    requestedScope,
    selection.workspaceId,
    sessionId,
    workspaceId,
    t,
  ]);

  useEffect(() => {
    refresh();
    return () => {
      requestNonce.current += 1;
      fileNonce.current += 1;
    };
  }, [refresh]);

  const previousRunStatus = useRef(sessionStatus);
  useEffect(() => {
    const previous = previousRunStatus.current;
    previousRunStatus.current = sessionStatus;
    if (
      previous === "running" &&
      sessionStatus !== "running" &&
      (requestedScope.kind === "uncommitted" ||
        (requestedScope.kind === "turn" && !requestedScope.checkpointId))
    )
      refresh();
  }, [refresh, requestedScope, sessionStatus]);

  useEffect(() => {
    const nonce = ++fileNonce.current;
    setFileResult(null);
    setFileLoading(false);
    if (!review || !selectedFile || loading) return;
    setFileLoading(true);
    void api.getReviewFile({ reviewId: review.reviewId, fileId: selectedFile.id }).then(
      (next) => {
        if (fileNonce.current !== nonce || activeQueryKey.current !== queryKey) return;
        setFileResult(next);
        if (next.state === "stale") setActionIssue(next);
        setFileLoading(false);
      },
      (error: unknown) => {
        if (fileNonce.current !== nonce || activeQueryKey.current !== queryKey) return;
        setFileResult({
          state: "failed",
          code: "review-file-read-failed",
          message: errorMessage(error),
        });
        setFileLoading(false);
      },
    );
    return () => {
      fileNonce.current += 1;
    };
  }, [api, loading, queryKey, review?.reviewId, selectedFile?.id, fileRequest?.nonce]);

  useEffect(() => {
    if (!selection.selectedPath) return;
    fileListRef.current
      ?.querySelector<HTMLElement>(`[data-file-path="${CSS.escape(selection.selectedPath)}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [review?.reviewId, selection.selectedPath]);

  const setBusy = (fileId: string, busy: boolean) => {
    setBusyFiles((previous) => {
      const next = new Set(previous);
      if (busy) next.add(fileId);
      else next.delete(fileId);
      return next;
    });
  };
  const stillShowing = (comparison: AvailableReview, nonce: number) =>
    requestNonce.current === nonce &&
    activeQueryKey.current === queryKey &&
    reviewRef.current?.reviewId === comparison.reviewId;

  const markReviewed = (comparison: AvailableReview, file: ReviewFileEntry) => {
    const nonce = requestNonce.current;
    setBusy(file.id, true);
    void api
      .setReviewFileReviewed({
        reviewId: comparison.reviewId,
        fileId: file.id,
        reviewed: !file.reviewed,
      })
      .then(
        (next) => {
          if (!stillShowing(comparison, nonce)) return;
          if (next.state !== "available") {
            setActionIssue(next);
            return;
          }
          setLoaded((current) =>
            current?.result.state === "available" && current.result.reviewId === next.reviewId
              ? {
                  ...current,
                  result: {
                    ...current.result,
                    files: current.result.files.map((entry) =>
                      entry.id === next.fileId ? { ...entry, reviewed: next.reviewed } : entry,
                    ),
                  },
                }
              : current,
          );
        },
        (error: unknown) => {
          if (stillShowing(comparison, nonce))
            setActionIssue({
              state: "failed",
              code: "review-mark-failed",
              message: errorMessage(error),
            });
        },
      )
      .finally(() => {
        if (stillShowing(comparison, nonce)) setBusy(file.id, false);
      });
  };

  const stageFile = (
    comparison: AvailableReview,
    file: ReviewFileEntry,
    action: "stage" | "unstage",
  ) => {
    const nonce = requestNonce.current;
    setBusy(file.id, true);
    void api
      .changeReviewFileStage({ reviewId: comparison.reviewId, fileId: file.id, action })
      .then(
        (next) => {
          if (!stillShowing(comparison, nonce)) return;
          if (next.state === "applied") refresh();
          else setActionIssue(next);
        },
        (error: unknown) => {
          if (stillShowing(comparison, nonce))
            setActionIssue({
              state: "failed",
              code: "review-stage-failed",
              message: errorMessage(error),
            });
        },
      )
      .finally(() => {
        if (stillShowing(comparison, nonce)) setBusy(file.id, false);
      });
  };

  const chooseScope = (kind: string) => {
    const scope: ReviewScope =
      kind === "branch"
        ? { kind: "branch" }
        : kind === "turn"
          ? { kind: "turn" }
          : { kind: "uncommitted" };
    onSelectionChange({ ...selection, selectedPath: null, scope });
  };
  const openCurrentFile = (comparison: AvailableReview, file: ReviewFileEntry) => {
    const nonce = requestNonce.current;
    const reportError = (error: unknown) => {
      if (stillShowing(comparison, nonce))
        setActionIssue({
          state: "failed",
          code: "review-open-file-failed",
          message: errorMessage(error),
        });
    };
    try {
      void Promise.resolve(
        onOpenFile({ workspaceId: comparison.checkoutId, path: file.path }),
      ).catch(reportError);
    } catch (error: unknown) {
      reportError(error);
    }
  };
  const selectedScope =
    requestedScope.kind === "turn" && requestedScope.checkpointId
      ? "selected-turn"
      : requestedScope.kind;
  const reviewedCount = review?.files.filter((file) => file.reviewed).length ?? 0;
  const displayedFileResult =
    fileResult?.state === "available" &&
    (fileResult.reviewId !== review?.reviewId || fileResult.fileId !== selectedFile?.id)
      ? null
      : fileResult;

  return (
    <section
      className="side-panel diff-panel file-workbench file-workbench--changes review-panel"
      aria-label={t("review.changesReview")}
    >
      <div className="diff-panel__header file-workbench__header">
        <div className="file-workbench__heading">
          <h2 className="diff-panel__title">{t("workbench.changes")}</h2>
        </div>
        {review && review.files.length > 0 ? (
          <span className="diff-panel__counter" data-testid="diff-panel-counter">
            {t("workbench.reviewedCount", { reviewed: reviewedCount, total: review.files.length })}
          </span>
        ) : null}
        <button
          className="icon-button"
          type="button"
          onClick={refresh}
          aria-label={t("common.refresh")}
          title={t("review.refreshComparison")}
          disabled={loading}
        >
          <RefreshIcon />
        </button>
      </div>
      <div className="review-panel__controls">
        <label>
          {t("review.checkout")}
          <select
            aria-label={t("review.reviewCheckout")}
            value={selection.workspaceId}
            onChange={(event) =>
              onSelectionChange({
                workspaceId: event.target.value,
                selectedPath: null,
                scope: requestedScope.kind === "turn" ? { kind: "uncommitted" } : requestedScope,
              })
            }
          >
            {!selectedCheckout ? (
              <option value={selection.workspaceId}>{t("review.unavailableCheckout")}</option>
            ) : null}
            {contexts.map((context) => (
              <option value={context.workspace.id} key={context.workspace.id}>
                {context.role === "thread" ? `${t("review.currentTask")} · ` : ""}
                {context.worktree?.branchName ??
                  context.workspace.branchName ??
                  context.workspace.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("review.compare")}
          <select
            aria-label={t("review.reviewScope")}
            value={selectedScope}
            onChange={(event) => chooseScope(event.target.value)}
          >
            <option value="uncommitted">{t("review.uncommitted")}</option>
            <option value="branch">{t("review.branch")}</option>
            <option value="turn">{t("review.lastTurn")}</option>
            {selectedScope === "selected-turn" ? (
              <option value="selected-turn">{t("review.selectedTurn")}</option>
            ) : null}
          </select>
        </label>
      </div>
      {requestedScope.kind === "branch" ? (
        <form
          className="review-panel__base"
          onSubmit={(event) => {
            event.preventDefault();
            const baseRef = baseDraft.trim();
            if (baseRef === (requestedScope.baseRef ?? "")) refresh();
            else
              onSelectionChange({
                ...selection,
                selectedPath: null,
                scope: baseRef ? { kind: "branch", baseRef } : { kind: "branch" },
              });
          }}
        >
          <label htmlFor="review-base-ref">{t("review.baseBranch")}</label>
          <input
            id="review-base-ref"
            aria-label={t("review.baseBranch")}
            value={baseDraft}
            onChange={(event) => setBaseDraft(event.target.value)}
            placeholder={
              review?.scope.kind === "branch"
                ? (review.scope.baseRef ?? t("review.repositoryDefault"))
                : t("review.repositoryDefault")
            }
          />
          <button type="submit" className="button" disabled={loading}>
            {t("review.compare")}
          </button>
        </form>
      ) : null}
      <p className="review-panel__scope-note">
        {requestedScope.kind === "uncommitted"
          ? t("review.scopeUncommittedDescription")
          : requestedScope.kind === "branch"
            ? t("review.scopeBranchDescription")
            : requestedScope.checkpointId
              ? t("review.scopeSelectedTurnDescription")
              : t("review.scopeLatestTurnDescription")}
      </p>
      {review && !loading ? (
        <div className="review-panel__identity" data-testid="review-comparison-identity">
          <span>{review.baseLabel}</span>
          {review.headOid ? <code title={review.headOid}>{review.headOid.slice(0, 8)}</code> : null}
          {review.capturedAt ? (
            <span>{t("review.captured", { time: formatCaptureTime(review.capturedAt) })}</span>
          ) : null}
        </div>
      ) : null}
      {actionIssue ? <ReviewIssueBanner issue={actionIssue} onRefresh={refresh} /> : null}
      {review && !loading ? <CoverageNotice coverage={review.coverage} /> : null}
      <div className="file-workbench__body">
        <section
          className="file-workbench__section file-workbench__section--changes"
          aria-label={t("workbench.changedFiles")}
        >
          <div className="file-workbench__section-header">
            <span>{t("workbench.changedFiles")}</span>
            <span>
              {loading
                ? t("common.loading")
                : review
                  ? review.files.length
                  : result
                    ? t("common.unavailable")
                    : t("common.loading")}
            </span>
          </div>
          {loading || !result ? (
            <div className="diff-panel__empty" role="status">
              {t("review.loadingComparison")}
            </div>
          ) : result.state !== "available" ? (
            <div
              className="diff-panel__empty diff-panel__unavailable"
              data-testid="changed-files-unavailable"
              role="status"
            >
              <p>{result.message}</p>
              <button className="button" type="button" onClick={refresh}>
                {t("common.retry")}
              </button>
            </div>
          ) : result.files.length === 0 ? (
            <div className="diff-panel__empty">
              {result.coverage.state === "partial"
                ? t("review.noCapturedChanges")
                : t("workbench.noChanges")}
            </div>
          ) : (
            <div className="diff-panel__file-list" ref={fileListRef}>
              {result.files.map((file) => {
                const selected = file.path === selection.selectedPath;
                const busy = busyFiles.has(file.id);
                return (
                  <div
                    className={`diff-panel__file${selected ? " diff-panel__file--selected" : ""}${file.reviewed ? " diff-panel__file--reviewed" : ""}`}
                    key={file.id}
                    data-workspace-id={result.checkoutId}
                    data-file-path={file.path}
                  >
                    <input
                      aria-label={t("review.markReviewed", { path: file.path })}
                      className="diff-panel__reviewed-checkbox"
                      data-testid={`diff-panel-reviewed-${file.path}`}
                      type="checkbox"
                      checked={file.reviewed}
                      disabled={busy || stale}
                      onChange={() => markReviewed(result, file)}
                    />
                    <button
                      className="diff-panel__file-name"
                      title={formatPathForDisplay(file.path)}
                      type="button"
                      onClick={() =>
                        onSelectionChange({
                          ...selection,
                          selectedPath: selected ? null : file.path,
                        })
                      }
                    >
                      <span
                        className={`diff-panel__status-dot diff-panel__status-dot--${file.status}`}
                      />
                      <span className="diff-panel__file-path">
                        {formatPathForDisplay(file.path)}
                      </span>
                      <span className="file-workbench__status-label">
                        {file.conflicted ? t("review.conflicted") : file.status}
                      </span>
                    </button>
                    {result.scope.kind === "uncommitted" ? (
                      <span className="review-panel__stage-actions">
                        <button
                          className="diff-panel__stage-btn"
                          type="button"
                          disabled={busy || stale || file.conflicted || !file.hasUnstagedChanges}
                          onClick={() => stageFile(result, file, "stage")}
                        >
                          {file.hasUnstagedChanges ? t("workbench.stage") : t("workbench.staged")}
                        </button>
                        {file.hasStagedChanges ? (
                          <button
                            className="diff-panel__stage-btn"
                            type="button"
                            disabled={busy || stale || file.conflicted}
                            onClick={() => stageFile(result, file, "unstage")}
                          >
                            {t("review.unstage")}
                          </button>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <div className="diff-panel__viewer file-workbench__viewer">
        <div className="diff-panel__viewer-header file-workbench__viewer-header">
          <span className="file-workbench__viewer-path">
            {selection.selectedPath
              ? formatPathForDisplay(selection.selectedPath)
              : t("workbench.selectFile")}
          </span>
          {review && selectedFile && selectedFile.status !== "deleted" ? (
            <button
              className="button review-panel__open-file"
              type="button"
              title={t("review.openCurrentFile")}
              onClick={() => openCurrentFile(review, selectedFile)}
            >
              {t("review.openInFiles")}
            </button>
          ) : null}
        </div>
        {selectedFile?.previousPath ? (
          <div className="review-panel__rename">
            {t("review.renamedFrom", { path: formatPathForDisplay(selectedFile.previousPath) })}
          </div>
        ) : null}
        <div className="review-panel__patches">
          {loading ? (
            <div className="diff-panel__empty">{t("review.refreshingComparison")}</div>
          ) : !review ? (
            <div className="diff-panel__empty">{t("review.chooseComparison")}</div>
          ) : selection.selectedPath === null ? (
            <div className="diff-panel__empty">{t("workbench.selectChangedFile")}</div>
          ) : !selectedFile ? (
            <div className="diff-panel__empty">{t("review.fileNotInComparison")}</div>
          ) : fileLoading ? (
            <div className="diff-panel__empty">{t("review.loadingDiff")}</div>
          ) : displayedFileResult?.state === "available" ? (
            <>
              <CoverageNotice coverage={displayedFileResult.coverage} />
              {displayedFileResult.summary ? (
                <p className="review-panel__summary">{displayedFileResult.summary}</p>
              ) : null}
              {displayedFileResult.sections.map((section) => (
                <section
                  className="review-panel__patch-section"
                  aria-label={t(`review.section.${section.kind}`)}
                  key={section.kind}
                >
                  <h3>{t(`review.section.${section.kind}`)}</h3>
                  <CoverageNotice coverage={section.coverage} />
                  {section.patch ? (
                    <InlineDiff
                      diff={section.patch}
                      language={extensionToLanguage(selectedFile.path)}
                    />
                  ) : (
                    <p className="diff-panel__empty">{t("review.noTextualChanges")}</p>
                  )}
                </section>
              ))}
              {displayedFileResult.sections.length === 0 && !displayedFileResult.summary ? (
                <p className="diff-panel__empty">{t("review.noTextDiff")}</p>
              ) : null}
            </>
          ) : displayedFileResult ? (
            <ReviewIssueBanner issue={displayedFileResult} onRefresh={refresh} />
          ) : (
            <div className="diff-panel__empty">{t("review.loadingDiff")}</div>
          )}
        </div>
      </div>
    </section>
  );
}

function ReviewIssueBanner({
  issue,
  onRefresh,
}: {
  readonly issue: ReviewIssue;
  readonly onRefresh: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="review-panel__issue"
      data-testid={issue.state === "stale" ? "review-stale" : "review-issue"}
      role="status"
    >
      <p>{issue.message}</p>
      <button className="button" type="button" onClick={onRefresh}>
        {issue.state === "stale" ? t("review.refreshComparison") : t("common.retry")}
      </button>
    </div>
  );
}

function CoverageNotice({ coverage }: { readonly coverage: ReviewCoverage }) {
  const { t } = useTranslation();
  if (coverage.state === "complete" && coverage.notes.length === 0) return null;
  return (
    <details className="review-panel__coverage" data-testid="review-coverage">
      <summary>
        {coverage.state === "partial"
          ? t("review.comparisonLimited")
          : t("review.comparisonDetails")}
      </summary>
      {coverage.notes.length ? (
        <ul>
          {coverage.notes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      ) : (
        <p>{t("review.someChangesExcluded")}</p>
      )}
    </details>
  );
}

/**
 * Plain paths read as-is. Paths whose edges or characters would be invisible or
 * ambiguous (surrounding whitespace, control characters, a leading or trailing
 * quote) are shown JSON-quoted so they cannot be confused with another path.
 */
function formatPathForDisplay(path: string): string {
  const ambiguous =
    /^[\s"]|[\s"]$/.test(path) ||
    [...path].some((char) => char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f);
  return ambiguous ? JSON.stringify(path) : path;
}

function formatCaptureTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
