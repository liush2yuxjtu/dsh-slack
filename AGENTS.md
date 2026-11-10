# Project rules

Work on main. Commit and push verified changes directly. Do not create a pull request or an issue. Keep this plugin external to DSH. Do not modify the upstream checkout.

Use official slots, session APIs, native conversation content and durable session projections. Every root message creates a new session. Every thread reply uses the selected session. Keep model credentials on the host and out of Git and browser code.

Before each commit run `node scripts/pre-commit.mjs`. Install the Git hook with `node scripts/install-hooks.mjs`. This gate tests the staged files in a separate directory and requires a fresh real DeepSeek API E2E. A mock, seeded assistant response or replay does not satisfy the gate. Missing prerequisites fail the commit.

Capture screenshots from real Chromium on this machine. Keep a source hash and actual API response identities with the acceptance evidence. Never describe a generated design image as a real screenshot.
