window.__ModuleLoader__.load({
  id: 'dsh-slack',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef, useSyncExternalStore } = React;
    const NS = 'dsh-slack';
    const ROW = 132;
    const en = {
      threads: 'Threads', later: 'Later', apps: 'Apps', workspaces: 'Workspaces', chats: 'Chats', about: 'About',
      search: 'Search DSH…', newThread: 'New thread', rootPlaceholder: 'Start a new conversation…', rootHint: 'Every message starts a new thread', send: 'Send new message', sending: 'Sending…', retry: 'Retry message',
      empty: 'No conversations yet', emptyHint: 'Send a message below to start your first thread.', noMatch: 'No matching threads', savedEmpty: 'No saved threads', savedHint: 'Save a thread with the pin button to read it later.',
      noReply: 'No assistant reply yet', nonText: 'Assistant sent a non-text message', loading: 'Loading threads…', loadError: 'Summary unavailable. Open the thread to retry.', running: 'Generating…',
      noTasks: 'No tasks', tasks: '{done}/{total}', messages: '{count} messages', updated: 'Updated {time}', thread: 'Thread', choose: 'Choose a thread', chooseHint: 'Continue a conversation here. New messages in the list always start a separate thread.',
      pin: 'Save for later', unpin: 'Remove from Later', back: 'Back to threads', openNav: 'Open navigation', collapseNav: 'Collapse navigation', restoreNav: 'Expand navigation',
      native: 'Native DSH', restore: 'Open DSH Slack',
      aboutTitle: 'Your conversations, in threads', aboutBody: 'Start each new topic in the message box on the left. Reply inside its thread to keep the full context. Titles, summaries and TODO progress come from your real DSH sessions.',
      aboutNative: 'The thread uses the native DSH conversation, tools, model selector and composer. Task counts come from the native todo_write tool. No tasks are inferred from assistant prose.',
      aboutClose: 'Back to Chats', sendFailed: 'Message was not accepted. Your draft is kept. Retry to use the same thread.', new: 'New', live: 'DSH workspace', threadCount: '{count} threads',
    };
    const zh = {
      threads: '会话', later: '稍后查看', apps: '应用', workspaces: '工作区', chats: '对话', about: '关于',
      search: '搜索 DSH…', newThread: '新建会话', rootPlaceholder: '开始一个新对话…', rootHint: '每条消息都创建一个新会话', send: '发送新消息', sending: '正在发送…', retry: '重试消息',
      empty: '暂无会话', emptyHint: '在下方发送消息，开始第一个会话。', noMatch: '没有匹配的会话', savedEmpty: '暂无收藏会话', savedHint: '点击会话右上角的图钉，保存到稍后查看。',
      noReply: '暂无 Assistant 回复', nonText: 'Assistant 发送了非文本消息', loading: '正在加载会话…', loadError: '摘要暂不可用，请打开会话重试。', running: '生成中…',
      noTasks: '暂无任务', tasks: '{done}/{total}', messages: '{count} 条消息', updated: '更新于 {time}', thread: '会话', choose: '选择一个会话', chooseHint: '在这里继续对话。左侧发送的每条新消息都会创建独立会话。',
      pin: '保存到稍后查看', unpin: '从稍后查看移除', back: '返回会话列表', openNav: '打开导航', collapseNav: '收起导航', restoreNav: '展开导航',
      native: '原生 DSH', restore: '打开 DSH Slack',
      aboutTitle: '每个话题，都有独立会话', aboutBody: '在左侧消息框输入新话题。在会话内回复，保留完整上下文。标题、摘要和 TODO 进度来自真实 DSH 会话。',
      aboutNative: '会话使用 DSH 原生消息、工具、模型选择器和输入框。任务数量只来自原生 todo_write 工具，不从回复文案推测。',
      aboutClose: '返回对话', sendFailed: '消息未被接收，草稿已保留。重试会沿用同一个会话。', new: '新', live: 'DSH 工作区', threadCount: '{count} 个会话',
    };
    const css = `
      .dsh-slack-nav,.dsh-slack-app{--sl-border:var(--dsw-alias-border-l2,#dddde5);--sl-bg:var(--dsw-alias-bg-base,#fff);--sl-text:var(--dsw-alias-label-primary,#1d1c24);--sl-muted:var(--dsw-alias-label-secondary,#64606f);--sl-selected:#e8e0fa;--sl-accent:#6f3bb2;box-sizing:border-box;font-family:var(--dsw-font-family,Arial,sans-serif);font-size:14px}
      .dsh-slack-nav *,.dsh-slack-app *{box-sizing:border-box}.dsh-slack-nav button,.dsh-slack-app button,.dsh-slack-app input,.dsh-slack-app textarea{font:inherit}.dsh-slack-nav button,.dsh-slack-app button{cursor:pointer}.dsh-slack-nav button:focus-visible,.dsh-slack-app :focus-visible{outline:2px solid #9661e8;outline-offset:-2px}.dsh-slack-icon{flex:none;vertical-align:middle;width:20px;height:20px}
      .dsh-slack-nav{height:100%;min-width:0;display:flex;flex-direction:column;background:#35143d;color:#f7f0fa;overflow:hidden}.dsh-slack-nav-top{height:56px;min-height:56px;border-bottom:1px solid #ffffff1c;display:flex;align-items:center;justify-content:space-between;padding:0 22px;font-size:22px;font-weight:700}.dsh-slack-nav-top button,.dsh-slack-nav-rail button{background:none;border:0;color:inherit;padding:7px;display:flex;align-items:center;justify-content:center}.dsh-slack-nav-body{padding:22px 12px;display:flex;flex:1;min-height:0;flex-direction:column;gap:5px;overflow:auto}.dsh-slack-nav-item{display:flex;align-items:center;gap:13px;min-height:39px;border:0;border-radius:7px;background:transparent;color:inherit;text-align:left;padding:8px 16px;width:100%;font-size:15px!important}.dsh-slack-nav-item:hover{background:#ffffff13}.dsh-slack-nav-item[data-selected=true]{background:#743ca4;color:white;font-weight:600}.dsh-slack-nav-label{font-size:12px;color:#dbc7e4;padding:20px 16px 8px;letter-spacing:.02em}.dsh-slack-brand{width:29px;height:29px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:#965ce4;color:white;font-size:11px;letter-spacing:-.4px;font-weight:800;flex:none}.dsh-slack-nav-footer{display:flex;flex-direction:column;gap:10px;padding:16px 26px;font-size:12px;color:#d2bddd;border-top:1px solid #ffffff12}.dsh-slack-nav-rail{display:flex;align-items:center;flex-direction:column;gap:18px;padding:16px 0}.dsh-slack-nav-rail .dsh-slack-brand{margin-bottom:14px}
      .dsh-slack-app{display:flex;flex-direction:column;min-width:0;height:100%;min-height:0;background:var(--sl-bg);color:var(--sl-text);overflow:hidden}.dsh-slack-topbar{height:56px;min-height:56px;background:#35143d;display:flex;align-items:center;gap:16px;padding:9px 26px;color:white}.dsh-slack-topbar input{background:#ffffff24;border:1px solid #ffffff18;border-radius:7px;height:36px;flex:1;min-width:0;color:white;padding:0 14px;font-size:14px}.dsh-slack-topbar input::placeholder{color:#ede0f2}.dsh-slack-topbar .dsh-slack-icon{opacity:.9}.dsh-slack-topbar-note{font-size:12px;color:#e3d0e9;white-space:nowrap}.dsh-slack-columns{flex:1;min-height:0;min-width:0;display:grid;grid-template-columns:minmax(280px,418px) minmax(0,1fr)}
      .dsh-slack-list{min-width:0;min-height:0;display:flex;flex-direction:column;border-right:1px solid var(--sl-border);background:var(--sl-bg)}.dsh-slack-list-header{height:109px;min-height:109px;padding:20px 22px 0;border-bottom:1px solid var(--sl-border);display:flex;flex-direction:column;justify-content:space-between}.dsh-slack-list-heading{display:flex;align-items:center;gap:10px}.dsh-slack-list-heading strong{font-size:22px;letter-spacing:-.6px}.dsh-slack-icon-button{border:0;background:transparent;color:inherit;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;flex:none}.dsh-slack-icon-button:hover{background:#9370b41a}.dsh-slack-compose-button{margin-left:auto}.dsh-slack-tabs{display:flex;gap:20px}.dsh-slack-tabs button{background:none;border:0;border-bottom:3px solid transparent;padding:10px 3px;color:var(--sl-muted)}.dsh-slack-tabs button[aria-selected=true]{color:var(--sl-accent);font-weight:600;border-bottom-color:var(--sl-accent)}
      .dsh-slack-list-scroll{min-height:0;flex:1;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin;padding:10px 10px 0}.dsh-slack-list-space{position:relative;width:100%}.dsh-slack-card{position:absolute;left:0;right:0;width:100%;height:128px;border:0;border-bottom:1px solid var(--sl-border);background:transparent;border-radius:0;display:flex;flex-direction:column;align-items:stretch;text-align:left;gap:7px;padding:14px 16px;color:inherit;overflow:hidden}.dsh-slack-card:hover{background:#9661e80a}.dsh-slack-card[aria-selected=true]{border-radius:9px;background:var(--sl-selected);border-bottom-color:transparent;box-shadow:inset 3px 0 0 var(--sl-accent)}.dsh-slack-card-top{display:flex;align-items:baseline;gap:12px;min-width:0}.dsh-slack-card-title{font-size:16px;font-weight:700;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1}.dsh-slack-card time{font-size:11px;color:var(--sl-muted);white-space:nowrap}.dsh-slack-summary{font-size:14px;line-height:20px;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;min-height:38px}.dsh-slack-card-bottom{display:flex;gap:9px;align-items:center;min-width:0;color:var(--sl-muted);font-size:11px;line-height:17px}.dsh-slack-progress{display:inline-flex;align-items:center;gap:4px;background:#787b8a18;border-radius:4px;color:var(--sl-text);padding:0 4px;white-space:nowrap;font-weight:600}.dsh-slack-progress[data-complete=true]{color:#187447;background:#2b9b721c}.dsh-slack-todo-labels{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsh-slack-running{color:var(--sl-accent);font-size:11px;white-space:nowrap}.dsh-slack-empty{padding:34px 18px;color:var(--sl-muted);text-align:center;line-height:1.6}.dsh-slack-empty strong{display:block;color:var(--sl-text);font-size:15px;margin-bottom:5px}.dsh-slack-empty p{margin:0}
      .dsh-slack-root-form{border-top:1px solid var(--sl-border);padding:13px 14px 10px;flex:none}.dsh-slack-root-box{border:1px solid var(--sl-border);border-radius:8px;background:var(--sl-bg);overflow:hidden}.dsh-slack-root-input{width:100%;height:71px;resize:vertical;max-height:150px;min-height:60px;border:0;background:transparent;color:var(--sl-text);padding:11px 12px;line-height:19px;display:block;font-size:13px!important}.dsh-slack-root-actions{display:flex;align-items:center;justify-content:space-between;padding:0 7px 6px;gap:8px}.dsh-slack-root-actions span{font-size:10px;color:var(--sl-muted)}.dsh-slack-root-submit{width:31px;height:28px;background:var(--sl-accent);border:0;border-radius:5px;color:white;display:flex;align-items:center;justify-content:center}.dsh-slack-root-submit:disabled{opacity:.4;cursor:default}.dsh-slack-root-error{font-size:12px;color:#ad3434;line-height:1.5;margin:8px 0 0}.dsh-slack-root-error button{background:none;border:0;color:inherit;text-decoration:underline;padding:2px 0}.dsh-slack-root-count{font-size:10px;color:var(--sl-muted);margin-top:7px;text-align:right}
      .dsh-slack-thread{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--sl-bg)}.dsh-slack-thread-header{height:87px;min-height:87px;border-bottom:1px solid var(--sl-border);padding:18px 24px 14px;display:flex;gap:10px;align-items:center}.dsh-slack-thread-heading{flex:1;min-width:0}.dsh-slack-thread-title{font-size:20px;line-height:26px;letter-spacing:-.45px;margin:0 0 4px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsh-slack-thread-meta{display:flex;gap:8px;align-items:center;color:var(--sl-muted);font-size:12px;flex-wrap:wrap}.dsh-slack-native{min-width:0;min-height:0;display:flex;flex:1;position:relative}.dsh-slack-native>[data-conversation-content]{flex:1;min-width:0;min-height:0}.dsh-slack-thread-empty{display:flex;flex:1;align-items:center;justify-content:center;min-width:0;padding:30px}.dsh-slack-thread-empty-inner{max-width:360px;text-align:center;color:var(--sl-muted);line-height:1.65}.dsh-slack-thread-empty-inner .dsh-slack-brand{width:48px;height:48px;font-size:17px;border-radius:13px}.dsh-slack-thread-empty h2{color:var(--sl-text);font-size:22px;letter-spacing:-.6px}.dsh-slack-about{padding:25px 24px;line-height:1.7;overflow:auto;flex:1;min-height:0}.dsh-slack-about h2{font-size:20px;line-height:1.4}.dsh-slack-about button{border:1px solid var(--sl-border);background:transparent;color:var(--sl-accent);padding:8px 12px;border-radius:6px}.dsh-slack-back,.dsh-slack-mobile-nav{display:none}
      .dsh-slack-native-toggle{background:transparent;border:1px solid #ffffff42;color:inherit;border-radius:5px;padding:6px 8px;align-self:flex-start;font-size:11px!important}
      body[data-ds-dark-theme] .dsh-slack-nav,body[data-ds-dark-theme] .dsh-slack-app{--sl-selected:#39284f;--sl-accent:#b990f1}body[data-ds-dark-theme] .dsh-slack-root-submit{background:#7b48b9}body[data-ds-dark-theme] .dsh-slack-progress[data-complete=true]{color:#79cba7}body[data-ds-dark-theme] .dsh-slack-root-error{color:#f2a6a6}
      @media(max-width:1100px){.dsh-slack-columns{grid-template-columns:minmax(260px,310px) minmax(0,1fr)}.dsh-slack-topbar-note{display:none}.dsh-slack-thread-header{padding:15px 17px}.dsh-slack-thread-title{font-size:18px}.dsh-slack-list-header{padding-left:18px;padding-right:18px}}
      @media(max-width:760px){.dsh-slack-columns{display:flex;flex:1}.dsh-slack-list,.dsh-slack-thread{width:100%;flex:1}.dsh-slack-app[data-mobile-thread=false] .dsh-slack-thread{display:none}.dsh-slack-app[data-mobile-thread=true] .dsh-slack-list{display:none}.dsh-slack-back,.dsh-slack-mobile-nav{display:inline-flex}.dsh-slack-topbar{padding:9px 12px;gap:8px;padding-left:max(12px,var(--dsh-frame-leading-clearance,0px))}.dsh-slack-list-header{height:102px;min-height:102px}.dsh-slack-thread-header{height:79px;min-height:79px;padding:12px}.dsh-slack-thread-title{font-size:17px}.dsh-slack-thread-meta{font-size:11px;gap:5px}.dsh-slack-root-input{height:66px}.dsh-slack-thread-empty{padding:22px}}
      @media(prefers-reduced-motion:reduce){.dsh-slack-app *,.dsh-slack-nav *{scroll-behavior:auto!important}}
    `;
    const icon = (glyph, size = 20) => h('svg', { width: size, height: size, className: 'dsh-slack-icon', 'aria-hidden': true }, h('use', { href: `#dsw-icon-${glyph}-regular` }));
    const brand = () => h('span', { className: 'dsh-slack-brand', 'aria-hidden': true }, 'DSH');
    const listeners = new Set();
    let navigation = { filter: 'all', workspaceId: null, tab: 'chats', mobileThread: false };
    const navigate = patch => { navigation = { ...navigation, ...patch }; for (const listener of listeners) listener(); };
    const useNavigation = () => useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => navigation);
    const rootListeners = new Set();
    let rootState = { query: '', draft: '', submission: { state: 'idle' }, attempt: null, sending: false };
    const updateRoot = patch => { rootState = { ...rootState, ...patch }; for (const listener of rootListeners) listener(); };
    const useRoot = () => useSyncExternalStore(cb => { rootListeners.add(cb); return () => rootListeners.delete(cb); }, () => rootState);
    const titleOf = row => row?.projectionValues?.dshSlack?.officialTitle || row?.projectionValues?.dshSlack?.title || row?.title || row?.displayTitle || '';
    const timeOf = timestamp => {
      const date = new Date(timestamp);
      return date.toDateString() === new Date().toDateString()
        ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return {
      inject: ['slots', 'sessions', 'workspaces', 'uiWorkspace', 'layout', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh slack dictionaries');
        let enabled = true;
        let stopSidebar;
        let stopConversation;
        const modeListeners = new Set();
        const modeSource = { getSnapshot: () => enabled, subscribe: callback => { modeListeners.add(callback); return () => modeListeners.delete(callback); } };
        const toggleMode = () => {
          enabled = !enabled;
          if (enabled) mount();
          else { stopSidebar?.(); stopConversation?.(); stopSidebar = undefined; stopConversation = undefined; }
          for (const listener of modeListeners) listener();
        };
        function Sidebar({ collapsed, drawer, useWorkspaces, t }) {
          const nav = useNavigation();
          const workspaces = useWorkspaces(s => s);
          const go = patch => { ctx.layout.selectPanel(null); navigate({ ...patch, tab: 'chats', mobileThread: false }); if (drawer && !collapsed) ctx.layout.toggleSidebar(); };
          if (collapsed && !drawer) return h('nav', { className: 'dsh-slack-nav dsh-slack-nav-rail', 'aria-label': 'DSH' },
            h('style', null, css), brand(), h('button', { onClick: () => ctx.layout.toggleSidebar(), 'aria-label': t('restoreNav'), title: t('restoreNav') }, icon('panel-left-outline')),
            h('button', { onClick: () => go({ filter: 'all', workspaceId: null }), 'aria-label': t('threads'), title: t('threads') }, icon('layers-outline')),
            h('button', { onClick: toggleMode, 'aria-label': t('native'), title: t('native'), style: { fontSize: 10 } }, 'DSH'));
          return h('nav', { className: 'dsh-slack-nav', 'aria-label': 'DSH' }, h('style', null, css),
            h('div', { className: 'dsh-slack-nav-top' }, h('span', null, 'DSH'), h('button', { onClick: () => ctx.layout.toggleSidebar(), 'aria-label': t('collapseNav'), title: t('collapseNav') }, icon('panel-left-outline'))),
            h('div', { className: 'dsh-slack-nav-body' },
              h('button', { className: 'dsh-slack-nav-item', 'data-selected': nav.filter === 'all' && nav.workspaceId === null, onClick: () => go({ filter: 'all', workspaceId: null }) }, icon('layers-outline'), t('threads')),
              h('button', { className: 'dsh-slack-nav-item', 'data-selected': nav.filter === 'later', onClick: () => go({ filter: 'later', workspaceId: null }) }, icon('pin-outline'), t('later')),
              workspaces.items.length > 0 && h('div', { className: 'dsh-slack-nav-label' }, t('workspaces')),
              workspaces.items.map(workspace => h('button', { className: 'dsh-slack-nav-item', key: workspace.workspaceId, 'data-selected': nav.workspaceId === workspace.workspaceId,
                onClick: () => go({ filter: 'all', workspaceId: workspace.workspaceId }), title: workspace.title }, icon('folder-close'), h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, workspace.title))),
              h('div', { className: 'dsh-slack-nav-label' }, t('apps')),
              h('button', { className: 'dsh-slack-nav-item', 'data-selected': true, onClick: () => go({ filter: 'all', workspaceId: null }) }, brand(), 'DSH')),
            h('div', { className: 'dsh-slack-nav-footer' }, h('span', null, t('live')), h('button', { className: 'dsh-slack-native-toggle', onClick: toggleMode }, t('native'))));
        }

        function Slack(props) {
          const { sessionId, useSessions, useWorkspaces, renderFactorySlot, t } = props;
          const list = useSessions(s => s);
          const workspaces = useWorkspaces(s => s);
          const nav = useNavigation();
          const { query, draft, submission } = useRoot();
          const setQuery = query => updateRoot({ query });
          const setDraft = draft => updateRoot({ draft });
          const setSubmission = submission => updateRoot({ submission });
          const [pinError, setPinError] = useState('');
          const [scroll, setScroll] = useState(0);
          const [height, setHeight] = useState(600);
          const [focusedId, setFocusedId] = useState(null);
          const scroller = useRef(null);
          const rootInput = useRef(null);
          const pendingFocus = useRef(null);
          const archived = new Set(workspaces.archivedSessionIds);
          const pins = new Set(workspaces.pinnedSessionIds);
          const workspace = workspaces.items.find(item => item.workspaceId === nav.workspaceId);
          const rows = list.ids.map(id => list.byId[id]).filter(row => row && !row.blank && row.origin !== 'subagent' && !archived.has(row.id)
            && (nav.filter !== 'later' || pins.has(row.id)) && (!workspace || workspace.sessionIds.includes(row.id))
            && `${titleOf(row)} ${row.projectionValues?.dshSlack?.summary?.text || ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
            .sort((a, b) => b.updatedAt - a.updatedAt);
          const current = list.byId[sessionId];
          const currentView = current?.projectionValues?.dshSlack;
          const start = Math.max(0, Math.floor(scroll / ROW) - 2);
          const end = Math.min(rows.length, Math.ceil((scroll + height) / ROW) + 2);
          const visible = rows.slice(start, end);
          const visibleIds = visible.map(row => row.id).join('\n');
          const focusId = rows.some(row => row.id === focusedId) ? focusedId : rows.some(row => row.id === sessionId) ? sessionId : rows[0]?.id;
          useEffect(() => {
            const element = scroller.current;
            if (!element) return;
            const observer = new ResizeObserver(() => setHeight(element.clientHeight));
            observer.observe(element); return () => observer.disconnect();
          }, [nav.tab]);
          useEffect(() => { if (scroller.current) scroller.current.scrollTop = 0; setScroll(0); }, [query, nav.filter, nav.workspaceId]);
          useEffect(() => {
            for (const id of visibleIds.split('\n').filter(Boolean)) {
              if (ctx.sessions.list.getSnapshot().byId[id]?.projectionValues?.dshSlack === undefined) void ctx.sessions.refreshProjections(id).catch(() => {});
            }
          }, [visibleIds]);
          useEffect(() => {
            const id = pendingFocus.current;
            if (!id || !scroller.current) return;
            const card = Array.from(scroller.current.querySelectorAll('[data-session-id]')).find(element => element.dataset.sessionId === id);
            if (card) { card.focus({ preventScroll: true }); pendingFocus.current = null; }
          }, [focusedId, start, end]);
          const newThread = () => { navigate({ tab: 'chats', mobileThread: false }); requestAnimationFrame(() => rootInput.current?.focus()); };
          const submit = async event => {
            event?.preventDefault();
            const text = draft.trim();
            if (!text || rootState.sending) return;
            let value = rootState.attempt;
            if (!value || value.text !== text) value = { text, sessionId: crypto.randomUUID(), created: false, requestId: null };
            updateRoot({ sending: true, attempt: value, submission: { state: 'sending' } });
            try {
              if (!value.created) {
                value.sessionId = await ctx.sessions.create({ sessionId: value.sessionId, ...(workspace ? { workspaceId: workspace.workspaceId } : current?.cwd ? { cwd: current.cwd } : {}) });
                value.created = true;
              }
              ctx.uiWorkspace.openSession(value.sessionId);
              navigate({ mobileThread: true });
              await ctx.sessions.using(value.sessionId, { source: 'workspaceOperation' }, async reference => {
                const session = reference.binding.session;
                if (!value.requestId) value.requestId = session.beginSubmission({ mode: 'queue', text, attachments: [] }).requestId;
                const result = await session.prompt([{ type: 'text', text }], 'queue', undefined, value.requestId);
                if (!result.ok) throw new Error(result.error.message);
              });
              updateRoot({ draft: '', attempt: null, submission: { state: 'idle' } });
            } catch (error) { setSubmission({ state: 'failed', error: error.message }); }
            finally { updateRoot({ sending: false }); }
          };
          const pin = async () => {
            if (!sessionId) return;
            setPinError('');
            try { await (pins.has(sessionId) ? ctx.uiWorkspace.unpinSession(sessionId) : ctx.uiWorkspace.pinSession(sessionId)); }
            catch (error) { setPinError(error.message); }
          };
          const keyDown = event => {
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const index = Math.max(0, rows.findIndex(row => row.id === event.target.dataset.sessionId));
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1 : Math.max(0, Math.min(rows.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
            if (!rows[next] || !scroller.current) return;
            pendingFocus.current = rows[next].id; setFocusedId(rows[next].id);
            const top = next * ROW;
            if (top < scroller.current.scrollTop) scroller.current.scrollTop = top;
            else if (top + ROW > scroller.current.scrollTop + height) scroller.current.scrollTop = top + ROW - height;
            setScroll(scroller.current.scrollTop);
          };
          const emptyTitle = query ? 'noMatch' : nav.filter === 'later' ? 'savedEmpty' : list.phase === 'ready' ? 'empty' : 'loading';
          return h('main', { className: 'dsh-slack-app', 'data-mobile-thread': nav.mobileThread, 'aria-label': 'DSH threads' }, h('style', null, css),
            h('div', { className: 'dsh-slack-topbar' },
              h('button', { className: 'dsh-slack-icon-button dsh-slack-mobile-nav', onClick: () => ctx.layout.toggleSidebar(), 'aria-label': t('openNav') }, icon('panel-left-outline')),
              icon('search-outline'), h('input', { type: 'search', placeholder: t('search'), 'aria-label': t('search'), value: query, onChange: event => { setQuery(event.target.value); navigate({ mobileThread: false }); } }),
              h('span', { className: 'dsh-slack-topbar-note' }, 'DeepSeek Harness')),
            h('div', { className: 'dsh-slack-columns' },
              h('section', { className: 'dsh-slack-list', 'aria-label': t('chats') },
                h('header', { className: 'dsh-slack-list-header' },
                  h('div', { className: 'dsh-slack-list-heading' }, brand(), h('strong', null, nav.filter === 'later' ? t('later') : 'DSH'), h('button', { className: 'dsh-slack-icon-button dsh-slack-compose-button', onClick: newThread, 'aria-label': t('newThread'), title: t('newThread') }, icon('edit-outline'))),
                  h('div', { className: 'dsh-slack-tabs', role: 'tablist', 'aria-label': 'DSH' }, ['chats', 'about'].map(tab => h('button', { key: tab, role: 'tab', 'aria-selected': nav.tab === tab, onClick: () => navigate({ tab }) }, t(tab))))),
                nav.tab === 'about' ? h('section', { className: 'dsh-slack-about' }, h('h2', null, t('aboutTitle')), h('p', null, t('aboutBody')), h('p', null, t('aboutNative')), h('button', { onClick: () => navigate({ tab: 'chats' }) }, t('aboutClose')))
                  : h('div', { className: 'dsh-slack-list-scroll', role: 'listbox', 'aria-label': t('threads'), onKeyDown: keyDown, ref: scroller, onScroll: event => setScroll(event.currentTarget.scrollTop) },
                    rows.length === 0 ? h('div', { className: 'dsh-slack-empty', role: 'status' }, h('strong', null, t(emptyTitle)), !query && list.phase === 'ready' && h('p', null, t(nav.filter === 'later' ? 'savedHint' : 'emptyHint')))
                      : h('div', { className: 'dsh-slack-list-space', style: { height: rows.length * ROW } }, visible.map((row, offset) => {
                        const view = row.projectionValues?.dshSlack;
                        const todos = view?.todos;
                        const load = list.projectionsBySession[row.id];
                        const summary = view?.summary ? view.summary.text || t('nonText') : t(view ? 'noReply' : ['ready', 'error'].includes(load?.state) ? 'loadError' : 'loading');
                        return h('button', { key: row.id, className: 'dsh-slack-card', role: 'option', 'data-session-id': row.id, 'aria-selected': row.id === sessionId, 'aria-label': titleOf(row),
                          'aria-posinset': start + offset + 1, 'aria-setsize': rows.length, tabIndex: focusId === row.id ? 0 : -1,
                          style: { top: (start + offset) * ROW }, onFocus: () => setFocusedId(row.id), onClick: () => { ctx.uiWorkspace.openSession(row.id); navigate({ mobileThread: true }); } },
                          h('span', { className: 'dsh-slack-card-top' }, h('span', { className: 'dsh-slack-card-title', title: titleOf(row) }, titleOf(row)), h('time', { dateTime: new Date(row.updatedAt).toISOString() }, timeOf(row.updatedAt))),
                          h('p', { className: 'dsh-slack-summary', title: summary }, summary),
                          h('span', { className: 'dsh-slack-card-bottom' },
                            todos?.total > 0 ? h('span', { className: 'dsh-slack-progress', 'data-complete': todos.completed === todos.total, 'aria-label': `TODO ${todos.completed}/${todos.total}` }, icon('checklist-outline', 14), t('tasks', { done: todos.completed, total: todos.total })) : h('span', null, t('noTasks')),
                            row.running ? h('span', { className: 'dsh-slack-running', role: 'status' }, t('running')) : h('span', { className: 'dsh-slack-todo-labels', title: todos?.items.map(item => item.content).join(' · ') }, todos?.items.map(item => item.content).join(' · ') || t('messages', { count: view?.messageCount || 0 }))));
                      }))),
                h('form', { className: 'dsh-slack-root-form', onSubmit: submit },
                  h('div', { className: 'dsh-slack-root-box' }, h('textarea', { className: 'dsh-slack-root-input', ref: rootInput, placeholder: t('rootPlaceholder'), 'aria-label': t('rootPlaceholder'), value: draft, disabled: submission.state === 'sending',
                    onChange: event => setDraft(event.target.value), onKeyDown: event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } } }),
                    h('div', { className: 'dsh-slack-root-actions' }, h('span', null, t(submission.state === 'sending' ? 'sending' : 'rootHint')), h('button', { type: 'submit', className: 'dsh-slack-root-submit', disabled: !draft.trim() || submission.state === 'sending', 'aria-label': t('send'), title: t('send') }, icon('send-outline', 17)))),
                  submission.state === 'failed' && h('p', { className: 'dsh-slack-root-error', role: 'alert' }, t('sendFailed'), ' ', h('button', { type: 'button', onClick: submit }, t('retry'))),
                  h('div', { className: 'dsh-slack-root-count' }, t('threadCount', { count: rows.length })))),
              h('section', { className: 'dsh-slack-thread', 'aria-label': t('thread') },
                h('header', { className: 'dsh-slack-thread-header' }, h('button', { className: 'dsh-slack-icon-button dsh-slack-back', onClick: () => navigate({ mobileThread: false }), 'aria-label': t('back') }, icon('chevron-left-outline')),
                  h('div', { className: 'dsh-slack-thread-heading' }, h('h1', { className: 'dsh-slack-thread-title' }, titleOf(current) || t('choose')), h('div', { className: 'dsh-slack-thread-meta' }, h('span', null, t('thread')), currentView && h('span', null, '·'), currentView && h('span', null, t('messages', { count: currentView.messageCount })), current && h('span', null, '·'), current && h('span', null, t('updated', { time: timeOf(current.updatedAt) })))),
                  sessionId && h('button', { className: 'dsh-slack-icon-button dsh-slack-pin', onClick: pin, 'aria-label': t(pins.has(sessionId) ? 'unpin' : 'pin'), 'aria-pressed': pins.has(sessionId), title: t(pins.has(sessionId) ? 'unpin' : 'pin') }, icon(pins.has(sessionId) ? 'pin-fill' : 'pin-outline'))),
                pinError && h('p', { role: 'alert', className: 'dsh-slack-root-error' }, pinError),
                sessionId ? h('div', { className: 'dsh-slack-native' }, renderFactorySlot('conversation.content', { variant: 'embedded', phase: 'active', hero: false }))
                  : h('div', { className: 'dsh-slack-thread-empty' }, h('div', { className: 'dsh-slack-thread-empty-inner' }, brand(), h('h2', null, t('choose')), h('p', null, t('chooseHint')))))));
        }
        function mount() {
          stopSidebar = ctx.slots.inject('sidebar', () => ctx.slots.register({ name: 'sidebar', priority: -10, locale: NS }, Sidebar));
          stopConversation = ctx.slots.inject('main.conversation', () => ctx.slots.register({ name: 'main.conversation', priority: -10, locale: NS }, Slack));
        }
        function Restore({ t }) {
          const active = useSyncExternalStore(modeSource.subscribe, modeSource.getSnapshot);
          return active ? null : h('button', { className: 'dsh-slack-restore', onClick: toggleMode, style: {
            position: 'fixed', bottom: 64, left: 12, zIndex: 100, pointerEvents: 'auto', padding: '8px 12px',
            background: '#fff', color: '#542481', border: '1px solid #b995dc', borderRadius: 7, fontSize: 12, cursor: 'pointer',
          } }, t('restore'));
        }
        mount();
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'dsh-slack-restore', locale: NS }, Restore));
        ctx.effect(() => () => { stopSidebar?.(); stopConversation?.(); modeListeners.clear(); }, 'dsh slack mode cleanup');
      },
    };
  },
});
