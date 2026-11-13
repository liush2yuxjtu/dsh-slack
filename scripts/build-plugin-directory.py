"""Build a directory of explicitly pinned public DSH plugin releases."""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "plugins"
BASE = "https://liush2yuxjtu.github.io/dsh-slack/plugins/"
DATA = json.loads((ROOT / "scripts/plugin-directory.json").read_text())
OUT.mkdir(parents=True, exist_ok=True)
def esc(value):
    return html.escape(str(value), quote=True)
def copybox(value):
    return '<div class="copybox"><pre><code>' + esc(value) + '</code></pre><button type="button" class="copy" data-copy>复制 / Copy</button></div>'
def page(title, body, filename):
    content = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title><meta name="description" content="DSH 插件选择、固定版本安装与首次使用。Sidebar History、Slack UI、Channels、Artifacts。"><link rel="canonical" href="' + BASE + filename + '"><link rel="stylesheet" href="directory.css"><script src="directory.js" defer></script></head><body><main><nav><a href="../">DSH Slack UI</a><a href="index.html">插件目录 / Plugins</a><a href="first-use.html">首次使用 / First use</a><a href="index.json">Discover JSON</a></nav>' + body + '<p id="copy-status" role="status" aria-live="polite"></p><footer>Unofficial community plugins · MIT · 核对日期 ' + esc(DATA["checkedAt"]) + '</footer></main></body></html>'
    (OUT / filename).write_text(content)
cards = []
for item in DATA["plugins"]:
    command = item["install"]
    cards.append('<article id="' + esc(item["id"]) + '"><p class="eyebrow">' + esc(item["need"]["en"]) + '</p><h2>' + esc(item["title"]) + '</h2><p>' + esc(item["need"]["zh"]) + '</p><p class="version">v' + esc(item["version"]) + ' · ' + esc(item["commit"][:7] if item.get("commit") else "public npm") + '</p><p>' + esc(item["description"]["zh"]) + '</p><p lang="en">' + esc(item["description"]["en"]) + '</p>' + copybox(command) + '<p class="limit">' + esc(item["limit"]["zh"]) + '</p><p lang="en" class="limit">' + esc(item["limit"]["en"]) + '</p><p><a href="first-use.html#' + esc(item["id"]) + '">首次成功步骤 / First use</a> · <a href="' + esc(item["readme"]) + '">源码与说明 / Source</a></p></article>')
intro = '<header><p class="eyebrow">DEEPSEEK HARNESS · COMMUNITY PLUGINS</p><h1>按任务选择 DSH 插件</h1><p class="lead">找回进度、整理任务线程、在频道协作，或预览本地 HTML。每个入口都指向明确的公开版本。</p><p lang="en">Choose a public, pinned release for your task. These plugins run inside DSH and do not connect to Slack.</p></header><aside><strong>Slack UI 与 Channels 二选一。</strong>它们都替换会话布局。切换前先移除另一个，再重启 DSH。Sidebar 与当前布局的组合兼容性未单独验收。</aside>'
discover = '<section><h2>在 DSH Discover 中安装</h2><p>Plugins → Experimental plugins → 开启 Custom plugin indexes → Discover → Add index source，粘贴：</p>' + copybox(BASE + 'index.json') + '<p>查看安装确认中的版本与来源。npm 裸名 dsh-slack 和 dsh-channels 不代表本作者的仓库；使用本页的完整 Git 地址。</p></section>'
page("DSH 插件目录与固定版本安装", intro + '<div class="grid">' + ''.join(cards) + '</div>' + discover, "index.html")
sections = []
for item in DATA["plugins"]:
    steps = ''.join('<li>' + esc(s) + '</li>' for s in item["steps"])
    sections.append('<section id="' + esc(item["id"]) + '"><h2>' + esc(item["title"]) + '</h2>' + copybox(item["install"]) + '<ol>' + steps + '</ol><p class="limit">' + esc(item["limit"]["zh"]) + '</p><a href="' + esc(item["readme"]) + '">完整说明 / Full instructions</a></section>')
