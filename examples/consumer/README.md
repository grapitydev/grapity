# Consumer example (GitHub Actions)

Copy-paste workflow for repositories that materialize specs from a Grapity
registry.

| File | When it runs | What it does |
| --- | --- | --- |
| `materialize-check.yml` | Every pull request | Reports spec drift as a sticky PR comment and inline `::warning::` annotations in the checks UI |

A live repository running this exact workflow against the public
`grapity-registry` spec on registry.grapity.dev is available at
[grapitydev/example-consumer-github](https://github.com/grapitydev/example-consumer-github).

## Setup

The file opens with a commented header listing every value to replace.
Against public specs (anonymous reads) the only configuration needed is a
`GRAPITY_REGISTRY_URL` variable under **Settings > Secrets and variables >
Actions**.

Authenticated registries (Keycloak client credentials) additionally need the
keycloak block commented in the file plus these entries:

| Name | Kind | Description |
| --- | --- | --- |
| `KEYCLOAK_SERVER_URL` | Variable | Keycloak server URL |
| `KEYCLOAK_REALM` | Variable | Keycloak realm |
| `KEYCLOAK_CLIENT_ID` | Variable | Client id (needs the `specs:read` scope) |
| `KEYCLOAK_CLIENT_SECRET` | Secret | Client secret |

## Behavior

- **Warn by default.** Stale specs never fail the pipeline; they surface as a
  PR comment and as inline `::warning::` annotations in the GitHub checks UI.
- **Sticky comment.** The comment is keyed by the `materialize-check` header
  and updated in place, so re-runs never spam the PR. `skip_unchanged` avoids
  no-op edits.
- **All-clear.** When drift is resolved, the comment is edited to confirm all
  specs are up to date, so the PR always reflects the current state.
- **Blocking mode.** Change the check step to
  `grapity materialize --check --fail-on-stale` to fail the pipeline on
  drift. Details in the workflow header.

## Committing vs restoring specs

This example assumes the usual flow: run `grapity materialize` locally and
commit the specs, `grapity.yaml`, and `grapity-lock.json`. If your team
prefers not to commit the spec files, gitignore them and run
`grapity materialize` before codegen (locally and in CI) to restore the exact
pinned versions from the manifest and lockfile.
