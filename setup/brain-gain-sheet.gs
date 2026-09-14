/**
 * Brain Gain signups -> Google Sheet.
 *
 * Paste this into Extensions > Apps Script on the Google Sheet that should
 * hold signups, then deploy it as a web app. Full steps are in README.md.
 */

const SHEET_NAME = "Brain Gain";
const FIELDS = [
  "name", "email", "status", "michigan_city", "linkedin", "lived_away_in",
  "years_away", "industry", "role", "talent", "involvement", "consent",
];
const NOTIFY = true; // email the sheet owner every time someone signs up

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p._gotcha) return ok_(); // the hidden field only gets filled by bots

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow([new Date()].concat(FIELDS.map((f) => clean_(p[f]))));
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY) {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: "New Boomerander: " + (p.name || "someone"),
      body: FIELDS.map((f) => f + ": " + (p[f] || "")).join("\n"),
    });
  }
  return ok_();
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

// Run this once from the Apps Script editor. It grants permissions,
// creates the "Brain Gain" tab and sends you a test email.
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
