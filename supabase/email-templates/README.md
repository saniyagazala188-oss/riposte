# Riposte email templates for Supabase

Paste each file into Supabase: **Authentication → Email Templates**, pick the template, set the subject, switch to the source/HTML view, replace everything, Save.

| Supabase template | Subject | File |
|---|---|---|
| Confirm signup | Confirm your email for Riposte | [confirm-signup.html](confirm-signup.html) |
| Magic Link | Your Riposte login link | [magic-link.html](magic-link.html) |
| Reset Password | Reset your Riposte password | [reset-password.html](reset-password.html) |
| Change Email Address | Confirm your new email for Riposte | [change-email.html](change-email.html) |

To change the wording, edit `scripts/build-email-templates.py` and run it again.
