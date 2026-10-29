(function () {
  "use strict";
  var A = window.SnipzyAuth;
  var $ = function (id) { return document.getElementById(id); };
  var msg = $("msg");
  function say(t, ok) { msg.textContent = t; msg.className = "msg " + (ok ? "ok" : "bad"); msg.hidden = false; }
  function busy(form, on) { form.querySelectorAll("button[type=submit]").forEach(function (b) { b.disabled = on; }); }
  function tab(login) {
    $("fLogin").hidden = !login; $("fSignup").hidden = login; msg.hidden = true;
    $("tabLogin").setAttribute("aria-pressed", login ? "true" : "false");
    $("tabSignup").setAttribute("aria-pressed", login ? "false" : "true");
  }
  $("tabLogin").onclick = function () { tab(true); };
  $("tabSignup").onclick = function () { tab(false); };
  if (location.hash === "#inscription") tab(false);
  if (!A.configured()) say("Le site n'est pas encore relié aux comptes.", false);

  A.session().then(function (s) { if (s) location.replace("compte.html"); });

  $("fLogin").onsubmit = function (e) {
    e.preventDefault();
    var mail = $("liMail").value.trim(), pw = $("liPw").value;
    if (!mail || !pw) return say("Remplis l'email et le mot de passe.", false);
    busy(this, true); var f = this;
    A.signIn(mail, pw).then(function () { location.href = "compte.html"; },
      function (er) { say(er.message, false); busy(f, false); });
  };

  $("fSignup").onsubmit = function (e) {
    e.preventDefault();
    var mail = $("suMail").value.trim(), pw = $("suPw").value;
    if (!/^\S+@\S+\.\S+$/.test(mail)) return say("Cet email n'a pas l'air valide.", false);
    if (pw.length < 8) return say("Le mot de passe doit faire au moins 8 caractères.", false);
    if (!$("suOk").checked) return say("Coche la case pour accepter les conditions et la confidentialité.", false);
    busy(this, true); var f = this;
    A.signUp(mail, pw).then(function (r) {
      if (r && r.access_token) { location.href = "compte.html"; return; }
      say("Compte créé. Ouvre l'email que Snipzy vient de t'envoyer et clique sur le lien pour confirmer. Pense à regarder dans les courriers indésirables.", true);
      f.reset(); busy(f, false);
    }, function (er) { say(er.message, false); busy(f, false); });
  };

  $("forgot").onclick = function () {
    var mail = $("liMail").value.trim();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return say("Écris ton email dans la case ci-dessus, puis clique à nouveau.", false);
    A.recover(mail).then(function () {
      say("Si un compte existe avec cet email, un lien pour choisir un nouveau mot de passe vient d'être envoyé.", true);
    }, function (er) { say(er.message, false); });
  };
})();
