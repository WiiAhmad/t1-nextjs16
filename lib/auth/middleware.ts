import { z } from 'zod';
import { User } from '@/lib/db/schema';
import { getUserById, getUserByEmail } from '@/lib/db/query';
import { getSession } from './session';
import { redirect } from 'next/navigation';

export type ActionState = {
  error?: string;
  success?: string | boolean;
  message?: string;
  [key: string]: any; // This allows for additional properties
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.issues[0].message };
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const session = await getSession();
    if (!session) {
      throw new Error('User is not authenticated');
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      throw new Error('User not found');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.issues[0].message };
    }

    return action(result.data, formData, user);
  };
}

type ActionWithUserFunction<T> = (
  formData: FormData,
  user: User
) => Promise<T>;

export function withUser<T>(action: ActionWithUserFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const session = await getSession();
    if (!session) {
      redirect('/sign-in');
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      redirect('/sign-in');
    }

    return action(formData, user);
  };
}