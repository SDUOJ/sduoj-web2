import request from './request';
export type AgentAction = {
  id: string;
  hash: string;
  status: string;
  action: { method: string; path: string; arguments: Record<string, unknown>; reason: string };
  actor?: string;
  result?: unknown;
};
export type AgentSession = {
  id: string;
  title: string;
  state: string;
  updated_at: string;
  instructions: string;
  events: Array<{ id: string; kind: string; text: string; at: string }>;
  stream?: string;
  actions: AgentAction[];
  plan: Array<{ step: string; status: string }>;
};
export type AgentPreset = { id: string; title: string; instructions: string };
const base = '/ps/management-agent';
export const managementAgent = {
  list: () =>
    request.get<Array<Pick<AgentSession, 'id' | 'title' | 'state' | 'updated_at'>>>(
      base + '/sessions',
    ),
  presets: () => request.get<AgentPreset[]>(base + '/presets'),
  create: (data: { title: string; preset: string; instructions: string }) =>
    request.post<AgentSession>(base + '/sessions', data),
  detail: (id: string) => request.get<AgentSession>(`${base}/sessions/${id}`),
  message: (id: string, text: string) => request.post(`${base}/sessions/${id}/messages`, { text }),
  decide: (id: string, action: AgentAction, approve: boolean) =>
    request.post(`${base}/sessions/${id}/actions/${action.id}`, {
      action_hash: action.hash,
      approve,
    }),
  stop: (id: string) => request.post(`${base}/sessions/${id}/stop`, {}),
};
