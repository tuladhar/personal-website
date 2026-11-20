/*
 * Python for SysAdmin: browser runtime.
 * Pages arrive pre-rendered (see scripts/python-for-sys-admin/build.mjs). This script adds the theme
 * switcher, stars, copy buttons and in-page navigation, and refreshes content from GitHub when the
 * live chapters are newer than the snapshot.
 */
(function () {
  "use strict";
  var P = window.PFS;
  var snap = JSON.parse(document.getElementById("pfs-snapshot").textContent);
  var app = document.getElementById("app");

  // ?source=http://localhost:8001/ previews a local checkout of Python-for-SysAdmin (kept for this tab)
  var SRC = P.RAW;
  try {
    var qs = new URLSearchParams(location.search).get("source");
    if (qs) sessionStorage.setItem("pfs-source", qs);
    SRC = sessionStorage.getItem("pfs-source") || SRC;
  } catch (e) {}
  if (!/\/$/.test(SRC)) SRC += "/";

  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function sanitize(html) { return window.DOMPurify ? DOMPurify.sanitize(html, { ADD_ATTR: ["target"] }) : html; }

  /* ---------- old #/ links keep working ---------- */
  if (/^#\//.test(location.hash)) {
    var parts = location.hash.slice(2).split("/"), head = decodeURIComponent(parts[0] || "");
    var target = !head ? P.BASE : head.charAt(0) === "~" ? P.BASE + "#" + head.slice(1) :
      (snap.pages.indexOf(head) >= 0 ? P.BASE + head + "/" : P.BASE + "?chapter=" + encodeURIComponent(head)) + (parts[1] ? "#" + parts[1] : "");
    location.replace(target);
    return;
  }

  /* ---------- themes ---------- */
  var THEMES = [
    ["tokyo-night", "Tokyo Night", ["#1a1b26", "#9ece6a", "#7aa2f7"]],
    ["catppuccin", "Catppuccin", ["#1e1e2e", "#89b4fa", "#cba6f7"]],
    ["gruvbox", "Gruvbox", ["#282828", "#a9b665", "#d8a657"]],
    ["nord", "Nord", ["#2e3440", "#88c0d0", "#81a1c1"]],
    ["everforest", "Everforest", ["#2d353b", "#a7c080", "#7fbbb3"]],
    ["matte-black", "Matte Black", ["#121212", "#e68e0d", "#eaeaea"]],
    ["rose-pine", "Rosé Pine Dawn", ["#faf4ed", "#286983", "#b4637a"]],
    ["catppuccin-latte", "Catppuccin Latte", ["#eff1f5", "#1e66f5", "#8839ef"]]
  ];
  var themeBtn = document.getElementById("themeBtn"), themePop = document.getElementById("themePop");
  function setTheme(id) {
    document.documentElement.setAttribute("data-theme", id);
    try { localStorage.setItem("pfs-theme", id); } catch (e) {}
    var t = THEMES.filter(function (x) { return x[0] === id; })[0];
    if (t) document.querySelector('meta[name="theme-color"]').setAttribute("content", t[2][0]);
    themePop.querySelectorAll(".theme-opt").forEach(function (b) { b.setAttribute("aria-checked", b.dataset.theme === id ? "true" : "false"); });
  }
  THEMES.forEach(function (t) {
    var b = document.createElement("button");
    b.className = "theme-opt"; b.type = "button"; b.setAttribute("role", "menuitemradio"); b.dataset.theme = t[0];
    b.innerHTML = '<span class="swatch">' + t[2].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") + "</span>" + P.esc(t[1]);
    b.addEventListener("click", function () { setTheme(t[0]); closeTheme(); });
    themePop.appendChild(b);
  });
  setTheme(document.documentElement.getAttribute("data-theme") || "tokyo-night");
  function closeTheme() { themePop.classList.remove("open"); themeBtn.setAttribute("aria-expanded", "false"); }
  themeBtn.addEventListener("click", function (e) { e.stopPropagation(); var o = themePop.classList.toggle("open"); themeBtn.setAttribute("aria-expanded", o ? "true" : "false"); });
  document.addEventListener("click", function (e) { if (!themePop.contains(e.target)) closeTheme(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeTheme(); });

  /* ---------- stars and contributors ---------- */
  function setStars(n) { document.querySelectorAll("[data-stars]").forEach(function (el) { el.textContent = "★ " + n.toLocaleString(); }); }
  function refreshStars() { var s = store("pfs-stars"); if (s) setStars(+s); }
  if (store("pfs-stars")) refreshStars();
  else fetch("https://api.github.com/repos/" + P.REPO).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (d && typeof d.stargazers_count === "number") { store("pfs-stars", String(d.stargazers_count)); setStars(d.stargazers_count); }
  }).catch(function () {});

  var contributors = null;
  function loadContributors() {
    if (!contributors) {
      var c = store("pfs-contrib");
      contributors = c ? Promise.resolve(JSON.parse(c)) :
        fetch("https://api.github.com/repos/" + P.REPO + "/contributors?per_page=30").then(function (r) { return r.ok ? r.json() : []; }).then(function (list) {
          var slim = (list || []).filter(function (u) { return u.type === "User"; }).map(function (u) { return { l: u.login, a: u.avatar_url, h: u.html_url }; });
          store("pfs-contrib", JSON.stringify(slim)); return slim;
        }).catch(function () { return []; });
    }
    return contributors;
  }

  /* ---------- live content ---------- */
  var site = null, manifestText = null, mdCache = {};
  var livePromise = fetch(SRC + "chapters/chapters.json", { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status); return r.text();
  }).then(function (t) { manifestText = t; site = new P.Site(JSON.parse(t), snap.pages); return site; })
    .catch(function () { site = new P.Site(snap.manifest, snap.pages); return site; });

  function loadMd(ch) {
    if (mdCache[ch.file]) return Promise.resolve(mdCache[ch.file]);
    return fetch(SRC + "chapters/" + ch.file, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status); return r.text();
    }).then(function (t) { mdCache[ch.file] = t; return t; });
  }

  /* ---------- routing ---------- */
  function routeOf(loc) {
    var q = new URLSearchParams(loc.search).get("chapter");
    if (q) return q;
    var rest = loc.pathname.indexOf(P.BASE) === 0 ? loc.pathname.slice(P.BASE.length) : "";
    return decodeURIComponent(rest.replace(/\/(index\.html)?$/, ""));
  }

  var view = { slug: snap.slug || "" };   // what the server-rendered page shows

  function afterRender() {
    refreshStars();
    if (!view.slug) {
      setupGif();
      loadContributors().then(function (list) {
        var el = document.getElementById("avatars");
        if (!el || !list.length) return;
        el.innerHTML = list.map(function (u) { return '<a href="' + P.esc(u.h) + '" target="_blank" rel="noopener" title="' + P.esc(u.l) + '"><img src="' + P.esc(u.a) + '&s=64" alt="' + P.esc(u.l) + '" loading="lazy"></a>'; }).join("");
      });
    } else {
      var cur = document.querySelector('.sidebar [aria-current="page"]');
      if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" });
    }
  }

  function showHome(fresh) {
    if (view.slug !== "" || fresh) app.innerHTML = P.home(site);
    view.slug = "";
    document.title = P.HOME_TITLE;
    afterRender();
  }

  function showChapter(slug, fresh) {
    var ch = site.bySlug[slug];
    if (!ch) { app.innerHTML = notFound(slug); document.title = "Not found | Python for SysAdmin"; view.slug = slug; return; }
    if (view.slug !== slug || fresh) {
      app.innerHTML = P.chapter(site, ch, '<p class="loading">loading chapter</p>');
      if (!fresh) window.scrollTo(0, 0);
    }
    view.slug = slug;
    document.title = P.chapterTitle(ch);
    var body = document.getElementById("chapterBody");
    var staticHash = body.getAttribute("data-md-hash");
    loadMd(ch).then(function (md) {
      if (view.slug !== slug) return;
      if (staticHash && staticHash === P.hash(md)) return;  // snapshot is current: keep it
      body.innerHTML = P.renderChapter(site, md, sanitize);
      body.setAttribute("data-md-hash", P.hash(md));
      if (location.hash) scrollToId(location.hash.slice(1));
    }).catch(function () {
      if (staticHash) return;  // offline or GitHub down: the snapshot is still readable
      body.innerHTML = '<div class="error-box"><h1 style="font-size:1.5rem">Couldn\'t load this chapter</h1><p>Read it on GitHub: <a href="' + P.GH + "/blob/" + P.BRANCH + "/chapters/" + encodeURIComponent(ch.file) + '">' + P.esc(ch.file) + "</a>.</p></div>";
    });
    afterRender();
  }

  function notFound(slug) {
    return '<div class="wrap" style="padding:3rem 1rem"><div class="error-box"><h1 style="font-size:1.5rem;margin-top:0">No chapter called "' + P.esc(slug) + '"</h1><p><a href="' + P.BASE + '#chapters">See all chapters</a>.</p></div></div>';
  }

  function render(fresh) {
    var slug = routeOf(location);
    if (slug) showChapter(slug, fresh); else showHome(fresh);
  }

  function scrollToId(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }

  function setupGif() {
    var img = document.getElementById("gifImg");
    if (!img || img.getAttribute("src")) return;
    img.onload = function () { document.getElementById("gifFigure").hidden = false; document.getElementById("gifPlaceholder").hidden = true; };
    img.onerror = function () { img.removeAttribute("src"); };
    img.src = SRC + "assets/playground-demo.gif";
  }

  // in-site links navigate without a full page load
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy],[data-copy-text]");
    if (b) {
      var text = b.hasAttribute("data-copy-text") ? b.getAttribute("data-copy-text") : b.closest(".code").querySelector("pre").innerText;
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { var o = b.textContent; b.textContent = "copied ✓"; setTimeout(function () { b.textContent = o; }, 1400); }, function () {});
      return;
    }
    var a = e.target.closest("a[href]");
    if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var url = new URL(a.getAttribute("href"), location.href);
    if (url.origin !== location.origin || url.pathname.indexOf(P.BASE) !== 0) return;
    if (url.pathname === location.pathname && url.search === location.search) return;  // same page, e.g. #anchor
    if (!site) return;  // live data not ready: let the browser load the page
    e.preventDefault();
    history.pushState(null, "", url.pathname + url.search + url.hash);
    render(false);
    if (url.hash) setTimeout(function () { scrollToId(url.hash.slice(1)); }, 0);
  });
  window.addEventListener("popstate", function () { render(false); });

  /* ---------- boot ---------- */
  afterRender();
  livePromise.then(function () {
    var slug = routeOf(location);
    if (slug !== view.slug) return render(true);       // e.g. ?chapter=new-chapter on the home snapshot
    if (!slug) {
      if (manifestText && P.hash(manifestText) !== snap.manifestHash) showHome(true);
      else afterRender();
    } else {
      showChapter(slug, manifestText && P.hash(manifestText) !== snap.manifestHash);
    }
  });
})();
