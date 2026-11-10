import { z } from 'zod';
import { emptySlack, projectSlack } from './src/projection.mjs';

export const name = 'dsh-slack';
export const inject = ['sessionProjections'];

const item = z.object({ content: z.string().max(180), status: z.enum(['pending', 'in_progress', 'completed']) });
const projection = z.object({
  title: z.string().max(72),
  officialTitle: z.string().max(72).nullable(),
  summary: z.object({ text: z.string().max(360), messageId: z.string() }).nullable(),
  todos: z.object({ total: z.number().int().nonnegative(), completed: z.number().int().nonnegative(), items: z.array(item).max(3) }).nullable(),
  messageCount: z.number().int().nonnegative(),
});

export async function apply(ctx) {
  await ctx.sessionProjections.register({
    key: 'dshSlack', stateSchema: projection, init: emptySlack, apply: projectSlack,
    wire: { viewSchema: projection, view: state => state, summary: true }, stateVersion: 1,
  });
}
