import { eq, and, desc, asc, like, or } from 'drizzle-orm';
import { db } from './index';
import {
  users,
  memos,
  tags,
  memoTags,
  aiSuggestions,
  teams,
  teamMembers,
} from './schema';
import type {
  CreateMemoForm,
  UpdateMemoForm,
  CreateTagForm,
  CreateTeamForm,
} from '@/types';

// User queries
export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] || null;
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  avatar?: string;
}) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function updateUser(
  id: string,
  data: Partial<typeof users.$inferInsert>
) {
  const result = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

// Memo queries
export async function getMemosByUserId(userId: string, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(memos)
    .where(eq(memos.userId, userId))
    .orderBy(desc(memos.updatedAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select()
    .from(memos)
    .where(eq(memos.userId, userId));

  return {
    memos: result,
    total: totalResult.length,
  };
}

export async function getMemoById(id: string) {
  const result = await db.select().from(memos).where(eq(memos.id, id)).limit(1);
  return result[0] || null;
}

export async function getPublicMemos(page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(memos)
    .where(eq(memos.isPublic, true))
    .orderBy(desc(memos.updatedAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select()
    .from(memos)
    .where(eq(memos.isPublic, true));

  return {
    memos: result,
    total: totalResult.length,
  };
}

export async function createMemo(data: CreateMemoForm & { userId: string }) {
  const { tagIds, ...memoData } = data;

  const result = await db.insert(memos).values(memoData).returning();
  const memo = result[0];

  // Add tags if provided
  if (tagIds && tagIds.length > 0) {
    const tagRelations = tagIds.map((tagId) => ({
      memoId: memo.id,
      tagId,
    }));
    await db.insert(memoTags).values(tagRelations);
  }

  return memo;
}

export async function updateMemo(id: string, data: UpdateMemoForm) {
  const { tagIds, ...memoData } = data;

  const result = await db
    .update(memos)
    .set({ ...memoData, updatedAt: new Date() })
    .where(eq(memos.id, id))
    .returning();

  const memo = result[0];

  // Update tags if provided
  if (tagIds !== undefined) {
    // Remove existing tags
    await db.delete(memoTags).where(eq(memoTags.memoId, id));

    // Add new tags
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map((tagId) => ({
        memoId: id,
        tagId,
      }));
      await db.insert(memoTags).values(tagRelations);
    }
  }

  return memo;
}

export async function deleteMemo(id: string) {
  await db.delete(memos).where(eq(memos.id, id));
}

export async function searchMemos(
  userId: string,
  query: string,
  page = 1,
  limit = 10
) {
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(memos)
    .where(
      and(
        eq(memos.userId, userId),
        or(like(memos.title, `%${query}%`), like(memos.content, `%${query}%`))
      )
    )
    .orderBy(desc(memos.updatedAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select()
    .from(memos)
    .where(
      and(
        eq(memos.userId, userId),
        or(like(memos.title, `%${query}%`), like(memos.content, `%${query}%`))
      )
    );

  return {
    memos: result,
    total: totalResult.length,
  };
}

// Tag queries
export async function getTagsByUserId(userId: string) {
  return await db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(asc(tags.name));
}

export async function getTagById(id: string) {
  const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return result[0] || null;
}

export async function createTag(data: CreateTagForm & { userId: string }) {
  const result = await db.insert(tags).values(data).returning();
  return result[0];
}

export async function updateTag(id: string, data: Partial<CreateTagForm>) {
  const result = await db
    .update(tags)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tags.id, id))
    .returning();
  return result[0];
}

export async function deleteTag(id: string) {
  await db.delete(tags).where(eq(tags.id, id));
}

// AI Suggestions queries
export async function getAISuggestionsByMemoId(memoId: string) {
  return await db
    .select()
    .from(aiSuggestions)
    .where(eq(aiSuggestions.memoId, memoId))
    .orderBy(desc(aiSuggestions.createdAt));
}

export async function createAISuggestion(data: {
  memoId: string;
  type: string;
  content: string;
}) {
  const result = await db.insert(aiSuggestions).values(data).returning();
  return result[0];
}

export async function updateAISuggestion(
  id: string,
  data: Partial<typeof aiSuggestions.$inferInsert>
) {
  const result = await db
    .update(aiSuggestions)
    .set(data)
    .where(eq(aiSuggestions.id, id))
    .returning();
  return result[0];
}

// Team queries
export async function getTeamsByUserId(userId: string) {
  const result = await db
    .select({
      team: teams,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId))
    .orderBy(asc(teams.name));

  return result.map((row) => ({
    ...row.team,
    role: row.role,
  }));
}

export async function getTeamById(id: string) {
  const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return result[0] || null;
}

export async function createTeam(data: CreateTeamForm) {
  const result = await db.insert(teams).values(data).returning();
  return result[0];
}

export async function updateTeam(id: string, data: Partial<CreateTeamForm>) {
  const result = await db
    .update(teams)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(teams.id, id))
    .returning();
  return result[0];
}

export async function deleteTeam(id: string) {
  await db.delete(teams).where(eq(teams.id, id));
}

// Team Member queries
export async function addTeamMember(data: {
  teamId: string;
  userId: string;
  role?: string;
}) {
  const result = await db.insert(teamMembers).values(data).returning();
  return result[0];
}

export async function removeTeamMember(teamId: string, userId: string) {
  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
}

export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  role: string
) {
  const result = await db
    .update(teamMembers)
    .set({ role })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .returning();
  return result[0];
}

export async function getTeamMembers(teamId: string) {
  const result = await db
    .select({
      member: teamMembers,
      user: users,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(asc(users.name));

  return result.map((row) => ({
    ...row.member,
    user: row.user,
  }));
}
