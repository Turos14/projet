// Portfolio : liste les dépôts GitHub et propose ouverture / téléchargement.
(async function () {
  const $ = (s) => document.querySelector(s);
  const grid = $("#grid");
  const status = $("#status");
  const CACHE_KEY = "repos-cache-v1";
  const CACHE_TTL = 60 * 60 * 1000; // 1 h (l'API non authentifiée est limitée à 60 req/h)

  const config = await fetch("projects.json").then((r) => r.json()).catch(() => ({}));
  const user = config.user || "Turos14";
  const exclude = new Set(config.exclude || []);
  const overrides = config.overrides || {};

  async function loadRepos() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && Date.now() - cached.t < CACHE_TTL) return cached.repos;
    } catch (_) {}
    try {
      const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`);
      if (!res.ok) throw new Error(res.status);
      const repos = await res.json();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), repos })); } catch (_) {}
      return repos;
    } catch (e) {
      console.warn("API GitHub indisponible, utilisation de la liste locale.", e);
      return config.fallback || [];
    }
  }

  function toProject(r) {
    const o = overrides[r.name] || {};
    const branch = o.branch || r.default_branch || "main";
    const pagesBranch = o.pagesBranch || branch;
    const repoUrl = r.html_url || `https://github.com/${user}/${r.name}`;
    const webUrl = o.webUrl !== undefined ? o.webUrl
      : (r.homepage || (r.has_pages ? `https://${user.toLowerCase()}.github.io/${r.name}/` : null));
    return {
      name: o.title || r.name,
      description: o.description || r.description || "Pas encore de description.",
      language: r.language || "Autre",
      stars: r.stargazers_count,
      pushed: r.pushed_at,
      repoUrl,
      webUrl,
      sourceZip: `https://github.com/${user}/${r.name}/archive/refs/heads/${branch}.zip`,
      appZip: o.appDownload || (webUrl ? `https://github.com/${user}/${r.name}/archive/refs/heads/${pagesBranch}.zip` : null),
    };
  }

  const repos = await loadRepos();
  const projects = repos
    .filter((r) => !exclude.has(r.name) && !r.fork && !r.archived)
    .map(toProject)
    .sort((a, b) => (b.webUrl ? 1 : 0) - (a.webUrl ? 1 : 0) || (b.pushed || "").localeCompare(a.pushed || ""));

  function link(label, href, cls, download) {
    const a = document.createElement("a");
    a.className = "btn" + (cls ? " " + cls : "");
    a.href = href;
    a.textContent = label;
    if (download) a.setAttribute("download", "");
    else { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }

  function render(list) {
    grid.replaceChildren();
    const tpl = $("#card-tpl");
    for (const p of list) {
      const card = tpl.content.cloneNode(true);
      card.querySelector(".name").textContent = p.name;
      card.querySelector(".lang").textContent = p.language;
      card.querySelector(".desc").textContent = p.description;
      const meta = card.querySelector(".meta");
      if (p.pushed) meta.append(Object.assign(document.createElement("span"), {
        textContent: "Mis à jour le " + new Date(p.pushed).toLocaleDateString("fr-FR"),
      }));
      if (p.stars) meta.append(Object.assign(document.createElement("span"), { textContent: "★ " + p.stars }));

      const actions = card.querySelector(".actions");
      if (p.webUrl) actions.append(link("▶ Ouvrir l'app", p.webUrl, "primary"));
      if (p.appZip) actions.append(link("⬇ Télécharger l'app", p.appZip, "", true));
      actions.append(link("⬇ Code source (.zip)", p.sourceZip, "", true));
      actions.append(link("GitHub ↗", p.repoUrl));
      grid.append(card);
    }
    status.textContent = list.length ? `${list.length} projet(s)` : "Aucun projet trouvé.";
  }

  // Filtres
  let lang = "Tous";
  const langs = ["Tous", "Apps web", ...new Set(projects.map((p) => p.language))];
  const filters = $("#filters");
  for (const l of langs) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = l;
    b.setAttribute("aria-pressed", l === lang);
    b.onclick = () => {
      lang = l;
      filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      apply();
    };
    filters.append(b);
  }

  function apply() {
    const q = $("#search").value.trim().toLowerCase();
    render(projects.filter((p) =>
      (lang === "Tous" || (lang === "Apps web" ? !!p.webUrl : p.language === lang)) &&
      (!q || (p.name + " " + p.description).toLowerCase().includes(q))
    ));
  }
  $("#search").addEventListener("input", apply);
  apply();
})();
