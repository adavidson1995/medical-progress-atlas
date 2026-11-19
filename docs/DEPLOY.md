# Deploying the atlas

The atlas is a static site. `npm run build` produces a `dist/` folder of plain files (HTML, JavaScript, CSS, fonts, the map outlines and the dataset), under 2 MB in total. It needs no server code, database, API key or map-tile service, so any static host works, and all three options below have free plans.

All asset paths are relative (`base: './'` in `vite.config.ts`), so the same build works at a domain root, under a sub-path such as `https://user.github.io/atlas/`, or opened from a local web server.

## Requirements

- Node.js 18 or later (the GitHub workflow uses the current LTS release) and npm.

## Build locally

```
npm ci              # install exact dependency versions from package-lock.json
npm test            # unit and dataset tests
npm run build       # validates data/, type-checks, and writes dist/
npm run preview     # serves dist/ at http://localhost:4173 to check it
```

`npm run build` stops if the dataset has any validation error.

### The social preview URL (`VITE_SITE_URL`)

Social networks need an **absolute** address for the preview image. Set `VITE_SITE_URL` to the site's final public address when building:

```
VITE_SITE_URL=https://your-name.github.io/atlas/ npm run build
```

If it is not set, the build still works, but the `og:image` and `og:url` tags are relative and link previews will not show the image. The preview image itself is `public/og-image.png` (1200 × 630), a screenshot of the site.

## Option 1: GitHub Pages (recommended)

The repository includes `.github/workflows/deploy.yml`, which tests, builds and deploys on every push to `main`, and sets `VITE_SITE_URL` automatically.

1. Create a GitHub repository and push this project to its `main` branch. (`node_modules/` and `dist/` are ignored by `.gitignore`.)
2. In the repository, open **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main`, or run the workflow by hand from the **Actions** tab ("Deploy to GitHub Pages" → "Run workflow").
4. When the run finishes, the site is at `https://<user>.github.io/<repository>/`. The address is also shown on the deploy step of the run.

GitHub Pages is free for public repositories. For a custom domain, add it under Settings → Pages; nothing in the build needs to change.

## Option 2: Cloudflare Pages

1. In the Cloudflare dashboard, create a Pages project and connect the Git repository (or use **Direct Upload** and upload the contents of `dist/`).
2. Build settings:
   - Framework preset: **None** (or Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `VITE_SITE_URL` = `https://<project>.pages.dev/` (or your custom domain)
   - If the default Node version is older than 18, add `NODE_VERSION` = `20`.
3. Deploy. Later pushes redeploy automatically.

## Option 3: Netlify

1. Add a new site from the Git repository (or drag the `dist/` folder onto the Netlify dashboard for a one-off deploy).
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variable: `VITE_SITE_URL` = `https://<site>.netlify.app/`
3. Deploy.

## Any other static host

Run `npm run build` with `VITE_SITE_URL` set, then upload the contents of `dist/` to the web root (or a sub-folder). No redirects or rewrite rules are needed: the app keeps its state in the URL fragment (`#...`), which never reaches the server.

## Updating the content

Edit the files in `data-src/` (see `DATA_SCHEMA.md`), run `npm run validate`, `npm test` and `npm run check-links`, then commit and push. The workflow rebuilds and redeploys.

## Third-party terms

- **Basemap:** Natural Earth country outlines, which are in the public domain (naturalearthdata.com/about/terms-of-use; credit is not required but is given in the site's About panel). They reach the project through the `world-atlas` npm package (ISC licence) and are bundled as `public/data/countries-110m.json` and `countries-50m.json`, so there are no tile-service limits or keys.
- **Fonts:** Public Sans and Newsreader, both under the SIL Open Font License 1.1, bundled through the `@fontsource-variable` packages.
- **Code dependencies:** React, d3 modules and topojson-client (MIT or ISC licences). See `package.json`.
