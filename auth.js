/* Snipzy : petit client pour Supabase Auth (sans bibliothèque externe). */
(function () {
  "use strict";
  var C = window.SNIPZY, SK = "snipzy_session";

  function save(s) { try { localStorage.setItem(SK, JSON.stringify(s)); } catch (e) {} }
  function load() { try { return JSON.parse(localStorage.getItem(SK) || "null"); } catch (e) { return null; } }
  function clear() { try { localStorage.removeItem(SK); } catch (e) {} }

  var MSG = {
    invalid_credentials: "Email ou mot de passe incorrect.",
    email_not_confirmed: "Ton email n'est pas encore confirmé. Ouvre le mail que Snipzy t'a envoyé et clique sur le lien.",
    user_already_exists: "Un compte existe déjà avec cet email. Essaie de te connecter.",
    weak_password: "Mot de passe trop faible. Prends au moins 10 caractères.",
    over_email_send_rate_limit: "Trop d'emails envoyés pour le moment. Réessaie dans une heure.",
    over_request_rate_limit: "Trop d'essais. Attends un peu avant de réessayer.",
    same_password: "Le nouveau mot de passe doit être différent de l'ancien.",
    otp_expired: "Ce lien a expiré. Demande-en un nouveau.",
    signup_disabled: "Les inscriptions sont fermées pour le moment."
  };

  function api(path, opts, token) {
    opts = opts || {};
    var h = { apikey: C.key, "Content-Type": "application/json", Authorization: "Bearer " + (token || C.key) };
    return fetch(C.url + path, { method: opts.method || "GET", headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
          if (!r.ok) {
            var code = (j && (j.error_code || j.code)) || "";
            var err = new Error(MSG[code] || (j && (j.msg || j.message || j.error_description)) || "Erreur " + r.status);
            err.code = code; err.status = r.status; throw err;
          }
          return j;
        });
      }, function () { throw new Error("Impossible de joindre le serveur. Vérifie ta connexion internet."); });
  }

  function store(t) {
    var s = { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: t.expires_at || (Math.floor(Date.now() / 1000) + (t.expires_in || 3600)), user: t.user };
    save(s); return s;
  }

  function session() {
    var s = load();
    if (!s) return Promise.resolve(null);
    if (s.expires_at > Math.floor(Date.now() / 1000) + 30) return Promise.resolve(s);
    return api("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: s.refresh_token } })
      .then(store, function () { clear(); return null; });
  }

  /* Retour d'un lien reçu par email : les infos arrivent dans l'adresse après le # */
  function fromHash() {
    var h = location.hash.replace(/^#/, "");
    if (!h) return Promise.resolve(null);
    var p = new URLSearchParams(h);
    if (p.get("error") || p.get("error_code")) {
      history.replaceState(null, "", location.pathname);
      return Promise.resolve({ error: MSG[p.get("error_code")] || p.get("error_description") || "Le lien n'est pas valide." });
    }
    if (!p.get("access_token")) return Promise.resolve(null);
    var type = p.get("type"), at = p.get("access_token"), rt = p.get("refresh_token");
    var exp = Math.floor(Date.now() / 1000) + (parseInt(p.get("expires_in"), 10) || 3600);
    history.replaceState(null, "", location.pathname);
    return api("/auth/v1/user", {}, at).then(function (u) {
      store({ access_token: at, refresh_token: rt, expires_at: exp, user: u });
      return { type: type };
    }, function (e) { return { error: e.message }; });
  }

  window.SnipzyAuth = {
    configured: function () { return C && C.key && C.key.indexOf("COLLE_") !== 0; },
    session: session,
    fromHash: fromHash,
    clear: clear,
    redirect: function () { return location.origin + "/compte.html"; },
    signUp: function (email, password) {
      return api("/auth/v1/signup?redirect_to=" + encodeURIComponent(this.redirect()), { method: "POST", body: { email: email, password: password } });
    },
    signIn: function (email, password) {
      return api("/auth/v1/token?grant_type=password", { method: "POST", body: { email: email, password: password } }).then(store);
    },
    recover: function (email) {
      return api("/auth/v1/recover?redirect_to=" + encodeURIComponent(this.redirect()), { method: "POST", body: { email: email } });
    },
    setPassword: function (token, password) {
      return api("/auth/v1/user", { method: "PUT", body: { password: password } }, token);
    },
    signOut: function (token) {
      clear();
      return api("/auth/v1/logout", { method: "POST" }, token).then(null, function () {});
    },
    profile: function (token) {
      return api("/rest/v1/profiles?select=plan,created_at,plan_status,plan_period_end", {}, token).then(function (r) { return r && r[0] || null; });
    },
    deleteAccount: function (token) {
      return api("/rest/v1/rpc/delete_my_account", { method: "POST", body: {} }, token).then(function () { clear(); });
    }
  };
})();
