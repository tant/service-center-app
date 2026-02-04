"use client";

/**
 * Workflow Detail Container
 * Main component that composes all workflow detail sub-components
 */

import { WorkflowHeaderActions } from "./workflow-header-actions";
import { WorkflowInfoCard } from "./workflow-info-card";
import { WorkflowTasksList } from "./workflow-tasks-list";
import type { WorkflowDetailData } from "./types";

interface WorkflowDetailProps {
  workflow: WorkflowDetailData;
}

export function WorkflowDetail({ workflow }: WorkflowDetailProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
          <div className="space-y-6">
            <WorkflowHeaderActions workflow={workflow} />
            <WorkflowInfoCard workflow={workflow} />
            <WorkflowTasksList
              tasks={workflow.tasks || []}
              enforceSequence={workflow.enforce_sequence}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export type { WorkflowDetailData, WorkflowTaskItem } from "./types";
