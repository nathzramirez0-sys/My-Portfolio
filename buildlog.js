/* ─────────────────────────────────────────────
   Cable Manager's build log: commits per week, the two phases, and the
   dated milestones, drawn from PORTFOLIO.build in data.js.

   Used by projects/cable-manager.html. Milestones tied to a point on the
   map link back to the home page with that point selected.
   ───────────────────────────────────────────── */

(function () {
  "use strict";

  const P = window.PORTFOLIO;
  const $ = (id) => document.getElementById(id);
  const B = P && P.build;
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
  const home = plot.dataset.home || "../index.html";

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
  let items = [];
  const mark = (week, on) => items.forEach((li) => li.classList.toggle("is-on", on && Number(li.dataset.week) === week));
  const colEls = B.weeks.map((v, i) => {
    const b = make("button", "col");
    b.type = "button";
    b.setAttribute("aria-label", `Week of ${day(weekOf(i))}: ${v} commit${v === 1 ? "" : "s"}`);
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

  // below the baseline: milestone ticks, month names and the two phases
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
  items = B.milestones.map((m) => {
    const li = make("li", "milestone");
    li.dataset.week = m.week;
    li.append(make("span", "ms-date mono", m.date), make("span", "ms-text", m.text));
    if (m.node) {
      const a = make("a", "map-link", "On the map");
      a.href = `${home}?node=${encodeURIComponent(m.node)}`;
      li.append(a);
    }
    li.addEventListener("pointerenter", () => colEls[m.week].classList.add("is-marked"));
    li.addEventListener("pointerleave", () => colEls[m.week].classList.remove("is-marked"));
    list.append(li);
    return li;
  });

  // the same numbers as a table
  const body = $("build-table").tBodies[0];
  B.weeks.forEach((v, i) => {
    const tr = make("tr");
    tr.append(make("td", "", day(weekOf(i))), make("td", "", String(v)));
    body.append(tr);
  });
})();
