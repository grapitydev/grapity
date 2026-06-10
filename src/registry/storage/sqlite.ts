import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { sql, eq, and, desc, asc } from "drizzle-orm";
import path from "node:path";
import { specs, specVersions, auditLog, gatewayConfigs, gatewayConfigVersions, provisions, httpLogs } from "./schema";
import type {
  Spec,
  SpecVersion,
  SpecFilters,
  CompatReport,
  SpecStore,
  AuditAction,
  GatewayConfig,
  GatewayConfigVersion,
  Provision,
  GatewayConfigStore,
  GatewayLog,
  GatewayLogFilters,
  GatewayLogStats,
} from "core";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { v4 as uuid } from "uuid";
import { SQLITE_MIGRATIONS_FOLDER } from "../paths";

const MIGRATIONS_FOLDER = SQLITE_MIGRATIONS_FOLDER;

export class SQLiteSpecStore implements SpecStore, GatewayConfigStore {
  private db: BetterSQLite3Database;

  constructor(dbPath: string) {
    const sqlite = new Database(dbPath);
    this.db = drizzle(sqlite);
  }

  async migrate(): Promise<void> {
    await migrate(this.db, {
      migrationsFolder: MIGRATIONS_FOLDER,
    });
  }

  async getSpec(name: string): Promise<Spec | null> {
    const rows = await this.db.select().from(specs).where(eq(specs.name, name)).limit(1);
    if (rows.length === 0) return null;
    return this.mapSpecRow(rows[0]);
  }

  async getSpecVersion(name: string, semver: string): Promise<SpecVersion | null> {
    const spec = await this.getSpec(name);
    if (!spec) return null;
    const rows = await this.db.select().from(specVersions)
      .where(and(eq(specVersions.specId, spec.id), eq(specVersions.semver, semver)))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapVersionRow(rows[0]);
  }

  async getLatestVersion(name: string): Promise<SpecVersion | null> {
    const spec = await this.getSpec(name);
    if (!spec) return null;
    const rows = await this.db.select().from(specVersions)
      .where(eq(specVersions.specId, spec.id))
      .orderBy(desc(specVersions.createdAt), desc(sql`rowid`))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapVersionRow(rows[0]);
  }

  async listSpecs(filters?: SpecFilters): Promise<Spec[]> {
    const conditions = [];
    if (filters?.type) conditions.push(eq(specs.type, filters.type));
    if (filters?.owner) conditions.push(eq(specs.owner, filters.owner));

    let rows = conditions.length > 0
      ? await this.db.select().from(specs).where(and(...conditions))
      : await this.db.select().from(specs);

    if (filters?.tags && filters.tags.length > 0) {
      rows = rows.filter((row) => {
        const rowTags = (row.tags as string[]) ?? [];
        return filters.tags!.every((tag) => rowTags.includes(tag));
      });
    }

    return rows.map((r) => this.mapSpecRow(r));
  }

  async listVersions(
    name: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ versions: SpecVersion[]; total: number }> {
    const spec = await this.getSpec(name);
    if (!spec) return { versions: [], total: 0 };

    const limit = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(specVersions)
      .where(eq(specVersions.specId, spec.id));
    const total = Number(countRow?.count ?? 0);

    const rows = await this.db.select().from(specVersions)
      .where(eq(specVersions.specId, spec.id))
      .orderBy(desc(specVersions.createdAt), desc(sql`rowid`))
      .limit(limit)
      .offset(offset);

    return { versions: rows.map((r) => this.mapVersionRow(r)), total };
  }

  async pushSpecVersion(spec: Spec, version: SpecVersion): Promise<SpecVersion> {
    const existingSpec = await this.getSpec(spec.name);

    if (!existingSpec) {
      await this.db.insert(specs).values({
        id: spec.id,
        name: spec.name,
        type: spec.type,
        description: spec.description ?? null,
        owner: spec.owner ?? null,
        sourceRepo: spec.sourceRepo ?? null,
        tags: spec.tags ?? [],
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
      });
    } else {
      await this.db.update(specs)
        .set({ updatedAt: new Date() })
        .where(eq(specs.id, existingSpec.id));
    }

    const specId = existingSpec?.id ?? spec.id;
    await this.db.insert(specVersions).values({
      id: version.id,
      specId,
      semver: version.semver,
      content: version.content,
      checksum: version.checksum,
      gitRef: version.gitRef ?? null,
      pushedBy: version.pushedBy ?? null,
      compatibility: version.compatibility ?? null,
      previousVersion: version.previousVersion ?? null,
      forceReason: version.forceReason ?? null,
      isPrerelease: version.isPrerelease,
      createdAt: version.createdAt,
    });

    return version;
  }

