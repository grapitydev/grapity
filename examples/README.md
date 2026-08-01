# CI examples

Ready-to-copy GitHub Actions workflows for teams producing or consuming API
contracts through a Grapity registry. Every workflow opens with a commented
setup header listing the variables and secrets to configure.

## Producer (you own an API and publish its spec)

| File | What it does |
| --- | --- |
| [`producer/contract.yml`](producer/contract.yml) | Validates the spec on every pull request (breaking changes fail) and pushes a new version on merge to main |

The same setup the Grapity repository runs for its own registry spec, via the
composite action [`grapitydev/grapity/actions/grapity`](../actions/grapity).

## Consumer (you materialize specs from the registry)

| File | What it does |
| --- | --- |
| [`consumer/materialize-check.yml`](consumer/materialize-check.yml) | Reports spec drift on every pull request as a sticky PR comment |

A live consumer repository running this exact workflow is available at
[grapitydev/example-consumer-github](https://github.com/grapitydev/example-consumer-github).
