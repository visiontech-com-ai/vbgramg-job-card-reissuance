/*!
 * ┌─────────────────────────────────────────────────────────┐
 * │  VisionTech · VBG-RAM-G Auto Processor                   │
 * │  Bulk Job Card marking for the Rozgar & Ajeevika portal  │
 * └─────────────────────────────────────────────────────────┘
 */
(async () => {
  const BRAND   = 'VisionTech';
  const APP     = 'VBG-RAM-G Auto Processor';
  const VERSION = '1.0';

  console.clear();
  console.log(
    `%c ${BRAND} %c ${APP} %c v${VERSION} `,
    'background:#0b3d91;color:#fff;font-weight:700;padding:3px 8px;border-radius:3px 0 0 3px',
    'background:#1565c0;color:#fff;padding:3px 8px',
    'background:#e8eef7;color:#0b3d91;padding:3px 8px;border-radius:0 3px 3px 0'
  );
  console.log('%cBulk Job Card marking — panchayat → village → page',
    'color:#5a6b82;font-style:italic');

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // The page confirms a save with alert('Valid Record(s) updated successfully !!').
  // Capture it instead of blocking, and count them so each Update can be
  // matched to its own confirmation.
  let alertCount = 0, lastAlert = '';
  window.alert = m => { alertCount++; lastAlert = String(m); };

  // ══════════════════════════════════════════════════════════════════════
  //  POSTBACK TRACKING
  //  A monotonic counter of COMPLETED postbacks. Comparing a counter
  //  (instead of watching a boolean edge, or diffing ViewState/grid text)
  //  is race-free: an endRequest from an earlier postback can never be
  //  mistaken for the one we are currently waiting on, and two identical
  //  "No data found" pages in a row no longer look like "nothing happened".
  // ══════════════════════════════════════════════════════════════════════
  const hasSys = typeof Sys !== 'undefined' && !!window.Sys?.WebForms?.PageRequestManager;

  // The portal's own ValidateRadioButton (ReIssue_JC.aspx:700) does
  // getElementById(...).getElementsByTagName(...) on a radio group that
  // doesn't exist in these grid rows, so it throws inside Page_ClientValidate
  // on every Update click. The postback still succeeds — btnSave is a submit
  // input, so the thrown onclick never cancels the default submit, and
  // ScriptManager turns that into the async postback. But it floods the
  // console, so wrap it and treat a throw as "valid".
  function patchValidator() {
    const fn = window.ValidateRadioButton;
    if (typeof fn !== 'function' || fn.__vbgPatched) return;
    const patched = function (source, args) {
      try { return fn.apply(this, arguments); }
      catch { if (args) args.IsValid = true; return true; }
    };
    patched.__vbgPatched = true;
    window.ValidateRadioButton = patched;
  }

  if (hasSys && !window.__vbgHooked) {
    const mgr = Sys.WebForms.PageRequestManager.getInstance();
    window.__vbgDone = 0;                       // completed postbacks
    window.__vbgBusy = false;                   // one in flight?
    mgr.add_beginRequest(() => { window.__vbgBusy = true; });
    mgr.add_endRequest(() => {
      window.__vbgBusy = false;
      window.__vbgDone++;
      patchValidator();   // each refresh re-runs page scripts, restoring the original
    });
    window.__vbgHooked = true;
    console.log('✓ UpdatePanel hooks installed');
  }
  patchValidator();

  const pbDone = () => window.__vbgDone || 0;
  const pbBusy = () => !!window.__vbgBusy;

  // Wait until no postback is in flight (before we trigger a new one).
  async function waitIdle(timeout = 25000) {
    if (!hasSys) { await sleep(2500); return; }
    const t0 = Date.now();
    while (pbBusy() && Date.now() - t0 < timeout) await sleep(200);
  }

  // Wait until the completed-postback counter passes `before`.
  async function waitDone(before, timeout = 25000) {
    if (!hasSys) { await sleep(3000); return true; }
    const t0 = Date.now();
    while (pbDone() <= before) {
      if (Date.now() - t0 > timeout) { console.warn('    ⚠ postback timeout'); return false; }
      await sleep(200);
    }
    await sleep(350);                           // let the DOM swap settle
    return true;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  FIRING A POSTBACK FROM A STRICT-MODE SNIPPET
  //  Sys$WebForms$PageRequestManager$_doPostBack walks the call stack via
  //  arguments.callee.caller / caller.arguments to locate the DOM event.
  //  Any strict-mode frame on that stack makes those accessors throw:
  //    "'caller', 'callee', and 'arguments' properties may not be accessed
  //     on strict mode functions"
  //  Chrome Snippets are strict, so a DIRECT call always fails — and so
  //  does window.eval(), because our strict frame is still on the stack.
  //  setTimeout(string, 0) is the escape: the string is compiled and run
  //  as a fresh global (non-strict) task with an EMPTY stack. This is the
  //  exact mechanism the page's own onchange="setTimeout('__doPostBack…')"
  //  attributes use.
  // ══════════════════════════════════════════════════════════════════════
  async function firePostback(controlId, label = controlId) {
    await waitIdle();
    const before = pbDone();

    // Attempt A — setTimeout with a string: empty stack, global non-strict.
    window.setTimeout(`__doPostBack('${controlId}','')`, 0);

    const t0 = Date.now();
    while (!pbBusy() && pbDone() === before && Date.now() - t0 < 2500) await sleep(150);

    // Attempt B — nothing started (e.g. CSP blocked string-eval): fall back
    // to dispatching a change event so the page's own inline handler runs.
    if (!pbBusy() && pbDone() === before) {
      console.warn(`    ⚠ ${label}: setTimeout path didn't start — trying dispatchEvent`);
      const el = document.getElementById(controlId.replace(/\$/g, '_'));
      el?.dispatchEvent(new Event('change', { bubbles: true }));
      const t1 = Date.now();
      while (!pbBusy() && pbDone() === before && Date.now() - t1 < 2500) await sleep(150);
    }

    if (!pbBusy() && pbDone() === before) {
      console.error(`    ❌ ${label}: postback never started`);
      return false;
    }
    return await waitDone(before);
  }

  // Click something that causes a postback, and wait for it to finish.
  async function clickAndWait(el, timeout = 25000) {
    await waitIdle();
    const before = pbDone();
    el.click();
    return await waitDone(before, timeout);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  GRID / PAGER HELPERS
  // ══════════════════════════════════════════════════════════════════════
  const grid = () => document.getElementById('ctl00_ContentPlaceHolder1_griddata');
  const msgText = () =>
    document.getElementById('ctl00_ContentPlaceHolder1_lblmsg')?.textContent.trim() || '';

  const getCheckboxes = () =>
    [...(grid()?.querySelectorAll('input[type="checkbox"]') || [])];

  function gridEmpty() {
    const txt = grid()?.innerText || '';
    return txt.includes('No data found') || txt.includes('already Marked');
  }

  // Fingerprint of what the grid is currently showing. Used to tell whether
  // an Update replaced the rows (marked records drop out of the result set)
  // or left them in place.
  function gridSig() {
    const g = grid();
    if (!g) return '';
    const rows = g.querySelectorAll('tr').length;
    return rows + '|' + (g.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  }

  // The pager renders the current page as a <span> and the others as <a>.
  // "Next page" = the first <a> that appears after that <span>.
  function nextPageLink() {
    let past = false;
    for (const td of document.querySelectorAll('tr.pageing td')) {
      if (td.querySelector('span') && !td.querySelector('a')) { past = true; continue; }
      if (past) { const a = td.querySelector('a'); if (a) return a; }
    }
    return null;
  }

  function pageLink(num) {
    for (const a of document.querySelectorAll('tr.pageing td a'))
      if (a.textContent.trim() === String(num)) return a;
    return null;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  CONFIRMATION
  //  Never advance on the strength of "the postback finished" alone — the
  //  save is only real once the page says so, via alert() or lblmsg.
  // ══════════════════════════════════════════════════════════════════════
  async function waitForSave(alertsBefore, timeout = 12000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      if (alertCount > alertsBefore) return lastAlert;
      const m = msgText();
      if (/success|updated|already marked|no data found/i.test(m)) return m;
      await sleep(200);
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  ONE PASS OVER A VILLAGE  →  number of records saved
  //
  //  The pager trap: marked records LEAVE the grid, so after saving page 1
  //  the old page 2 slides up into the page-1 slot. Clicking "next page"
  //  there lands on old page 3 and silently skips a whole batch. So when
  //  the grid refills we deliberately STAY PUT and re-read the same slot;
  //  we only advance the pager when an Update left the rows unchanged.
  // ══════════════════════════════════════════════════════════════════════
  async function onePass() {
    let saved = 0, updates = 0, stuck = 0;

    for (let guard = 0; guard < 400; guard++) {
      if (gridEmpty()) break;

      const boxes = getCheckboxes();
      if (!boxes.length) {
        const next = nextPageLink();               // nothing here; look further on
        if (!next) break;
        await clickAndWait(next, 20000);
        continue;
      }

      const sigBefore = gridSig();
      const alertsBefore = alertCount;

      boxes.forEach(cb => { if (!cb.checked) cb.click(); });
      await clickAndWait(document.getElementById('ctl00_ContentPlaceHolder1_btnSave'));

      const confirm = await waitForSave(alertsBefore);
      if (!confirm) {
        stuck++;
        console.warn(`    ⚠ no confirmation after Update (${stuck}/3) — retrying`);
        if (stuck >= 3) { console.error('    ❌ giving up on this page'); break; }
        await sleep(1500);
        continue;                                  // same rows, try again
      }
      stuck = 0;

      if (/already marked|no data found/i.test(confirm)) break;

      saved += boxes.length;
      updates++;
      console.log(`    +${boxes.length} (${saved} total) — ${confirm}`);

      if (gridEmpty()) break;

      // Rows unchanged ⇒ they persist after marking, so the remaining work
      // really is on later pages. Otherwise the slot refilled: stay put.
      if (gridSig() === sigBefore) {
        const next = nextPageLink();
        if (!next) break;
        await clickAndWait(next, 20000);
      }
    }

    if (updates) console.log(`    ⇒ ${saved} record(s) in ${updates} update(s)`);
    return saved;
  }

  // Sweep until a full pass finds nothing left to tick. The first pass does
  // the bulk; later passes are cheap and prove the village is actually clear
  // rather than assuming it from a pager that ran out.
  async function doVillage() {
    let total = 0;
    for (let sweep = 1; sweep <= 5; sweep++) {
      if (sweep > 1) {
        const first = pageLink(1);                 // restart from the top
        if (first) await clickAndWait(first, 20000);
      }
      const n = await onePass();
      total += n;
      if (n === 0) return total;
      console.log(`    ↻ verifying (sweep ${sweep + 1})`);
    }
    console.warn('    ⚠ sweep limit hit — re-check this village manually');
    return total;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  ALL VILLAGES OF THE CURRENT PANCHAYAT
  // ══════════════════════════════════════════════════════════════════════
  async function doAllVillages() {
    let total = 0;
    const vSel = () => document.getElementById('ctl00_ContentPlaceHolder1_Village_Code');
    if (!vSel()) { console.log('  ⚠ no village dropdown'); return 0; }

    // Snapshot values now — the <select> is replaced by every UpdatePanel
    // refresh, so a saved element/option reference goes stale.
    const villages = [...vSel().options]
      .filter(o => o.value.trim() && o.value.trim() !== 'Select')
      .map(o => ({ value: o.value, text: o.text.trim() }));

    if (!villages.length) { console.log('  no villages — skipping'); return 0; }
    console.log(`  ${villages.length} village(s)`);

    for (let i = 0; i < villages.length; i++) {
      const v = villages[i];
      console.log(`\n  [V${i + 1}/${villages.length}] ${v.text}`);

      const sel = vSel();
      if (sel.value.trim() !== v.value.trim()) {
        sel.value = v.value;                    // set BEFORE the postback so
        await firePostback(                     // ViewState picks it up
          'ctl00$ContentPlaceHolder1$Village_Code',
          `village ${v.text}`
        );
        const now = vSel();
        if (now && now.value.trim() !== v.value.trim()) {
          console.error(`    ❌ village stuck on "${now.selectedOptions[0]?.text.trim()}" — skipping`);
          continue;
        }
      }
      total += await doVillage();
    }
    return total;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  SELECTION — accepts "3", "1,4,7", "2-6", a name fragment, or ALL
  //  Returns null for "everything", otherwise a sorted list of 1-based
  //  positions in `all`.
  // ══════════════════════════════════════════════════════════════════════
  function parseSelection(input, all) {
    const s = (input || '').trim();
    if (!s || /^(a|all|\*)$/i.test(s)) return null;

    const picked = new Set();
    for (const raw of s.split(',')) {
      const part = raw.trim();
      if (!part) continue;

      const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        let a = +range[1], b = +range[2];
        if (a > b) [a, b] = [b, a];
        for (let i = a; i <= b; i++) if (i >= 1 && i <= all.length) picked.add(i);
        continue;
      }
      if (/^\d+$/.test(part)) {
        const n = +part;
        if (n >= 1 && n <= all.length) picked.add(n);
        else console.warn(`  ⚠ "${part}" is out of range 1–${all.length}`);
        continue;
      }
      const hits = all.filter(p => p.text.toLowerCase().includes(part.toLowerCase()));
      if (!hits.length) console.warn(`  ⚠ nothing matched "${part}"`);
      hits.forEach(p => picked.add(p.n));
    }
    return [...picked].sort((x, y) => x - y);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  MAIN
  // ══════════════════════════════════════════════════════════════════════
  const pSel = () => document.getElementById('ctl00_ContentPlaceHolder1_ddlpanch');
  if (!pSel()) { console.error('❌ panchayat dropdown not found'); return; }

  const all = [...pSel().options]
    .filter(o => o.value !== '00')
    .map((o, i) => ({ value: o.value, text: o.text.trim(), n: i + 1 }));

  const menu = all.map(p => `${String(p.n).padStart(2)}. ${p.text}`).join('\n');
  console.log(`\nPanchayats (${all.length}):\n${menu}`);

  let queue = all;
  try {
    const answer = window.prompt(
      `${BRAND} · ${APP} v${VERSION}\n` +
      `${'═'.repeat(46)}\n` +
      `Which panchayat(s) should I process?\n\n${menu}\n\n` +
      `${'─'.repeat(46)}\n` +
      `Examples:  7   |   1,4,9   |   2-6   |   somaspur\n` +
      `ALL or blank = every panchayat.   Cancel = abort.`,
      'ALL'
    );
    if (answer === null) { console.log('\n⏹  Cancelled — nothing processed.'); return; }

    const picked = parseSelection(answer, all);
    if (picked) {
      if (!picked.length) { console.error('\n❌ Nothing matched your input — aborting.'); return; }
      queue = picked.map(n => all[n - 1]);
    }
  } catch {
    console.warn('⚠ prompt() unavailable — processing all panchayats');
  }

  console.log(
    `\n▶ Queue: ${queue.length} of ${all.length} — ${queue.map(p => p.text).join(', ')}`
  );

  const started = Date.now();
  let grandTotal = 0, failed = 0;

  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    console.log(
      `\n${'─'.repeat(52)}\n[${i + 1}/${queue.length}]  P${p.n}. ${p.text}\n${'─'.repeat(52)}`
    );

    const el = pSel();
    if (el.value !== p.value) {
      el.value = p.value;
      await firePostback('ctl00$ContentPlaceHolder1$ddlpanch', `panchayat ${p.text}`);
      const now = pSel();
      if (now && now.value !== p.value) {
        console.error(`    ❌ panchayat didn't switch — skipping`);
        failed++;
        continue;
      }
    }
    const n = await doAllVillages();
    grandTotal += n;
    console.log(`  ▪ ${p.text}: ${n} record(s) marked`);
  }

  const mins = Math.floor((Date.now() - started) / 60000);
  const secs = Math.round(((Date.now() - started) % 60000) / 1000);

  console.log('');
  console.log(
    `%c ${BRAND} %c RUN COMPLETE `,
    'background:#0b3d91;color:#fff;font-weight:700;padding:3px 8px;border-radius:3px 0 0 3px',
    'background:#1b7f4b;color:#fff;font-weight:700;padding:3px 8px;border-radius:0 3px 3px 0'
  );
  console.log(`   Panchayats  : ${queue.length - failed} of ${queue.length}`);
  console.log(`   Records     : ${grandTotal} marked`);
  console.log(`   Elapsed     : ${mins}m ${secs}s`);
  if (failed) console.warn(`   ⚠ ${failed} panchayat(s) could not be opened — re-run those`);
  console.log('%c   VisionTech · automation for VBG-RAM-G',
    'color:#5a6b82;font-style:italic');
})().catch(e => console.error(`%c VisionTech %c FATAL `,
  'background:#0b3d91;color:#fff;padding:2px 6px', 'background:#b3261e;color:#fff;padding:2px 6px', e));
