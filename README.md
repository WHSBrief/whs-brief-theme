# WHS Brief — Ghost theme

Adapted from Ghost's official Casper theme for the WHS Brief subscription
publication. Free posts (`#blog` tag) and the paywalled weekly brief
(`#brief` tag) share this theme; access is gated per-post in Ghost Admin,
not by the theme.

## What's customised vs. stock Casper

- **Branding**: `assets/css/screen.css` overrides `--font-serif` to match
  the brand's serif stack, and tints the page background with a paper tone
  (`--whs-paper`). The accent colour itself is set in Ghost Admin
  (Settings > Design > Brand), not hardcoded in the theme — Casper already
  wires a `--ghost-accent-color` CSS variable everywhere for this. **When
  setting it: type the hex value WITH the `#` prefix (e.g. `#256464`, not
  `256464`) and click Save directly without clicking elsewhere first** —
  the colour-picker silently reverts to its previous value on blur if you
  don't include the `#`, or if you click away before saving.
- **`routes.yaml`** (repo root): defines `/blog/` and `/brief/` as tag-filtered
  collections with their own permalink structure. This is a Ghost
  *site-level* config file, not part of the theme zip — see the comment
  at the top of the file for how to apply it (local dev vs. live Ghost(Pro)).
- **Ad slots**: `partials/ad-header.hbs`, `ad-sidebar.hbs`, `ad-in-content.hbs`,
  wired into `default.hbs` and `post.hbs`. All gated behind the `show_ads`
  theme setting (off by default) and an `adsense_client_id` text setting —
  both configurable in Ghost Admin > Design > Theme settings, no code
  changes needed once an AdSense account is approved. Casper has no native
  sidebar column, so the sidebar slot renders as a fixed rail on viewports
  ≥1400px and is hidden below that.
- **Custom theme settings defaults** (`package.json` → `config.custom`):
  `title_font`/`body_font` default to "Elegant serif", `email_signup_text`
  defaults to WHS Brief copy.
- Package identity (`package.json` name/author) updated from "casper"/Ghost
  Foundation to "whs-brief"/Orana Skills Centre.

## Local development

Requires Node 22 (Ghost core itself pins to `^22.23.1` as of writing — newer
Node LTS releases are NOT yet supported by Ghost, even though this theme's
own `package.json` only asks for `>=22.12.0`) and Python 3 with `setuptools`
(needed to build better-sqlite3's native bindings — on Windows, Python's
installer doesn't create a `python3` command by default, so a `python3.exe`
shim copy of `python.exe` is needed).

```bash
pnpm install --frozen-lockfile   # via corepack, pinned to the version in package.json
pnpm run build                   # compile CSS/JS into assets/built/
pnpm run zip                     # build + package as dist/whs-brief.zip
pnpm exec gscan --fatal --verbose .   # Ghost's official theme validator
```

To preview against a real Ghost instance: `ghost install local` in a
separate directory (not this repo), copy this theme folder into its
`content/themes/whs-brief/`, copy `routes.yaml` into
`content/settings/routes.yaml`, `ghost restart`, then activate the theme in
Ghost Admin > Settings > Design > Change theme > Installed.

## Deploying to the live Ghost(Pro) site

**Manual (simplest, no setup required):**
1. `pnpm run zip` to produce `dist/whs-brief.zip`.
2. On the live site: Ghost Admin > Settings > Design > Change theme >
   Upload theme > select the zip > Activate.

**Automated (`.github/workflows/deploy-to-ghost-pro.yml`, already in this
repo but inactive until configured):**
Builds and uploads the theme via [TryGhost's official deploy action](https://github.com/TryGhost/action-deploy-theme)
on every push to `main`. To activate it:
1. Ghost Admin (live site) > Settings > Integrations > Add custom
   integration > name it e.g. "GitHub deploy" > copy the **Admin API Key**.
2. In this GitHub repo: Settings > Secrets and variables > Actions > add
   secret `GHOST_ADMIN_API_KEY` (the key from step 1) and secret/variable
   `GHOST_API_URL` (the site's URL, e.g. `https://www.whsbrief.com`).
3. Settings > Environments > New environment named `production-deploy` >
   enable **Required reviewers** with yourself added — this makes every
   deploy to the live site wait for your manual approval in the Actions
   tab, rather than pushing to production unattended.

Until steps 1–3 are done, the workflow will simply fail with a clear
"secret not configured" error — it won't touch the live site.

---

Originally forked from Ghost's official [Casper](https://github.com/TryGhost/Casper)
theme, MIT licensed, © Ghost Foundation.
