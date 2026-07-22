<p align="center">
  <a href="https://grapity.dev">
    <img src="./assets/grapity-header.png" alt="Grapity — API contract governance" width="720" />
  </a>
</p>

<p align="center">
  <strong>Open-source API governance.</strong> Ship APIs that won't break your consumers.
</p>

<p align="center">
  <a href="https://github.com/grapitydev/grapity/actions/workflows/ci.yml"><img src="https://github.com/grapitydev/grapity/actions/workflows/ci.yml/badge.svg?branch=main&event=push" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@grapity/grapity"><img src="https://img.shields.io/npm/v/@grapity/grapity.svg" alt="npm" /></a>
  <a href="https://github.com/grapitydev/grapity/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License: Apache 2.0" /></a>
  <a href="https://grapity.dev/docs/getting-started/quickstart"><img src="https://img.shields.io/badge/docs-online-blue.svg" alt="Docs" /></a>
</p>

<p align="center">
  <a href="https://grapity.dev">grapity.dev</a> ·
  <a href="https://grapity.dev/docs/getting-started/quickstart">Quickstart</a> ·
  <a href="https://grapity.dev/docs/cli-reference/init">CLI Reference</a> ·
  <a href="https://x.com/grapitydev">@grapitydev</a>
</p>

Grapity is a contract registry that validates backward compatibility, auto-assigns semver, provisions Kong gateways from the same spec, and serves a browsable Hub for every API your team ships.

## Installation

macOS and Linux (auto-detects Homebrew, apt, dnf or pacman):

```bash
curl -fsSL https://packages.grapity.dev/install.sh | sh
```

Any platform with Node.js 20+ (incl. Windows):

```bash
npm install -g @grapity/grapity
```

See the [installation guide](https://grapity.dev/docs/getting-started/installation/) for all methods.

## Quick start

### Local mode

Run a registry server on this machine. No external dependencies.

```bash
grapity init --local
grapity serve --no-auth
```

Open http://localhost:3000 for the Hub and use http://localhost:3750 for the Registry API.

### Remote mode

Connect to a hosted Grapity instance. No server to run.

```bash
grapity init --remote --url https://api.grapity.dev
```

## Things you can do

- **Publish specs** — `grapity registry push` validates backward compatibility and assigns semver.
- **Pull specs into repos** — `grapity materialize` pins versions in `grapity.yaml` and `grapity-lock.json`.
- **Provision gateways** — `grapity gateway provision` generates decK YAML and applies it to Kong.
- **Browse APIs** — `grapity serve` starts the Hub for exploring specs and comparing versions.

See the [CLI Reference](https://grapity.dev/docs/cli-reference/init) and [Platform docs](https://grapity.dev/docs/platform/) for full details.

## License

Apache-2.0
