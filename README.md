# @grapity/grapity

grapity - API spec registry and compatibility guardian.

[Quickstart](https://grapity.dev/docs/getting-started/quickstart) · [CLI Reference](https://grapity.dev/docs/cli-reference/init)

## Installation

```bash
npm install -g @grapity/grapity
```

## Setup

### Local mode (SQLite)

Run a registry server on this machine. No external dependencies.

```bash
grapity init --local
grapity serve
```

For local development without Keycloak, use `--no-auth`:

```bash
grapity serve --no-auth
```

### Self-hosted (PostgreSQL + Keycloak)

```bash
grapity init --local \
  --db postgresql://user:pass@host:5432/grapity \
  --auth keycloak \
  --keycloak-server https://keycloak.example.com \
  --keycloak-realm grapity \
  --keycloak-client-id grapity-cli

export GRAPITY_CLIENT_SECRET="your-client-secret"
grapity serve
```

### Remote / SaaS

Connect to a hosted Grapity instance. No server to run.

```bash
grapity init --remote --url https://api.grapity.dev \
  --auth keycloak \
  --keycloak-server https://keycloak.example.com \
  --keycloak-realm grapity \
  --keycloak-client-id grapity-cli

export GRAPITY_CLIENT_SECRET="your-client-secret"
```

## Commands

### `grapity init`

Configure the registry. Writes `~/.grapity/config.yaml`.

```
--local                     Use local mode (SQLite or PostgreSQL)
--remote                    Use remote mode
--url <url>                 Registry URL (required for remote)
--port <port>               Port for local server (default: 3750)
--db <path-or-url>          SQLite path or postgresql:// URL (for local mode)
--auth <mode>               Auth mode: none | keycloak (default: none)
--keycloak-server <url>     Keycloak server URL
--keycloak-realm <realm>    Keycloak realm
--keycloak-client-id <id>   Keycloak client ID for CLI client credentials
--keycloak-audience <aud>   Keycloak token audience to validate
--keycloak-role-source <s>  Where to read roles from: scope | realm_access.roles
```

### `grapity serve`

Start the registry server and the Hub developer portal. Use `--no-hub` to skip the portal.

```
-p, --port <port>       Port to listen on (default: 3750)
--hub-port <port>       Port for the developer portal (default: 3000)
--no-hub                Skip starting the developer portal
--no-auth               Start without authentication (local development only)
```

### `grapity auth`

Check or clear the cached Keycloak access token.

```bash
grapity auth status    # Show current authentication status
grapity auth clear     # Clear the cached token
```

Client secrets are never written to `~/.grapity/config.yaml`. Set `GRAPITY_CLIENT_SECRET` (or `GRAPITY_TOKEN` for automation) before running commands.

Push a spec file to the registry. Validates structure, checks backward compatibility against the latest version, assigns a semver, and stores the result.

```
--name <name>         Spec name (required)
--type <type>         Spec type: openapi | asyncapi
--description <desc>  Description
--owner <owner>       Owner
--source-repo <url>   Source repository URL
--tags <tags>         Comma-separated tags
--git-ref <ref>       Git commit SHA
--pushed-by <by>      Pusher identity
--force               Force push even with breaking changes
--reason <reason>     Reason for force push (required with --force)
--prerelease          Use pre-release versioning (0.x)
```

Breaking changes block a push by default. Use `--force --reason <reason>` to override (recorded in the audit log).

### `grapity registry validate <file>`

Validate a spec against the latest version in the registry without storing anything. Returns the compatibility report.

```
--against <name>      Spec name to validate against (required)
```

### `grapity registry list`

List all specs in the registry.

```
--type <type>         Filter by spec type
--owner <owner>       Filter by owner
--tags <tags>         Comma-separated tag filter
```

### `grapity registry get <name>`

Get metadata and latest version details for a spec.

### `grapity registry versions <name>`

List all versions of a spec, newest first.

### `grapity registry spec <name>`

Fetch the raw spec document (OpenAPI/AsyncAPI file) for a spec. Prints to stdout, pipe-friendly.

```
--semver <semver>     Specific version (default: latest)
--format <format>     Output format: json or yaml (default: yaml)
```

Examples:

```bash
grapity registry spec payments-api                          # latest, yaml
grapity registry spec payments-api --format json            # latest, json
grapity registry spec payments-api --semver 1.2.0           # specific version
grapity registry spec payments-api --semver 1.2.0 | yq '.info.title'
```

### `grapity gateway list`

List all gateway configs in the registry.

### `grapity gateway push <file>`

Push a gateway config YAML file to the registry. Validates declared routes against the registered spec and stores the config.

```
--pushed-by <by>      Identity of the pusher
```

### `grapity gateway get <name>`

Show details for a gateway config.

```
--version <uuid>      Specific version UUID (defaults to latest)
```

### `grapity gateway versions <name>`

List all versions for a gateway config.

### `grapity gateway config <name>`

Fetch the raw gateway config YAML from the registry. Pipe-friendly.

```
--version <uuid>      Specific version UUID (defaults to latest)
--output <file>       Write output to a file instead of stdout
```

### `grapity gateway preview [file]`

Render decK YAML from a gateway config without running decK.

```
--env <name>          Target environment name (required)
--name <name>         Gateway config name (registry mode)
--version <uuid>      Specific version UUID (registry mode)
--output <file>       Write decK YAML to a file instead of stdout
```

Examples:

```bash
# From a local file
grapity gateway preview ./payments-gateway.config.yaml --env staging

# From the registry
grapity gateway preview --name payments-gateway --env staging
```

### `grapity gateway provision --name <name> --env <name>`

Provision a gateway config to Kong via decK. Fetches the latest version, generates decK YAML, and runs `deck gateway diff` against the environment's Kong admin API.

```
--version <uuid>      Specific config version (defaults to latest)
--sync                Apply changes via deck sync (default is diff)
```

Requires the `deck` CLI to be installed.

### `grapity gateway logs <config-name>`

Query gateway logs stored in the registry.

```
--env <environment>   Filter by environment
--path <path>         Filter by request path
--method <method>     Filter by HTTP method
--status <status>     Filter by response status code
--from <iso-date>     Filter logs from this date (ISO 8601)
--to <iso-date>       Filter logs to this date (ISO 8601)
--limit <n>           Number of logs to show (default: 20)
--offset <n>          Offset for pagination (default: 0)
--stats               Show aggregated endpoint usage stats instead of individual logs
```

## License

Apache-2.0
