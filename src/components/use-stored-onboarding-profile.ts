"use client";

import { useSyncExternalStore } from "react";
import {
  ONBOARDING_STORAGE_EVENT,
  readStoredOnboardingProfile,
  type OnboardingProfile,
} from "@/lib/onboarding";

function subscribeToStorage(storageKey: string, onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === storageKey) {
      onStoreChange();
    }
  };

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<string>;

    if (!customEvent.detail || customEvent.detail === storageKey) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(
    ONBOARDING_STORAGE_EVENT,
    handleCustomEvent as EventListener,
  );

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      ONBOARDING_STORAGE_EVENT,
      handleCustomEvent as EventListener,
    );
  };
}

export function useStoredOnboardingProfile(storageKey: string) {
  return useSyncExternalStore<OnboardingProfile | null>(
    (onStoreChange) => subscribeToStorage(storageKey, onStoreChange),
    () => readStoredOnboardingProfile(storageKey),
    () => null,
  );
}
