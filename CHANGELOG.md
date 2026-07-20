# Changelog

This changelog merges the histories of the four previously separate packages
(`@grapity/core`, `@grapity/registry`, `@grapity/hub`, `@grapity/cli`) into the
unified `@grapity/grapity` package.

## [0.10.0](https://github.com/grapitydev/grapity/compare/v0.9.0...v0.10.0) (2026-07-20)


### Features

* auto-bump homebrew formula on release ([278813f](https://github.com/grapitydev/grapity/commit/278813f6d78c9f7b9eaf403019338937779d2e1d))


### Bug Fixes

* upload standalone binaries with explicit repo flag ([47daa67](https://github.com/grapitydev/grapity/commit/47daa67897d847649f1ae4bda3f294d031c285ac))

## [0.9.0](https://github.com/grapitydev/grapity/compare/v0.8.2...v0.9.0) (2026-07-19)


### Features

* add npm keywords and sharpen package description for search discovery ([95f4cec](https://github.com/grapitydev/grapity/commit/95f4cec1fa00e4135069e2e75c21b1ed44f722ae))
* add standalone binary distribution and release pipeline ([4959ba7](https://github.com/grapitydev/grapity/commit/4959ba7485c3edc149536bcb554f7284df019d7d))


### Bug Fixes

* run CI on main pushes and pin README badge to main so bot PR approvals don't mark it failing ([b51a7ce](https://github.com/grapitydev/grapity/commit/b51a7cea79cd71f11ecd80de5e8a0a4484e8f88d))

## [0.8.2](https://github.com/grapitydev/grapity/compare/v0.8.1...v0.8.2) (2026-07-16)


### Bug Fixes

* slim demo image with production-only node_modules and pinned Bun ([4840d06](https://github.com/grapitydev/grapity/commit/4840d068d83385e479bbed18b1d9faf238d2371f))

## [0.8.1](https://github.com/grapitydev/grapity/compare/v0.8.0...v0.8.1) (2026-07-16)


### Bug Fixes

* shrink npm package from 21.6 MB to 272 KB ([f6584e1](https://github.com/grapitydev/grapity/commit/f6584e11290b96b825339e008bf80027bb80fdc9))

## [0.8.0](https://github.com/grapitydev/grapity/compare/v0.7.0...v0.8.0) (2026-07-15)


### Features

* **hub:** dynamic filters with URL sync and client-side filtering ([b1a9588](https://github.com/grapitydev/grapity/commit/b1a9588d53fe72e433b7be3bec97b644d831f226))
* improve Hub light mode contrast and theme-aware method colors ([45b0846](https://github.com/grapitydev/grapity/commit/45b0846a8012570108b82d575ba79db4c8121ade))


### Bug Fixes

* remove leftover sessionStorage references in Hub tests ([a1b5ec9](https://github.com/grapitydev/grapity/commit/a1b5ec95e34d46c1b9e61aa7efde851e382da9e6))
* share Hub auth session across tabs via localStorage ([9edaf1e](https://github.com/grapitydev/grapity/commit/9edaf1e5685ef2ad65caca68c0f91affad57a4c3))

## [0.7.0](https://github.com/grapitydev/grapity/compare/v0.6.0...v0.7.0) (2026-07-04)


### Features

* add demo container entrypoint, standalone servers, and publish workflow ([3b5c9a2](https://github.com/grapitydev/grapity/commit/3b5c9a2ff0ee16b92746a4ae6881536d6858a956))
* **demo:** expose registry on separate public url ([50f20cd](https://github.com/grapitydev/grapity/commit/50f20cd6095064e654d378a52cb58c1c53b900fe))
* **demo:** split demo entrypoint by GRAPITY_DEMO_MODE and route registry on port 3750 ([5150d8e](https://github.com/grapitydev/grapity/commit/5150d8e2016042d64b1d675884d531273c762550))
* **hub:** add Keycloak auth guard, login page, and 401 redirect flow ([0625eba](https://github.com/grapitydev/grapity/commit/0625ebab6280f5e78752baee161b5acf77a84908))
* **hub:** harmonize login card with try panel and simplify registry welcome ([7614fca](https://github.com/grapitydev/grapity/commit/7614fca3ac3a7557a4465d6b6a381097346351b4))


### Bug Fixes

* **demo:** install curl for healthchecks ([6bd220f](https://github.com/grapitydev/grapity/commit/6bd220f5e7ad243d6d061a8dd54115a4bf00bd76))
* **hub:** make 401 redirect navigate before throwing and remove dead code ([0bcfcc4](https://github.com/grapitydev/grapity/commit/0bcfcc4ceb89379adbc2c025074e7087a0794562))
* **hub:** persist PKCE verifier in localStorage across Keycloak redirect ([3474538](https://github.com/grapitydev/grapity/commit/3474538f46359fe8012f46ced640bf815606efcc))
* **hub:** serve static assets before SPA fallback ([d8b0b5b](https://github.com/grapitydev/grapity/commit/d8b0b5b702440819d24ae2cb2aeff2313267b00c))
* **hub:** stop auto-login on 401 and surface registry error message ([0e68f59](https://github.com/grapitydev/grapity/commit/0e68f597c6bbeeac5b012b0d8ba6bc6f0a188d2a))
* **registry:** allow Authorization and Content-Type headers in CORS ([c1e8b22](https://github.com/grapitydev/grapity/commit/c1e8b2262a9290e1b0f0695960485e94005770c8))

## [0.6.0](https://github.com/grapitydev/grapity/compare/v0.5.0...v0.6.0) (2026-06-21)


### Features

* add 60s product tour to README ([7eb1de2](https://github.com/grapitydev/grapity/commit/7eb1de28f277b2339abcaf2f1972f94830d00231))
* add CI, npm, license and docs badges ([d79c7dd](https://github.com/grapitydev/grapity/commit/d79c7dd54318fcc769a05358543f22f4598c9959))
* add grapity materialize command with grapity.yaml and grapity-lock.json ([e0c2542](https://github.com/grapitydev/grapity/commit/e0c254297c3f8ef35db0321bd0cf0444cdde6a0c))
* README poster click-to-play ([bca9d46](https://github.com/grapitydev/grapity/commit/bca9d4644711f7b4aee32c87510ff6324ee14914))
* rewrite README header for clarity ([994d91a](https://github.com/grapitydev/grapity/commit/994d91a8643190cb236cf1f7328bf6bc7a835b4b))


### Bug Fixes

* README poster opens grapity.dev tour instead of GitHub blob ([a920dd0](https://github.com/grapitydev/grapity/commit/a920dd05ad400ea921485b362b0ebf61065afd91))

## [0.5.0](https://github.com/grapitydev/grapity/compare/v0.4.1...v0.5.0) (2026-06-14)


### Features

* **ci:** add PR verification workflow ([66e8724](https://github.com/grapitydev/grapity/commit/66e872479d11751d9a8c9cceb053b282e23d8d73))
* **hub:** render endpoint security requirements and scopes in Overview ([31df845](https://github.com/grapitydev/grapity/commit/31df845535379555d8a7d418a7feca557541e259))


### Bug Fixes

* **deps:** update bun, npm, drizzle-orm, lucide-react, ora, uuid and mise-action ([b069988](https://github.com/grapitydev/grapity/commit/b06998828ce9495ad7cbb3c17ef4cae5ea3054e2))
* **hub:** remove redundant runtime config script from index.html ([bfd0f61](https://github.com/grapitydev/grapity/commit/bfd0f617755dc3df81327eacf94aea0c068f5b1e))
* **openapi:** migrate deprecated example and nullable to OpenAPI 3.1 equivalents ([d7179e5](https://github.com/grapitydev/grapity/commit/d7179e5cf2d1cd58bfe02b580a4ddb31b3944dc3))
* **openapi:** use openIdConnect security scheme for Keycloak OIDC ([00a8752](https://github.com/grapitydev/grapity/commit/00a87520944564bff8cfe272ed39eac08f94b284))
* **tests:** remove cross-repo doc sync test and resolve hardcoded cwd ([f98697d](https://github.com/grapitydev/grapity/commit/f98697de3c913eb79566c121fc6466c6eb149613))

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
