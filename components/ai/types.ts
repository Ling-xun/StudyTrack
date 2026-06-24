export type AiMessageItem = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

export type AiConversationListItem = {
  id: string;
  title: string;
  scopeType: string | null;
  scopeValue: string | null;
  mode: string | null;
  model: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AiConversationDetail = Omit<AiConversationListItem, "messageCount"> & {
  messages: AiMessageItem[];
};

export type AiSummaryListItem = {
  id: string;
  title: string;
  content: string;
  scopeType: string;
  scopeValue: string | null;
  mode: string;
  sourceCount: number;
  model: string | null;
  createdAt: string;
};

export type AiSummaryDetail = AiSummaryListItem & {
  sourceHash: string | null;
  updatedAt: string;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
