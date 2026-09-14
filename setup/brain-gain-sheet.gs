/**
 * Brain Gain signups -> Google Sheet, plus one summary email a day.
 *
 * Paste this into Extensions > Apps Script on the Google Sheet that should
 * hold signups, then deploy it as a web app. Full steps are in README.md.
 */

const SHEET_NAME = "Brain Gain";
const FIELDS = [
  "name", "email", "status", "michigan_city", "linkedin", "lived_away_in",
  "years_away", "industry", "role", "talent", "involvement", "consent",
];
const INSTANT_EMAIL = false; // true = one email per signup (free Gmail allows about 100 a day)
const DIGEST_HOUR = 8;       // the daily summary goes out around this hour, in the script's time zone

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p._gotcha) return ok_(); // the hidden field only gets filled by bots

  // Wait up to 30 seconds for other signups arriving at the same moment.
  // If the wait runs out, save the row anyway: a lost signup is worse than a rare out-of-order row.
  const lock = LockService.getScriptLock();
  const locked = lock.tryLock(30000);
  try {
    getSheet_().appendRow([new Date()].concat(FIELDS.map((f) => clean_(p[f]))));
  } finally {
    if (locked) lock.releaseLock();
  }

  if (INSTANT_EMAIL) {
    // The row is already saved. If Gmail's daily limit is hit, skip the email instead of failing.
    try {
      MailApp.sendEmail({
        to: owner_(),
        subject: "New Boomerander: " + (p.name || "someone"),
        body: format_(p),
      });
    } catch (err) {
      console.warn("Signup saved, email skipped: " + err);
    }
  }
  return ok_();
}

// Runs once a day on the trigger set up by installDailyDigest().
function sendDailyDigest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheet_();
  const props = PropertiesService.getScriptProperties();
  const since = Number(props.getProperty("lastDigest")) || Date.now() - 24 * 60 * 60 * 1000;
  const now = Date.now();

  const count = sheet.getLastRow() - 1;
  const rows = count > 0 ? sheet.getRange(2, 1, count, FIELDS.length + 1).getValues() : [];
  const fresh = rows.filter((r) => r[0] instanceof Date && r[0].getTime() > since && r[0].getTime() <= now);

  if (fresh.length) {
    const people = fresh.map((r, i) => {
      const p = {};
      FIELDS.forEach((f, j) => (p[f] = r[j + 1]));
      return (i + 1) + ".\n" + format_(p);
    });
    // If this throws, lastDigest isn't updated, so tomorrow's summary still includes these people.
    MailApp.sendEmail({
      to: owner_(),
      subject: fresh.length + " new Boomerander" + (fresh.length === 1 ? "" : "s") + " joined the Brain Gain",
      body: "Open the sheet: " + ss.getUrl() + "\n\n" + people.join("\n"),
    });
  }
  props.setProperty("lastDigest", String(now));
}

// Run this once from the Apps Script editor to schedule the daily summary.
// Running it again replaces the schedule instead of adding a second one.
function installDailyDigest() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "sendDailyDigest")
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sendDailyDigest").timeBased().everyDays(1).atHour(DIGEST_HOUR).create();
  PropertiesService.getScriptProperties().setProperty("lastDigest", String(Date.now() - 24 * 60 * 60 * 1000));
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["submitted_at"].concat(FIELDS));
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function format_(p) {
  const line = (label, v) => (v ? label + ": " + String(v).slice(0, 400) + "\n" : "");
  return line("Name", p.name) + line("Email", p.email) + line("Status", p.status) +
    line("Michigan city", p.michigan_city) + line("Industry", p.industry) + line("Role", p.role) +
    line("Wants to", p.involvement) + line("Lived in", p.lived_away_in) +
    line("Years away", p.years_away) + line("LinkedIn", p.linkedin) + line("Talent", p.talent);
}

function owner_() {
  return Session.getEffectiveUser().getEmail();
}

// A value starting with = + - or @ would run as a spreadsheet formula.
// Prefixing an apostrophe stores it as plain text instead.
function clean_(v) {
  v = String(v || "").slice(0, 5000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run this from the editor to add a test row. Then run sendDailyDigest to see the summary email.
function testSignup() {
  doPost({
    parameter: {
      name: "Test Boomerander",
      email: "test@example.com",
      status: "Back in Michigan",
      michigan_city: "Grand Rapids",
      talent: "Testing the form",
      consent: "yes",
    },
  });
}
