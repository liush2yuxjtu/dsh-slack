"""Build the bilingual public documentation from one page catalog."""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs'
BASE = 'https://liush2yuxjtu.github.io/dsh-slack/'
REPO = 'https://github.com/liush2yuxjtu/dsh-slack'
INSTALL = '''git clone https://github.com/liush2yuxjtu/dsh-slack.git
cd dsh-slack
npm pack --ignore-scripts
dsh plugin --profile web add "$PWD/dsh-slack-0.1.0.tgz"
dsh web'''

PAGES = {
    'home': {
        'path': '',
        'en': ('DSH Slack UI | Chat threads for DeepSeek Harness', 'An open-source DeepSeek Harness plugin for independent task sessions, contextual thread replies, chat history, assistant summaries, and live TODO progress.'),
        'zh': ('DSH Slack UI | DeepSeek Harness 会话历史与任务线程', '开源 DeepSeek Harness 插件，提供独立任务会话、Thread 续聊、历史摘要和真实 TODO 待办进度。查看实机演示与安装步骤。'),
    },
    'install': {
        'path': 'install/',
        'en': ('Install DSH Slack UI | DeepSeek Harness plugin', 'Install DSH Slack UI from its GitHub source into a DeepSeek Harness Web profile. Check the tested version, host credentials, and first-session workflow.'),
        'zh': ('安装 DSH Slack UI | DeepSeek Harness 插件', '从 GitHub 源码打包安装 DSH Slack UI，核对宿主兼容版本、API 凭据与首次会话操作。'),
    },
    'demo': {
        'path': 'demo/',
        'en': ('DSH Slack UI demo | Real DeepSeek session threads', 'Watch a real DeepSeek Harness recording: create separate task sessions, reply in a thread, and update native TODO progress from 1/3 to 2/3.'),
        'zh': ('DSH Slack UI 实机演示 | 真实 DeepSeek 任务线程', '观看真实 DeepSeek API 录屏：创建独立任务会话，在 Thread 中续聊，将原生 TODO 进度从 1/3 更新到 2/3。'),
    },
    'guide': {
        'path': 'guides/session-threads/',
        'en': ('Manage DSH sessions and TODOs | DSH Slack UI guide', 'Learn where to start a new DeepSeek Harness session, where to continue a thread, and how summaries, TODO progress, and reload recovery work.'),
        'zh': ('管理 DSH 会话历史与待办 | DSH Slack UI 使用教程', '了解如何创建独立 DeepSeek Harness 会话、在 Thread 中继续任务，以及历史摘要、TODO 进度与刷新恢复的工作方式。'),
    },
}


def url(page, lang):
    return BASE + ('zh/' if lang == 'zh' else '') + PAGES[page]['path']


def asset(path):
    return BASE + path


def code(text, lang):
    label = '复制命令' if lang == 'zh' else 'Copy commands'
    return f'<div class="codebox"><button type="button" class="copy" data-copy>{label}</button><pre><code>{html.escape(text)}</code></pre><p class="copy-status" role="status" aria-live="polite"></p></div>'


def link(page, lang, text, primary=False):
    return f'<a class="button {"primary" if primary else "secondary"}" href="{url(page, lang)}">{text}</a>'


