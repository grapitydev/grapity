# Producer example (GitHub Actions)

Copy-paste workflow for API repositories that publish their spec to a Grapity
registry. It uses the composite action
[`grapitydev/grapity/actions/grapity`](../../actions/grapity), which
installs the CLI and wraps `grapity registry validate` / `grapity registry
push` (the same action also serves consumers with `command: check`).

| File | What it does |
| --- | --- |
| `contract.yml` | Validates the spec on every pull request (breaking changes fail the check) and pushes a new version on every merge to main |

This is the same setup the Grapity repository runs for its own registry spec
in
[`.github/workflows/registry-dogfood.yml`](../../.github/workflows/registry-dogfood.yml),
which pushes on release instead of merge.

## Setup

The file opens with a commented header listing every value to replace. In
short: point `spec`/`paths` at your OpenAPI or AsyncAPI document, set the
spec name and the inline keycloak values (server URL, realm, client id), and
add under **Settings > Secrets and variables > Actions**:

| Name | Kind | Description |
| --- | --- | --- |
| `GRAPITY_REGISTRY_URL` | Variable | Registry base URL (e.g. `https://registry.example.com`) |
| `GRAPITY_CI_CLIENT_SECRET` | Secret | Client secret (client credentials grant, needs the `specs:write` scope) |

Pin the action to a release tag for reproducibility
(`grapitydev/grapity/actions/grapity@v0.17.0`) instead of `@main`.

## Notes

- **First registration**: validation passes with an `initial` classification
  when nothing is registered yet, so the first pull request is green.
- **Breaking changes** are rejected on push with `409`. Emergency overrides
  stay manual: `grapity registry push --force --reason "..."` records the
  reason in the audit log.
- **Public APIs**: add `visibility: public` to the push inputs to make the
  spec readable without a token.
- **Pre-release APIs**: add `prerelease: "true"` to the push inputs to keep
  versions in the 0.x line while the API is unstable.
- **Forks** do not receive repository secrets, so validation skips fork pull
  requests (the guard is already in the file).

Full action input reference:
[GitHub Actions CI](https://grapity.dev/docs/getting-started/github-actions).
