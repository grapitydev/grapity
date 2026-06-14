import { decodeJwt } from "jose";
import { buildKeycloakUrls } from "registry/auth/middleware";
import type { KeycloakAuthConfig } from "./config";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export function resetTokenCache(): void {
  cachedToken = null;
}

export async function getAccessToken(config: KeycloakAuthConfig): Promise<string> {
  const staticToken = process.env.GRAPITY_TOKEN;
  if (staticToken) {
    return staticToken;
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.accessToken;
  }

  const clientSecret = process.env.GRAPITY_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error(
      "Keycloak client secret not found. Set GRAPITY_CLIENT_SECRET or provide a static token via GRAPITY_TOKEN."
    );
  }

  const { tokenUrl } = buildKeycloakUrls({ serverUrl: config.serverUrl, realm: config.realm });

  const params = new URLSearchParams();
  params.set("grant_type", "client_credentials");
  params.set("client_id", config.clientId);
  params.set("client_secret", clientSecret);
  if (config.audience) {
    params.set("audience", config.audience);
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`Keycloak token request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as TokenResponse;
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in,
  };

  return data.access_token;
}

export function decodeToken(token: string): {
  sub?: string;
  exp?: number;
  iss?: string;
  scope?: string;
  roles?: string[];
} {
  try {
    const payload = decodeJwt(token);
    return {
      sub: payload.sub,
      exp: payload.exp,
      iss: payload.iss,
      scope: typeof payload.scope === "string" ? payload.scope : undefined,
      roles: (payload.realm_access as { roles?: string[] } | undefined)?.roles,
    };
  } catch {
    return {};
  }
}

export function formatTokenStatus(token: string): {
  valid: boolean;
  sub?: string;
  exp?: number;
  expired?: boolean;
} {
  const decoded = decodeToken(token);
  const now = Math.floor(Date.now() / 1000);
  return {
    valid: !!decoded.sub,
    sub: decoded.sub,
    exp: decoded.exp,
    expired: decoded.exp ? decoded.exp < now : undefined,
  };
}
