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