guide = '<header><h1>安装后完成第一个动作</h1><p>已测试宿主 DSH 0.2.2-rc.1。先确认 Node.js 24.9+ 与可运行的 dsh web。模型凭据仅在 Host 配置。</p></header><section><h2>准备与切换</h2><p>只安装你需要的插件。Slack UI 与 Channels 切换时，先移除另一个：</p>' + copybox('dsh plugin --profile web remove dsh-slack\ndsh plugin --profile web remove dsh-channels') + '<p>上述两行是按需移除命令，不要求每次都执行。随后运行所选插件的安装命令，再重启 dsh web。</p><p>若最小 Linux 环境提示无法创建默认工作区：Native DSH → Preview Continue → Choose workspace → Edit path → 输入现有目录的绝对路径 → Enter → Open。</p></section>'
page("DSH 插件首次使用指南", guide + ''.join(sections) + '<section><h2>失败时保留什么</h2><p>记录插件版本、DSH版本、失败步骤和错误文本。不要分享API key、Host登录URL、频道令牌或私人对话。</p></section>', "first-use.html")
plugins = []
for item in DATA["plugins"]:
    source = {"type": "npm"} if item["source"] == "npm" else {"type": "git", "url": item["repo"], "commit": item["commit"]}
    plugins.append({"name": item["name"], "title": item["title"], "description": item["description"], "author": "Liu Shiyu", "homepage": item["readme"], "repository": {"url": item["repo"]}, "versions": [{"version": item["version"], "publishTimestamp": item["publishTimestamp"], "source": source, "engines": item["engines"]}]})
(OUT / "index.json").write_text(json.dumps({"format": 1, "title": {"en": "Liu Shiyu DSH plugins", "zh": "Liu Shiyu DSH 插件"}, "description": {"en": "Public pinned releases with first-use instructions.", "zh": "公开固定版本与首次使用指南。"}, "plugins": plugins}, ensure_ascii=False, indent=2) + "\n")
(OUT / "directory.js").write_text("""document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText(button.closest('.copybox').querySelector('code').textContent);
      status.textContent = '已复制 / Copied';
    } catch {
      status.textContent = '复制失败，请手动选择命令 / Select the command to copy';
    }
  });
});
""")
(OUT / "directory.css").write_text("""*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:#202332;background:#f7f8fc;font:16px/1.65 system-ui,-apple-system,sans-serif}main{max-width:1120px;margin:auto;padding:28px 24px 60px}nav{display:flex;gap:20px;flex-wrap:wrap;font-size:14px}a{color:#5740a6;text-underline-offset:4px}header{max-width:800px;margin:62px 0 34px}h1{font-size:clamp(30px,5vw,48px);line-height:1.2;letter-spacing:-.035em}h2{font-size:24px;line-height:1.3}.lead{font-size:20px;color:#555d72}.eyebrow{font-size:12px;font-weight:650;letter-spacing:.08em;color:#64547d}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin:28px 0}article,section{background:white;border:1px solid #e1e3ed;border-radius:16px;padding:24px;min-width:0}section{margin:24px 0}article h2{margin:6px 0}.version{font:13px ui-monospace,monospace;color:#6a617a}.limit{font-size:14px;color:#665735}aside{padding:18px 22px;border-left:3px solid #75619e;background:#eeebf5;border-radius:8px}.copybox{position:relative;background:#f3f4f8;border-radius:9px;padding:12px;margin:20px 0}.copybox pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.7 ui-monospace,monospace;margin:0 0 40px}.copy{padding:7px 12px;border:1px solid #d5d1e1;border-radius:6px;background:white;cursor:pointer;min-height:40px}button:focus-visible,a:focus-visible{outline:3px solid #9677d1;outline-offset:3px}#copy-status{position:sticky;bottom:12px;width:max-content;max-width:100%;padding:6px 12px;background:#252038;color:white;border-radius:7px}#copy-status:empty{display:none}footer{font-size:13px;color:#687083;margin-top:32px}li+li{margin-top:10px}@media(max-width:700px){.grid{grid-template-columns:1fr}main{padding:20px 16px}header{margin-top:40px}article,section{padding:20px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
""")
print("Built two directory pages and format-1 index for", len(plugins), "plugins.")
