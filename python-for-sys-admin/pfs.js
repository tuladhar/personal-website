/*
 * Python for SysAdmin: shared rendering code.
 * Runs in the browser (window.PFS) and in the static build (scripts/python-for-sys-admin/build.mjs),
 * so a snapshot page and a live render produce the same HTML.
 * Needs the globals `marked` (12.x) and `hljs` (11.x).
 */
(function (root) {
  "use strict";

  var REPO = "tuladhar/Python-for-SysAdmin";
  var BRANCH = "main";
  var GH = "https://github.com/" + REPO;
  var BASE = "/python-for-sys-admin/";
  var SITE = "https://purutuladhar.com";
  var PLAYGROUND = "https://labs.iximiuz.com/playgrounds/python";
  var SKILLS = "https://github.com/tuladhar/my-claude-skills-as-devops-engineer";
  var NEW_ISSUE = GH + "/issues/new?template=chapter.yml";
  var RAW = "https://raw.githubusercontent.com/" + REPO + "/" + BRANCH + "/";

  var ICON_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var ICON_ISSUE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function slugify(s) { return s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, "").replace(/[`'"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  // FNV-1a, used to tell whether live content differs from the snapshot
  function hash(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); }

  /* ---------- the site model ---------- */
  // manifest: chapters/chapters.json; pages: slugs that have a static snapshot page
  function Site(manifest, pages) {
    this.manifest = manifest;
    this.pages = pages || [];
    this.flat = []; this.bySlug = {}; this.byFile = {};
    var self = this;
    manifest.sections.forEach(function (sec) {
      sec.chapters.forEach(function (ch) {
        ch.section = sec.title; ch.n = self.flat.length + 1;
        self.flat.push(ch); self.bySlug[ch.slug] = ch; self.byFile[ch.file] = ch;
      });
    });
  }
  // a chapter with a snapshot page gets a clean URL; a newer one works through ?chapter=
  Site.prototype.url = function (slug) {
    return this.pages.indexOf(slug) >= 0 ? BASE + slug + "/" : BASE + "?chapter=" + encodeURIComponent(slug);
  };

  function issueUrl(w) { return NEW_ISSUE + "&title=" + encodeURIComponent("Chapter: " + w.title + " (" + w.module + ")"); }

  /* ---------- markdown ---------- */
  function renderChapter(site, md, sanitize) {
    var ids = {};
    var r = new marked.Renderer();
    r.code = function (code, info) {
      var lang = (info || "").trim().split(/\s+/)[0].toLowerCase();
      var label = lang || "text";
      var file = (code.match(/^(?:#!.*\n)?#\s*([\w.-]+\.py)\s*\n/) || [])[1];
      var html = lang && hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value : esc(code);
      return '<div class="code"><div class="code-head"><span class="file">' + esc(file || label) + '</span><span class="actions">' +
        (file ? '<a class="mini-btn" href="' + GH + "/blob/" + BRANCH + "/examples/" + encodeURIComponent(file) + '" target="_blank" rel="noopener">source</a>' : "") +
        '<button class="mini-btn" type="button" data-copy>copy</button></span></div><pre><code class="hljs language-' + esc(label) + '">' + html + "</code></pre></div>";
    };
    r.heading = function (text, level, raw) {
      if (level === 1) return "<h1>" + text + "</h1>";
      var id = slugify(raw) || "section";
      if (ids[id]) id += "-" + (++ids[id]); else ids[id] = 1;
      return "<h" + level + ' id="' + id + '">' + text + '<a class="anchor" href="#' + id + '" aria-label="Link to this section">#</a></h' + level + ">";
    };
    r.link = function (href, title, text) {
      var url = resolveHref(site, href || "");
      var ext = /^https?:/i.test(url);
      return '<a href="' + esc(url) + '"' + (title ? ' title="' + esc(title) + '"' : "") + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + text + "</a>";
    };
    r.image = function (href, title, text) {
      var url = /^https?:/i.test(href) ? href : new URL(href, RAW + "chapters/").href;
      return '<img src="' + esc(url) + '" alt="' + esc(text) + '" loading="lazy"' + (title ? ' title="' + esc(title) + '"' : "") + ">";
    };
    r.table = function (header, body) { return '<div class="table-wrap"><table><thead>' + header + "</thead><tbody>" + body + "</tbody></table></div>"; };
    var html = marked.parse(md, { renderer: r, gfm: true });
    html = html.replace(/(<h1>[\s\S]*?<\/h1>)/, "$1" + labCallout());
    return sanitize ? sanitize(html) : html;
  }

  function resolveHref(site, href) {
    if (/^(https?:|mailto:|#)/i.test(href)) return href;
    var parts = href.split("#"), file = parts[0].replace(/^\.\//, ""), frag = parts[1];
    if (site.byFile[file]) return site.url(site.byFile[file].slug) + (frag ? "#" + frag : "");
    var abs = new URL(parts[0], "https://x.invalid/" + REPO + "/chapters/").pathname.replace("/" + REPO + "/", "");
    return GH + "/blob/" + BRANCH + "/" + abs + (frag ? "#" + frag : "");
  }

  function labCallout() {
    return '<div class="callout-lab"><span class="ico">&gt;_</span><div>Run every example in this chapter in a <strong>free Linux VM</strong>. No setup, nothing to break on your laptop. Stuck? Try the <a href="' + SKILLS + '" target="_blank" rel="noopener"><code>/step-by-step</code> skill</a>.</div><a class="btn btn-primary" href="' + PLAYGROUND + '" target="_blank" rel="noopener">Open playground ↗</a></div>';
  }

  /* ---------- page parts ---------- */
  function sidebar(site, active) {
    var html = "";
    site.manifest.sections.forEach(function (sec) {
      html += '<div class="side-sec">' + esc(sec.title) + '</div><ul class="side-list">';
      sec.chapters.forEach(function (ch) {
        html += '<li><a href="' + site.url(ch.slug) + '"' + (ch.slug === active ? ' aria-current="page"' : "") + '><span class="n">' + pad(ch.n) + "</span><span>" + esc(ch.title) + "</span></a></li>";
      });
      html += "</ul>";
    });
    return html;
  }

  function home(site) {
    var m = site.manifest, flat = site.flat;
    var toc = m.sections.map(function (sec) {
      return "<div><h3>" + esc(sec.title) + '</h3><ul class="toc-list">' + sec.chapters.map(function (ch) {
        return '<li><a href="' + site.url(ch.slug) + '"><span class="n">' + pad(ch.n) + "</span><span><b>" + esc(ch.title) + "</b><small>" + esc(ch.summary || "") + "</small></span></a></li>";
      }).join("") + "</ul></div>";
    }).join("");
    var wanted = (m.wanted || []).map(function (w) {
      return '<li><a href="' + esc(issueUrl(w)) + '" target="_blank" rel="noopener" title="' + esc(w.summary) + '">+ ' + esc(w.title) + " <code>" + esc(w.module) + "</code></a></li>";
    }).join("");
    var first = flat[0] ? site.url(flat[0].slug) : BASE;
    var clone = "git clone " + GH + ".git &amp;&amp; cd Python-for-SysAdmin/examples";
    var skillCmd = "git clone " + SKILLS + ".git /tmp/skills &amp;&amp; cp -r /tmp/skills/skills/step-by-step ~/.claude/skills/";

    return '' +
    '<section class="hero"><div class="wrap">' +
      '<div>' +
        '<p class="eyebrow">● community guide · free &amp; open source</p>' +
        '<h1>Python for <em>SysAdmins</em> &amp; DevOps engineers</h1>' +
        '<p class="lead">A practical manual that teaches Python 3 through the work you already do: reading logs and configs, running commands, checking disks and ports, and turning one-off shell hacks into real tools.</p>' +
        '<div class="cta-row">' +
          '<a class="btn btn-primary" href="' + first + '">Start reading →</a>' +
          '<a class="btn" href="' + PLAYGROUND + '" target="_blank" rel="noopener">Practice in a free Linux VM ↗</a>' +
          '<a class="btn" href="' + GH + '" target="_blank" rel="noopener"><span class="star">★</span> Star on GitHub <span class="mono muted" data-stars></span></a>' +
        '</div>' +
        '<div class="hero-meta"><span>' + flat.length + ' chapters</span><span>Python 3.11+</span><span>standard library first</span><span>every script tested</span></div>' +
      '</div>' +
      '<div class="term" aria-label="Example terminal session">' +
        '<div class="term-bar"><i></i><i></i><i></i><span>laborant@python-01: ~/Python-for-SysAdmin/examples</span></div>' +
        '<pre><span class="p">$</span> <span class="o">python3 disk_alert.py /var</span>\n' +
        '/var: 87.4% used, 3.1 GiB free\n<span class="w">WARNING: /var is above 80%</span>\n\n' +
        '<span class="p">$</span> <span class="o">python3 tcp_port_checker.py db-01 -p 22 5432</span>\n' +
        'db-01:22    open\ndb-01:5432  open\n\n' +
        '<span class="p">$</span> <span class="o">python3 prune_backups.py /srv/backups</span>\n' +
        'deleting /srv/backups/etc-2026-11-09.tar.gz <span class="c"># 11 days old</span>\n\n' +
        '<span class="p">$</span> <span class="cursor"></span></pre>' +
      '</div>' +
    '</div></section>' +

    '<section class="block" id="playground"><div class="wrap">' +
      '<div class="section-head"><p class="kicker">Hands-on</p><h2>Practice on a real Linux box, right in your browser</h2>' +
      '<p>Reading about <code>subprocess</code> is not the same as killing a process. Every chapter is meant to be typed and run. The free <a href="' + PLAYGROUND + '" target="_blank" rel="noopener">iximiuz Labs Python Playground</a> gives you a disposable VM where breaking things is part of the lesson.</p></div>' +
      '<div class="grid-2">' +
        '<div class="card">' +
          '<div class="spec"><span class="tag">Linux VM · sudo</span><span class="tag">latest Python 3</span><span class="tag">uv · pyenv</span><span class="tag">Docker</span><span class="tag">VS Code</span><span class="tag">no paywall</span></div>' +
          '<ol class="steps">' +
            '<li><div><strong>Open the playground</strong><span>Sign in to iximiuz Labs and click <em>Start playground</em>. It boots in seconds.</span></div></li>' +
            '<li><div><strong>Clone this guide</strong><span>All the example scripts come with it.</span></div></li>' +
            '<li><div><strong>Run, break, fix</strong><span>Follow a chapter and run each script as you go.</span></div></li>' +
          '</ol>' +
          '<div class="copyline"><code>' + clone + '</code><button class="mini-btn" type="button" data-copy-text="' + clone + '">copy</button></div>' +
          '<a class="btn btn-primary" href="' + PLAYGROUND + '" target="_blank" rel="noopener">Launch the Python Playground ↗</a>' +
        '</div>' +
        '<div class="card" id="gifCard">' +
          '<figure class="gif-frame" id="gifFigure" hidden><img id="gifImg" alt="Starting the iximiuz Labs Python playground and running an example script" loading="lazy"><figcaption>Starting the playground and running <code>grep.py</code>.</figcaption></figure>' +
          '<div id="gifPlaceholder"><p class="kicker">Demo</p><h3 style="margin:.2rem 0 .6rem">Your first five minutes</h3>' +
          '<div class="chat" style="margin-top:1rem"><div class="bot">laborant@python-01:~$ <b>python3 --version</b><br>Python 3.14.x</div><div class="bot">laborant@python-01:~$ <b>cat /etc/passwd | python3 grep.py bash</b><br>root:x:0:0:root:/root:/bin/bash</div><div class="bot">laborant@python-01:~$ <b>python3 sys_01.py</b><br>Running on platform: linux</div></div>' +
          '<p class="muted" style="font-size:.88rem;margin:1rem 0 0">Recorded a nice demo GIF? <a href="' + GH + '/blob/main/CONTRIBUTING.md#adding-a-gif" target="_blank" rel="noopener">Contribute it</a>.</p></div>' +
        '</div>' +
      '</div>' +
    '</div></section>' +

    '<section class="block" id="chapters"><div class="wrap">' +
      '<div class="section-head"><p class="kicker">The manual</p><h2>' + flat.length + ' chapters, from <code>stdin</code> to sockets</h2><p>Each chapter teaches one module through a real task and ends with exercises. Read them in order, or jump to what you need today.</p></div>' +
      '<div class="toc-sections">' + toc + '</div>' +
    '</div></section>' +

    '<section class="block" id="ai"><div class="wrap">' +
      '<div class="grid-2">' +
        '<div class="card ai">' +
          '<span class="badge">Highly recommended</span>' +
          '<h3>Stuck? Learn it <span style="color:var(--brand)">step by step</span> with AI</h3>' +
          '<p>AI tools love to answer with a wall of text. The free <a href="' + SKILLS + '" target="_blank" rel="noopener"><code>/step-by-step</code> Claude skill</a> fixes that: it explains any topic one short, simple sentence at a time, and waits for you to say <strong>"understood"</strong> before moving on. It\'s the closest thing to a patient mentor sitting next to you.</p>' +
          '<div class="copyline"><code>' + skillCmd + '</code><button class="mini-btn" type="button" data-copy-text="' + skillCmd + '">copy</button></div>' +
          '<p class="muted" style="font-size:.85rem;margin:-.5rem 0 1.25rem">Then open Claude Code and type <code>/step-by-step</code> followed by any topic from this guide.</p>' +
          '<div class="cta-row"><a class="btn btn-primary" href="' + SKILLS + '" target="_blank" rel="noopener">Get the skill ↗</a><a class="btn" href="' + SKILLS + '" target="_blank" rel="noopener"><span class="star">★</span> Star it if it helps</a></div>' +
        '</div>' +
        '<div class="chat" aria-label="Example step-by-step conversation">' +
          '<div class="me">/step-by-step how subprocess.run captures stdout and the exit code</div>' +
          '<div class="bot"><b>Step 1.</b> subprocess.run() starts a program and waits for it to finish.<br><span class="muted">Reply "understood" to continue.</span></div>' +
          '<div class="me">understood</div>' +
          '<div class="bot"><b>Step 2.</b> It returns a CompletedProcess object that holds the result.</div>' +
          '<div class="me">understood</div>' +
          '<div class="bot"><b>Step 3.</b> The exit code is in result.returncode, where 0 means success.</div>' +
          '<div class="me">understood</div>' +
          '<div class="bot"><b>Step 4.</b> Add capture_output=True and text=True to get the output as a string in result.stdout.</div>' +
        '</div>' +
      '</div>' +
    '</div></section>' +

    '<section class="block" id="contribute"><div class="wrap">' +
      '<div class="section-head"><p class="kicker">Community driven</p><h2>This guide is written by people like you</h2><p>Know <code>logging</code> inside out? Automate switches with <code>netmiko</code>? Write the chapter you wish you had when you started. Merged chapters appear on this site automatically, with your name in the history.</p></div>' +
      '<div class="grid-2">' +
        '<div class="card"><h3 style="margin:0 0 .4rem">Help wanted</h3><p class="muted" style="margin:0 0 1rem;font-size:.92rem">Pick a topic to claim it. It opens a GitHub issue so nobody duplicates your work.</p>' +
          '<ul class="wanted">' + wanted + '</ul>' +
          '<div class="cta-row"><a class="btn btn-primary" href="' + GH + '/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">Read the contributing guide ↗</a><a class="btn" href="' + NEW_ISSUE + '" target="_blank" rel="noopener">Propose another topic</a></div>' +
        '</div>' +
        '<div class="card"><h3 style="margin:0 0 .8rem">Three ways to help</h3>' +
          '<ol class="steps">' +
            '<li><div><strong>Fix what you find</strong><span>Every chapter has an "Edit this page on GitHub" link. Typos and outdated examples count.</span></div></li>' +
            '<li><div><strong>Write a chapter</strong><span>Markdown plus runnable scripts in <code>examples/</code>. The guide explains the style.</span></div></li>' +
            '<li><div><strong>Record a GIF</strong><span>A 20-second demo in the playground helps beginners more than a page of text.</span></div></li>' +
          '</ol>' +
          '<div class="avatars" id="avatars" aria-label="Contributors"></div>' +
        '</div>' +
      '</div>' +
      '<div class="star-band" style="margin-top:2.5rem">' +
        '<h2><span style="color:var(--star)">★</span> Like it? Give it a star.</h2>' +
        '<p>Stars help other sysadmins find this guide, and keep new chapters coming. It takes one click.</p>' +
        '<div class="cta-row"><a class="btn btn-primary" href="' + GH + '" target="_blank" rel="noopener">★ Star Python for SysAdmin <span class="mono" data-stars></span></a><a class="btn" href="' + SKILLS + '" target="_blank" rel="noopener">★ Star the Claude skills</a></div>' +
      '</div>' +
    '</div></section>';
  }

  // the chapter page; bodyHtml is the rendered chapter (or a loading placeholder)
  function chapter(site, ch, bodyHtml) {
    var i = site.flat.indexOf(ch), prev = site.flat[i - 1], next = site.flat[i + 1];
    return '<div class="wrap"><div class="manual">' +
      '<nav class="sidebar" aria-label="Chapters">' + sidebar(site, ch.slug) +
        '<div class="side-cta">Want a chapter that isn\'t here? <a href="' + BASE + '#contribute">Help write it →</a></div></nav>' +
      '<div style="min-width:0">' +
        '<details class="mobile-toc"><summary>☰ Chapters (' + pad(ch.n) + "/" + pad(site.flat.length) + ')</summary><nav aria-label="Chapters (mobile)">' + sidebar(site, ch.slug) + "</nav></details>" +
        '<article class="prose" style="margin-top:1.25rem">' +
          '<div class="chapter-meta"><span class="num">Chapter ' + pad(ch.n) + '</span><span>' + esc(ch.section) + '</span></div>' +
          '<div id="chapterBody" data-slug="' + esc(ch.slug) + '">' + bodyHtml + '</div>' +
        "</article>" +
        '<div class="chapter-foot">' +
          '<div class="edit-row">' +
            '<a href="' + GH + "/edit/" + BRANCH + "/chapters/" + encodeURIComponent(ch.file) + '" target="_blank" rel="noopener">' + ICON_EDIT + "Edit this page on GitHub</a>" +
            '<a href="' + GH + "/issues/new?title=" + encodeURIComponent("[" + ch.title + "] ") + '" target="_blank" rel="noopener">' + ICON_ISSUE + "Report a problem</a>" +
          "</div>" +
          '<div class="pager">' +
            (prev ? '<a class="prev" href="' + site.url(prev.slug) + '"><small>← Previous</small>' + esc(prev.title) + "</a>" : "") +
            (next ? '<a class="next" href="' + site.url(next.slug) + '"><small>Next →</small>' + esc(next.title) + "</a>" : '<a class="next" href="' + BASE + '#contribute"><small>You reached the end →</small>Help write the next chapter</a>') +
          "</div>" +
          '<div class="contrib-card"><h4>Made it this far? Help the next learner.</h4><p>This guide is community driven. Fix something on this page, write a missing chapter, or just give the repo a star so more people find it.</p>' +
            '<div class="cta-row"><a class="btn btn-primary" href="' + GH + '" target="_blank" rel="noopener">★ Star on GitHub <span class="mono" data-stars></span></a><a class="btn" href="' + GH + '/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">Contribute a chapter</a></div></div>' +
        "</div>" +
      "</div>" +
    "</div></div>";
  }

  function chapterTitle(ch) { return ch.title + " | Python for SysAdmin"; }
  var HOME_TITLE = "Python for SysAdmin | A community guide for DevOps & sysadmins";

  root.PFS = {
    REPO: REPO, BRANCH: BRANCH, GH: GH, BASE: BASE, SITE: SITE, RAW: RAW, PLAYGROUND: PLAYGROUND, SKILLS: SKILLS,
    HOME_TITLE: HOME_TITLE, esc: esc, pad: pad, hash: hash, Site: Site,
    renderChapter: renderChapter, home: home, chapter: chapter, chapterTitle: chapterTitle
  };
})(typeof window !== "undefined" ? window : globalThis);
