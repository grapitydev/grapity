# Consumer example (GitHub Actions)

Copy-paste workflow for repositories that materialize specs from a Grapity
registry. It uses the composite action
[`grapitydev/grapity/actions/grapity`](../../actions/grapity), which installs
the CLI and wraps `grapity materialize --check`.

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

Authenticated registries (Keycloak client credentials) switch
`auth-mode: none` to `auth-mode: keycloak` and pass these inputs (the
commented lines in the file):

| Input | Source | Description |
| --- | --- | --- |
| `keycloak-server-url` | Variable | Keycloak server URL |
| `realm` | Variable | Keycloak realm |
| `client-id` | Variable | Client id (needs the `specs:read` scope) |
| `client-secret` | Secret | Client secret |

## Behavior

- **Warn by default.** Stale specs never fail the pipeline; they surface as a
  PR comment and as inline `::warning::` annotations in the GitHub checks UI.
- **Sticky comment.** The comment is keyed by the `materialize-check` header
  and updated in place, so re-runs never spam the PR. Set
  `post-comment: "false"` to disable it (the job summary always shows the
  status).
- **All-clear.** When drift is resolved, the comment is edited to confirm all
  specs are up to date, so the PR always reflects the current state.
- **Blocking mode.** Add `fail-on-stale: "true"` to fail the pipeline on
  drift; the comment still posts on a red run.

## Committing vs restoring specs

This example assumes the usual flow: run `grapity materialize` locally and
commit the specs, `grapity.yaml`, and `grapity-lock.json`. If your team
prefers not to commit the spec files, gitignore them and run
`grapity materialize` before codegen (locally and in CI) to restore the exact
pinned versions from the manifest and lockfile.