def content(page, lang):
    zh = lang == 'zh'
    media_lang = 'zh' if zh else 'en'
    if page == 'home':
        return f'''<section class="hero wrap">
<div><p class="eyebrow">DEEPSEEK HARNESS · OPEN SOURCE</p>
<h1>{'每个任务，<br>都有自己的 Thread。' if zh else 'Keep every DSH task<br>in its own thread.'}</h1>
<p class="lead">{'在列表开始新任务，在 Thread 继续对话。用标题、摘要和待办进度，找回正在做的事。' if zh else 'Start a task in the list. Continue it in a thread. Find your work again with session titles, assistant summaries, and TODO progress.'}</p>
<div class="actions">{link('install', lang, '安装插件' if zh else 'Install the plugin', True)}{link('demo', lang, '观看实机演示' if zh else 'Watch the real demo')}</div>
<p class="caption">{'社区插件 · MIT · 已测试 DSH 0.2.2-rc.1' if zh else 'Community plugin · MIT · Tested on DSH 0.2.2-rc.1'}</p></div>
<div class="hero-note"><span class="status-dot"></span>{'真实 DSH + 官方 DeepSeek API' if zh else 'Real DSH + official DeepSeek API'}<strong>{'一个会话，一段完整上下文。' if zh else 'One session. The full conversation.'}</strong><a href="{url('guide', lang)}">{'查看操作方式' if zh else 'See how sessions work'} →</a></div>
</section>
<section class="wrap product-shot"><img src="{asset(f'evidence/ui-review/{media_lang}.png')}" width="1280" height="800" alt="{'真实 DSH 界面，左侧会话列表，右侧发布任务对话与 2/3 待办进度' if zh else 'Real DSH UI with session history, the launch conversation, and 2/3 TODO progress'}"><p class="caption">{'来自 GPT Work Linux 的真实截图。完整录屏保留模型等待时间。' if zh else 'Captured on GPT Work Linux. The complete recording preserves actual model waits.'}</p></section>
<section class="wrap section"><div class="section-heading"><p class="eyebrow">{'从任务到结果' if zh else 'FROM TASK TO RESULT'}</p><h2>{'开始新任务，或接着做。' if zh else 'Start something new. Or pick it up.'}</h2></div>
<div class="steps"><article><span class="step">01</span><h3>{'新消息，新会话' if zh else 'New message, new session'}</h3><p>{'列表下方的输入框为每条新任务创建独立 session。不同任务各自保留历史。' if zh else 'Each message in the Chats composer starts an independent DSH session. Separate tasks keep separate histories.'}</p></article><article><span class="step">02</span><h3>{'在 Thread 里继续' if zh else 'Reply inside the thread'}</h3><p>{'选中任务后，在右侧输入框回复。当前 session 保留此前对话与工具上下文。' if zh else 'Select the task and reply in its Thread composer. The same session keeps earlier conversation and tool context.'}</p></article><article><span class="step">03</span><h3>{'进度跟着任务走' if zh else 'Keep progress in view'}</h3><p>{'会话入口展示助手摘要和真实 TODO 完成数，右侧可展开完整原生清单。' if zh else 'The session entry shows the assistant summary and real TODO count. Expand the native checklist for details.'}</p></article></div></section>
<section class="wrap section split"><div><p class="eyebrow">{'沿用原生能力' if zh else 'BUILT AROUND NATIVE DSH'}</p><h2>{'工具、Markdown、待办。<br>都留在对话里。' if zh else 'Your tools and TODOs<br>stay in the conversation.'}</h2></div><div><p>{'插件复用 DSH 原生消息渲染器、工具调用和输入框。会话由宿主持久化，刷新后可继续。' if zh else 'The plugin reuses the native DSH message renderer, tool calls, and composer. The host persists sessions so you can continue after a reload.'}</p><p>{'点击「原生 DSH」访问 Settings 和 Plugins，再返回线程界面，未发送的草稿会保留。' if zh else 'Choose Native DSH to open Settings and Plugins. Return to the threaded interface with your unsent draft preserved.'}</p>{link('guide', lang, '阅读使用教程' if zh else 'Read the workflow guide')}</div></section>
<section class="wrap section callout"><div><p class="eyebrow">{'先看清，再安装' if zh else 'SEE IT BEFORE YOU INSTALL'}</p><h2>{'真实请求。真实会话。' if zh else 'Real requests. Real sessions.'}</h2><p>{'中英文演示各保留 6 次官方 API 响应记录。8 秒短片展示会话切换，完整原片展示创建与更新过程。' if zh else 'Each language recording has six official API response records. The 8-second clip shows navigation. The full recording shows session creation and updates.'}</p></div>{link('demo', lang, '打开录屏与证据' if zh else 'Open recordings and evidence', True)}</section>
<section class="wrap section prose"><h2>{'这是哪一个 DSH Slack？' if zh else 'Which DSH Slack is this?'}</h2><p>{'这是 liush2yuxjtu/dsh-slack，提供 Slack 风格的 DSH 会话界面。不连接 Slack 服务，不需要 Slack 账号。当前版本不包含多人频道、仅 @deepseek 触发或跨会话频道记忆。' if zh else 'This is liush2yuxjtu/dsh-slack, the Slack-style session UI for DSH. It does not connect to Slack or require a Slack account. Shared channels, mention-only execution, and cross-session channel memory are outside this version.'}</p></section>'''
    if page == 'install':
        return f'''<section class="wrap section prose"><p class="eyebrow">{'安装指南' if zh else 'INSTALLATION'}</p><h1>{'把 Thread 加入你的 DSH。' if zh else 'Add threads to your DSH.'}</h1><p class="lead">{'从明确的 GitHub 仓库打包，安装到 Web profile。' if zh else 'Pack this GitHub repository and install it into your Web profile.'}</p>
<h2>{'1. 核对宿主版本' if zh else '1. Check the host version'}</h2><p>{'需要 Node.js 24.9.0 或更高版本，以及 DSH 0.2.2-rc.1。已测试上游提交 fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159。' if zh else 'Use Node.js 24.9.0 or later and DSH 0.2.2-rc.1. The tested upstream revision is fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159.'}</p><p>{'先在宿主设置中配置 DeepSeek provider 与 API 凭据。密钥由宿主管理。' if zh else 'Configure the DeepSeek provider and API credential in the host settings. The host manages the key.'}</p>
<h2>{'2. 打包并安装' if zh else '2. Pack and install'}</h2>{code(INSTALL, lang)}<p>{'在 DSH Plugins 中启用 bundle。此流程安装的是 liush2yuxjtu/dsh-slack，包版本为 0.1.0。' if zh else 'Enable the bundle in DSH Plugins. This installs liush2yuxjtu/dsh-slack, package version 0.1.0.'}</p>
<h2>{'3. 验证第一段对话' if zh else '3. Check your first conversation'}</h2><ol><li>{'在「对话」输入框发送一个新任务。' if zh else 'Send a new task in the Chats composer.'}</li><li>{'在右侧 Thread 回复，确认它继续当前任务。' if zh else 'Reply in the Thread and confirm it continues that task.'}</li><li>{'创建另一个任务，再返回第一个会话。刷新后检查历史仍存在。' if zh else 'Create a second task, then return to the first. Reload and check that its history remains.'}</li></ol>
<h2>{'需要排查？' if zh else 'Need to troubleshoot?'}</h2><p>{'没有界面时，检查 Web profile 和 bundle 启用状态。没有模型回复时，切换「原生 DSH」检查宿主的 provider 和凭据。只有模型写入原生待办后才会显示 TODO 计数。' if zh else 'If the UI is missing, check the Web profile and enabled bundle. If the model does not reply, open Native DSH and check the host provider and credential. TODO counts appear after the model writes native tasks.'}</p>
<p>{'DSH 插件 API 尚未稳定。升级宿主后，需重新验收兼容性。' if zh else 'The DSH plugin API is pre-stable. Recheck compatibility after upgrading the host.'}</p><div class="actions">{link('guide', lang, '查看使用教程' if zh else 'Read the guide', True)}<a class="button secondary" href="{REPO}/blob/main/docs/verification.md">{'验收报告' if zh else 'Verification report'}</a></div></section>'''
    if page == 'demo':
        seconds = '25.87' if zh else '61.87'
        return f'''<section class="wrap section"><p class="eyebrow">{'真实 API 实机录屏' if zh else 'REAL API WALKTHROUGH'}</p><h1>{'看任务如何成为 Thread。' if zh else 'Watch a task become a thread.'}</h1><p class="lead">{'创建两个独立会话，回到发布任务并续聊，让待办从 1/3 更新到 2/3。' if zh else 'Create two separate sessions, return to the launch task, and update its TODOs from 1/3 to 2/3.'}</p>
<video class="walkthrough" controls preload="metadata" poster="{asset(f'media/{media_lang}/poster.png')}" width="1280" height="800"><source src="{asset(f'media/{media_lang}/full-demo.mp4')}" type="video/mp4"><a href="{asset(f'media/{media_lang}/full-demo.mp4')}">{'下载完整录屏' if zh else 'Download the recording'}</a></video>
<p class="caption">{'完整原片' if zh else 'Complete recording'} · {seconds}s · Chromium · GPT Work Linux · DeepSeek Flash</p></section>
<section class="wrap section prose"><h2>{'录屏中的操作' if zh else 'What happens in the recording'}</h2><ol><li>{'开始「规划发布」，模型写入三项待办，第一项完成。' if zh else 'Start Plan the launch. The model writes three TODOs with the first complete.'}</li><li>{'开始「筹备工作坊」，使用另一个独立 session。' if zh else 'Start Plan the workshop in a separate session.'}</li><li>{'回到发布 Thread，继续回复，将准备截图标记完成。' if zh else 'Return to the launch Thread and ask to mark the screenshots complete.'}</li><li>{'切换任务再返回，展开原生 TODO，确认进度保留为 2/3。' if zh else 'Switch away and return. Expand the native TODO list and see the retained 2/3 progress.'}</li></ol>
<p class="caption">{'本页录屏保留此前版本的界面。首页截图展示本次界面修复。' if zh else 'These recordings retain the earlier UI. The home page screenshot shows the current UI cleanup.'}</p><h2>{'只想看 8 秒？' if zh else 'Have eight seconds?'}</h2><video controls preload="metadata" poster="{asset(f'media/{media_lang}/poster.png')}" width="1280" height="1024"><source src="{asset(f'media/{media_lang}/feature-8s.mp4')}" type="video/mp4"></video><p>{'短片展示重新打开已有 Thread 和展开待办。它不表示模型在 8 秒内完成了整项任务。' if zh else 'The short clip reopens an existing Thread and expands its TODOs. It does not show the model completing the whole task in eight seconds.'}</p>
<h2>{'如何确认是真实 API？' if zh else 'How is the API source verified?'}</h2><p>{'两种语言各有 6 次官方 HTTP 200 响应，记录包含 response ID、usage 和原生工具调用。录屏无加速，无预置助手回复，也无 mock 模型。' if zh else 'Each language has six official HTTP 200 responses with response IDs, usage, and native tool calls. The recordings use no speed changes, seeded assistant replies, or mock model.'}</p><div class="actions"><a class="button secondary" href="{REPO}/blob/main/docs/media/{media_lang}/recording.json">{'API 来源记录' if zh else 'API provenance'}</a><a class="button secondary" href="{REPO}/blob/main/docs/media/{media_lang}/qa.json">{'媒体 QA' if zh else 'Media QA'}</a>{link('install', lang, '安装插件' if zh else 'Install the plugin', True)}</div></section>'''
    return f'''<section class="wrap section prose"><p class="eyebrow">{'会话与待办教程' if zh else 'SESSION WORKFLOW GUIDE'}</p><h1>{'新任务放左边，<br>继续聊在 Thread。' if zh else 'New task in Chats.<br>Follow-up in the Thread.'}</h1><p class="lead">{'两个输入框对应两种操作。选择正确的入口，就能保持任务上下文。' if zh else 'The two composers do different jobs. Choose the right one to keep the task context you need.'}</p>
<h2>{'创建独立会话' if zh else 'Create an independent session'}</h2><p>{'在「对话」列表下方输入「帮我规划一次产品发布」。发送后，DSH Slack UI 创建一个新 session，并把它加入历史列表。然后在同一位置发送「帮我筹备工作坊」，它会成为另一个任务。' if zh else 'Enter “Help me plan a product launch” below the Chats list. DSH Slack UI creates a new session and adds it to history. Send “Help me plan a workshop” in the same composer to start a separate task.'}</p>
<h2>{'在同一个 Thread 续聊' if zh else 'Continue the same Thread'}</h2><p>{'选中发布任务，在右侧 Thread 的输入框发送「截图已经准备好了，更新待办」。这条消息沿用发布 session。不要在列表输入框发送这条续聊消息，因为那里会创建新会话。' if zh else 'Select the launch task. In its Thread composer, send “The screenshots are ready. Update the checklist.” That reply uses the launch session. Sending it in the Chats composer would start a new session.'}</p>
<h2>{'理解标题、摘要与 TODO' if zh else 'Read titles, summaries, and TODOs'}</h2><p>{'标题来自 DSH 会话元数据。摘要来自已提交的助手正文。推理内容和未完成的流式片段不会成为摘要。TODO 进度来自原生 todo/write 事件，与右侧完整任务面板一致。没有任务的会话不会显示编造的进度。' if zh else 'Titles come from DSH session metadata. Summaries use committed assistant text, excluding reasoning and unfinished stream fragments. TODO progress comes from native todo/write events shared with the full task panel. Sessions without tasks do not receive invented progress.'}</p>
<h2>{'刷新与返回原生界面' if zh else 'Reload and return to native DSH'}</h2><p>{'刷新后，由宿主持久化恢复当前会话。点击「原生 DSH」可访问 Settings 和 Plugins，点击「打开 DSH Slack」返回。切换时保留未发送的新任务草稿。' if zh else 'After a reload, host persistence restores the selected session. Choose Native DSH for Settings and Plugins, then Open DSH Slack to return. Unsent root drafts survive this switch.'}</p>
<h2>{'上下文的边界' if zh else 'Understand the context boundary'}</h2><p>{'同一 Thread 沿用同一 session 的上下文。此版本没有实现跨 session 的频道记忆，也没有多人频道或仅 @deepseek 触发机制。' if zh else 'A Thread keeps the context of its own session. This version does not implement cross-session channel memory, shared human channels, or mention-only execution.'}</p><div class="actions">{link('demo', lang, '看真实操作' if zh else 'Watch the workflow', True)}{link('install', lang, '安装指南' if zh else 'Installation guide')}</div></section>'''


