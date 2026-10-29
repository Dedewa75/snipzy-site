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
    A.profile(token).then(function (p) {
      $("cPlan").textContent = p ? (PLANS[p.plan] || p.plan) : "Gratuit";
    }, function () { $("cPlan").textContent = "Gratuit"; });
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
    if (pw.length < 8) return say("Le mot de passe doit faire au moins 8 caractères.", false);
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
