import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface HubAuthConfig {
  mode: "keycloak";
  serverUrl: string;
  realm: string;
  clientId: string;
  audience?: string;
}

interface ConfigContextValue {
  registryUrl: string;
  auth?: HubAuthConfig;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

interface WindowConfig {
  registryUrl?: string;
  auth?: HubAuthConfig;
  remote?: { url?: string };
}

declare global {
  interface Window {
    __GRAPITY_CONFIG__?: WindowConfig;
  }
}

function getConfig(): ConfigContextValue {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("registry");
  const windowConfig = window.__GRAPITY_CONFIG__;

  const registryUrl =
    override ?? windowConfig?.registryUrl ?? windowConfig?.remote?.url ?? "";

  return {
    registryUrl,
    auth: windowConfig?.auth,
  };
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config] = useState(() => getConfig());

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}
