import { z } from "zod";

export const demoEnvSchema = z.object({
  GRAPITY_DEMO_ID: z.string().min(1),
  GRAPITY_PUBLIC_URL: z.string().url(),

  GRAPITY_KEYCLOAK_SERVER_URL: z.string().url(),
  GRAPITY_KEYCLOAK_REALM: z.string().min(1),
  GRAPITY_KEYCLOAK_CLIENT_ID: z.string().min(1),
  GRAPITY_KEYCLOAK_HUB_CLIENT_ID: z.string().min(1),
  GRAPITY_KEYCLOAK_AUDIENCE: z.string().optional(),
  GRAPITY_KEYCLOAK_ROLE_SOURCE: z
    .union([z.literal("scope"), z.literal("realm_access.roles")])
    .default("scope"),

  GRAPITY_CLIENT_SECRET: z.string().min(1),

  GRAPITY_DEMO_USERNAME: z.string().min(1),
  GRAPITY_DEMO_PASSWORD: z.string().min(1),

  GRAPITY_REGISTRY_PORT: z.coerce.number().int().min(1).default(3750),
  GRAPITY_HUB_PORT: z.coerce.number().int().min(1).default(3000),
  GRAPITY_DATABASE_PATH: z.string().min(1).default("/data/registry.db"),
});

export type DemoEnv = z.infer<typeof demoEnvSchema>;
