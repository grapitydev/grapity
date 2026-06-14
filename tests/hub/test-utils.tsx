import { type ReactNode } from "react";
import { ConfigProvider } from "hub/context/ConfigContext";
import { AuthProvider } from "hub/context/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider>
      <AuthProvider>{children}</AuthProvider>
    </ConfigProvider>
  );
}