  async deleteSpec(name: string): Promise<boolean> {
    const existingSpec = await this.getSpec(name);
    if (!existingSpec) return false;

    await this.db.delete(specVersions).where(eq(specVersions.specId, existingSpec.id));
    await this.db.delete(specs).where(eq(specs.id, existingSpec.id));
    return true;
  }

  async getCompatReport(name: string, semver: string): Promise<CompatReport | null> {
    const version = await this.getSpecVersion(name, semver);
    return version?.compatibility ?? null;
  }

  async logAudit(
    action: AuditAction,
    actor: string,
    specName: string,
    version: string | undefined,
    details: Record<string, unknown> | undefined
  ): Promise<void> {
    await this.db.insert(auditLog).values({
      id: uuid(),
      action,
      actor,
      specName,
      version: version ?? null,
      details: details ?? null,
      createdAt: new Date(),
    });
  }

  private mapSpecRow(row: typeof specs.$inferSelect): Spec {
    return {
      id: row.id,
      name: row.name,
      type: row.type as "openapi" | "asyncapi",
      description: row.description ?? undefined,
      owner: row.owner ?? undefined,
      sourceRepo: row.sourceRepo ?? undefined,
      tags: (row.tags as string[]) ?? [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapVersionRow(row: typeof specVersions.$inferSelect): SpecVersion {
    return {
      id: row.id,
      specId: row.specId,
      semver: row.semver,
      content: row.content,
      checksum: row.checksum,
      gitRef: row.gitRef ?? undefined,
      pushedBy: row.pushedBy ?? undefined,
      compatibility: (row.compatibility as CompatReport | null) ?? undefined,
      previousVersion: row.previousVersion ?? undefined,
      forceReason: row.forceReason ?? undefined,
      isPrerelease: row.isPrerelease,
      createdAt: row.createdAt,
    };
  }

  // GatewayConfigStore implementation

  async getGatewayConfig(name: string): Promise<GatewayConfig | null> {
    const rows = await this.db.select().from(gatewayConfigs).where(eq(gatewayConfigs.name, name)).limit(1);
    if (rows.length === 0) return null;
    return this.mapGatewayConfigRow(rows[0]);
  }

  async listGatewayConfigs(): Promise<GatewayConfig[]> {
    const rows = await this.db.select().from(gatewayConfigs);
    return rows.map((r) => this.mapGatewayConfigRow(r));
  }

  async getGatewayConfigVersion(name: string, versionId: string): Promise<GatewayConfigVersion | null> {
    const config = await this.getGatewayConfig(name);
    if (!config) return null;
    const rows = await this.db.select().from(gatewayConfigVersions)
      .where(and(eq(gatewayConfigVersions.gatewayConfigId, config.id), eq(gatewayConfigVersions.id, versionId)))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapGatewayConfigVersionRow(rows[0]);
  }

  async getLatestGatewayConfigVersion(name: string): Promise<GatewayConfigVersion | null> {
    const config = await this.getGatewayConfig(name);
    if (!config) return null;
    const rows = await this.db.select().from(gatewayConfigVersions)
      .where(eq(gatewayConfigVersions.gatewayConfigId, config.id))
      .orderBy(desc(gatewayConfigVersions.createdAt), desc(sql`rowid`))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapGatewayConfigVersionRow(rows[0]);
  }

  async listGatewayConfigVersions(name: string): Promise<GatewayConfigVersion[]> {
    const config = await this.getGatewayConfig(name);
    if (!config) return [];
    const rows = await this.db.select().from(gatewayConfigVersions)
      .where(eq(gatewayConfigVersions.gatewayConfigId, config.id))
      .orderBy(desc(gatewayConfigVersions.createdAt), desc(sql`rowid`))
      .limit(5);
    return rows.map((r) => this.mapGatewayConfigVersionRow(r));
  }

  async pushGatewayConfigVersion(config: GatewayConfig, version: GatewayConfigVersion): Promise<GatewayConfigVersion> {
    const existingConfig = await this.getGatewayConfig(config.name);

    if (!existingConfig) {
      await this.db.insert(gatewayConfigs).values({
        id: config.id,
        name: config.name,
        provider: config.provider,
        specName: config.specName,
        specSemver: config.specSemver,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      });
    } else {
      await this.db.update(gatewayConfigs)
        .set({ updatedAt: new Date(), specSemver: config.specSemver })
        .where(eq(gatewayConfigs.id, existingConfig.id));
    }

    const configId = existingConfig?.id ?? config.id;
    await this.db.insert(gatewayConfigVersions).values({
      id: version.id,
      gatewayConfigId: configId,
      routes: version.routes,
      environments: version.environments,
      callerIdentification: version.callerIdentification ?? null,
      content: version.content,
      checksum: version.checksum,
      pushedBy: version.pushedBy ?? null,
      createdAt: version.createdAt,
    });

    // Retain only latest 5 versions
    const versions = await this.db.select().from(gatewayConfigVersions)
      .where(eq(gatewayConfigVersions.gatewayConfigId, configId))
      .orderBy(desc(gatewayConfigVersions.createdAt), desc(sql`rowid`));

    if (versions.length > 5) {
      const toDelete = versions.slice(5);
      for (const v of toDelete) {
        await this.db.delete(gatewayConfigVersions)
          .where(eq(gatewayConfigVersions.id, v.id));
      }
    }

    return version;
  }

  async recordProvision(provision: Provision): Promise<void> {
    await this.db.insert(provisions).values({
      id: provision.id,
      gatewayConfigName: provision.gatewayConfigName,
      gatewayConfigVersion: provision.gatewayConfigVersion,
      environment: provision.environment,
      provider: provision.provider,
      synced: provision.synced,
      actor: provision.actor,
      details: provision.details ?? null,
      createdAt: provision.createdAt,
    });
  }

  async listProvisions(gatewayConfigName?: string): Promise<Provision[]> {
    const rows = gatewayConfigName
      ? await this.db.select().from(provisions)
          .where(eq(provisions.gatewayConfigName, gatewayConfigName))
          .orderBy(desc(provisions.createdAt))
      : await this.db.select().from(provisions)
          .orderBy(desc(provisions.createdAt));

    return rows.map((r) => ({
      id: r.id,
      gatewayConfigName: r.gatewayConfigName,
      gatewayConfigVersion: r.gatewayConfigVersion,
      environment: r.environment,
      provider: r.provider as "kong",
      synced: r.synced,
      actor: r.actor,
      details: r.details ?? undefined,
      createdAt: r.createdAt,
    }));
  }

  private mapGatewayConfigRow(row: typeof gatewayConfigs.$inferSelect): GatewayConfig {
    return {
      id: row.id,
      name: row.name,
      provider: row.provider as "kong",
      specName: row.specName,
      specSemver: row.specSemver,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapGatewayConfigVersionRow(row: typeof gatewayConfigVersions.$inferSelect): GatewayConfigVersion {
    return {
      id: row.id,
      gatewayConfigId: row.gatewayConfigId,
      routes: row.routes as GatewayConfigVersion["routes"],
      environments: row.environments as GatewayConfigVersion["environments"],
      callerIdentification: row.callerIdentification as GatewayConfigVersion["callerIdentification"] ?? undefined,
      content: row.content,
      checksum: row.checksum,
      pushedBy: row.pushedBy ?? undefined,
      createdAt: row.createdAt,
    };
  }

  async recordGatewayLog(log: GatewayLog): Promise<void> {
    await this.db.insert(httpLogs).values({
      id: log.id,
      provider: log.provider,
      gatewayConfigName: log.gatewayConfigName,
      environment: log.environment,
      method: log.method,
      path: log.path,
      routePath: log.routePath ?? null,
      status: log.status,
      callerId: log.callerId ?? null,
      callerSource: log.callerSource ?? null,
      callerConfidence: log.callerConfidence,
      occurredAt: log.occurredAt,
      createdAt: log.createdAt,
    });
  }

  async listGatewayLogs(filters: GatewayLogFilters): Promise<{ logs: GatewayLog[]; total: number }> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    let query = this.db.select().from(httpLogs);
    const conditions = [];

    if (filters.gatewayConfigName) {
      conditions.push(eq(httpLogs.gatewayConfigName, filters.gatewayConfigName));
    }
    if (filters.environment) {
      conditions.push(eq(httpLogs.environment, filters.environment));
    }
    if (filters.path) {
      conditions.push(eq(httpLogs.path, filters.path));
    }
    if (filters.method) {
      conditions.push(eq(httpLogs.method, filters.method));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(httpLogs.status, filters.status));
    }
    if (filters.from) {
      conditions.push(sql`${httpLogs.occurredAt} >= ${filters.from.getTime()}`);
    }
    if (filters.to) {
      conditions.push(sql`${httpLogs.occurredAt} <= ${filters.to.getTime()}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const countResult = await this.db.select({ count: sql<number>`count(*)` }).from(httpLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = countResult[0]?.count ?? 0;

    const rows = await query.orderBy(desc(httpLogs.occurredAt)).limit(limit).offset(offset);

    return {
      logs: rows.map((r) => ({
        id: r.id,
        provider: r.provider,
        gatewayConfigName: r.gatewayConfigName,
        environment: r.environment,
        method: r.method,
        path: r.path,
        routePath: r.routePath ?? undefined,
        status: r.status,
        callerId: r.callerId ?? undefined,
        callerSource: r.callerSource ?? undefined,
        callerConfidence: r.callerConfidence as GatewayLog["callerConfidence"],
        occurredAt: r.occurredAt,
        createdAt: r.createdAt,
      })),
      total,
    };
  }

  async getGatewayLog(id: string): Promise<GatewayLog | null> {
    const rows = await this.db.select().from(httpLogs).where(eq(httpLogs.id, id)).limit(1);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      provider: r.provider,
      gatewayConfigName: r.gatewayConfigName,
      environment: r.environment,
      method: r.method,
      path: r.path,
      routePath: r.routePath ?? undefined,
      status: r.status,
      callerId: r.callerId ?? undefined,
      callerSource: r.callerSource ?? undefined,
      callerConfidence: r.callerConfidence as GatewayLog["callerConfidence"],
      occurredAt: r.occurredAt,
      createdAt: r.createdAt,
    };
  }

  async getGatewayLogStats(_filters: GatewayLogFilters): Promise<GatewayLogStats[]> {
    // Build conditions for the stats query
    const conditions = [];
    if (_filters.gatewayConfigName) {
      conditions.push(eq(httpLogs.gatewayConfigName, _filters.gatewayConfigName));
    }
    if (_filters.environment) {
      conditions.push(eq(httpLogs.environment, _filters.environment));
    }
    if (_filters.from) {
      conditions.push(sql`${httpLogs.occurredAt} >= ${_filters.from.getTime()}`);
    }
    if (_filters.to) {
      conditions.push(sql`${httpLogs.occurredAt} <= ${_filters.to.getTime()}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        gatewayConfigName: httpLogs.gatewayConfigName,
        environment: httpLogs.environment,
        method: httpLogs.method,
        routePath: httpLogs.routePath,
        lastSeenAt: sql<number>`max(${httpLogs.occurredAt})`,
        totalCalls: sql<number>`count(*)`,
        uniqueCallerIds: sql<number>`count(distinct ${httpLogs.callerId})`,
      })
      .from(httpLogs)
      .where(whereClause)
      .groupBy(httpLogs.gatewayConfigName, httpLogs.environment, httpLogs.method, httpLogs.routePath);

    return rows.map((r) => ({
      gatewayConfigName: r.gatewayConfigName,
      environment: r.environment,
      method: r.method,
      routePath: r.routePath ?? "/",
      lastSeenAt: new Date(r.lastSeenAt),
      totalCalls: r.totalCalls,
      uniqueCallerIds: r.uniqueCallerIds,
    }));
  }

  async deleteGatewayLogsOlderThan(days: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    await this.db.delete(httpLogs).where(sql`${httpLogs.occurredAt} < ${cutoff.getTime()}`);
  }
}
