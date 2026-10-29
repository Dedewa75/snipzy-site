(function () {
  "use strict";
  var KEY = "snipzy_consent";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- cookies : rien de tiers n'est chargé avant ton choix ---- */
  function readConsent() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function saveConsent(ads) {
    var c = { ads: !!ads, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    window.dispatchEvent(new CustomEvent("snipzy:consent", { detail: c }));
    return c;
  }
  var bar = document.getElementById("cookie");
  function showBar() { if (bar) { bar.hidden = false; var b = document.getElementById("cookie-refuse"); if (b) b.focus(); } }
  function hideBar() { if (bar) bar.hidden = true; }
  if (bar) {
    document.getElementById("cookie-refuse").onclick = function () { saveConsent(false); hideBar(); };
    document.getElementById("cookie-accept").onclick = function () { saveConsent(true); hideBar(); };
    if (readConsent() === null) { bar.hidden = false; }
  }
  var reopen = document.getElementById("cookie-reopen");
  if (reopen) reopen.onclick = showBar;
  /* Plus tard : si readConsent().ads === true, c'est ici qu'on chargera le script publicitaire. */


  /* ---- lien Connexion / Mon compte dans le menu ---- */
  var acc = document.getElementById("navAcc");
  if (acc) { try { if (localStorage.getItem("snipzy_session")) { acc.textContent = "Mon compte"; acc.href = "compte.html"; } } catch (e) {} }

  /* ---- téléphone de démonstration ---- */
  var sub = document.getElementById("demoSub");
  if (sub) {
    var chunks = [["JE VOIS", "PLUS"], ["PERSONNE", "C'EST"], ["UN TRUC", "DE FOU"], ["ÇA FAIT", "PLAISIR"]];
    var ci = 0, wi = 0;
    var render = function () {
      sub.textContent = "";
      chunks[ci].forEach(function (w, i) {
        var s = document.createElement("span");
        s.textContent = w;
        if (i === wi) s.className = "on";
        sub.appendChild(s);
      });
    };
    render();
    if (!reduced) setInterval(function () {
      wi++;
      if (wi >= chunks[ci].length) { wi = 0; ci = (ci + 1) % chunks.length; }
      render();
    }, 650);
  }


  /* ---- boutons désactivés : ne font rien ---- */
  document.querySelectorAll('[aria-disabled="true"]').forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); });
  });

  /* ---- tarifs mensuel / annuel ---- */
  var tg = document.querySelectorAll("[data-bill]");
  if (tg.length) {
    var set = function (mode) {
      tg.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-bill") === mode ? "true" : "false"); });
      document.querySelectorAll("[data-m]").forEach(function (el) {
        el.textContent = el.getAttribute(mode === "y" ? "data-y" : "data-m");
      });
    };
    tg.forEach(function (b) { b.onclick = function () { set(b.getAttribute("data-bill")); }; });
    set("m");
  }
})();
