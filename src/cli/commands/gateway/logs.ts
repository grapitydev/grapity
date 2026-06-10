import { Command } from "commander";
import { client } from "../../client";
import { formatError, formatEmptyState } from "../../output";

export const logsCommand = new Command("logs")
  .description("Query gateway logs and endpoint usage stats")
  .argument("<config-name>", "Gateway config name")
  .option("--env <environment>", "Filter by environment")
  .option("--path <path>", "Filter by request path")
  .option("--method <method>", "Filter by HTTP method")
  .option("--status <status>", "Filter by response status code", parseInt)
  .option("--from <iso-date>", "Filter logs from this date (ISO 8601)")
  .option("--to <iso-date>", "Filter logs to this date (ISO 8601)")
  .option("--limit <n>", "Number of logs to show", parseInt, 20)
  .option("--offset <n>", "Offset for pagination", parseInt, 0)
  .option("--stats", "Show aggregated endpoint usage stats instead of individual logs")
  .action(async (configName: string, options: {
    env?: string;
    path?: string;
    method?: string;
    status?: number;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
    stats?: boolean;
  }) => {
    try {
      if (options.stats) {
        const result = await client.getGatewayLogStats({
          gatewayConfig: configName,
          environment: options.env,
          from: options.from,
          to: options.to,
        });

        if (result.length === 0) {
          console.log(formatEmptyState("No usage data found for this gateway config.", [
            "Logs are ingested by the http-log plugin pointing at the registry.",
          ]));
          return;
        }

        console.log(`Endpoint usage for ${configName}`);
        console.log("-".repeat(80));
        for (const stat of result) {
          console.log(`  ${stat.method.padEnd(6)} ${stat.routePath.padEnd(40)}  ${stat.totalCalls.toString().padStart(6)} calls  ${stat.uniqueCallerIds.toString().padStart(4)} unique callers  last: ${new Date(stat.lastSeenAt).toLocaleString()}`);
        }
        return;
      }

      const result = await client.listGatewayLogs({
        gatewayConfig: configName,
        environment: options.env,
        path: options.path,
        method: options.method,
        status: options.status,
        from: options.from,
        to: options.to,
        limit: options.limit,
        offset: options.offset,
      });

      if (result.data.length === 0) {
        console.log(formatEmptyState("No logs found for this gateway config.", [
          "Logs are ingested by the http-log plugin pointing at the registry.",
        ]));
        return;
      }

      console.log(`Gateway logs for ${configName}`);
      console.log("-".repeat(100));
      for (const log of result.data) {
        const caller = log.callerId ?? "anonymous";
        const line = `${log.method.padEnd(6)} ${log.path.padEnd(40)}  status:${String(log.status).padStart(3)}  ${caller.padStart(20)}  ${log.occurredAt}`;
        console.log(line);
      }

      const { pagination } = result;
      if (pagination.hasMore) {
        const offset = options.offset ?? 0;
        const limit = options.limit ?? 20;
        console.log(`\nShowing ${offset}–${offset + result.data.length} of ${pagination.total}. Use --offset ${offset + limit} for more.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
