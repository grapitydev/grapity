import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useConfig, type HubAuthConfig } from "./ConfigContext";

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: TokenSet | null;
  login: () => void;
  logout: () => void;
  handleCallback: (code: string, returnedState: string) => Promise<TokenSet>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_TOKEN_KEY = "grapity_access_token";
const REFRESH_TOKEN_KEY = "grapity_refresh_token";
const ID_TOKEN_KEY = "grapity_id_token";
const EXPIRES_AT_KEY = "grapity_expires_at";
const VERIFIER_KEY = "grapity_pkce_verifier";
const STATE_KEY = "grapity_oidc_state";
const NONCE_KEY = "grapity_oidc_nonce";
const POST_LOGIN_PATH_KEY = "grapity_post_login_path";

function generateRandom(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(plain: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

function buildAuthUrl(auth: HubAuthConfig, challenge: string, state: string, nonce: string): string {
  const params = new URLSearchParams({
    client_id: auth.clientId,
    response_type: "code",
    scope: "openid specs:read",
    redirect_uri: `${window.location.origin}/callback`,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });
  return `${auth.serverUrl}/realms/${auth.realm}/protocol/openid-connect/auth?${params.toString()}`;
}

async function exchangeCode(
  auth: HubAuthConfig,
  code: string,
  verifier: string
): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: auth.clientId,
    code,
    redirect_uri: `${window.location.origin}/callback`,
    code_verifier: verifier,
  });

  const res = await fetch(
    `${auth.serverUrl}/realms/${auth.realm}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

function loadTokenSet(): TokenSet | null {
  const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) return null;

  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined;
  const idToken = sessionStorage.getItem(ID_TOKEN_KEY) ?? undefined;
  const expiresAtRaw = sessionStorage.getItem(EXPIRES_AT_KEY);

  return {
    accessToken,
    refreshToken,
    idToken,
    expiresAt: expiresAtRaw ? parseInt(expiresAtRaw, 10) : undefined,
  };
}

function saveTokenSet(tokens: TokenSet): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
  if (tokens.idToken) {
    sessionStorage.setItem(ID_TOKEN_KEY, tokens.idToken);
  }
  if (tokens.expiresAt) {
    sessionStorage.setItem(EXPIRES_AT_KEY, String(tokens.expiresAt));
  }
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ID_TOKEN_KEY);
  sessionStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(NONCE_KEY);
  localStorage.removeItem(POST_LOGIN_PATH_KEY);
}

export function getAndClearPostLoginPath(): string {
  const path = localStorage.getItem(POST_LOGIN_PATH_KEY) ?? "/";
  localStorage.removeItem(POST_LOGIN_PATH_KEY);
  return path;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useConfig();
  const [token, setToken] = useState<TokenSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = loadTokenSet();
    if (stored) {
      setToken(stored);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(() => {
    if (!auth) return;

    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== "/" && !currentPath.startsWith("/callback")) {
      localStorage.setItem(POST_LOGIN_PATH_KEY, currentPath);
    }

    const verifier = generateRandom();
    const state = generateRandom();
    const nonce = generateRandom();

    localStorage.setItem(VERIFIER_KEY, verifier);
    localStorage.setItem(STATE_KEY, state);
    localStorage.setItem(NONCE_KEY, nonce);

    sha256(verifier).then((digest) => {
      const challenge = base64UrlEncode(digest);
      window.location.href = buildAuthUrl(auth, challenge, state, nonce);
    });
  }, [auth]);

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);

    if (auth) {
      const params = new URLSearchParams({
        client_id: auth.clientId,
        post_logout_redirect_uri: `${window.location.origin}/`,
      });
      if (token?.idToken) {
        params.set("id_token_hint", token.idToken);
      }
      window.location.href = `${auth.serverUrl}/realms/${auth.realm}/protocol/openid-connect/logout?${params.toString()}`;
    }
  }, [auth, token?.idToken]);

  const handleCallback = useCallback(
    async (code: string, returnedState: string): Promise<TokenSet> => {
      if (!auth) {
        throw new Error("Keycloak auth is not configured");
      }

      const verifier = localStorage.getItem(VERIFIER_KEY);
      const expectedState = localStorage.getItem(STATE_KEY);

      if (!verifier) {
        throw new Error("PKCE verifier not found");
      }

      if (!expectedState || returnedState !== expectedState) {
        throw new Error("Invalid OIDC state parameter");
      }

      const tokens = await exchangeCode(auth, code, verifier);
      saveTokenSet(tokens);
      setToken(tokens);
      localStorage.removeItem(VERIFIER_KEY);
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(NONCE_KEY);
      return tokens;
    },
    [auth]
  );

  const value: AuthContextValue = {
    isAuthenticated: !!token && Date.now() < (token.expiresAt ?? Infinity),
    isLoading,
    token,
    login,
    logout,
    handleCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getAccessToken(): string | null {
  const tokens = loadTokenSet();
  if (!tokens) return null;
  if (tokens.expiresAt && Date.now() >= tokens.expiresAt) return null;
  return tokens.accessToken;
}

export type { HubAuthConfig };
