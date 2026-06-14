// CLI REFERENCE: grapity.dev/docs/cli-reference/auth.md
// If you add or change flags/behavior, update the doc above.

import { Command } from "commander";
import { getConfig, type KeycloakAuthConfig } from "../config";
import { getAccessToken, formatTokenStatus, resetTokenCache } from "../auth";
import { formatError, formatAuthStatus } from "../output";

export const authCommand = new Command("auth")
  .description("Manage authentication for remote registry mode")
  .addCommand(
    new Command("status")
      .description("Show current authentication status")
      .action(async () => {
        const config = getConfig();
        const auth = config.mode === "remote" ? config.remote?.auth : config.local?.auth;

        if (!auth) {
          console.log(formatAuthStatus({ mode: "none", configured: false }));
          return;
        }

        if (auth.mode !== "keycloak") {
          console.log(formatAuthStatus({ mode: auth.mode, configured: true }));
          return;
        }

        if (!auth.clientId) {
          console.error(
            formatError(
              "auth misconfigured",
              "Keycloak auth is configured but clientId is missing. Run grapity init with --keycloak-client-id."
            )
          );
          process.exit(1);
        }

        try {
          const token = await getAccessToken(auth as KeycloakAuthConfig);
          const status = formatTokenStatus(token);
          console.log(
            formatAuthStatus({
              mode: auth.mode,
              configured: true,
              serverUrl: auth.serverUrl,
              realm: auth.realm,
              clientId: auth.clientId,
              audience: auth.audience,
              ...status,
            })
          );
        } catch (err) {
          console.error(
            formatError(
              "auth failed",
              err instanceof Error ? err.message : "Unable to fetch access token"
            )
          );
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command("clear")
      .description("Clear the cached access token")
      .action(() => {
        resetTokenCache();
        console.log(formatAuthStatus({ mode: "none", configured: false, cleared: true }));
      })
  );
