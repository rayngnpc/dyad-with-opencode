import { useQuery } from "@tanstack/react-query";
import { IpcClient } from "@/ipc/ipc_client";
import type { LanguageModelProvider } from "@/ipc/ipc_types";
import { useSettings } from "./useSettings";
import {
  cloudProviders,
  VertexProviderSetting,
  AzureProviderSetting,
} from "@/lib/schemas";

export function useLanguageModelProviders() {
  const ipcClient = IpcClient.getInstance();
  const { settings, envVars } = useSettings();

  const queryResult = useQuery<LanguageModelProvider[], Error>({
    queryKey: ["languageModelProviders"],
    queryFn: async () => {
      return ipcClient.getLanguageModelProviders();
    },
  });

  const cliAvailabilityQuery = useQuery<boolean, Error>({
    queryKey: ["cliProviderAvailability"],
    queryFn: async () => {
      return ipcClient.isAnyCliProviderAvailable();
    },
    staleTime: 60000,
  });

  const isProviderSetup = (provider: string) => {
    const providerSettings = settings?.providerSettings[provider];
    if (queryResult.isLoading) {
      return false;
    }
    if (provider === "vertex") {
      const vertexSettings = providerSettings as VertexProviderSetting;
      if (
        vertexSettings?.serviceAccountKey?.value &&
        vertexSettings?.projectId &&
        vertexSettings?.location
      ) {
        return true;
      }
      return false;
    }
    if (provider === "azure") {
      const azureSettings = providerSettings as AzureProviderSetting;
      const hasSavedSettings = Boolean(
        (azureSettings?.apiKey?.value ?? "").trim() &&
          (azureSettings?.resourceName ?? "").trim(),
      );
      if (hasSavedSettings) {
        return true;
      }
      if (envVars["AZURE_API_KEY"] && envVars["AZURE_RESOURCE_NAME"]) {
        return true;
      }
      return false;
    }
    if (providerSettings?.apiKey?.value) {
      return true;
    }
    const providerData = queryResult.data?.find((p) => p.id === provider);
    if (providerData?.envVarName && envVars[providerData.envVarName]) {
      return true;
    }
    return false;
  };

  const isAnyProviderSetup = () => {
    if (cloudProviders.some((provider) => isProviderSetup(provider))) {
      return true;
    }

    const customProviders = queryResult.data?.filter(
      (provider) => provider.type === "custom",
    );
    if (customProviders?.some((provider) => isProviderSetup(provider.id))) {
      return true;
    }

    if (cliAvailabilityQuery.data === true) {
      return true;
    }

    return false;
  };

  return {
    ...queryResult,
    isLoading: queryResult.isLoading || cliAvailabilityQuery.isLoading,
    isProviderSetup,
    isAnyProviderSetup,
  };
}
