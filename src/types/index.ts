export interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  isArchived?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
