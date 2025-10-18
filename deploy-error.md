# Deploy Error

Timed out
Port scan timeout reached, no open ports detected on 0.0.0.0. Detected open ports on localhost -- did you mean to bind one of these to 0.0.0.0?



==> Cloning from https://github.com/Elian-bang/date-log
==> Checking out commit a653703df96d8c1f05fe8bb1e4b96db7b6ffae3e in branch main
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install; npm run build'...
added 271 packages, and audited 272 packages in 6s
68 packages are looking for funding
run `npm fund` for details
2 moderate severity vulnerabilities
To address all issues (including breaking changes), run:
npm audit fix --force
Run `npm audit` for details.
> my-date-log@1.0.0 build
> tsc && vite build
vite v5.4.20 building for production...
transforming...
✓ 356 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.60 kB │ gzip:  0.39 kB
dist/assets/index-CA5BqNjG.css   19.16 kB │ gzip:  4.43 kB
dist/assets/index-BA1kSgEa.js    80.27 kB │ gzip: 20.19 kB
dist/assets/vendor-DzD5lsRU.js  202.27 kB │ gzip: 65.93 kB
✓ built in 2.22s
==> Uploading build...
==> Uploaded in 5.6s. Compression took 2.2s
==> Build successful 🎉
==> Deploying...
==> Running 'npm run dev'
> my-date-log@1.0.0 dev
> vite
VITE v5.4.20  ready in 2097 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
==> No open ports detected on 0.0.0.0, continuing to scan...
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
==> No open ports detected on 0.0.0.0, continuing to scan...
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
==> No open ports detected on 0.0.0.0, continuing to scan...
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
==> No open ports detected on 0.0.0.0, continuing to scan...
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
==> No open ports detected on 0.0.0.0, continuing to scan...
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
==> Port scan timeout reached, no open ports detected on 0.0.0.0. Detected open ports on localhost -- did you mean to bind one of these to 0.0.0.0?
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
==> Timed out: Port scan timeout reached, no open ports detected on 0.0.0.0. Detected open ports on localhost -- did you mean to bind one of these to 0.0.0.0?
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys