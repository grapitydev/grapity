# Materialize check example (GitHub Actions)

Copy-paste workflow for consumer repositories that materialize specs from a
Grapity registry. On every pull request it runs `grapity materialize --check`
and reports spec drift as a sticky PR comment: one comment, updated in place on
every push, showing either the outdated specs (materialized vs latest version)
or an all-clear note.

Two variants are provided:

| File | When to use |
| --- | --- |
| `materialize-check-public.yml` | The registry serves your specs publicly (anonymous reads, `auth: mode: none`). No registry credentials needed. |
| `materialize-check.yml` | The registry requires authentication (Keycloak client credentials). |

A live repository running the public variant is available at
[grapitydev/example-consumer-github](https://github.com/grapitydev/example-consumer-github).

## Setup (public specs)

1. Copy `materialize-check-public.yml` into your repo at
   `.github/workflows/materialize-check.yml`.
2. Add a **variable** (Settings > Secrets and variables > Actions > Variables)
   named `GRAPITY_REGISTRY_URL` with your registry base URL
   (e.g. `https://registry.grapity.dev`).
3. Open a pull request. The workflow comments with the freshness status of
   every spec in `grapity-lock.json`.

## Setup (authenticated registry)

1. Copy `materialize-check.yml` into your repo at
   `.github/workflows/materialize-check.yml`.
2. Add these secrets under **Settings > Secrets and variables > Actions**:

   | Secret | Description |
   | --- | --- |
   | `GRAPITY_REGISTRY_URL` | Base URL of the Grapity registry (e.g. `https://registry.example.com`) |
   | `KEYCLOAK_SERVER_URL` | Keycloak server URL |
   | `KEYCLOAK_REALM` | Keycloak realm |
   | `KEYCLOAK_CLIENT_ID` | Client id for the client credentials grant (needs the `specs:read` scope) |
   | `KEYCLOAK_CLIENT_SECRET` | Client secret |

3. Open a pull request. The workflow comments with the freshness status of
   every spec in `grapity-lock.json`.

Both variants need `pull-requests: write` (already declared in the files) so
the workflow can post and update the comment.

## Behavior

- **Warn by default.** Stale specs never fail the pipeline; they surface as a
  PR comment and as inline `::warning::` annotations in the GitHub checks UI.
- **Sticky comment.** The comment is keyed by the `materialize-check` header
  and updated in place, so re-runs never spam the PR. `skip_unchanged` avoids
  no-op edits.
- **All-clear.** When drift is resolved, the comment is edited to confirm all
  specs are up to date, so the PR always reflects the current state.

## Blocking mode

To fail the pipeline on drift instead of only warning, change the check step
to:

```yaml
grapity materialize --check --fail-on-stale
```

Note that `--fail-on-stale` exits non-zero, which marks the step failed (the
comment still posts thanks to `if: always()` on the comment step). Do not
combine `--fail-on-stale` with `--json` in the same step if you also want the
JSON output captured: the command exits before later steps in the same shell
block run. Use two steps if you need both.
