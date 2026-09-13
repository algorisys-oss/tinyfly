# Deployment Guide

This guide covers how to deploy tinyfly to various platforms.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Build for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Build the embeddable player (optional)
npm run build:player
```

The build output is in the `dist/` directory. The player build goes to
`lib/player/` instead, so an app build (which empties `dist/`) doesn't delete it.

Besides the editor, `npm run build` writes the docs for language models to the
site root (see `vite-llms-plugin.ts`):

- `llms.txt` — an [llmstxt.org](https://llmstxt.org) index of the docs
- `llms-full.txt` — every doc in one file
- `docs/<page>.md` — each doc as raw markdown

Configure your host to serve `.md` and `.txt` files as text (`text/markdown` and
`text/plain`), not as downloads, and make sure the SPA fallback below doesn't
replace them with `index.html`. Because `/docs` is also an editor route, the host
must answer `/docs` with `index.html`, not a directory listing or an error for the
`docs/` folder. The dev server serves the same paths.

## Publishing to OSS Repository

The project uses a separate OSS (Open Source Software) repository for public releases. The `publish-oss.sh` script handles publishing a cleaned version without internal files.

### What Gets Excluded

Files listed in `.ossignore` are excluded from OSS publishing:
- `scripts/` - Internal publishing scripts
- `CLAUDE.md` - Internal AI instructions

### Publishing Process

```bash
# Dry run - preview what will be published
npm run release:oss:dry-run      # ./scripts/publish-oss.sh

# Push to the OSS repo, build the CDN bundles into cdn/, and tag v{version}
npm run release:oss              # ./scripts/publish-oss.sh --push
```

These two npm scripts exist only in the private repository: the publish script
replaces the OSS copy's `scripts` with the public set (`dev`, `build`, the library
builds, `test`, `e2e`), since `scripts/` itself is not published.

### What the Script Does

1. Creates a clean copy from the latest git commit
2. Removes paths listed in `.ossignore`
3. Builds the browser and player bundles from that copy into `cdn/`
4. Patches `package.json` (removes `private` flag)
5. Pushes to the OSS repository and tags the commit `v{version}`, unless that
   tag already exists (see [jsDelivr GitHub CDN](#jsdelivr-github-cdn))

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OSS_REMOTE` | Git URL of the OSS repository | `https://github.com/algorisys-oss/tinyfly.git` |
| `OSS_BRANCH` | Branch to push to | `main` |
| `OSS_MESSAGE` | Custom commit message | Auto-generated |

### Example with Custom Message

```bash
OSS_REMOTE=https://github.com/algorisys-oss/tinyfly.git \
OSS_MESSAGE="Release v1.0.0" \
./scripts/publish-oss.sh --push
```

## Deployment Options

### 1. Static Hosting (Recommended)

Tinyfly is a static SPA (Single Page Application) that can be deployed to any static hosting service.

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

Or drag and drop the `dist/` folder to [Netlify Drop](https://app.netlify.com/drop).

**netlify.toml** (optional, for redirects):
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### GitHub Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Add base path to `vite.config.ts` if deploying to a subpath:
   ```typescript
   export default defineConfig({
     base: '/tinyfly/',
     plugins: [solid()],
   })
   ```

3. Deploy using GitHub Actions or manually push the `dist/` folder to the `gh-pages` branch.

**GitHub Actions workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

#### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `dist`

#### AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync to S3 bucket
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache (if using)
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### 2. Docker Deployment

Create a `Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Serve docs/*.md as text instead of a download (.txt is text/plain already)
    location ~* \.md$ {
        default_type text/markdown;
        charset utf-8;
        charset_types text/markdown;
    }

    # Handle SPA routing. No `$uri/`: /docs is an editor route, but dist/docs/
    # is also a folder of .md files, and nginx would answer 403 for the folder.
    location / {
        try_files $uri /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

Build and run:

```bash
# Build image
docker build -t tinyfly .

# Run container
docker run -p 8080:80 tinyfly
```

### 3. Node.js Server (with serve)

For simple deployments:

```bash
# Install serve globally
npm i -g serve

# Build and serve
npm run build
serve -s dist -l 3000
```

## Environment Configuration

### Base URL

If deploying to a subpath (e.g., `https://example.com/tinyfly/`), update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/tinyfly/',
  plugins: [solid()],
})
```

### SPA Routing

Tinyfly uses client-side routing. Ensure your server/hosting is configured to:
- Serve `index.html` for all routes (fallback)
- This is required for `/app` (the editor), `/examples`, `/showcase/…`, `/docs` and other routes to work on direct access

## Embedding the Player

The embeddable player can be built separately:

```bash
npm run build:player
```

This writes `lib/player/tinyfly-player.{iife,es,umd}.js`. The IIFE build is a
plain script that puts the player on a `tinyfly` global:

```html
<div id="container"></div>

<script src="https://your-cdn.com/tinyfly-player.iife.js"></script>
<script>
  tinyfly.play('#container', 'animation.json', { loop: -1, autoplay: true })
</script>
```

This is the same code the editor's **Embed** dialog generates.

## jsDelivr GitHub CDN

Every release publishes the bundles to the `cdn/` folder of
[algorisys-oss/tinyfly](https://github.com/algorisys-oss/tinyfly) and tags the
commit `v{version}` (`./scripts/publish-oss.sh --push`, above). jsDelivr serves
them straight from GitHub, so you don't need to host the scripts yourself:

```
https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v{version}/cdn/tinyfly.iife.js
```

| File | What | Global |
|---|---|---|
| `tinyfly.iife.js` | Everything: engine, player, `live` (GSAP-style), drivers, interaction | `tinyfly` |
| `tinyfly.umd.js` | The same, as UMD | `tinyfly` |
| `tinyfly.esm.js` | The same, as an ES module | — |
| `tinyfly-player.iife.js` | Player only, for playing exported JSON | `tinyfly` |

Pin a version tag in production. The script never moves an existing tag, so a
pinned URL keeps serving the same file; bump the version in `package.json` to
publish new bundles. `@main` follows the latest publish and jsDelivr caches it for
up to a day.

## Performance Optimization

### Caching Headers

Configure your server/CDN with appropriate cache headers:

| File Type | Cache Duration |
|-----------|---------------|
| `*.html`  | No cache or short (5 min) |
| `*.js`, `*.css` | 1 year (files are hashed) |
| `*.json` (animations) | Based on update frequency |

### CDN Configuration

For best performance:
1. Enable gzip/brotli compression
2. Use HTTP/2 or HTTP/3
3. Configure appropriate cache headers
4. Consider edge caching for static assets

## Monitoring

### Health Check Endpoint

The application serves static files, so a simple HTTP 200 check on `/` suffices.

### Error Tracking

Consider integrating error tracking (Sentry, LogRocket, etc.) by adding the script to `index.html`:

```html
<script src="https://js.sentry-cdn.com/your-key.min.js" crossorigin="anonymous"></script>
```

## Troubleshooting

### Routes return 404

Ensure your server is configured to serve `index.html` for all routes (SPA fallback).

### Assets not loading

Check the `base` path in `vite.config.ts` matches your deployment path.

### CORS issues with animations

If loading animation JSON files from a different domain, ensure CORS headers are set:

```
Access-Control-Allow-Origin: *
```

## Security Considerations

1. **Content Security Policy**: Configure appropriate CSP headers
2. **HTTPS**: Always use HTTPS in production
3. **Subresource Integrity**: Consider adding SRI to external scripts

Example CSP header:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
```
