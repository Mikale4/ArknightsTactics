
// =====================================================================
//  GAME BOY SHELL — the whole game sits on a Game Boy screen. The buttons work:
//  D-pad: tabs (left/right) and scrolling (up/down) in menus; targets (left/right) and moves (up/down) in battle.
//  A: confirm / advance text / use the highlighted move. B: back / close. START: the START menu. SELECT: Auto in
//  battle, the Bag elsewhere. Keyboard: arrows, Z or Space = A, X or Esc = B, Enter = START, Shift = SELECT.
// =====================================================================
const SHELLS = [["classic", "Classic"], ["pikachu", "Pikachu"], ["red", "Red"], ["blue", "Blue"], ["purple", "Atomic Purple"], ["off", "Off"]];
const GB = { hl: 0, rep: 0 };
function applyShell() {
  const el = $("#gb"); if (!el) return;
  el.className = "gb " + ((S && S.settings.shell) || "classic");
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = getComputedStyle(el).getPropertyValue("--body").trim() || "#cfccc4";
  if (BT.on) setTimeout(sizeCanvas, 30);
}
const shown = sel => { const e = $(sel); return e && !e.hidden ? e : null; };
function gbPress(k) {
  sfx("tap");
  try { navigator.vibrate && navigator.vibrate(6); } catch (e) { /* no vibration */ }
  const ti = shown("#title");
  if (ti && !ti.classList.contains("out")) { if ((k === "a" || k === "start") && $("#ttap") && !$("#ttap").hidden) titleStart(); return; }
  if (shown("#gacha")) { const d = shown("#gDone") || shown("#evDone"); if (k === "a" || k === "b" || k === "start") { if (d) d.click(); else { const w = $("#gacha .gwrap"); if (w) w.click(); } } return; }
  if (shown("#dlg")) { if (k === "start") $("#dSkip").click(); else if (k === "a" || k === "b") $("#dlg .dwrap").click(); return; }
  if (shown("#battle")) return gbBattle(k);
  if (shown("#modal")) return gbModal(k);
  gbApp(k);
}
function gbBattle(k) {
  const pop = shown("#bPop");
  if (pop) { if (k === "a" || k === "b" || k === "start") { const r = $("#bRes"); if (r) r.click(); else pop.hidden = true; } else if (k === "up" || k === "down") pop.firstElementChild && pop.firstElementChild.scrollBy({ top: k === "up" ? -80 : 80 }); return; }
  if ($(".result")) { if (k === "a" || k === "b") $("#rDone").click(); else if (k === "select" && $("#rRetry")) $("#rRetry").click(); return; }
  if (k === "start") return $("#bPause").click();
  if (k === "select") return $("#bAuto").click();
  const B = BT.B, u = B && B.waiting;
  if (!BT.picking || !u || !BT.inputRes) return;
  const n = u.skills.length;
  if (k !== "b") BT.gbUsed = true;
  if (k === "left" || k === "right") {
    const list = B.targetable(u).map(x => VU(x.uid)).filter(v => v && v.scr).sort((a, b) => a.scr.x - b.scr.x);
    if (!list.length) return;
    const i = list.indexOf(BT.target), j = i < 0 ? 0 : (i + (k === "right" ? 1 : -1) + list.length) % list.length;
    BT.target = list[j]; BT.redrawControls && BT.redrawControls();
  } else if (k === "up" || k === "down") { GB.hl = (GB.hl + (k === "down" ? 1 : -1) + n) % n; BT.redrawControls && BT.redrawControls(); }
  else if (k === "a") BT.chooseMove && BT.chooseMove(u.skills[Math.min(GB.hl, n - 1)].slot);
  else if (k === "b" && BT.target) popup(unitPop(BT.target.u));
}
function gbModal(k) {
  const box = $("#modal .mbox"); if (!box) return;
  const items = $$("#modal .gbitem, #modal .starter, #modal .avpick button");
  if (items.length) {
    let i = items.findIndex(x => x.classList.contains("gbsel"));
    if (["up", "down", "left", "right"].includes(k)) {
      i = i < 0 ? 0 : (i + (k === "down" || k === "right" ? 1 : -1) + items.length) % items.length;
      items.forEach((x, j) => x.classList.toggle("gbsel", j === i)); items[i].scrollIntoView({ block: "nearest" }); return;
    }
    if (k === "a" && i >= 0 && !$("#modal .avpick")) { items[i].click(); return; }
    if (k === "a" && i >= 0 && $("#modal .avpick") && items[i].closest(".avpick")) { items[i].click(); return; }
  }
  if (k === "up" || k === "down") { box.scrollBy({ top: k === "up" ? -90 : 90, behavior: "smooth" }); return; }
  if (k === "a") { const b = [...$$("#modal .btn")].find(x => !x.disabled && !x.classList.contains("ghost") && !x.classList.contains("red")) || $("#modal .btn:not([disabled])"); if (b) b.click(); return; }
  if (k === "b" || (k === "start" && $("#modal.gbm"))) { if (!$("#nname") && !$(".starters")) closeModal(); }
}
const TAB_ORDER = ["home", "story", "battle", "ops", "hh"];
function gbApp(k) {
  if (!UI.inGame) return;
  const view = $("#view");
  if (k === "left" || k === "right") {
    const btns = $$("#tabs button"), i = btns.findIndex(b => b.classList.contains("on"));
    const j = ((i < 0 ? 0 : i) + (k === "right" ? 1 : -1) + btns.length) % btns.length;
    btns[j].click(); return;
  }
  if (k === "up" || k === "down") { view.scrollBy({ top: (k === "up" ? -1 : 1) * view.clientHeight * .45, behavior: "smooth" }); return; }
  if (k === "start") return startMenu();
  if (k === "select") return route("depot");
  if (k === "b") { const bk = $("#view .backbtn"); if (bk) bk.click(); else if (UI.view !== "home") route("home"); return; }
  if (k === "a") {
    const vr = view.getBoundingClientRect();
    const cand = $$("#view .hint, #view .btn:not(.ghost):not([disabled])").find(e => { const r = e.getBoundingClientRect(); return r.height && r.bottom > vr.top && r.top < vr.bottom; });
    if (cand) cand.click();
  }
}
// the START menu, laid out like Red and Blue's
function startMenu() {
  const it = (act, label, ic, data = "") => `<button class="gbitem" data-act="${act}" ${data}>${ic}<span>${label}</span></button>`;
  openModal(`<div class="startmenu">
    ${it("go", "POKéDEX", IC.dex.replace("<svg", '<svg width="22" height="22"'), 'data-v="dex"')}
    ${it("go", "POKéMON", IC.pokeball.replace("<svg", '<svg width="22" height="22"'), 'data-v="ops"')}
    ${it("go", "BAG", IC.depot.replace("<svg", '<svg width="22" height="22"'), 'data-v="depot"')}
    ${it("go", esc(S.name.toUpperCase()), `<img class="px" src="${trainerURL(avatar())}" alt="">`, 'data-v="settings"')}
    ${it("inbox", "MAIL", IC.mail.replace("<svg", '<svg width="22" height="22"'))}
    ${it("gbSave", "SAVE", IC.book.replace("<svg", '<svg width="22" height="22"'))}
    ${it("go", "OPTION", IC.gearIc.replace("<svg", '<svg width="22" height="22"'), 'data-v="settings"')}
    ${it("closeModal", "EXIT", IC.back.replace("<svg", '<svg width="22" height="22"'))}
  </div>`, "gbm");
  const first = $("#modal .gbitem"); if (first) first.classList.add("gbsel");
}
const GB_ACT = {
  gbSave: () => { closeModal(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } sfx("heal"); toast(`${S.name} saved the game.`, "gold"); },
  setShell: d => { S.settings.shell = d.v; applyShell(); rerender(); },
};
function gbInit() {
  // buttons react on press (not release), and the D-pad repeats while held
  for (const b of $$("[data-gb]")) {
    const k = b.dataset.gb;
    b.addEventListener("pointerdown", ev => {
      ev.preventDefault(); b.classList.add("down"); gbPress(k);
      clearInterval(GB.rep);
      if (["up", "down", "left", "right"].includes(k)) { const t0 = Date.now(); GB.rep = setInterval(() => { if (Date.now() - t0 > 380) gbPress(k); }, 140); }
    });
    const up = () => { b.classList.remove("down"); clearInterval(GB.rep); };
    b.addEventListener("pointerup", up); b.addEventListener("pointerleave", up); b.addEventListener("pointercancel", up);
    b.addEventListener("contextmenu", ev => ev.preventDefault());
  }
  document.addEventListener("keydown", ev => {
    if (ev.target.closest && ev.target.closest("input, textarea")) return;
    const k = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", z: "a", Z: "a", " ": "a", x: "b", X: "b", Escape: "b", Backspace: "b", Enter: "start", Shift: "select" }[ev.key];
    if (!k) return;
    ev.preventDefault();
    const b = $(`[data-gb="${k}"]`); if (b) { b.classList.add("down"); setTimeout(() => b.classList.remove("down"), 120); }
    gbPress(k);
  });
}
