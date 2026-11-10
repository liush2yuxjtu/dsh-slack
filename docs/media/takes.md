# Take decisions

Date: 2026-11-10. Decisions are based on the recorded files, source markers, decoded frames and actual-response evidence. Failed takes are not represented as passing feature recordings.

| Take / edit | Actual capture | Decision | Evidence and reason |
| --- | --- | --- | --- |
| English take 1 / edit 1 | 61.867 s, 6 actual API responses | discard edit | The first sampled frame showed history loading. The original MP4 export also ended one frame short of eight seconds. The complete capture is retained. |
| English take 1 / edit 2 | Same immutable source | **keep** | Advance the continuous interval by 0.5 s. Export exactly 240 frames at 30 fps. The first frame is stable; final conversation and TODO result remain visible for at least 5.616 s. |
| Chinese take 1 | Startup only; no model responses | discard | The browser did not finish navigation before its timeout. No accepted capture is published. |
| Chinese take 2 | 6 actual API responses | discard | The real interactions exceeded the short-clip timing limit. The recorder correctly refused a clip without the required result hold. |
| Chinese take 3 / edit 1 | 25.867 s, 6 actual API responses | **keep** | Real sessions, contextual reply and TODO progress passed. Exact eight-second export; visible final result for at least 5.527 s. |

Each kept MP4 and GIF passes decoding, file-hash, source-continuity, language and actual-pixel OCR checks. The original full MP4 is unchanged. The published contact sheets contain real decoded frames; the numbered labels appear only in review sheets, not in the recordings.

The [independent cold viewer](cold-viewer.md) identified the operated history entry, conversation switch and expanded task list in both languages. The reviewer correctly limited the short-clip claim to reopening existing work. The README descriptions use that scope. The longer hold is retained to give the conversation and task text time to be read. Native DSH model controls retain `DeepSeek Flash Off` in the Chinese UI; the plugin does not fabricate a translated host control.
