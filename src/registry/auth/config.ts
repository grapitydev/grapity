import type { JWTPayload } from "jose";

export type AuthMode = "none" | "keycloak";
export type RoleSource = "scope" | "realm_access.roles";

export interface KeycloakAuthConfig {
  mode: "keycloak";
  serverUrl: string;
  realm: string;
  audience?: string;
  roleSource?: RoleSource;
}

export type AuthConfig = { mode: "none" } | KeycloakAuthConfig;
