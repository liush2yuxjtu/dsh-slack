import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptySlack, projectSlack, plainText } from '../src/projection.mjs';

const user = text => ({ type: 'user/message', data: { content: [{ type: 'text', text }], source: { kind: 'user' } } });
const assistant = (text, extra = {}) => ({ type: 'assistant/message', data: { message: { id: 'reply', content: [{ type: 'text', text }] }, ...extra } });
const tasks = todos => ({ type: 'todo/write', data: { todos } });

test('a thread counts committed messages and keeps its original request as a fallback title', () => {
  const state = [user('**Review sidebar**'), assistant('Reviewed the sidebar.'), user('Continue')].reduce(projectSlack, emptySlack());
  assert.equal(state.title, 'Review sidebar');
  assert.equal(state.messageCount, 3);
  assert.equal(state.summary.text, 'Reviewed the sidebar.');
});
test('the first non-empty request line supplies the compact title', () => {
  assert.equal(projectSlack(emptySlack(), user('\n\n**Simplify DSH sidebar UI**\nPlease inspect layout.json and create three tasks.')).title, 'Simplify DSH sidebar UI');
});
test('tool-only assistant messages preserve the latest readable summary', () => {
  const state = projectSlack(emptySlack(), assistant('Readable result'));
  const next = projectSlack(state, { type: 'assistant/message', data: { message: { id: 'tool', content: [{ type: 'tool-call', name: 'todo_write', arguments: '{}' }] } } });
  assert.deepEqual(next.summary, state.summary);
  assert.equal(next.messageCount, state.messageCount);
});
test('tool results and injected context do not count as human messages', () => {
  const event = user('Internal tool result'); event.data.source = { kind: 'tool', callId: 'call' };
  assert.equal(projectSlack(emptySlack(), event).messageCount, 0);
  assert.equal(projectSlack(emptySlack(), event).title, '');
});
test('explicit and model titles update while automatic fallback keeps the first request line', () => {
  const initial = projectSlack(emptySlack(), user('First line\nDetailed request'));
  const title = (text, kind) => ({ type: 'session/title', data: { title: text, source: { kind } } });
  const renamed = projectSlack(initial, title('Reviewed UI', 'user'));
  assert.equal(renamed.officialTitle, 'Reviewed UI');
  assert.equal(projectSlack(renamed, title('Model title', 'provider')).officialTitle, 'Model title');
  const reset = projectSlack(renamed, title('First line Detailed request', 'fallback'));
  assert.equal(reset.officialTitle, null);
  assert.equal(reset.title, 'First line');
});
test('native TODO events are the only task authority and stay bounded', () => {
  const state = projectSlack(emptySlack(), tasks([
    { content: 'complete', status: 'completed' }, { content: 'wait', status: 'pending' },
    { content: 'work', status: 'in_progress' }, { content: 'extra', status: 'pending' },
  ]));
  assert.equal(state.todos.total, 4);
  assert.equal(state.todos.completed, 1);
  assert.deepEqual(state.todos.items.map(item => item.content), ['work', 'wait', 'extra']);
  assert.equal(projectSlack(state, assistant('Everything is done')).todos.completed, 1);
  assert.equal(projectSlack(state, { type: 'turn/start' }).todos, null);
});
test('stream fragments, interrupted attempts and reasoning never enter the summary', () => {
  const state = projectSlack(emptySlack(), assistant('committed'));
  assert.equal(projectSlack(state, { type: 'assistant/chunk', data: { text: 'fragment' } }), state);
  assert.equal(projectSlack(state, assistant('cancelled', { interrupted: true })), state);
  const event = assistant('final'); event.data.message.content.unshift({ type: 'reasoning', text: 'private' });
  assert.equal(projectSlack(state, event).summary.text, 'final');
});
test('summaries remove Markdown markup while retaining readable text', () => {
  assert.equal(plainText('# Result\n\n**Ready** with [design](https://example.com).\n- [x] `Ship`'), 'Result Ready with design. Ship');
  assert.equal(plainText('```js\nconst ready = true;\n```'), 'const ready = true;');
});
test('independent sessions never share state and projection replay is deterministic', () => {
  const events = [user('x'.repeat(500)), assistant('y'.repeat(1000)), tasks(Array.from({ length: 40 }, () => ({ content: 'z'.repeat(400), status: 'pending' })))];
  const a = events.reduce(projectSlack, emptySlack());
  assert.deepEqual(a, JSON.parse(JSON.stringify(events)).reduce(projectSlack, emptySlack()));
  assert.deepEqual(emptySlack(), { title: '', officialTitle: null, summary: null, todos: null, messageCount: 0 });
  assert.equal(a.title.length, 72); assert.equal(a.summary.text.length, 360); assert.equal(a.todos.items.length, 3); assert.equal(a.todos.items[0].content.length, 180);
});
