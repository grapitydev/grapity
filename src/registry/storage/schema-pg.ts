import { pgTable, text, timestamp, boolean, jsonb, index, integer } from "drizzle-orm/pg-core";
import type { CompatReport } from "core";

export const specs = pgTable("specs", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type", { enum: ["openapi", "asyncapi"] as [string, ...string[]] }).notNull(),
  description: text("description"),
  owner: text("owner"),
  sourceRepo: text("source_repo"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const specVersions = pgTable("spec_versions", {
  id: text("id").primaryKey(),
  specId: text("spec_id").notNull().references(() => specs.id),
  semver: text("semver").notNull(),
  content: text("content").notNull(),
  checksum: text("checksum").notNull(),
  gitRef: text("git_ref"),
  pushedBy: text("pushed_by"),
  compatibility: jsonb("compatibility").$type<CompatReport>(),
  previousVersion: text("previous_version"),
  forceReason: text("force_reason"),
  isPrerelease: boolean("is_prerelease").notNull().default(false),
  createdAt: timestamp("created_at").notNull(),
}, (table) => [
  index("idx_spec_versions_spec_id").on(table.specId),
  index("idx_spec_versions_semver").on(table.specId, table.semver),
]);

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  action: text("action", { enum: ["spec.push", "spec.push.force", "spec.delete"] as [string, ...string[]] }).notNull(),
  actor: text("actor").notNull(),
  specName: text("spec_name").notNull(),
  version: text("version"),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull(),
}, (table) => [
  index("idx_audit_log_spec_name").on(table.specName),
  index("idx_audit_log_created_at").on(table.createdAt),
]);

export const gatewayConfigs = pgTable("gateway_configs", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  provider: text("provider", { enum: ["kong"] as [string, ...string[]] }).notNull(),
  specName: text("spec_name").notNull(),
  specSemver: text("spec_semver").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const gatewayConfigVersions = pgTable("gateway_config_versions", {
  id: text("id").primaryKey(),
  gatewayConfigId: text("gateway_config_id").notNull().references(() => gatewayConfigs.id),
  routes: jsonb("routes").$type<{ path: string; methods: string[] }[]>().notNull(),
  environments: jsonb("environments").$type<{ name: string; kongAddr: string; upstream: string; plugins: { name: string; config: Record<string, unknown>; order?: number }[] }[]>().notNull(),
  callerIdentification: jsonb("caller_identification").$type<{ strategy: "first-match"; rules: { source: string; confidence: string }[] } | null>(),
  content: text("content").notNull(),
  checksum: text("checksum").notNull(),
  pushedBy: text("pushed_by"),
  createdAt: timestamp("created_at").notNull(),
}, (table) => [
  index("idx_gateway_config_versions_config_id").on(table.gatewayConfigId),
]);

export const httpLogs = pgTable("http_logs", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  gatewayConfigName: text("gateway_config_name").notNull(),
  environment: text("environment").notNull(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  routePath: text("route_path"),
  status: integer("status").notNull(),
  callerId: text("caller_id"),
  callerSource: text("caller_source"),
  callerConfidence: text("caller_confidence").notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
}, (table) => [
  index("idx_http_logs_config_env").on(table.gatewayConfigName, table.environment),
  index("idx_http_logs_occurred_at").on(table.occurredAt),
  index("idx_http_logs_caller").on(table.gatewayConfigName, table.environment, table.callerId),
]);

export const provisions = pgTable("provisions", {
  id: text("id").primaryKey(),
  gatewayConfigName: text("gateway_config_name").notNull(),
  gatewayConfigVersion: text("gateway_config_version").notNull(),
  environment: text("environment").notNull(),
  provider: text("provider", { enum: ["kong"] as [string, ...string[]] }).notNull(),
  synced: boolean("synced").notNull().default(false),
  actor: text("actor").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull(),
}, (table) => [
  index("idx_provisions_config_name").on(table.gatewayConfigName),
  index("idx_provisions_created_at").on(table.createdAt),
]);
