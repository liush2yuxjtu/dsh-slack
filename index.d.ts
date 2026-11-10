import type { Context } from '@deepseek-ai/cordis';
export const name: 'dsh-slack';
export const inject: string[];
export function apply(ctx: Context): Promise<void>;
export interface SlackProjection {
  title: string;
  officialTitle: string | null;
  summary: { text: string; messageId: string } | null;
  todos: { total: number; completed: number; items: Array<{ content: string; status: 'pending' | 'in_progress' | 'completed' }> } | null;
  messageCount: number;
}
