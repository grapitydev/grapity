import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import type { CompatReport } from "core";

export const specs = sqliteTable("specs", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type", { enum: ["openapi", "asyncapi"] }).notNull(),
  description: text("description"),
  owner: text("owner"),
  sourceRepo: text("source_repo"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const specVersions = sqliteTable("spec_versions", {
  id: text("id").primaryKey(),
  specId: text("spec_id").notNull().references(() => specs.id),
  semver: text("semver").notNull(),
  content: text("content").notNull(),
  checksum: text("checksum").notNull(),
  gitRef: text("git_ref"),
  pushedBy: text("pushed_by"),
  compatibility: text("compatibility", { mode: "json" }).$type<CompatReport>(),
  previousVersion: text("previous_version"),
  forceReason: text("force_reason"),
  isPrerelease: integer("is_prerelease", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("idx_spec_versions_spec_id").on(table.specId),
  index("idx_spec_versions_semver").on(table.specId, table.semver),
]);

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  action: text("action", { enum: ["spec.push", "spec.push.force", "spec.delete"] }).notNull(),
  actor: text("actor").notNull(),
  specName: text("spec_name").notNull(),
  version: text("version"),
  details: text("details", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("idx_audit_log_spec_name").on(table.specName),
  index("idx_audit_log_created_at").on(table.createdAt),
]);

export const gatewayConfigs = sqliteTable("gateway_configs", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  provider: text("provider", { enum: ["kong"] }).notNull(),
  specName: text("spec_name").notNull(),
  specSemver: text("spec_semver").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const gatewayConfigVersions = sqliteTable("gateway_config_versions", {
  id: text("id").primaryKey(),
  gatewayConfigId: text("gateway_config_id").notNull().references(() => gatewayConfigs.id),
  routes: text("routes", { mode: "json" }).$type<{ path: string; methods: string[] }[]>().notNull(),
  environments: text("environments", { mode: "json" }).$type<{ name: string; kongAddr: string; upstream: string; plugins: { name: string; config: Record<string, unknown>; order?: number }[] }[]>().notNull(),
  callerIdentification: text("caller_identification", { mode: "json" }).$type<{ strategy: "first-match"; rules: { source: string; confidence: string }[] } | null>(),
  content: text("content").notNull(),
  checksum: text("checksum").notNull(),
  pushedBy: text("pushed_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("idx_gateway_config_versions_config_id").on(table.gatewayConfigId),
]);

export const httpLogs = sqliteTable("http_logs", {
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
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("idx_http_logs_config_env").on(table.gatewayConfigName, table.environment),
  index("idx_http_logs_occurred_at").on(table.occurredAt),
  index("idx_http_logs_caller").on(table.gatewayConfigName, table.environment, table.callerId),
]);

export const provisions = sqliteTable("provisions", {
  id: text("id").primaryKey(),
  gatewayConfigName: text("gateway_config_name").notNull(),
  gatewayConfigVersion: text("gateway_config_version").notNull(),
  environment: text("environment").notNull(),
  provider: text("provider", { enum: ["kong"] }).notNull(),
  synced: integer("synced", { mode: "boolean" }).notNull().default(false),
  actor: text("actor").notNull(),
  details: text("details", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("idx_provisions_config_name").on(table.gatewayConfigName),
  index("idx_provisions_created_at").on(table.createdAt),
]);
