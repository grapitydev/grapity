# Changelog

This changelog merges the histories of the four previously separate packages
(`@grapity/core`, `@grapity/registry`, `@grapity/hub`, `@grapity/cli`) into the
unified `@grapity/grapity` package.

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
