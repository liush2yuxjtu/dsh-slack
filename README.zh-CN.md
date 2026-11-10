# DSH Slack 插件：DeepSeek Harness 会话历史与 Thread

DSH Slack 是开源的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件，提供 Slack 风格的 Thread、会话历史、助手摘要和 TODO 待办进度。

在「对话」列表下方发送消息，每条消息创建一个独立 session。在右侧 Thread 回复，继续当前 session。列表显示标题、最新回复摘要和真实 TODO 进度。右侧保留 DSH 原生消息、Markdown、工具和输入框。

[English](README.md)

[安装](#安装) · [功能](#功能) · [真实 API 验证](#验证) · [常见问题](#常见问题) · [故障排查](#故障排查)

![真实中文版 DSH：规划发布会话、完整上下文和 2/3 待办进度](docs/media/zh/snapshot.png)

## 8 秒查看真实 DSH 会话与待办

在历史列表点击「规划发布」，展开原生待办清单。此前的回复和更新后的 **2/3** 进度都保留在同一个 Thread 中。「筹备工作坊」使用另一个独立 session。

[![8 秒真实录屏：打开规划发布会话并查看待办](docs/media/zh/feature-8s.gif)](docs/media/zh/feature-8s.mp4)

[播放 8 秒 MP4](docs/media/zh/feature-8s.mp4) · [查看完整原片](docs/media/zh/full-demo.mp4) · [录制与验收证据](docs/media/README.md)

画面来自 GPT Work 机器上的真实 Chromium，使用官方 DeepSeek API。8 秒短片展示重新打开已有 Thread。完整原片包含新建两个会话、继续回复和模型的实际等待时间。没有加速，也没有生成的界面帧。

## 功能

| 任务 | 插件行为 |
| --- | --- |
| 开始独立任务 | 在「对话」输入框发送新消息，每条消息创建独立 DSH session。 |
| 继续已有对话 | 在右侧 Thread 回复，保留当前 session 与上下文。 |
| 浏览会话历史 | 列表展示标题、助手摘要与 TODO 完成数。 |
| 查看待办进度 | 列表与原生 TODO 面板读取同一组持久化任务事件。 |
| 刷新后继续 | 使用 DSH 持久化恢复选中的 session 与对话。 |
| 使用原生能力 | 保留 DSH 的 Markdown、工具调用、TODO 面板与输入框。 |
| 打开宿主设置 | 切换到「原生 DSH」访问 Settings 与 Plugins，返回时保留草稿。 |

## 安装

需要 Node.js 24.9 或更高版本，以及 DSH `0.2.2-rc.1`。

已验收的上游提交为 `fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159`。DSH 插件 API 尚未稳定，升级宿主后需重新验证兼容性。

```sh
git clone https://github.com/liush2yuxjtu/dsh-slack.git
cd dsh-slack
npm pack --ignore-scripts
dsh plugin --profile web add "$PWD/dsh-slack-0.1.0.tgz"
dsh web
```

在 DSH 插件管理中启用此 bundle。DeepSeek API key 由 DSH Host 管理。插件不在浏览器读取密钥，也不添加远程遥测。

点击左下角 **原生 DSH**，恢复原生导航、Settings 和 Plugins。点击 **打开 DSH Slack** 返回。切换时保留未发送的新会话草稿。

## 验证

```sh
npm install
npm run verify
npm run verify:media
DSH_SOURCE_ROOT=/path/to/built/deepseek-harness \
DSH_API_KEY_FILE=/private/path/to/deepseek.key \
npm run verify:live
node scripts/install-hooks.mjs
```

最终验收运行真实 DSH、官方 DeepSeek API 和本机 Chromium。模型回复、工具调用、TODO 与 API 响应逐条核对。提交门禁从暂存文件导出候选版本，并重新运行真实 API 验收。缺少凭据或检查失败会拒绝提交。

查看 [验收报告](docs/verification.md)、[设计检查](docs/design-qa.md) 和 [英文说明](README.md)。

此插件提供 Slack 风格的 DSH 界面，不连接 Slack 服务。

## 常见问题

### 这是 Slack Bot 或 Slack 集成吗？

不是。插件运行在 DeepSeek Harness Web 界面中，使用 DSH 的会话与工具，不需要 Slack 账号。

### 支持多人频道、仅 @deepseek 触发或跨会话记忆吗？

当前版本不包含这些功能。「对话」输入框的新消息创建独立 session；Thread 输入框的消息继续当前 session。

### 对话和 API key 存在哪里？

对话由 DSH 持久化。DeepSeek API key 在宿主设置中配置。插件不在浏览器代码读取密钥，也不发送分析遥测。

### 截图与视频是真实运行吗？

是。中英文素材都来自真实 Chromium 和官方 DeepSeek API。[录制证据](docs/media/README.md)保留响应记录、源码哈希、完整原片与媒体 QA。8 秒短片展示会话切换与展开待办；完整原片包含模型的实际等待时间。

## 故障排查

| 现象 | 检查方法 |
| --- | --- |
| 插件没有显示 | 使用已验收的 DSH 版本，将安装包加入 Web profile，并在 Plugins 启用 bundle。 |
| 模型没有回复 | 打开「原生 DSH」，检查宿主的 DeepSeek 凭据与 provider 配置。 |
| 会话没有 TODO 数量 | 模型写入原生任务后才显示进度。插件不会为空会话编造待办。 |
| 找不到 Settings 或 Plugins | 点击左下角「原生 DSH」。完成后点击「打开 DSH Slack」返回。 |
| 升级 DSH 后界面异常 | 对照固定上游版本检查兼容性，重新运行真实 API 验收。 |

## 项目与许可证

源码与维护：[liush2yuxjtu/dsh-slack](https://github.com/liush2yuxjtu/dsh-slack)。本社区插件采用 [MIT license](LICENSE)。
