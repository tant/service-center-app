import { useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";

export type DefaultWorkflows = Partial<Record<"service_request" | "service_ticket", string>>;

type Options = {
  workflows?: { id: string }[];
  entityType?: "service_request" | "service_ticket";
};

export function useDefaultWorkflowsSettings(options?: Options) {
  const { workflows = [], entityType } = options || {};

  const settingsQuery = trpc.appSettings.getSettings.useQuery(
    { keys: ["default_workflows"] },
    { refetchOnWindowFocus: false },
  );

  const [defaults, setDefaults] = useState<DefaultWorkflows>({});
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (settingsQuery.data && !hasHydrated) {
      const value = settingsQuery.data.default_workflows as DefaultWorkflows | null;
      setDefaults(value || {});
      setHasHydrated(true);
    }
  }, [settingsQuery.data, hasHydrated]);

  const upsertSettings = trpc.appSettings.upsertSettings.useMutation();

  const save = useCallback(async () => {
    const payload: Record<string, string> = {};
    if (defaults.service_request) payload.service_request = defaults.service_request;
    if (defaults.service_ticket) payload.service_ticket = defaults.service_ticket;

    await upsertSettings.mutateAsync({
      settings: [
        {
          key: "default_workflows",
          value: payload,
          category: "workflow",
          description: "Default workflows mapping per ticket type",
        },
      ],
    });
    await settingsQuery.refetch();
  }, [defaults, settingsQuery, upsertSettings]);

  const missing = useMemo(() => {
    // Only compute when caller provides workflows + entityType
    if (!entityType || !workflows?.length) return { service_request: false, service_ticket: false };
    const id = defaults[entityType];
    if (!id) return { service_request: false, service_ticket: false };
    const exists = workflows.some((wf) => wf.id === id);
    return {
      service_request: entityType === "service_request" ? !exists : false,
      service_ticket: entityType === "service_ticket" ? !exists : false,
    };
  }, [defaults, entityType, workflows]);

  return {
    defaults,
    setDefaults,
    isLoading: settingsQuery.isLoading,
    isSaving: upsertSettings.isPending,
    save,
    error: settingsQuery.error?.message || upsertSettings.error?.message,
    refetch: settingsQuery.refetch,
    missing,
  };
}
