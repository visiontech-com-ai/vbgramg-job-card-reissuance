# VBG-RAM-G — Job Card Re-issuance Auto Processor

**By [VisionTech](https://github.com/visiontech-com-ai)**

A helper script that marks Job Card re-issuance records in bulk on the
**VBG-RAM-G** portal (Viksit Bharat Guarantee for Rozgar & Ajeevika Mission).

Instead of ticking 10 checkboxes, clicking **Update**, clicking **OK**, and
repeating that hundreds of times, you run this once and let it work through
every page, every village, and every panchayat on its own.

📖 **[Read the step-by-step guide →](https://visiontech-com-ai.github.io/vbgramg-job-card-reissuance/)**

---

## What it does

For each panchayat you choose, it:

1. Opens each village in turn
2. Ticks all the checkboxes on the page
3. Clicks **Update** and waits for *"Valid Record(s) updated successfully !!"*
4. Moves to the next batch of records
5. Repeats until that village has nothing left, then checks it **again** to be sure
6. Moves to the next village, then the next panchayat

At the end it tells you how many records were marked and how long it took.

## What you need

- **Google Chrome** on a computer (not a phone)
- Your **portal login**
- To be **in India** — the portal blocks other countries
- 30–60 minutes, depending on how many records you have

## Quick start

If you've done this kind of thing before, the short version is:

1. Log in to the portal and open the **Job Card Re-issuance** page. Pick your
   district and block so the panchayat dropdown fills up.
2. Press <kbd>F12</kbd> → **Sources** tab → click **Deactivate breakpoints**
   (the flag-with-a-slash icon). ⚠️ **Don't skip this** — the portal has
   `debugger` statements that will freeze the page.
3. **Sources** → **Snippets** → **+ New snippet** → name it `vbgramg`
4. Paste all of [`auto.js`](auto.js) → <kbd>Ctrl</kbd>+<kbd>S</kbd> to save
5. <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to run
6. A box asks which panchayats — type `ALL` or a number like `7`
7. Leave the tab open and visible. Don't click on the page.

**New to this? Follow the [full illustrated guide](https://visiontech-com-ai.github.io/vbgramg-job-card-reissuance/)
instead — it explains every step with pictures.**

## Choosing panchayats

When the box appears you can type:

| You type | What happens |
|---|---|
| `ALL` or leave it blank | Every panchayat |
| `7` | Only panchayat number 7 |
| `1,4,9` | Those three |
| `2-6` | Panchayats 2 through 6 |
| `somaspur` | Anything with that name — matches SOMASPUR-I *and* SOMASPUR-II |
| `1,5-8,gurap` | Mix and match |
| *Cancel* | Nothing happens at all |

Useful for resuming: if you finished 1–8 yesterday, type `9-18` today.

## Is it safe to run twice?

Yes. Records that are already marked don't come back in the list, so re-running
only picks up whatever is left. If a run gets interrupted, just run it again.

## Troubleshooting

| What you see | What to do |
|---|---|
| **Paused in debugger** | You skipped the breakpoints step. Press <kbd>F8</kbd>, then deactivate breakpoints and re-run. |
| `panchayat dropdown not found` | You're on the wrong page. Open the Job Card Re-issuance page first. |
| `caller, callee, and arguments...` | You pasted into **Console** instead of **Snippets**. Use a Snippet. |
| Nothing happens | Check the **Console** tab for red text. Refresh the page and try again. |
| `village stuck on ...` | The portal didn't switch. The script skips it and carries on — re-run that panchayat afterwards. |
| `sweep limit hit` | Check that village by hand; something unusual happened. |
| Logged out mid-run | Log in again, reopen the page, re-run. Finished work is saved. |

## How it works (for the curious)

The portal is ASP.NET WebForms with UpdatePanel partial refreshes. Three things
make automating it awkward, and the script handles each:

- **Chrome Snippets run in strict mode**, but ASP.NET's `__doPostBack` inspects
  `arguments.callee.caller` to find the triggering event — which throws if any
  strict frame is on the stack. The script fires postbacks via
  `setTimeout("__doPostBack(...)", 0)` so they run on an empty, non-strict stack.

- **Knowing when a refresh finished.** It hooks `beginRequest`/`endRequest` and
  counts *completed* postbacks, then waits for the counter to pass a value taken
  before the click. A stale event can't satisfy a later wait.

- **The pager shifts under you.** Marked records leave the grid, so page 2 slides
  into the page-1 slot. Clicking "next" there skips a whole batch. The script
  fingerprints the grid before each save and only advances the pager when the
  rows *didn't* change.

It also patches the portal's own `ValidateRadioButton`, which throws on every
Update click because it looks for a radio group that isn't in these rows.

## Disclaimer

An automation helper for work you are already authorised to do on the portal. It
only clicks the same buttons you would click by hand — it does not bypass logins,
change validation, or touch anything you don't have access to. **You are
responsible for the data you submit.** Verify your results on the portal.

Not affiliated with, endorsed by, or connected to NIC or the Ministry of Rural
Development.

## License

[MIT](LICENSE) © VisionTech
