
// =====================================================================
//  TITLE SCREEN + LOCAL ACCOUNTS
//  Accounts live in this browser only (ACCT_KEY), each with its own save key.
//  Guest play keeps the original save key, so existing progress stays where it was;
//  the Demo plays on its own key (a9d_demo.js).
// =====================================================================
const ACCT_KEY = "ak_tactics_accounts";
const DEMO_KEY = SAVE_KEY + ":demo";
const GAME_VERSION = "2.0";
let SESSION = null; // { id: "guest" | "demo" | account id, name }

function acctData() {
  try { const d = JSON.parse(localStorage.getItem(ACCT_KEY)); if (d && Array.isArray(d.list)) return d; } catch (e) { /* storage unavailable */ }
  return { list: [], remember: null };
}
function acctStore(d) { try { localStorage.setItem(ACCT_KEY, JSON.stringify(d)); } catch (e) { /* storage unavailable */ } }
const acctSlot = id => id === "guest" ? SAVE_KEY : id === "demo" ? DEMO_KEY : SAVE_KEY + ":acct:" + id;
const hasSave = key => { try { return !!localStorage.getItem(key); } catch (e) { return false; } };
function readSave(key) { try { const s = JSON.parse(localStorage.getItem(key)); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
async function pwHash(salt, pw) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pw));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  let h = ""; for (let i = 0; i < 8; i++) h += hash(i + ":" + salt + ":" + pw).toString(16).padStart(8, "0");
  return h;
}

const EMBLEM = `<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="#5fd4ff" stroke-width="2.4">
  <path d="M32 3 59 18v28L32 61 5 46V18z"/><path d="M32 13 50 23v18L32 51 14 41V23z" stroke="#f2c14e" stroke-width="2"/></g>
  <path fill="#e8f6ff" d="M32 20 41 36H23z"/><path fill="#5fd4ff" d="M23 39h18l-9 6z"/></svg>`;
const TICON = {
  acct: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/></svg>',
  notice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>',
  demo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
};

