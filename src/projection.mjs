export function plainText(text) {
  return text.replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<https?:\/\/([^>]+)>/g, '$1')
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+(?:\[[ xX]\]\s*)?|\d+\.\s+)/gm, '')
    .replace(/(\*\*|__|~~|`)/g, '')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/\s+/g, ' ').trim();
}

export function emptySlack() {
  return { title: '', officialTitle: null, summary: null, todos: null, messageCount: 0 };
}

export function projectSlack(state, event) {
  if (event.type === 'session/title') return { ...state, officialTitle: event.data.source.kind === 'fallback' ? null : event.data.title.slice(0, 72) };
  if (event.type === 'turn/start') return state.todos === null ? state : { ...state, todos: null };
  if (event.type === 'todo/write') {
    const order = { in_progress: 0, pending: 1, completed: 2 };
    const todos = event.data.todos;
    return { ...state, todos: {
      total: todos.length,
      completed: todos.filter(item => item.status === 'completed').length,
      items: [...todos].sort((a, b) => order[a.status] - order[b.status]).slice(0, 3)
        .map(item => ({ content: item.content.slice(0, 180), status: item.status })),
    } };
  }
  if (event.type === 'user/message') {
    if (event.data.source?.kind !== 'user') return state;
    const text = event.data.content.filter(block => block.type === 'text').map(block => block.text).join(' ');
    const firstLine = text.split(/\r?\n/).find(line => line.trim()) || '';
    return { ...state, title: state.title || plainText(firstLine).slice(0, 72), messageCount: state.messageCount + 1 };
  }
  if (event.type === 'assistant/message' && !event.data.interrupted) {
    const message = event.data.message;
    const text = message.content.filter(block => block.type === 'text').map(block => block.text).join(' ');
    if (!text.trim()) return state;
    return { ...state, summary: { text: plainText(text).slice(0, 360), messageId: message.id }, messageCount: state.messageCount + 1 };
  }
  return state;
}
