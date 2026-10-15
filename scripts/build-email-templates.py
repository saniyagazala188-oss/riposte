"""Builds Riposte's sign-in email templates for Supabase (Authentication -> Email Templates).
Run: python3 scripts/build-email-templates.py  -> writes supabase/email-templates/*.html
Supabase fills in {{ .ConfirmationURL }} and {{ .Email }} when it sends each email."""
from pathlib import Path

INK, MUTED, LINE, ACCENT, BG, SOFT = "#12171c", "#5a6470", "#dce1e3", "#0e6b66", "#f4f6f5", "#e3f0ee"

def page(preheader, heading, intro, button, note, ignore):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>{heading}</title>
</head>
<body style="margin:0;padding:0;background:{BG};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:{INK}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">{preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{BG};padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 4px 16px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="width:28px;height:28px;background:{ACCENT};border-radius:8px;text-align:center;vertical-align:middle;color:#ffffff;font-size:16px;font-weight:700;line-height:28px">&#8599;</td>
<td style="padding-left:10px;font-size:18px;font-weight:700;color:{INK}">Riposte</td>
</tr></table>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid {LINE};border-radius:16px;padding:32px 28px">
<h1 style="margin:0 0 10px;font-size:24px;line-height:1.25;font-weight:700;color:{INK}">{heading}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:{MUTED}">{intro}</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="border-radius:10px;background:{ACCENT}">
<a href="{{{{ .ConfirmationURL }}}}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px">{button}</a>
</td></tr></table>
<p style="margin:24px 0 0;padding:12px 14px;background:{SOFT};border-radius:10px;font-size:14px;line-height:1.5;color:{INK}">{note}</p>
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:{MUTED}">Button not working? Copy this link into your browser:<br>
<a href="{{{{ .ConfirmationURL }}}}" style="color:{ACCENT};word-break:break-all">{{{{ .ConfirmationURL }}}}</a></p>
</td></tr>
<tr><td style="padding:18px 4px 0;font-size:12px;line-height:1.6;color:{MUTED}">
{ignore}<br>
Riposte · competitive intelligence for marketers · <a href="https://useriposte.com" style="color:{MUTED}">useriposte.com</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
"""

TEMPLATES = {
    "confirm-signup": dict(
        subject="Confirm your email for Riposte",
        preheader="One click and your Riposte workspace is ready.",
        heading="Confirm your email",
        intro="Thanks for signing up for Riposte. Confirm that {{ .Email }} is yours, and your workspace is ready.",
        button="Confirm my email",
        note="<strong>What happens next:</strong> add your product and a few competitors. Riposte checks their sites every day and tells you what changed, why it matters to you, and what to do about it.",
        ignore="Didn't sign up? You can ignore this email. No account is created until the link is clicked.",
    ),
    "magic-link": dict(
        subject="Your Riposte login link",
        preheader="Click to log in. The link works once.",
        heading="Your login link",
        intro="Click below to log in to Riposte as {{ .Email }}. No password needed.",
        button="Log in to Riposte",
        note="The link works <strong>once</strong> and expires in <strong>1 hour</strong>. Open it on the same device you asked from.",
        ignore="Didn't ask for this? You can ignore this email. Nobody can log in without the link.",
    ),
    "reset-password": dict(
        subject="Reset your Riposte password",
        preheader="Choose a new password for your Riposte account.",
        heading="Reset your password",
        intro="Someone asked to reset the password for {{ .Email }}. If that was you, click below and choose a new one.",
        button="Choose a new password",
        note="The link works <strong>once</strong> and expires in <strong>1 hour</strong>. Your current password keeps working until you save a new one.",
        ignore="Didn't ask for this? You can ignore this email. Your password stays the same.",
    ),
    "change-email": dict(
        subject="Confirm your new email for Riposte",
        preheader="Confirm the new email address for your Riposte account.",
        heading="Confirm your new email",
        intro="You asked to change your Riposte login email to {{ .NewEmail }}. Click below to confirm.",
        button="Confirm new email",
        note="Until you confirm, you keep logging in with {{ .Email }}.",
        ignore="Didn't ask for this? Ignore this email and nothing changes.",
    ),
}

out = Path(__file__).resolve().parent.parent / "supabase" / "email-templates"
out.mkdir(parents=True, exist_ok=True)
index = ["# Riposte email templates for Supabase\n",
         "Paste each file into Supabase: **Authentication → Email Templates**, pick the template, set the subject, switch to the source/HTML view, replace everything, Save.\n",
         "| Supabase template | Subject | File |", "|---|---|---|"]
names = {"confirm-signup": "Confirm signup", "magic-link": "Magic Link", "reset-password": "Reset Password", "change-email": "Change Email Address"}
for key, t in TEMPLATES.items():
    (out / f"{key}.html").write_text(page(t["preheader"], t["heading"], t["intro"], t["button"], t["note"], t["ignore"]))
    index.append(f"| {names[key]} | {t['subject']} | [{key}.html]({key}.html) |")
(out / "README.md").write_text("\n".join(index) + "\n\nTo change the wording, edit `scripts/build-email-templates.py` and run it again.\n")
print("wrote", len(TEMPLATES), "templates to", out)
