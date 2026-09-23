import type { ScheduledTaskRecord } from "../../../contracts/desktop-state";
import { formatScheduledTaskRowMeta } from "../../../contracts/scheduled-tasks";
import { useTranslation } from "react-i18next";

interface ScheduledTaskChipProps {
  readonly task: ScheduledTaskRecord;
  readonly onOpen: () => void;
}

export function ScheduledTaskChip({ task, onOpen }: ScheduledTaskChipProps) {
  const { t } = useTranslation();
  return (
    <div className="scheduled-task-chip" data-testid="scheduled-task-chip">
      <span>{formatScheduledTaskRowMeta(task)}</span>
      <button className="button button--secondary" type="button" onClick={onOpen}>
        {t("common.open")}
      </button>
    </div>
  );
}
