import z from 'zod';

export const RegistrationStrategySchema = z.enum(['open', 'closed', 'requires_approval', 'invite_link']);

export const ObelusConfigSchema = z.object({
  registrationStrategy: RegistrationStrategySchema,
});
