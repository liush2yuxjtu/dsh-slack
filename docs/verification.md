# 真实 API 验收

结果为 PASS。本轮于 2026-11-10 17:37 完成，时区为 UTC+8。

实际运行 DSH `0.2.2-rc.1`，上游提交为 `fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159`。机器为 GPT Work 的 Linux 环境。Node.js 为 `v24.22.1`，本机 Chromium 为 `134.0.6998.35`。

本轮运行 ID 为 `105dcbde-e961-4e51-acdb-4c63c5b9dd02`。共核对 12 次官方 DeepSeek API 响应。模型为 `deepseek-flash`。每次响应均为 HTTP 200，具有响应 ID、输出 token usage 和响应内容哈希。

## 自动完成的检查

| # | 事项 | 归类 | 依据 | 可撤销做法 | 超时默认 | 选项 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 四条顶层消息创建四个独立 session | 自动做 | [运行记录](evidence/result.json) 中四个 session ID | 独立临时 DSH profile | — | — |
| 2 | Thread 回复沿用上下文 | 自动做 | 首轮从文件读取随机 nonce，第二轮未重读文件仍返回正确 nonce 与计算结果 | 临时文件与测试消息 | — | — |
| 3 | TODO 与摘要实时更新 | 自动做 | 官方 API 工具调用 ID、原生 `todo/write` 和 UI 的 1/3、2/3 进度一致 | 正常 session 事件 | — | — |
| 4 | 刷新恢复当前会话与摘要 | 自动做 | [刷新截图](evidence/04-reload.png) | 浏览器刷新 | — | — |
| 5 | 草稿跨会话与原生导航切换保留 | 自动做 | `unsent-root-draft-survives-thread-switch` 与 `draft-survives-native-navigation-round-trip` | 未发送草稿 | — | — |
| 6 | 原生 Settings 与 Plugins 可访问 | 自动做 | [实际 Settings 截图](evidence/08-native-settings.png) | Native DSH 与返回按钮 | — | — |
| 7 | 收藏、移除收藏、搜索与键盘操作 | 自动做 | 实际浏览器操作，包含 ArrowDown、Home、End 与选中状态 | 测试 profile 中的收藏 | — | — |
| 8 | 移动端列表与 Thread 切换 | 自动做 | [移动列表](evidence/05-mobile-list.png) 与 [移动 Thread](evidence/05-mobile.png)，390×844，无横向溢出 | 浏览器 viewport | — | — |
| 9 | DSH 显式主题与系统主题分别生效 | 自动做 | 系统浅色加 DSH 深色，以及系统深色加 DSH 浅色均通过；[深色截图](evidence/06-dark.png) | 临时 profile 的主题设置 | — | — |
| 10 | 完整 TODO 与输入框位置 | 自动做 | 三项原生 TODO 可展开；输入框的停靠位置为 `sticky` | 原生 embedded conversation | — | — |

9 项单元测试、所有 JavaScript 语法检查和实际 npm 分发文件检查通过。浏览器 console error 为 0。

## 证据

- [完整验收结果、源码哈希与 API 响应记录](evidence/result.json)。
- [原生持久事件](evidence/native-events.json)。
- [最终桌面截图](evidence/07-final.png)，1672×941。
- [设计检查](design-qa.md)。

模型回复、TODO 和截图均来自本轮真实 DSH 与官方 API。运行记录中的 `mockedService`、`scriptedModel`、`seededAssistantMessages` 和 `seededTodoEvents` 均为 `false`。密钥与认证 URL 未写入这些证据。

## 提交门禁

`scripts/pre-commit.mjs` 导出 Git 暂存树，在独立目录运行单元、打包与一轮全新的真实 API 浏览器验收。提交前检查暂存树保持不变。缺少凭据、缺少 runtime、响应来源不匹配或任一断言失败均拒绝提交。门禁的运行日志和 receipt 保存在忽略的 `.runtime/precommit/` 中，避免改变已经验证的暂存树。

本包的兼容目标为上述 DSH 版本。新版本的 DSH API 需要重新验收。

## 功能录屏验收（2026-11-10）

英文与中文 README 已分别加入对应语言的真实截图、8 秒 GIF 和 MP4。两套录制各核对 6 次官方 API 响应。完整原片保留新建两个 session、Thread 回复和 TODO 从 1/3 更新到 2/3 的实际过程。

短片只展示打开已有 Thread 和展开原生 TODO。两版 MP4 均为 240 帧、30 fps、8.000 秒；GIF 均为 96 帧、8.000 秒，单文件小于 3 MiB。英文结果保持至少 5.616 秒，中文至少 5.527 秒。解码、原片连续片段比对、语言、实际像素文字与独立冷观看检查均通过。

查看 [完整媒体证据与复现命令](media/README.md)、[逐次录制取舍](media/takes.md) 和 [独立审看记录](media/cold-viewer.md)。媒体不含 mock 模型、预置助手回复或加速片段。
