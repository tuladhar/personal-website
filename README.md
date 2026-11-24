# Puru Tuladhar - Personal Website

Welcome to repository that takes care of my personal website! 

This site is designed to showcase my work and interests, and it is powered by Cloudflare Pages.

This website utilizes GitHub integration for automatic deployment. Every time I commit changes to the main branch, Cloudflare Pages automatically builds and deploys the changes. This seamless integration allows for efficient updates and management of my personal website.

- Automatic Deployments: Changes are reflected on the live site immediately after pushing to the main branch.
- Fast Performance: Hosted on Cloudflare’s edge network, ensuring quick loading times for visitors.

For more details on how to set up a similar deployment process, you can refer to the [Cloudflare Git integration guide](https://developers.cloudflare.com/pages/get-started/git-integration/)

## Python for SysAdmin guide (`/python-for-sys-admin/`)

The guide's chapters live in [tuladhar/Python-for-SysAdmin](https://github.com/tuladhar/Python-for-SysAdmin). Pages here are a **static snapshot** of them, one pre-rendered page per chapter, so search engines and link previews see the full content. In the browser, each page also loads the latest chapter from GitHub, so readers see merged changes right away.

- Refresh the snapshot with the `/update-website` Claude Code skill, or run `node scripts/python-for-sys-admin/build.mjs` and open a PR.
- Generated files (do not edit by hand): `python-for-sys-admin/index.html`, `python-for-sys-admin/<chapter>/index.html`, `python-for-sys-admin/snapshot.json` and the marked block in `sitemap.xml`.
- Edit the design in `python-for-sys-admin/style.css`, `pfs.js`, `app.js` and `scripts/python-for-sys-admin/template.html`, then rebuild.
