# Changelog

This changelog merges the histories of the four previously separate packages
(`@grapity/core`, `@grapity/registry`, `@grapity/hub`, `@grapity/cli`) into the
unified `@grapity/grapity` package.

## [0.4.1](https://github.com/grapitydev/grapity/compare/v0.4.0...v0.4.1) (2026-06-14)


### Bug Fixes

* **registry:** generate route scopes at build time and remove runtime openapi.yaml dependency ([e3fbf83](https://github.com/grapitydev/grapity/commit/e3fbf832ec9fa843a5f28a9843876b8c1d19b17a))

## [0.4.0](https://github.com/grapitydev/grapity/compare/v0.3.0...v0.4.0) (2026-06-14)


### Features

* **auth,cli,hub,registry:** add Keycloak OIDC/JWT auth and scope enforcement ([1b525d6](https://github.com/grapitydev/grapity/commit/1b525d6a750859715f6b9c575b6aeb2ae8cd2b09))


### Bug Fixes

* **cli,registry:** surface friendly PostgreSQL connection errors on serve ([a8c55f3](https://github.com/grapitydev/grapity/commit/a8c55f30b6fafd39d0f8dce7fd9104b08c5303ea))
* **cli:** use package version from index and drop per-component version labels in serve output ([7feed64](https://github.com/grapitydev/grapity/commit/7feed641dc9b4d6ad60f67f0f7836d24ec68840a))

## [0.3.0](https://github.com/grapitydev/grapity/compare/v0.2.0...v0.3.0) (2026-06-13)


### Features

* add PostgreSQL support to registry with selectable backend ([cb3d6e4](https://github.com/grapitydev/grapity/commit/cb3d6e42aa788b29d8f8ae3bd4c42d17713f32d2))
* remove unimplemented CLI options and simplify server config ([10399aa](https://github.com/grapitydev/grapity/commit/10399aa8d3c648ee21d1163d1b7d36ac314dde5c))

## [0.2.0](https://github.com/grapitydev/grapity/compare/v0.1.0...v0.2.0) (2026-06-10)


### Features

* unify @grapity/core, @grapity/registry, @grapity/hub, @grapity/cli into @grapity/grapity ([d0d6c74](https://github.com/grapitydev/grapity/commit/d0d6c74bfd11ef9c8648f11fe1c962c99641c10c))


### Bug Fixes

* add renovate.json with fix prefix for dependency bumps ([13a8699](https://github.com/grapitydev/grapity/commit/13a8699ea15ac5e813ae0cd6f0bbba1f8c516c6f))
* drop bold Documentation prefix and link to Quickstart ([ebdad9b](https://github.com/grapitydev/grapity/commit/ebdad9b392ef401ff526dc78e7bdf52fe9f303ce))
* improve documentation link in README ([ae4f7d8](https://github.com/grapitydev/grapity/commit/ae4f7d8b4d4f03d8d598177c4e329eb3df38cec3))
* prevent vite build from clearing dist/ and removing core/registry output ([9d596d0](https://github.com/grapitydev/grapity/commit/9d596d0018fbb48447c2d68b6e1fc41bb02c0ceb))
* remove Node.js version requirement from README ([35269e6](https://github.com/grapitydev/grapity/commit/35269e649df65a7df45ef54acffddfe9552c29ca))
* remove redundant unified package description ([27dd33f](https://github.com/grapitydev/grapity/commit/27dd33fd3e05b0a48d47d6b6b576df7857015654))

## [0.1.0](https://github.com/grapitydev/grapity/releases/tag/v0.1.0) (2026-06-10)

### Features

* unify `@grapity/core`, `@grapity/registry`, `@grapity/hub`, `@grapity/cli` into single `@grapity/grapity` package

## Historical changelogs

### @grapity/cli

#### [0.8.0](https://github.com/grapitydev/cli/compare/v0.7.0...v0.8.0) (2026-06-08)

* add registry delete command and handle empty responses

#### [0.7.0](https://github.com/grapitydev/cli/compare/v0.6.0...v0.7.0) (2026-06-06)

* add blocked push output and validate formatting with breaking change error
* include latest version in spec list output

#### [0.6.0](https://github.com/grapitydev/cli/compare/v0.5.0...v0.6.0) (2026-06-02)

* add Apache-2.0 LICENSE file
* add gateway logs command and gateway engine

#### [0.5.0](https://github.com/grapitydev/cli/compare/v0.4.4...v0.5.0) (2026-05-25)

* add documentation links

#### [0.4.0](https://github.com/grapitydev/cli/compare/v0.3.0...v0.4.0) (2026-04-30)

* display resolved semver in registry spec header

#### [0.3.0](https://github.com/grapitydev/cli/compare/v0.2.2...v0.3.0) (2026-04-30)

* add syntax highlighting to registry spec output
* pretty-print JSON output in registry spec command
* rename --version to --semver in registry spec command

#### [0.2.0](https://github.com/grapitydev/cli/compare/v0.1.0...v0.2.0) (2026-04-29)

* unify CLI output theming across all commands
* update CLI to consume new registry API response shapes

#### [0.1.0](https://github.com/grapitydev/cli/compare/v0.0.12...v0.1.0) (2026-04-26)

* add registry spec command to fetch raw spec content

### @grapity/registry

#### [0.7.0](https://github.com/grapitydev/registry/compare/v0.6.0...v0.7.0) (2026-06-08)

* add delete spec endpoint and move openapi.yaml to core
* resolve $ref in diff engine for schemas, parameters, and additionalProperties

#### [0.6.0](https://github.com/grapitydev/registry/compare/v0.5.0...v0.6.0) (2026-06-06)

* expand compat engine with field-level deprecation and grace period enforcement
* update registry spec and services

#### [0.5.0](https://github.com/grapitydev/registry/compare/v0.4.0...v0.5.0) (2026-06-02)

* add Apache-2.0 LICENSE file
* add gateway log ingestion endpoints and storage

#### [0.4.0](https://github.com/grapitydev/registry/compare/v0.3.3...v0.4.0) (2026-05-25)

* add documentation links

#### [0.3.0](https://github.com/grapitydev/registry/compare/v0.2.1...v0.3.0) (2026-04-30)

* add Grapity-Resolved-Version header to spec serving endpoints

#### [0.2.0](https://github.com/grapitydev/registry/compare/v0.1.0...v0.2.0) (2026-04-29)

* adopt data envelope for all responses and add version pagination

#### [0.1.0](https://github.com/grapitydev/registry/compare/v0.0.9...v0.1.0) (2026-04-26)

* add SVG favicon to welcome page
* add welcome page at / with RGB glitch logo and API endpoint reference

### @grapity/hub

#### [0.4.0](https://github.com/grapitydev/hub/compare/v0.3.0...v0.4.0) (2026-06-08)

* improve schema parser accuracy for $ref, allOf, enums, and arrays

#### [0.3.0](https://github.com/grapitydev/hub/compare/v0.2.0...v0.3.0) (2026-06-06)

* add classification filter and version badges to spec list
* add JSON syntax highlighting and fix status code colors
* add YAML syntax highlighting to CodeBlock
* display deprecation indicators at endpoint, parameter, and property levels
* map spec type tags to brand colors (openapi=green, asyncapi=rose)
* monochromatic bash rendering in code blocks
* move spec type tags to purple to avoid color collision with version badges
* redesign endpoint display with flat layout and side-by-side examples
* redesign Hub UI with Changelog, VersionBadge pills, scroll-spy fix, and OverviewFooter
* replace hand-rolled JSON tokenizer with Shiki syntax highlighting
* support light/dark theme switching for Shiki syntax highlighting

#### [0.2.0](https://github.com/grapitydev/hub/compare/v0.1.3...v0.2.0) (2026-05-25)

* add documentation links

### @grapity/core

#### [0.4.0](https://github.com/grapitydev/core/compare/v0.3.0...v0.4.0) (2026-06-08)

* generate types from openapi.yaml and add deleteSpec to store interface

#### [0.3.0](https://github.com/grapitydev/core/compare/v0.2.0...v0.3.0) (2026-06-05)

* add change category to compat report and remove explicit version from push request
* add SpecListItem with latest version to list response

#### [0.2.0](https://github.com/grapitydev/core/compare/v0.1.0...v0.2.0) (2026-06-01)

* add Apache-2.0 LICENSE file
* add documentation links
* add gateway log types, caller identification, and provision interfaces

#### [0.1.0](https://github.com/grapitydev/core/compare/v0.0.4...v0.1.0) (2026-04-29)

* add PaginationMeta and wrap response types in data envelope
