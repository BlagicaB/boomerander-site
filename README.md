# Boomerander

A one-page site celebrating Michiganders who left and came back, plus a signup form for the Brain Gain: a network of Michigan people with outside experience who want a job, are hiring or want to help others.

Static HTML. No build step. One file: `index.html`.

## Connect the form

Signups go straight into a Google Sheet you own, through a small Google Apps Script. Free, no form service account and you get an email for each signup.

1. Create a Google Sheet called **Boomerander Brain Gain**. Keep it private.
2. In the sheet: **Extensions → Apps Script**. Delete the starter code, paste in everything from `setup/brain-gain-sheet.gs` and click Save.
3. Pick `testSignup` in the function dropdown and click **Run**. Google asks for permission. It will say the app isn't verified because it's your own script: click **Advanced → Go to project** and allow. A **Brain Gain** tab appears with a test row. Then pick `installDailyDigest` and click **Run** once. That schedules one summary email a day (around 8am) listing everyone who signed up since the last one. To see what it looks like right away, run `sendDailyDigest`. Delete the test row after.
4. Click **Deploy → New deployment**, click the gear, choose **Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Click Deploy and copy the **Web app URL** (it ends in `/exec`).
5. Open `index.html`, find this line near the bottom and paste the URL between the quotes:

```js
const FORM_ENDPOINT = "";
```

6. Push, then submit the live form once to confirm a row lands in the sheet.

If you change the script later, use **Deploy → Manage deployments → pencil (Edit) → Version: New version → Deploy** so the URL stays the same.

**Emails:** you get one summary a day, not one per signup, so you stay far under free Gmail's limit of about 100 emails a day. No signups that day means no email. Set `INSTANT_EMAIL = true` in the script if you'd rather get an email per signup; signups still save even if Gmail's limit is hit. The summary hour follows the script's time zone (Apps Script → Project Settings), so set that to America/Detroit.

Fields collected: name, email, status (back / planning to come back / never left / employer), Michigan city, LinkedIn, where they lived, years away, industry, role, talent description, involvement (open to jobs, hiring, mentor, intros, help others move back, share story) and consent.

A hidden `_gotcha` field catches spam bots.

## Deploy on GitHub Pages

1. Create a repo (for example `boomerander-site`) and push this folder to `main`.
2. Repo Settings → Pages → deploy from `main`, root folder.
3. Add a `CNAME` file containing the domain (one line, no whitespace).
4. At the domain registrar, point DNS at GitHub Pages (A records to 185.199.108.153, .109, .110, .111 and a `www` CNAME to `<username>.github.io`).

## Keeping the stats honest

Every stat on the page links to its source. Update them when new Census numbers come out:

- Census state-to-state migration flows publish each fall.
- Census population estimates (Vintage) publish each December/January.
- Michigan's state demographer posts analysis at michigan.gov/mcda.
