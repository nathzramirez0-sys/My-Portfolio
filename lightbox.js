/* ─────────────────────────────────────────────
   Screenshot viewer.

   Any link with data-lightbox="group" opens its picture over the page
   instead of in a new tab. Pictures in the same group can be stepped
   through with the arrows, the arrow keys or a swipe. Esc, the close
   button or a click outside the picture closes it. Without JavaScript the
   links still open the picture on its own.
   ───────────────────────────────────────────── */

(function () {
  "use strict";

  const links = () => [...document.querySelectorAll("a[data-lightbox]")];
  if (!links().length) return;

  const box = document.createElement("div");
  box.className = "lb";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Screenshot viewer");
  box.innerHTML = `
    <figure class="lb-figure">
      <img class="lb-img" alt="">
      <figcaption class="lb-cap"><span class="lb-text"></span><span class="lb-count mono"></span></figcaption>
    </figure>
    <button type="button" class="lb-btn lb-prev" aria-label="Previous screenshot">‹</button>
    <button type="button" class="lb-btn lb-next" aria-label="Next screenshot">›</button>
    <button type="button" class="lb-btn lb-close" aria-label="Close">✕</button>`;
  document.body.appendChild(box);

  const img = box.querySelector(".lb-img");
  const text = box.querySelector(".lb-text");
  const count = box.querySelector(".lb-count");
  const prev = box.querySelector(".lb-prev");
  const next = box.querySelector(".lb-next");
  const close = box.querySelector(".lb-close");

  let group = [];
  let index = 0;
  let opener = null;

  function show(i) {
    index = (i + group.length) % group.length;
    const link = group[index];
    const thumb = link.querySelector("img");
    img.src = link.href;
    img.alt = thumb ? thumb.alt : "";
    text.textContent = link.dataset.caption || (thumb ? thumb.alt : "");
    count.textContent = group.length > 1 ? `${index + 1} / ${group.length}` : "";
    prev.hidden = next.hidden = group.length < 2;
    // fetch the neighbours so stepping feels instant
    [index + 1, index - 1].forEach((n) => {
      const l = group[(n + group.length) % group.length];
      if (l) new Image().src = l.href;
    });
  }

  function open(link) {
    group = links().filter((l) => l.dataset.lightbox === link.dataset.lightbox);
    opener = link;
    box.hidden = false;
    document.documentElement.classList.add("lb-open");
    show(group.indexOf(link));
    close.focus();
  }

  function shut() {
    box.hidden = true;
    img.removeAttribute("src");
    document.documentElement.classList.remove("lb-open");
    if (opener) opener.focus();
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest && e.target.closest("a[data-lightbox]");
    if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    open(link);
  });

  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  close.addEventListener("click", shut);
  box.addEventListener("click", (e) => { if (e.target === box) shut(); });

  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") shut();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "Tab") {
      // keep focus inside the viewer
      const items = [prev, next, close].filter((b) => !b.hidden);
      const at = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(at + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
  });

  // swipe on touch screens
  let startX = null;
  box.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") startX = e.clientX; });
  box.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50 && group.length > 1) show(index + (dx < 0 ? 1 : -1));
  });
})();
