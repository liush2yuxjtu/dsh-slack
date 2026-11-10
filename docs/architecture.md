# Session threads

The plugin replaces two official DSH slots. `sidebar` supplies the purple navigation. `main.conversation` supplies the compact session list and Thread frame. DSH's `conversation.content` factory renders the Thread contents with its supported `embedded` variant. That variant carries its own scroll and sticky-composer geometry outside the native main wrapper. The plugin does not reconstruct model messages or replace the native composer.

## Data ownership

| Data | Owner |
| --- | --- |
| Model messages and tool calls | Native DSH session |
| TODO state | Native `todo/write` events |
| Compact title, summary, count and progress | Bounded `dshSlack` session projection |
| Selected session | DSH workspace controller |
| Saved sessions | DSH native pin API |
| Unsent root message and submission attempt | Browser module store |
| API key and model configuration | DSH host |

Each new root submission creates a session. A failed submission keeps its session ID and request ID for retry. The draft store survives DSH's session-bound component remounts. Native Thread replies use the existing selected session.

The projection folds committed events. The first non-empty human user line supplies a fallback title. User-renamed and model-generated titles take precedence. DSH's automatic fallback does not concatenate later request lines into the compact title. Committed assistant text supplies the summary after Markdown punctuation is removed. Tool-only messages preserve the last readable summary. Internal tool results do not count as human messages. Interrupted output and reasoning do not enter the summary. TODO state resets when DSH starts the next turn and updates when the native tool writes it.

The list excludes archived sessions and subagents. It renders visible rows with overscan and reads projections for those rows. Scrolling does not open historical agents. Search filters titles and loaded summaries. Every displayed string uses React text rendering.

## Chosen design

A separate panel with a custom transcript would duplicate DSH's Markdown, tools, draft, model selection and input behavior. Reusing the native conversation factory keeps those behaviors under DSH's ownership.

The reference contains Slack channels and mentions. This plugin has actual DSH Threads, Later, Workspaces and an app entry. It does not add inactive Slack controls. The red review annotations and desktop window controls in the supplied reference are not application UI.

The Native DSH control unregisters both replacements. The original sidebar then restores Settings, Plugins and their shortcuts. A separate `shell.overlay` control restores the threaded view. The browser draft store survives both directions. Colors follow DSH's resolved `data-ds-dark-theme` state, including explicit preferences that differ from the operating system.
