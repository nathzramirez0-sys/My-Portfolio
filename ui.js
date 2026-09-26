/* ─────────────────────────────────────────────
   The ask box, the readout panel and the visitor lens.

   No language model runs here. A question is matched against the
   answers and the map's points in data.js, forgiving typos and word
   endings, and the best match is streamed into the readout while the
   map lights up the points it came from.

   Works without the 3D map: every call to it is optional.
   ───────────────────────────────────────────── */

(() => {
  const P = window.PORTFOLIO;
  const $ = (id) => document.getElementById(id);
  const map = () => window.portfolioScene;
  const email = () => $("email").textContent.trim();
  // motion is on when <html> has the "motion" class (see the script in index.html)
  const calm = () => !document.documentElement.classList.contains("motion");

  const nodeById = new Map(P.nodes.map((n) => [n.id, n]));
  nodeById.set("core", { id: "core", label: P.name, ring: null, keys: [], ...P.core });
  const ringById = new Map(P.rings.map((r) => [r.id, r]));
  const workIds = P.nodes.filter((n) => n.ring === P.rings[0].id).map((n) => n.id);

  function neighbours(id) {
    const out = new Set();
    P.edges.forEach(([a, b]) => {
      if (a === id) out.add(b);
      if (b === id) out.add(a);
    });
    if (id === "core") workIds.forEach((w) => out.add(w));
    else if (workIds.includes(id)) out.add("core");
    return [...out];
  }

  /* ───────────── Matching ───────────── */

  const STOP = new Set(
    ("a an the is are was were be been do does did you your yours i me my we our of for to in on at it its " +
      "this that these those what whats how why who which with and or can could would should will about " +
      "tell please any some there here have has had just really").split(" ")
  );

  const norm = (s) =>
    s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

  function stem(w) {
    if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
    if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
    return w;
  }

  // edit distance, only ever asked "is it 0 or 1?"
  function closeEnough(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      for (let j = 1; j <= b.length; j++) {
        row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = row;
    }
    return prev[b.length] <= 1;
  }

  function score(keys, phrase, words) {
    let s = 0;
    for (const raw of keys) {
      const key = norm(raw);
      if (key.includes(" ")) {
        if ((" " + phrase + " ").includes(" " + key + " ")) s += 3 * key.split(" ").length;
        continue;
      }
      const k = stem(key);
      if (words.includes(k)) s += 2;
      else if (k.length >= 5 && words.some((w) => w.length >= 4 && closeEnough(w, k))) s += 1.2;
    }
    return s;
  }

  function findReply(question) {
    const phrase = norm(question);
    const words = phrase.split(" ").filter((w) => w && !STOP.has(w)).map(stem);
    let best = null;
    let bestScore = 0;

    for (const a of P.answers) {
      const s = score(a.keys, phrase, words);
      if (s > bestScore) { best = { answer: a }; bestScore = s; }
    }
    // any point on the map can be asked about by name; answers win ties
    for (const n of P.nodes) {
      const s = score([n.label, ...(n.keys || [])], phrase, words) * 0.95;
      if (s > bestScore) { best = { node: n }; bestScore = s; }
    }
    return bestScore >= 1.2 ? best : null;
  }

  /* ───────────── The readout panel ───────────── */

  // The card only appears when there's something to say, and the map
  // slides aside to make room for it.
  const ro = {
    panel: $("readout"),
    kicker: $("ro-kicker"),
    title: $("ro-title"),
    body: $("ro-body"),
    links: $("ro-links"),
    reset: $("ro-reset"),
  };
  let streamId = 0;

  // tell the map how much of it the introduction column covers, so it can
  // centre in the rest (answers sit in that column, so nothing else covers it)
  const heroEl = $("top");
  const side = document.querySelector(".hero-side");
  // the introduction column keeps clear of the ask box, however its suggestions wrap
  const askerEl = document.querySelector(".asker");
  const setDock = () => heroEl.style.setProperty("--dock-h", askerEl.offsetHeight + "px");
  if ("ResizeObserver" in window) new ResizeObserver(setDock).observe(askerEl);
  setDock();
  window.addEventListener("load", setDock);
  if (document.fonts) document.fonts.ready.then(setDock);
  function layout() {
    const wide = window.innerWidth >= 1024;
    const left = wide && !heroEl.classList.contains("is-exploring") ? side.getBoundingClientRect().width : 0;
    map()?.setInsets(left, 0);
  }
  window.addEventListener("resize", layout);
  document.addEventListener("portfolio:scene-ready", layout);

  function openPanel() {
    ro.panel.classList.remove("is-idle");
    layout();
  }

  function linkChip(href, label) {
    const a = document.createElement("a");
    a.className = "ro-link";
    a.href = href;
    a.textContent = label;
    return a;
  }

  function nodeChip(id) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ro-node";
    b.textContent = nodeById.get(id).label;
    b.addEventListener("click", () => {
      map()?.select(id);
      showNode(id);
    });
    return b;
  }

  function showIdle() {
    streamId++;
    ro.panel.classList.add("is-idle");
    layout();
  }

  function showNode(id) {
    const n = nodeById.get(id);
    if (!n) return;
    streamId++;
    openPanel();
    ro.kicker.textContent = n.ring ? ringById.get(n.ring).label : "Centre";
    ro.title.textContent = n.label;
    ro.title.hidden = false;
    ro.body.textContent = n.text;

    const near = neighbours(id);
    const kids = [];
    if (near.length) {
      const label = document.createElement("span");
      label.className = "ro-label";
      label.textContent = "Connected to";
      kids.push(label, ...near.map(nodeChip));
    }
    kids.push(linkChip(n.section, "Read more ↓"));
    ro.links.replaceChildren(...kids);
  }

  function respond(question) {
    const reply = findReply(question);
    let text, lit, links;

    if (reply && reply.answer) {
      const a = reply.answer;
      text = typeof a.text === "function" ? a.text(email()) : a.text;
      lit = a.nodes;
      links = () => a.sources.map(([href, label]) => linkChip(href, label + " ↓"));
    } else if (reply && reply.node) {
      const n = reply.node;
      const near = neighbours(n.id);
      text = `${n.label}: ${n.text}`;
      lit = [n.id, ...near];
      links = () => [...near.map(nodeChip), linkChip(n.section, "Read more ↓")];
    } else {
      text = `That one isn't covered here, and I'd rather not guess. Try one of the suggestions, or ask me directly at ${email()}.`;
      lit = [];
      links = () => [];
    }

    const id = ++streamId;
    openPanel();
    ro.kicker.textContent = "> " + question;
    ro.title.hidden = true;
    ro.links.replaceChildren();
    const body = document.createElement("p");
    ro.body.replaceChildren(body);

    const light = () => {
      if (lit.length) map()?.highlight(lit);
      else map()?.clear();
    };

    if (calm()) {
      light();
      body.textContent = text;
      ro.links.replaceChildren(...links());
      return;
    }

    // a short retrieving beat: the map pulses and searches, then answers
    map()?.retrieve();
    const searching = document.createElement("span");
    searching.className = "retrieving mono";
    searching.textContent = "Retrieving from the map";
    ro.body.replaceChildren(searching);

    setTimeout(() => {
      if (id !== streamId) return;
      light();
      ro.body.replaceChildren(body);
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      ro.body.append(cursor);
      const tokens = text.split(/(\s+)/);
      let i = 0;
      (function tick() {
        if (id !== streamId) return;
        body.textContent += tokens.slice(i, i + 3).join("");
        i += 3;
        if (i < tokens.length) setTimeout(tick, 24);
        else {
          cursor.remove();
          ro.links.replaceChildren(...links());
        }
      })();
    }, 650);
  }

  function reset() {
    map()?.clear();
    showIdle();
  }

  ro.reset.addEventListener("click", reset);
  document.addEventListener("portfolio:select", (e) => showNode(e.detail.id));
  document.addEventListener("portfolio:clear", showIdle);

  /* ───────────── Explore mode and the ring keys ───────────── */

  const hero = heroEl;
  const exploreBtn = $("explore");
  const exploreLabel = $("explore-label");

  function setExplore(on) {
    hero.classList.toggle("is-exploring", on);
    exploreBtn.setAttribute("aria-pressed", String(on));
    exploreLabel.textContent = on ? "Back to the page" : "Explore the map";
    layout();
  }
  exploreBtn.addEventListener("click", () => setExplore(!hero.classList.contains("is-exploring")));

  // the motion switch: on by default, and
  // remembers their choice on this site
  const motionBtn = $("motion-toggle");
  const motionLabel = $("motion-label");
  function showMotion() {
    const on = !calm();
    motionBtn.setAttribute("aria-pressed", String(on));
    motionLabel.textContent = on ? "Motion on" : "Motion off";
  }
  motionBtn.addEventListener("click", () => {
    const on = calm();
    document.documentElement.classList.toggle("motion", on);
    try { localStorage.setItem("motion", on ? "on" : "off"); } catch (e) {}
    showMotion();
  });
  showMotion();

  // point at a ring's name to light that ring; tap to keep it lit
  let pinnedRing = null;
  const ringKeys = document.querySelectorAll("[data-ring-key]");
  ringKeys.forEach((key) => {
    const id = key.dataset.ringKey;
    key.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") map()?.focusRing(id); });
    key.addEventListener("pointerleave", () => map()?.focusRing(pinnedRing));
    key.addEventListener("focus", () => map()?.focusRing(id));
    key.addEventListener("blur", () => map()?.focusRing(pinnedRing));
    key.addEventListener("click", () => {
      pinnedRing = pinnedRing === id ? null : id;
      ringKeys.forEach((k) => k.setAttribute("aria-pressed", String(k.dataset.ringKey === pinnedRing)));
      map()?.focusRing(pinnedRing);
    });
  });

  /* ───────────── Visitor lens ───────────── */

  const lede = $("lede");
  const cta = $("cta");
  const chips = $("chips");
  const lensButtons = document.querySelectorAll("[data-lens]");
  let currentLens = "none";

  function applyLens(name) {
    currentLens = P.lenses[name] ? name : "none";
    const lens = P.lenses[currentLens];
    lede.textContent = lens.lede;
    cta.href = lens.cta[0];
    cta.textContent = lens.cta[1];
    chips.replaceChildren(
      ...lens.chips.map((q) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = q;
        b.addEventListener("click", () => respond(q));
        return b;
      })
    );
    lensButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lens === currentLens)));
    map()?.setLens(currentLens);
    setDock(); // the suggestions just changed, and with them the ask box's height
    try { localStorage.setItem("lens", currentLens); } catch (e) {}
  }

  lensButtons.forEach((b) =>
    b.addEventListener("click", () => {
      // pressing the active lens again clears it
      applyLens(b.getAttribute("aria-pressed") === "true" ? "none" : b.dataset.lens);
    })
  );

  let saved = "none";
  try { saved = localStorage.getItem("lens") || "none"; } catch (e) {}
  applyLens(saved);
  document.addEventListener("portfolio:scene-ready", () => map().setLens(currentLens));

  /* ───────────── The ask box ───────────── */

  const form = $("ask-form");
  const input = $("ask-input");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) { input.focus(); return; }
    respond(q);
    input.value = "";
  });

  document.addEventListener("keydown", (e) => {
    const typing = e.target.closest && e.target.closest("input, textarea, [contenteditable]");
    if (e.key === "Escape") {
      if (typing) input.blur();
      if (hero.classList.contains("is-exploring")) setExplore(false);
      else reset();
      return;
    }
    // "/" jumps to the ask box from anywhere
    if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setExplore(false);
      input.focus();
    }
  });

  /* ───────────── Links from the page back to the map ───────────── */

  function showOnMap(id) {
    const narrow = window.innerWidth < 1024;
    const target = narrow ? $("stage") : $("top");
    target.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: narrow ? "center" : "start" });
    map()?.select(id);
    showNode(id);
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("button[data-node]");
    if (b) showOnMap(b.dataset.node);
  });

  // a small orrery beside each section name, marking which ring it belongs to
  const RING_INDEX = Object.fromEntries(P.rings.map((r, i) => [r.id, i]));
  const SVG = "http://www.w3.org/2000/svg";

  function glyph(ringId) {
    const idx = RING_INDEX[ringId] ?? -1;
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 52 28");
    svg.setAttribute("width", "52");
    svg.setAttribute("height", "28");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("glyph");
    const shape = (tag, attrs) => {
      const s = document.createElementNS(SVG, tag);
      Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
      svg.append(s);
    };
    P.rings.forEach((_, i) => {
      const rx = 8 + i * 5.5;
      shape("ellipse", { cx: 26, cy: 14, rx, ry: rx * 0.42, class: i === idx ? "g-on" : "g-off" });
    });
    shape("circle", { cx: 26, cy: 14, r: 2, class: idx === -1 ? "g-fill" : "g-core" });
    if (idx >= 0) {
      const rx = 8 + idx * 5.5;
      shape("circle", { cx: 26 + rx * Math.cos(0.9), cy: 14 + rx * 0.42 * Math.sin(0.9), r: 2.4, class: "g-fill" });
    }
    return svg;
  }

  document.querySelectorAll(".section-label[data-ring]").forEach((label) => {
    label.prepend(glyph(label.dataset.ring));
  });

  /* ───────────── Build log: commits per week and the milestones ───────────── */

  function buildLog() {
    const B = P.build;
    const plot = $("build-plot");
    if (!B || !plot) return;

    const make = (tag, className, text) => {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined) el.textContent = text;
      return el;
    };
    const start = new Date(B.start + "T00:00:00");
    const weekOf = (i) => { const d = new Date(start); d.setDate(d.getDate() + i * 7); return d; };
    const day = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const month = (d) => d.toLocaleDateString("en-GB", { month: "long" });

    const n = B.weeks.length;
    const total = B.weeks.reduce((a, b) => a + b, 0);
    const max = Math.max(...B.weeks);
    const top = max * 1.12;
    const pct = (v) => (v / top) * 100 + "%";
    $("build-sub").textContent =
      `${total} commits, ${month(start)} to ${month(weekOf(n - 1))} ${weekOf(n - 1).getFullYear()}`;
    plot.style.setProperty("--n", n);

    // plot area: gridlines, one column per week, and a tooltip
    const area = make("div", "chart-area");
    for (let v = 0; v <= max; v += 10) {
      const line = make("div", "gridline");
      line.style.bottom = pct(v);
      line.append(make("span", "gridline-label", String(v)));
      area.append(line);
    }
    const cols = make("div", "chart-cols");
    const tip = make("div", "chart-tip");
    tip.hidden = true;
    const tipValue = make("strong");
    const tipWeek = make("span");
    tip.append(tipValue, tipWeek);

    const marked = new Set(B.milestones.map((m) => m.week));
    const colEls = B.weeks.map((v, i) => {
      const b = make("button", "col");
      b.type = "button";
      const label = `Week of ${day(weekOf(i))}: ${v} commit${v === 1 ? "" : "s"}`;
      b.setAttribute("aria-label", label);
      const bar = make("span", "col-bar");
      bar.style.height = pct(v);
      b.append(bar);
      if (v === max) {
        const cap = make("span", "cap", String(v));
        cap.style.bottom = `calc(${pct(v)} + 6px)`;
        b.append(cap);
      }
      const show = () => {
        tipValue.textContent = `${v} commit${v === 1 ? "" : "s"}`;
        tipWeek.textContent = `Week of ${day(weekOf(i))}`;
        tip.style.left = ((i + 0.5) / n) * 100 + "%";
        tip.style.bottom = `calc(${pct(v)} + 12px)`;
        tip.dataset.edge = i < 2 ? "start" : i > n - 3 ? "end" : "";
        tip.hidden = false;
        mark(i, true);
      };
      const hide = () => { tip.hidden = true; mark(i, false); };
      b.addEventListener("pointerenter", show);
      b.addEventListener("pointerleave", hide);
      b.addEventListener("focus", show);
      b.addEventListener("blur", hide);
      cols.append(b);
      return b;
    });
    area.append(cols, tip);

    // below the baseline: milestone ticks, the two phases, and month names
    const ticks = make("div", "chart-row chart-ticks");
    marked.forEach((i) => {
      const t = make("span", "tick");
      t.style.gridColumn = i + 1;
      ticks.append(t);
    });
    const phases = make("div", "chart-row chart-phases");
    B.phases.forEach((ph) => {
      const s = make("span", "phase", ph.label);
      s.style.gridColumn = `${ph.from + 1} / ${ph.to + 2}`;
      phases.append(s);
    });
    const months = make("div", "chart-row chart-months");
    let lastMonth = -1;
    B.weeks.forEach((_, i) => {
      const d = weekOf(i);
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        const m = make("span", "month", d.toLocaleDateString("en-GB", { month: "short" }));
        m.style.gridColumn = i + 1;
        months.append(m);
      }
    });
    plot.append(area, ticks, months, phases);

    // milestones, linked both ways to their week
    const list = $("milestones");
    const items = B.milestones.map((m) => {
      const li = make("li", "milestone reveal");
      li.dataset.week = m.week;
      const time = make("span", "ms-date mono", m.date);
      const text = make("span", "ms-text", m.text);
      li.append(time, text);
      if (m.node) {
        const b = make("button", "map-link", "On the map");
        b.type = "button";
        b.dataset.node = m.node;
        li.append(b);
      }
      li.addEventListener("pointerenter", () => colEls[m.week].classList.add("is-marked"));
      li.addEventListener("pointerleave", () => colEls[m.week].classList.remove("is-marked"));
      list.append(li);
      return li;
    });
    function mark(week, on) {
      items.forEach((li) => li.classList.toggle("is-on", on && Number(li.dataset.week) === week));
    }

    // the same numbers as a table
    const body = $("build-table").tBodies[0];
    B.weeks.forEach((v, i) => {
      const tr = make("tr");
      tr.append(make("td", "", day(weekOf(i))), make("td", "", String(v)));
      body.append(tr);
    });
  }
  buildLog();

  /* ───────────── Sections ease in as they arrive ───────────── */

  const reveals = document.querySelectorAll(".reveal");
  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--delay", Math.min(siblings.indexOf(el), 6) * 70 + "ms");
  });
  if (!calm() && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ───────────── Small effects: scroll progress, spotlight cards ───────────── */

  const topBar = document.querySelector(".bar");
  const progress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    topBar.style.setProperty("--progress", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
  };
  window.addEventListener("scroll", progress, { passive: true });
  progress();

  // a soft light follows the pointer across cards
  document.querySelectorAll(".service, .arch .node, .hard-list li, .asker, .project").forEach((el) => {
    el.classList.add("spot");
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ───────────── Contact ───────────── */

  const copyBtn = $("copy-email");
  copyBtn.addEventListener("click", () => {
    const done = (label) => {
      copyBtn.textContent = label;
      setTimeout(() => (copyBtn.textContent = "Copy"), 1600);
    };
    const selectIt = () => {
      const range = document.createRange();
      range.selectNodeContents($("email"));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      done("Press Ctrl+C");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email()).then(() => done("Copied"), selectIt);
    } else {
      selectIt();
    }
  });

  $("year").textContent = new Date().getFullYear();
})();
