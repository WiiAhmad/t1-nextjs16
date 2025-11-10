'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from '@/app/(auth)/action';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// ================================
// SIGNIN FORM COMPONENT
// ================================

function SignInForm() {
  const [state, action, isPending] = useActionState(signIn, null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  // Handle successful sign in - redirect to dashboard
  useEffect(() => {
    if ((state as any)?.success) {
      router.push('/dashboard');
    }
  }, [state, router]);

  return (
    <form action={action}>
      <FieldGroup>
        {(state as any)?.error && (
          <Alert variant="destructive">
            <AlertDescription>{(state as any).error}</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            autoComplete="email"
            defaultValue={state?.email || ''}
            className={cn(
              "transition-colors",
              (state as any)?.error && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={isPending}
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="pr-10"
              disabled={isPending}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isPending}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>

        <div className="flex items-start space-x-3 space-y-0">
          <Checkbox
            id="rememberMe"
            name="rememberMe"
            disabled={isPending}
          />
          <FieldLabel
            htmlFor="rememberMe"
            className="text-sm font-normal cursor-pointer"
          >
            Remember me
          </FieldLabel>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        <FieldDescription className="text-center">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

// ================================
// SIGNIN PAGE COMPONENT
// ================================

export default function SignInPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}