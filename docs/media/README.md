# Real feature recordings

The English and Chinese README files each use a screenshot and a recording in the matching UI and conversation language. These are real DSH repository builds on the GPT Work Linux machine, using Chromium and the official DeepSeek API. They are not a deployed production Release.

| Language | Screenshot | Continuous 8-second clip | Immutable complete recording | Evidence |
| --- | --- | --- | --- | --- |
| English | [PNG](en/snapshot.png) | [MP4](en/feature-8s.mp4) · [GIF](en/feature-8s.gif) | [Full MP4](en/full-demo.mp4) | [Provenance](en/recording.json) · [QA](en/qa.json) · [Pixel checks](en/verify/technical-qa.json) |
| 简体中文 | [PNG](zh/snapshot.png) | [MP4](zh/feature-8s.mp4) · [GIF](zh/feature-8s.gif) | [完整 MP4](zh/full-demo.mp4) | [来源](zh/recording.json) · [验收](zh/qa.json) · [像素检查](zh/verify/technical-qa.json) |

The complete recordings show two root messages creating separate sessions, real model responses and a contextual reply changing the launch TODO progress from 1/3 to 2/3. Each short clip is one continuous interval showing a return to that existing Thread and expansion of its TODO list. The short clip does not demonstrate instant model generation.

Only a fixed crop and scale are applied to the short clip. The GIF and MP4 use the same interval, at normal speed. The full MP4 is a byte-identical copy of the capture master. Screen frames, API response identities, usage and native message/tool events establish the source. No seeded assistant messages, replay model, mock endpoint, captions, music or explanatory overlays are used. A normal pointer shows the operated controls.

Public event files retain user-authored messages, assistant content, TODO writes and turn boundaries. Injected runtime-context messages and reasoning are omitted. Credentials and authentication URLs are not published.

The recorded UI source is commit `c44b9905213f639bb1ecb2c3c7a8980fdf6ede55`. Each provenance file contains SHA-256 hashes for the plugin UI and projection. The media update does not change those product files. The final staged commit still runs a fresh real API browser E2E through the Git hook.

## Reproduce

Use the pinned built DSH checkout and host credentials described in [verification](../verification.md). Recording also requires FFmpeg. Encoding and pixel checks require Python, Pillow, Tesseract and its `eng` and `chi_sim` language data. Keep keys outside this repository.

```sh
# Output goes to a new private runtime directory. Both languages run by default.
DSH_LIVE_OUTPUT="$PWD/.runtime/feature-media/new-take" npm run record:feature

# Use a new edits directory; the encoder refuses to overwrite an existing edit.
python scripts/build-recorded-media.py \
  .runtime/feature-media/new-take/en .runtime/feature-media/new-edit/en
python scripts/build-recorded-media.py \
  .runtime/feature-media/new-take/zh .runtime/feature-media/new-edit/zh

python scripts/verify-recorded-media.py \
  .runtime/feature-media/new-edit/en .runtime/feature-media/new-edit/zh --write

# Recheck the published files without rewriting them.
npm run verify:media
```

The recorder fails if sessions mix, the expected native TODO update is absent, a model response cannot be matched to its actual HTTPS response, console errors occur, or the short clip lacks three seconds of visible result. A failed take is kept outside the published media and recorded in [the take log](takes.md).

The encoder enforces a 240-frame, 30 fps H.264 MP4 and an infinite-loop GIF under 3 MiB. Verification decodes the video, checks file hashes and source continuity, and measures text in decoded MP4 and GIF pixels. Latin targets use capital height ≥16 px, operated-label x-height ≥9 px and secondary-label x-height ≥7 px. CJK targets use full glyph height at the same role thresholds. OCR runs in normal and inverted polarity with PSM 6 and 11. Contact sheets and an independent cold-viewer review supplement these technical checks.

See [the source-backed story and shot plan](story.md), [the take log](takes.md), and the per-language `verify` directories. The recording workflow follows [my-release-skills at the inspected revision](https://github.com/liush2yuxjtu/my-release-skills/tree/6c50908b990afd0e001dfc63afb4227a3f917c15), with the Work execution and language mapping documented in the shot plan.
