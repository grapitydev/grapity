import { z } from "zod";

const keycloakEnv = {
  GRAPITY_KEYCLOAK_SERVER_URL: z.string().url().optional(),
  GRAPITY_KEYCLOAK_REALM: z.string().min(1).optional(),
  GRAPITY_KEYCLOAK_AUDIENCE: z.string().optional(),
  GRAPITY_KEYCLOAK_ROLE_SOURCE: z
    .union([z.literal("scope"), z.literal("realm_access.roles")])
    .default("scope"),
};

export const registryEnvSchema = z
  .object({
    GRAPITY_AUTH_MODE: z
      .union([z.literal("keycloak"), z.literal("none")])
      .default("keycloak"),
    ...keycloakEnv,
    GRAPITY_REGISTRY_PORT: z.coerce.number().int().min(1).default(3750),
    GRAPITY_REGISTRY_HOSTNAME: z.string().min(1).default("0.0.0.0"),
    GRAPITY_DATABASE_URL: z.string().min(1),
    GRAPITY_CORS_ORIGINS: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.GRAPITY_AUTH_MODE === "none") return;
    for (const key of ["GRAPITY_KEYCLOAK_SERVER_URL", "GRAPITY_KEYCLOAK_REALM"] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when GRAPITY_AUTH_MODE is keycloak`,
        });
      }
    }
  });

export const hubEnvSchema = z.object({
  GRAPITY_HUB_PORT: z.coerce.number().int().min(1).default(3000),
  GRAPITY_REGISTRY_URL: z.string().min(1),
  GRAPITY_KEYCLOAK_SERVER_URL: z.string().url().optional(),
  GRAPITY_KEYCLOAK_REALM: z.string().min(1).optional(),
  GRAPITY_KEYCLOAK_HUB_CLIENT_ID: z.string().min(1).optional(),
  GRAPITY_KEYCLOAK_AUDIENCE: z.string().optional(),
});

export type RegistryEnv = z.infer<typeof registryEnvSchema>;
export type HubEnv = z.infer<typeof hubEnvSchema>;
