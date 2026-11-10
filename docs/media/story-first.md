# Story-first product demo — record-production-feature adaptation

This DSH plugin uses the **story research and cold-viewer portions** of [my-release-skills/record-production-feature](https://github.com/liush2yuxjtu/my-release-skills/tree/main/skills/record-production-feature). ChatCut-only hard rules (English-only UI, stock-footage portrait cutout, ChatCut machine lock) do not apply. Actual DSH language matching, real-model provenance, and native controls remain mandatory.

## User story

**An agent user juggling two plans returns to the right thread and continues its existing TODO list instead of losing context.**

1. Setup: an existing launch plan is visible.
2. Contrast: switching to another task creates a separate session.
3. Action: reopen the launch thread and continue the work.
4. Payoff: the saved native TODO state is visible without restarting the conversation.

## Story demo artifacts

| Locale | Edited story MP4 | Raw original | Edit manifest |
| --- | --- | --- | --- |
| English | [24-second demo](en/story-demo.mp4) | [Full real recording](en/full-demo.mp4) | [Manifest](en/story-demo.manifest.json) |
| 简体中文 | [20-second demo](zh/story-demo.mp4) | [完整真实原片](zh/full-demo.mp4) | [来源](zh/story-demo.manifest.json) |

These MP4s are editorial derivatives of existing real Chromium/official DeepSeek API recordings, **not new real API calls**. The cuts preserve pixels and normal speed inside each source interval, but time jumps between intervals. They contain no generated product frames, captions, or music. Source SHA256, exact intervals and output SHA256 are recorded in the manifests. Real API receipts live in the original [media evidence](README.md).

**QA:** ffprobe H.264/yuv420p and duration checks passed; visual contact sheets were inspected. Independent context-free cold-viewer comprehension and a freshly recorded story take remain pending, so do not label the *story* as final PASS. Keep the original 8s clips unchanged until a later replacement passes both provenance and narrative QA.

## Next recording acceptance

- Research real user problem and prepare A/B/C stories; score all candidates with the seven weighted criteria from `record-production-feature/references/story-research.md`.
- Before capture: record intended user action, starting UI state, exact outcome and language. Use real DSH sessions and actual DeepSeek API; no mock fallback for release media.
- Rehearse UI, record immutable full MP4, preserve real HTTPS response IDs, tool IDs, source SHA and state assertions.
- Deliver 15–30s story demo and separately a continuous 8s GIF. Editorial cuts are allowed in the story demo only when disclosed; the GIF's original continuous source interval must be traceable.
- Inspect frames at the delivery dimensions, real task-state transition and visible payoff; run an independent cold-viewer test: *Who has what problem, what changed, and why is that useful?*
- Every supported locale needs a matching real UI recording. No English screenshot or video substituted for Chinese content.
