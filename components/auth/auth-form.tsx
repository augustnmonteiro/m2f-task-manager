'use client';

import { useState, useTransition } from 'react';
import { signUp, signIn } from '@/server-actions/auth';

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = mode === 'login' ? await signIn(formData) : await signUp(formData);
      if (!result.ok) setError(result.error.message);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Task Notifier</h1>
        {error && <p role="alert" aria-live="polite" className="text-red-600 text-sm">{error}</p>}
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="border rounded px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="border rounded px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {isPending ? 'Loading…' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
        <button
          type="button"
          onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
          className="text-sm underline"
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
