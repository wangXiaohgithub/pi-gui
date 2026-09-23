import { Component, Fragment, type ReactNode } from "react";
import type { DesktopAppView, StateHydrationFailure } from "./desktop-app-state";
import { i18n } from "../i18n";

export type DesktopStartupSurfaceState =
  | { readonly kind: "loading" }
  | {
      readonly kind: "failed";
      readonly failure: StateHydrationFailure;
      readonly retrying: boolean;
    }
  | { readonly kind: "crashed" };

export interface DesktopStartupCopy {
  readonly title: string;
  readonly body: string;
  readonly status: "loading" | "failed" | "crashed";
}

export function startupSurfaceCopy(state: DesktopStartupSurfaceState): DesktopStartupCopy {
  if (state.kind === "loading") {
    return {
      title: i18n.t("errors.loadingSessions"),
      body: i18n.t("errors.loadingSessionsBody"),
      status: "loading",
    };
  }
  if (state.kind === "crashed") {
    return rendererBoundaryCopy();
  }
  if (state.failure.code === "bridge-unavailable") {
    return {
      title: i18n.t("errors.restoreFailedTitle"),
      body: i18n.t("errors.bridgeFailedBody"),
      status: "failed",
    };
  }
  return {
    title: i18n.t("errors.restoreFailedTitle"),
    body: i18n.t("errors.restoreFailedBody"),
    status: "failed",
  };
}

export function rendererBoundaryCopy(): DesktopStartupCopy {
  return {
    title: i18n.t("errors.crashedTitle"),
    body: i18n.t("errors.crashedBody"),
    status: "crashed",
  };
}

interface DesktopStartupSurfaceProps {
  readonly state: DesktopStartupSurfaceState;
  readonly onRetry: () => void;
  readonly onRelaunch?: () => void;
}

export function DesktopStartupSurface({ state, onRetry, onRelaunch }: DesktopStartupSurfaceProps) {
  const copy = startupSurfaceCopy(state);
  const retrying = state.kind === "failed" ? state.retrying : false;
  const showActions = copy.status !== "loading";
  const showRelaunch =
    Boolean(onRelaunch) &&
    (state.kind === "crashed" ||
      (state.kind === "failed" && state.failure.code !== "bridge-unavailable"));

  return (
    <div className="shell shell--loading">
      <main
        className="loading-card"
        data-testid="shell-status-card"
        data-status={copy.status}
        data-retrying={retrying ? "true" : "false"}
        data-failure={state.kind === "failed" ? state.failure.code : undefined}
      >
        <div className="loading-card__eyebrow">pi-gui</div>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        {showActions ? (
          <div className="loading-card__actions">
            <button
              className="button button--primary"
              data-testid="hydrate-retry"
              type="button"
              disabled={retrying}
              onClick={onRetry}
            >
              {retrying ? i18n.t("errors.retrying") : i18n.t("common.retry")}
            </button>
            {showRelaunch ? (
              <button
                className="button button--ghost"
                data-testid="hydrate-relaunch"
                type="button"
                onClick={onRelaunch}
              >
                {i18n.t("errors.relaunch")}
              </button>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}

interface RendererErrorBoundaryProps {
  readonly children: ReactNode;
  readonly onRelaunch?: () => void;
}

interface RendererErrorBoundaryState {
  readonly hasError: boolean;
  readonly remountKey: number;
}

export class RendererErrorBoundary extends Component<
  RendererErrorBoundaryProps,
  RendererErrorBoundaryState
> {
  state: RendererErrorBoundaryState = { hasError: false, remountKey: 0 };

  static getDerivedStateFromError(): Pick<RendererErrorBoundaryState, "hasError"> {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error("[renderer] render tree failed", error);
  }

  private readonly handleRetry = (): void => {
    this.setState((current) => ({
      hasError: false,
      remountKey: current.remountKey + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <DesktopStartupSurface
          state={{ kind: "crashed" }}
          onRetry={this.handleRetry}
          onRelaunch={this.props.onRelaunch}
        />
      );
    }
    return <Fragment key={this.state.remountKey}>{this.props.children}</Fragment>;
  }
}

export function toStartupSurfaceState(view: DesktopAppView): DesktopStartupSurfaceState {
  if (view.kind === "failed") {
    return view;
  }
  return { kind: "loading" };
}
