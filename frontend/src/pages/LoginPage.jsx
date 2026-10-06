import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { loginSchema } from '../validation/schemas.js';
import TextField from '../components/TextField.jsx';
import Button from '../components/Button.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-ink-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-ink-900">Worker Sign In</h1>
        <p className="mt-1 text-sm text-ink-500">Ticket QR Code Generator</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </p>
          )}
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            required
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
