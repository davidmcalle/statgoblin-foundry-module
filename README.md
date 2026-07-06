# StatGoblin — Foundry VTT module

Collects every roll from your Foundry game and sends it to your self-hosted
StatGoblin dashboard. Fork of [whatwerolled](https://github.com/whatwerolled/whatwerolled-foundry-module)
(MIT), pointed at a self-hosted ingest API.

## Installation

In Foundry's **Add-on Modules** tab, click **Install Module** and paste:

```
https://github.com/davidmcalle/statgoblin-foundry-module/releases/latest/download/module.json
```

Enable **StatGoblin** in your world's module list.

## Setup

**Game Settings → Configure Settings → StatGoblin**:

| Setting          | Value                                            |
| ---------------- | ------------------------------------------------ |
| **Ingest URL**   | Your StatGoblin API endpoint, e.g. `https://rolls.example.com/api/ingest` |
| **Ingest Token** | The campaign's secret ingest token from your StatGoblin dashboard |

Both blank = nothing is sent.

## Development

```
npm install
npm run build   # tsc + vite → dist/
```

Symlink `dist/` into Foundry's `Data/modules/statgoblin` for local dev.
Releases: bump `version` in `package.json`, merge to `main` — CI tags, builds,
and publishes `module.json` + `module.zip`.

## Compatibility

Foundry v14+, dnd5e v5+.
