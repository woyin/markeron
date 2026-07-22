# Distribution and Launch Checklist

Last researched: 2026-07-03

## Ready Now

### GitHub Pages Website

- Local source: `docs/`
- Workflow: `.github/workflows/pages.yml`
- Custom domain: `https://markeron.cn/` (GitHub Pages + Aliyun DNS)
- Legacy URL (redirects after DNS): `https://ifer47.github.io/markeron/`

#### Aliyun DNS (markeron.cn)

In [Aliyun DNS console](https://dc.console.aliyun.com/next/index#/domain-list/all), open **markeron.cn** → **DNS settings** → **Add record**:

| Type | Host | Value | TTL |
| :--- | :--- | :--- | :--- |
| A | `@` | `185.199.108.153` | 600 |
| A | `@` | `185.199.109.153` | 600 |
| A | `@` | `185.199.110.153` | 600 |
| A | `@` | `185.199.111.153` | 600 |

Optional `www` redirect:

| Type | Host | Value | TTL |
| :--- | :--- | :--- | :--- |
| CNAME | `www` | `ifer47.github.io` | 600 |

Then in GitHub **Settings → Pages**, confirm custom domain is `markeron.cn` and enable **Enforce HTTPS** once DNS checks pass (may take up to 24h).

### WinGet via Microsoft Store

MarkerOn already appears in the Microsoft Store WinGet source:

```powershell
winget install --id 9N6623X973JV --source msstore --accept-source-agreements
```

Keep this as the primary Windows package-manager install path for now.

Official references:

- Windows Package Manager overview: https://learn.microsoft.com/en-us/windows/package-manager/
- Submit packages: https://learn.microsoft.com/en-us/windows/package-manager/package/
- Submit manifests to repository: https://learn.microsoft.com/en-us/windows/package-manager/package/repository

### Product Hunt

Use the draft in `promo/launch-kit.md`.

Official notes checked:

- Product Hunt says makers can post their own product and start by clicking the Post button after logging in.
- Product Hunt recommends kicking off the conversation with a maker comment after posting.
- Product Hunt account age restrictions may apply.

Links:

- Post flow help: https://help.producthunt.com/en/articles/479557-how-to-post-a-product
- Getting started: https://help.producthunt.com/en/articles/2305333-getting-started
- Featuring guidelines: https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines

### Show HN

Use the draft in `promo/launch-kit.md`.

Important rule: submit something users can actually try, not a landing page alone. Use the GitHub repo or latest release as the URL.

Links:

- Guidelines: https://news.ycombinator.com/showhn.html
- Submit: https://news.ycombinator.com/submit

### AlternativeTo

Use this metadata:

- Name: `MarkerOn`
- Platforms: Windows, macOS
- License: Open Source / MIT
- Tags: screen annotation, desktop annotation, whiteboard, drawing, productivity, presentation
- Website: GitHub repo or GitHub Pages website
- Description: use the short description from `promo/launch-kit.md`
- Alternatives to list against: ZoomIt, Epic Pen, gInk, ppInk, ScreenBrush

Official FAQ says to use "Suggest new application" from the user menu and submit platforms, license, descriptions, tags, and related fields.

Link: https://alternativeto.net/faq/

## Needs Packaging Work

### Scoop

Portable Windows zip is published as `MarkerOn_X.Y.Z_x64_portable.zip`.

Local note: `packaging/scoop/README.md`

Target repository:

- Scoop Extras: https://github.com/ScoopInstaller/Extras

### Homebrew Cask

Draft cask exists at `packaging/homebrew/markeron.rb`.

Before submitting, test on macOS:

```bash
brew install --cask ./packaging/homebrew/markeron.rb
brew uninstall --cask markeron
```

Official references:

- Adding software: https://docs.brew.sh/Adding-Software-to-Homebrew
- Cask cookbook: https://docs.brew.sh/Cask-Cookbook
- Acceptable casks: https://docs.brew.sh/Acceptable-Casks

## Optional Directories

### SourceForge

Useful if you want an additional open-source project page and download mirror. SourceForge expects an open-source project, summary, icon, description, and screenshots.

Links:

- Create project: https://sourceforge.net/p/forge/documentation/Create%20a%20New%20Project/
- Promote project: https://sourceforge.net/p/forge/documentation/Promoting%20your%20project/

### Softpedia

Potentially useful for discovery, but submit carefully and make the GitHub/Microsoft Store official channel clear. Prioritize directories that link to the official downloads without repackaging.

## Suggested Launch Order

1. Merge and deploy GitHub Pages.
2. Add website link to GitHub repo About, README, and Microsoft Store listing.
3. Publish Product Hunt draft.
4. Publish Show HN using the repo/latest release URL.
5. Submit AlternativeTo.
6. Create portable Windows zip, then submit Scoop.
7. Test Homebrew cask on macOS, then submit.
8. Consider SourceForge only after official website and package managers are stable.
