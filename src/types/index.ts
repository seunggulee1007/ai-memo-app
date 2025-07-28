// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Memo types
export interface Memo {
  id: string;
  title: string;
  content: string;
  userId: string;
  isPublic: boolean;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  team?: Team;
  tags?: Tag[];
  aiSuggestions?: AISuggestion[];
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

// AI Suggestion types
export interface AISuggestion {
  id: string;
  memoId: string;
  type: 'grammar' | 'style' | 'structure' | 'summary';
  content: string;
  applied: boolean;
  createdAt: Date;
  memo?: Memo;
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  members?: TeamMember[];
  memos?: Memo[];
}

// Team Member types
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  team?: Team;
  user?: User;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

// Form types
export interface CreateMemoForm {
  title: string;
  content: string;
  isPublic: boolean;
  tagIds: string[];
}

export interface UpdateMemoForm extends Partial<CreateMemoForm> {
  id: string;
}

export interface CreateTagForm {
  name: string;
  color: string;
}

export interface CreateTeamForm {
  name: string;
  description?: string;
}
