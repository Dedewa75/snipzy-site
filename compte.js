(function () {
  "use strict";
  var A = window.SnipzyAuth;
  var $ = function (id) { return document.getElementById(id); };
  var msg = $("msg"), token = null;
  function say(t, ok) { msg.textContent = t; msg.className = "msg " + (ok ? "ok" : "bad"); msg.hidden = false; }
  var PLANS = { gratuit: "Gratuit", pro: "Pro", studio: "Studio" };

  function show(s) {
    $("wait").hidden = true;
    if (!s) { $("boxOut").hidden = false; return; }
    token = s.access_token;
    var nav = document.getElementById("navAcc"); if (nav) { nav.textContent = "Mon compte"; nav.href = "compte.html"; }
    $("boxIn").hidden = false;
    $("cMail").textContent = (s.user && s.user.email) || "";
    var d = s.user && s.user.created_at ? new Date(s.user.created_at) : null;
    $("cDate").textContent = d && !isNaN(d) ? d.toLocaleDateString("fr-BE") : "";
    $("cPlan").textContent = "…";
    loadPlan(s);
  }

  var billing = "m", uid = "", mail = "";
  var PRICES = { pro_m: "8,99 € / mois", pro_y: "59 € / an", studio_m: "19,99 € / mois", studio_y: "149 € / an" };

  function buyLink(key) {
    var base = (window.SNIPZY.links || {})[key];
    if (!base) return null;
    return base + (base.indexOf("?") < 0 ? "?" : "&") + "client_reference_id=" + encodeURIComponent(uid) +
      "&prefilled_email=" + encodeURIComponent(mail);
  }
  function consentOk() { return $("ok1").checked && $("ok2").checked; }
  function drawBuy() {
    $("bM").setAttribute("aria-pressed", billing === "m" ? "true" : "false");
    $("bY").setAttribute("aria-pressed", billing === "y" ? "true" : "false");
    [["Pro", "pro"], ["Studio", "studio"]].forEach(function (x) {
      var key = x[1] + "_" + billing, a = $("buy" + x[0]), link = buyLink(key);
      $("p" + x[0]).textContent = PRICES[key];
      if (link && consentOk()) { a.href = link; a.classList.remove("off"); a.textContent = "Choisir " + x[0]; }
      else if (link) { a.href = "#"; a.classList.add("off"); a.textContent = "Choisir " + x[0]; }
      else { a.href = "#"; a.classList.add("off"); a.textContent = "Bientôt disponible"; }
    });
    $("subNote").textContent = (window.SNIPZY.links && window.SNIPZY.links.pro_m)
      ? "Coche les deux cases pour continuer. Prix en euros, taxes comprises. Paiement sécurisé par Stripe. Tu peux résilier quand tu veux."
      : "Les abonnements Pro et Studio ne sont pas encore ouverts.";
  }
  $("ok1").onchange = drawBuy; $("ok2").onchange = drawBuy;
  $("bM").onclick = function () { billing = "m"; drawBuy(); };
  $("bY").onclick = function () { billing = "y"; drawBuy(); };

  function loadPlan(s, tries) {
    uid = (s.user && s.user.id) || ""; mail = (s.user && s.user.email) || "";
    A.profile(s.access_token).then(function (p) {
      var plan = p ? p.plan : "gratuit";
      $("cPlan").textContent = PLANS[plan] || plan;
      var paid = plan === "pro" || plan === "studio";
      $("subOn").hidden = !paid; $("subOff").hidden = paid;
      if (paid) {
        var d = p.plan_period_end ? new Date(p.plan_period_end).toLocaleDateString("fr-BE") : "";
        $("subInfo").textContent = "Tu es abonné à Snipzy " + PLANS[plan] + (d ? ". Prochaine échéance : " + d + "." : ".");
        var portal = (window.SNIPZY.links || {}).portal;
        if (portal) { $("portal").href = portal; $("portal").hidden = false; }
      } else {
        drawBuy();
        /* retour de paiement : le plan met quelques secondes à se mettre à jour */
        if (location.search.indexOf("paiement=ok") >= 0 && (tries || 0) < 10) {
          say("Paiement reçu. Ton abonnement se met à jour…", true);
          setTimeout(function () { loadPlan(s, (tries || 0) + 1); }, 2000);
        }
      }
      if (paid && location.search.indexOf("paiement=ok") >= 0) say("Merci ! Ton abonnement est actif.", true);
    }, function () { $("cPlan").textContent = "Gratuit"; $("subOff").hidden = false; drawBuy(); });
  }

  A.fromHash().then(function (h) {
    return A.session().then(function (s) {
      show(s);
      if (h && h.error) say(h.error, false);
      else if (h && h.type === "recovery") { say("Choisis ton nouveau mot de passe ci-dessous.", true); $("npw").focus(); }
      else if (h && h.type === "signup") say("Email confirmé. Bienvenue sur Snipzy !", true);
    });
  });

  $("fPw").onsubmit = function (e) {
    e.preventDefault();
    var pw = $("npw").value;
    if (pw.length < 10) return say("Le mot de passe doit faire au moins 10 caractères.", false);
    A.session().then(function (s) {
      if (!s) return say("Ta session a expiré. Reconnecte-toi.", false);
      return A.setPassword(s.access_token, pw).then(function () { $("fPw").reset(); say("Mot de passe changé.", true); });
    }).then(null, function (er) { say(er.message, false); });
  };

  $("logout").onclick = function () { A.signOut(token).then(function () { location.href = "index.html"; }); };

  $("del").onclick = function () {
    if (!window.confirm("Supprimer définitivement ton compte ? Cette action est irréversible.")) return;
    A.session().then(function (s) {
      if (!s) return say("Ta session a expiré. Reconnecte-toi.", false);
      return A.deleteAccount(s.access_token).then(function () { location.href = "index.html"; });
    }).then(null, function (er) { say(er.message, false); });
  };
})();