// ---------- title ----------
function showTitle(msg) {
  closeModal();
  for (const id of ["dlg", "gacha"]) { const el = $("#" + id); el.hidden = true; el.innerHTML = ""; }
  let root = $("#title");
  if (!root) { root = document.createElement("div"); root.id = "title"; document.body.appendChild(root); }
  const d = acctData(), rem = d.remember && d.list.find(a => a.id === d.remember);
  const cast = ["amiya", "exusiai", "silverash", "texas", "ch", "skadi", "surtr", "nightingale", "mudrock", "eyjafjalla"].filter(k => OPS[k]);
  const main = pick(cast), sides = cast.filter(k => k !== main).sort(() => R() - .5).slice(0, 2);
  root.className = ""; root.hidden = false; music("title");
  root.innerHTML = `<div class="tw">
    <div class="tbg"></div><div class="tgrid"></div><canvas class="tcv" id="tCv"></canvas>
    <img class="tart b" src="${spriteURL(OPS[sides[0]])}" alt=""><img class="tart c" src="${spriteURL(OPS[sides[1]])}" alt=""><img class="tart a" src="${spriteURL(OPS[main])}" alt="${esc(OPS[main].n)}">
    <div class="tshade"></div>
    <div class="tlogo">${EMBLEM}<div class="l1">ARKNIGHTS</div><div class="l2">TACTICS</div><div class="l3">Rhodes Island · Fan Edition</div></div>
    <div class="tstart" id="tStart"><div class="tload"><div class="bar"><i id="tBar"></i></div><small id="tLoadTxt">Connecting to Rhodes Island…</small></div></div>
    <div class="tfoot"><div class="tver">Ver ${GAME_VERSION} · Local server<br>Unofficial fan game · Arknights © Hypergryph / Yostar</div>
      <div class="tbtns"><button class="tbtn" id="tAcct">${TICON.acct}Account</button><button class="tbtn" id="tNote">${TICON.notice}Notices</button><button class="tbtn demo" id="tDemo">${TICON.demo}Demo</button></div></div>
  </div>`;
  titleSparks();
  // fake-but-honest loading: preload the art the first screens need
  const urls = [spriteURL(OPS[main]), spriteURL(OPS.amiya), ...Object.keys(rem ? readSave(acctSlot(rem.id)) && readSave(acctSlot(rem.id)).ops || {} : {}).slice(0, 4).map(k => OPS[k] && headURL(OPS[k])).filter(Boolean)];
  let done = 0, ready = false;
  const bar = $("#tBar"), txt = $("#tLoadTxt");
  const step = () => { done++; if (bar) bar.style.width = Math.min(100, 20 + done / urls.length * 80) + "%"; };
  const finish = () => {
    if (ready || !$("#tStart")) return; ready = true;
    bar.style.width = "100%"; txt.textContent = "Ready";
    setTimeout(() => {
      const st = $("#tStart"); if (!st) return;
      const d2 = acctData(), r2 = d2.remember && d2.list.find(a => a.id === d2.remember);
      st.innerHTML = `<div class="ttouch" id="tTouch">TOUCH TO START</div><div class="tuser">${r2 ? `Dr. ${esc(r2.name)}` : msg ? esc(msg) : "Log in or play as Guest"}</div>`;
    }, 260);
  };
  for (const u of urls) { const im = new Image(); im.onload = im.onerror = () => { step(); if (done >= urls.length) finish(); }; im.src = u; }
  setTimeout(finish, 2500);
  root.onclick = ev => {
    if (ev.target.closest(".tpanel")) return;
    if (ev.target.closest("#tAcct")) { sfx("tap"); return loginPanel("login"); }
    if (ev.target.closest("#tNote")) { sfx("tap"); return noticePanel(); }
    if (ev.target.closest("#tDemo")) { sfx("tap"); return demoPanel(); }
    if (!ready) return;
    sfx("cast"); voice(main, VO.title);
    const d2 = acctData(), r2 = d2.remember && d2.list.find(a => a.id === d2.remember);
    if (r2) enterAccount(r2); else loginPanel("login");
  };
}
function titleSparks() {
  const cv = $("#tCv"); if (!cv) return;
  const g = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
  const W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.scale(dpr, dpr);
  const ps = [];
  for (let k = 0; k < 60; k++) ps.push({ x: R() * W, y: R() * H, v: .15 + R() * .5, r: .6 + R() * 1.8, a: .2 + R() * .6, c: R() < .2 ? "#f2c14e" : "#5fd4ff" });
  const loop = () => {
    if (!cv.isConnected || $("#title").hidden) return; requestAnimationFrame(loop);
    g.clearRect(0, 0, W, H);
    for (const p of ps) { p.y -= p.v; p.x += Math.sin(p.y / 40) * .2; if (p.y < -10) { p.y = H + 10; p.x = R() * W; } g.globalAlpha = p.a; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  };
  loop();
}
function hideTitle() {
  const root = $("#title"); if (!root) return;
  root.classList.add("out");
  setTimeout(() => { if (root.classList.contains("out")) { root.hidden = true; root.innerHTML = ""; } }, 520);
}
function titlePanel(html) {
  const tw = $("#title .tw"); if (!tw) return null;
  const old = tw.querySelector(".tpanel"); if (old) old.remove();
  const p = document.createElement("div"); p.className = "tpanel"; p.innerHTML = `<div class="tcard">${html}</div>`;
  p.onclick = ev => { if (ev.target === p) p.remove(); };
  tw.appendChild(p);
  return p;
}

// ---------- login / register ----------
function loginPanel(tab, err) {
  const d = acctData(), guestSave = readSave(SAVE_KEY), cur = SESSION && SESSION.id !== "demo" ? SESSION : null;
  const reg = tab === "register";
  const p = titlePanel(`
    <div class="tabs2"><button class="${reg ? "" : "on"}" data-tab="login">Log In</button><button class="${reg ? "on" : ""}" data-tab="register">Register</button></div>
    <h2>${reg ? "New Doctor" : "Welcome back"}</h2>
    <div class="tfield"><label for="tId">Doctor ID</label><input id="tId" maxlength="16" autocomplete="username" spellcheck="false" placeholder="3–16 letters or numbers"></div>
    <div class="tfield"><label for="tPw">Password</label><input id="tPw" type="password" maxlength="64" autocomplete="${reg ? "new-password" : "current-password"}"></div>
    ${reg ? `<div class="tfield"><label for="tPw2">Confirm password</label><input id="tPw2" type="password" maxlength="64" autocomplete="new-password"></div>` : ""}
    <label class="tcheck"><input type="checkbox" id="tRem" checked> Stay logged in on this device</label>
    ${reg && guestSave && !d.list.length ? `<label class="tcheck"><input type="checkbox" id="tCarry" checked> Bring over this device's Guest progress (Lv ${guestSave.lvl}, ${Object.keys(guestSave.ops || {}).length} operators)</label>` : ""}
    <div class="terr" id="tErr">${err ? esc(err) : ""}</div>
    <button class="btn wide" id="tGo">${reg ? "Create account" : "Log in"}</button>
    ${!reg && d.list.length ? `<div class="stack" style="gap:6px"><div class="tnote">Accounts on this device</div>${d.list.map(a => `<button class="tacct" data-fill="${esc(a.name)}"><b>Dr. ${esc(a.name)}</b><span class="tiny dim">${a.last ? "Last played " + new Date(a.last).toLocaleDateString() : ""}</span></button>`).join("")}</div>` : ""}
    <div class="spread"><button class="tlink" id="tGuest">Play as Guest</button>${cur ? `<button class="tlink" id="tOut">Log out Dr. ${esc(cur.name)}</button>` : ""}</div>
    <p class="tnote">Accounts are saved in this browser only. This isn't an online account, so don't reuse a real password.</p>`);
  if (!p) return;
  const go = async () => {
    const id = ($("#tId").value || "").trim(), pw = $("#tPw").value || "", rem = $("#tRem").checked;
    const fail = m => { $("#tErr").textContent = m; sfx("tap"); };
    if (!/^[A-Za-z0-9 _.-]{3,16}$/.test(id)) return fail("Doctor ID: 3–16 letters, numbers, spaces, _ . or -.");
    if (pw.length < 4) return fail("Password: at least 4 characters.");
    const D = acctData(), ex = D.list.find(a => a.name.toLowerCase() === id.toLowerCase());
    if (reg) {
      if (ex) return fail("That Doctor ID is already registered on this device.");
      if (pw !== $("#tPw2").value) return fail("The passwords don't match.");
      const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const a = { id: "a" + Date.now().toString(36) + Math.floor(Math.random() * 1e4), name: id, salt, hash: await pwHash(salt, pw), created: Date.now(), last: Date.now() };
      D.list.push(a); D.remember = rem ? a.id : null; acctStore(D);
      if ($("#tCarry") && $("#tCarry").checked) {
        try { const g = localStorage.getItem(SAVE_KEY); localStorage.setItem(acctSlot(a.id), g); localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ }
      }
      sfx("win"); enterAccount(a, true);
    } else {
      if (!ex) return fail("No Doctor with that ID on this device. Register first.");
      if (await pwHash(ex.salt, pw) !== ex.hash) return fail("Wrong password.");
      D.remember = rem ? ex.id : null; acctStore(D);
      sfx("ui_mark"); enterAccount(ex);
    }
  };
  p.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { sfx("tap"); loginPanel(b.dataset.tab); });
  p.querySelectorAll("[data-fill]").forEach(b => b.onclick = () => { $("#tId").value = b.dataset.fill; $("#tPw").focus(); });
  $("#tGo").onclick = go;
  for (const el of p.querySelectorAll("input")) el.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  $("#tGuest").onclick = () => { sfx("ui_mark"); enterGuest(); };
  if ($("#tOut")) $("#tOut").onclick = () => { logout(); };
  setTimeout(() => { const f = $("#tId"); if (f && !matchMedia("(pointer:coarse)").matches) f.focus(); }, 60);
}
function enterAccount(a, isNew) {
  const D = acctData(), x = D.list.find(y => y.id === a.id); if (x) { x.last = Date.now(); acctStore(D); }
  SESSION = { id: a.id, name: a.name };
  hideTitle();
  enterGame(acctSlot(a.id), { name: a.name });
  if (isNew) toast(`Welcome to Rhodes Island, Dr. ${a.name}.`, "gold");
}
function enterGuest() {
  SESSION = { id: "guest", name: "Guest" };
  hideTitle();
  enterGame(SAVE_KEY, {});
}
function logout() {
  if (S) { try { localStorage.setItem(SAVE_SLOT, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
  const D = acctData(); D.remember = null; acctStore(D);
  S = null; SESSION = null; SAVE_SLOT = SAVE_KEY;
  showTitle("Logged out");
}

// ---------- notices + demo ----------
function noticePanel() {
  const p = titlePanel(`<div class="eyebrow">Notices</div><h2>Version ${GAME_VERSION}</h2>
    <div class="tnotes">
      <div><b>Real operator kits.</b> All 239 operators fight with their real Arknights skills, talents and class traits, translated to turn-based battles.</div>
      <div><b>Physical, Arts and True damage.</b> Arts damage goes through DEF but meets RES, as in Arknights.</div>
      <div><b>Modules.</b> Module types now carry real module codes (PRO, GUA, DRE…) in slots X and Y.</div>
      <div><b>Accounts.</b> Each Doctor on this device has their own save. Guest keeps the progress you already had.</div>
      <div><b>Demo.</b> Watch a runner play from a new save all the way to 100%.</div>
    </div>
    <button class="btn wide" id="tNoteX">Close</button>`);
  if (p) $("#tNoteX").onclick = () => p.remove();
}
function demoPanel() {
  const ds = readSave(DEMO_KEY);
  const p = titlePanel(`<div class="eyebrow">Demo</div><h2>Watch the runner</h2>
    <p class="small dim">A runner plays Arknights Tactics like an expert Doctor, from a brand-new save to 100%: every Main Theme stage with 3 stars,
      all Supplies operations, all 30 Stationary Security Service floors, Contingency Contract rank #1 and every Main Line mission.</p>
    <p class="tnote">It plays on its own Demo save, so your progress is never touched. While it waits for Sanity or Contract attempts, it skips time forward on that save only.
      Change its speed or stop it from the bar at the top. Keyboard: <b>\`</b> cycles speed, <b>Esc</b> stops.</p>
    ${ds ? `<button class="btn wide" id="tDemoGo">Continue the Demo (${demoProgressText(ds)})</button><button class="btn ghost wide" id="tDemoNew">Start a new Demo</button>`
      : `<button class="btn wide" id="tDemoNew">Start the Demo</button>`}
    <button class="btn ghost wide" id="tDemoX">Cancel</button>`);
  if (!p) return;
  if ($("#tDemoGo")) $("#tDemoGo").onclick = () => { p.remove(); startDemo(false); };
  $("#tDemoNew").onclick = () => { p.remove(); startDemo(true); };
  $("#tDemoX").onclick = () => p.remove();
}
