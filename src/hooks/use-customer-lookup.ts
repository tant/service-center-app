"use client";

import { useState } from "react";
import { useDebounce } from "./use-debounce";
import { trpc } from "@/components/providers/trpc-provider";

const MIN_PHONE_LENGTH = 6;

export function useCustomerLookup(phone: string) {
  const [enabled, setEnabled] = useState(false);
  const debouncedPhone = useDebounce(phone.trim(), 400);

  const shouldLookup = debouncedPhone.replace(/\D/g, "").length >= MIN_PHONE_LENGTH && enabled;

  const query = trpc.serviceRequest.lookupByPhone.useQuery(
    { phone: debouncedPhone },
    {
      enabled: shouldLookup,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  return {
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

