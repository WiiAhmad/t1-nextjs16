'use client';

import React, { useState, useEffect } from 'react';
import { signUp } from '@/app/(auth)/action';
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
// SIGNUP FORM COMPONENT
// ================================

function SignUpForm() {
  const [state, action, isPending] = useActionState(signUp, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  
  // Handle successful sign up - redirect to dashboard
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
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            autoComplete="name"
            defaultValue={(state as any)?.name || ''}
            className={cn(
              "transition-colors",
              (state as any)?.error && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={isPending}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            autoComplete="email"
            defaultValue={(state as any)?.email || ''}
            className={cn(
              "transition-colors",
              (state as any)?.error && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={isPending}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              required
              autoComplete="new-password"
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
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              className="pr-10"
              disabled={isPending}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isPending}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <FieldDescription>Please confirm your password.</FieldDescription>
        </Field>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        <FieldDescription className="text-center">
          Already have an account?{' '}
          <Link
            href="/signin"
            className="underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

// ================================
// SIGNUP PAGE COMPONENT
// ================================

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              Enter your information below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}