import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ConfigContextValue {
  registryUrl: string;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

function getRegistryUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("registry");
  if (override) return override;

  if ((window as any).__GRAPITY_CONFIG__?.remote?.url) {
    return (window as any).__GRAPITY_CONFIG__.remote.url;
  }

  return "";
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [registryUrl] = useState(() => getRegistryUrl());

  return (
    <ConfigContext.Provider value={{ registryUrl }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}
