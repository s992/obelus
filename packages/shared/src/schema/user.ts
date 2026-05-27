import z from 'zod';

export const UserStatusSchema = z.enum(['active', 'disabled', 'pending_approval']);

export const UserRoleSchema = z.enum(['admin', 'member']);

export const UserSchema = z.object({
  id: z.uuidv4(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userName: z.string(),
  passwordHash: z.string(),
  public: z.boolean(),
  status: UserStatusSchema,
  role: UserRoleSchema,
});

export const UserJsonSchema = UserSchema.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ListUsersUserSchema = z.object({
  id: z.uuidv4(),
  userName: z.string(),
  createdAt: z.date(),
  status: UserStatusSchema,
  role: UserRoleSchema,
});

export const ListUsersUserJsonSchema = ListUsersUserSchema.omit({ createdAt: true }).extend({
  createdAt: z.iso.datetime(),
});

export const ListUsersSchema = z.object({
  users: z.array(ListUsersUserSchema),
  hasNextPage: z.boolean(),
  nextPageToken: z.string().nullable(),
  totalCount: z.number(),
  pageSize: z.number(),
});