def render(page, lang):
    zh = lang == 'zh'
    title, description = PAGES[page][lang]
    nav = [('home', '概览' if zh else 'Overview'), ('install', '安装' if zh else 'Install'), ('demo', '演示' if zh else 'Demo'), ('guide', '教程' if zh else 'Guide')]
    alternate = 'en' if zh else 'zh'
    schema = {'@context': 'https://schema.org', '@type': 'SoftwareSourceCode', 'name': 'DSH Slack UI', 'description': description, 'url': url('home', lang), 'programmingLanguage': 'JavaScript', 'codeRepository': REPO, 'runtimePlatform': 'Node.js 24.9.0 or later with DeepSeek Harness Web', 'version': '0.1.0', 'license': REPO + '/blob/main/LICENSE', 'author': {'@type': 'Person', 'name': 'liush2yuxjtu', 'url': 'https://github.com/liush2yuxjtu'}}
    if page == 'demo':
        qa = json.loads((OUT / 'media' / lang / 'qa.json').read_text())
        schema = {'@context': 'https://schema.org', '@type': 'VideoObject', 'name': title, 'description': description, 'thumbnailUrl': [asset(f'media/{lang}/poster.png')], 'uploadDate': '2026-11-10T10:25:09Z', 'duration': 'PT' + str(qa['raw_duration_s']) + 'S', 'contentUrl': asset(f'media/{lang}/full-demo.mp4'), 'inLanguage': 'zh-CN' if zh else 'en', 'url': url(page, lang)}
    schema_json = json.dumps(schema, ensure_ascii=False).replace('</', '<' + chr(92) + '/')
    verification_file = OUT / 'google-site-verification.txt'
    verification = ('<meta name="google-site-verification" content="' + html.escape(verification_file.read_text().strip(), quote=True) + '">') if verification_file.exists() else ''
    return f'''<!doctype html>
<html lang="{'zh-CN' if zh else 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title><meta name="description" content="{html.escape(description, quote=True)}">{verification}<meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{url(page, lang)}">
<link rel="alternate" hreflang="en" href="{url(page, 'en')}"><link rel="alternate" hreflang="zh-CN" href="{url(page, 'zh')}"><link rel="alternate" hreflang="x-default" href="{url(page, 'en')}">
<meta property="og:type" content="website"><meta property="og:title" content="{html.escape(title, quote=True)}"><meta property="og:description" content="{html.escape(description, quote=True)}"><meta property="og:url" content="{url(page, lang)}"><meta property="og:image" content="{asset(f'evidence/ui-review/{lang}.png')}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#4b2f79">
<link rel="icon" href="{asset('assets/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="{asset('assets/site.css')}"><script defer src="{asset('assets/site.js')}"></script><script type="application/ld+json">{schema_json}</script></head>
<body><a class="skip" href="#main">{'跳到正文' if zh else 'Skip to content'}</a><header class="wrap header"><a class="brand" href="{url('home',lang)}"><span class="brand-icon">D</span>DSH Slack <span class="ui-tag">UI</span></a><nav aria-label="{'主导航' if zh else 'Main navigation'}">{''.join(f'<a href="{url(key,lang)}"'+(' aria-current="page"' if key==page else '')+f'>{label}</a>' for key,label in nav)}<a lang="{'en' if zh else 'zh-CN'}" href="{url(page,alternate)}">{'English' if zh else '中文'}</a></nav></header><main id="main">{content(page,lang)}</main><footer class="wrap footer"><div><a class="brand" href="{url('home',lang)}">DSH Slack UI</a><p>{'liush2yuxjtu 维护的独立社区插件。' if zh else 'An independent community plugin by liush2yuxjtu.'}</p><p>{'与 Slack 及 DeepSeek 官方无隶属关系。' if zh else 'Not affiliated with Slack or DeepSeek.'}</p></div><div><a href="{REPO}">GitHub</a><a href="{REPO}/blob/main/docs/verification.md">{'验收证据' if zh else 'Verification evidence'}</a><a href="{REPO}/blob/main/LICENSE">MIT license</a></div></footer></body></html>'''


def main():
    for key in PAGES:
        for lang in ('en', 'zh'):
            path = OUT / ('zh' if lang == 'zh' else '') / PAGES[key]['path'] / 'index.html'
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(render(key, lang))
    entries = []
    for key in PAGES:
        for lang in ('en', 'zh'):
            video = ''
            if key == 'demo':
                title, description = PAGES[key][lang]
                video = '<video:video><video:thumbnail_loc>' + asset(f'media/{lang}/poster.png') + '</video:thumbnail_loc><video:title>' + html.escape(title) + '</video:title><video:description>' + html.escape(description) + '</video:description><video:content_loc>' + asset(f'media/{lang}/full-demo.mp4') + '</video:content_loc></video:video>'
            entries.append(f'<url><loc>{url(key,lang)}</loc>{video}<xhtml:link rel="alternate" hreflang="en" href="{url(key,"en")}"/><xhtml:link rel="alternate" hreflang="zh-CN" href="{url(key,"zh")}"/></url>')
    (OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">' + ''.join(entries) + '</urlset>\n')
    (OUT / '.nojekyll').touch()
    print(f'Built {len(PAGES)*2} bilingual pages and sitemap.xml.')


if __name__ == '__main__':
    main()
