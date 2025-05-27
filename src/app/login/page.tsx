'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { FiLogIn, FiLoader } from 'react-icons/fi';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Attempting to sign in...');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Check for specific Supabase auth errors if desired
        throw new Error(error.message || 'Invalid login credentials. Please try again.');
      }

      toast.success('Logged in successfully! Redirecting...', { id: toastId });
      router.push('/dashboard');
      router.refresh(); // Ensure layout re-renders and auth state is picked up
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to log in. Please check your credentials.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-orbitly-light-green py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="https://i.postimg.cc/fL5MZ1Z1/Dhruva-holistic-wellness-logo-3-01.png" 
            alt="Dhruva Wellness Logo"
            width={730} 
            height={200}
            className="h-20 w-auto"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-orbitly-charcoal">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-orbitly-dark-sage">
          Sign in to access your Dhruva Wellness CRM.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl bg-white px-4 py-8 shadow-xl sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-orbitly-charcoal"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="block w-full rounded-lg border-orbitly-soft-gray py-2.5 text-orbitly-charcoal shadow-sm placeholder:text-orbitly-soft-gray focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-orbitly-charcoal"
                >
                  Password
                </label>
                {/* <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Forgot your password?
                  </a>
                </div> */}
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="block w-full rounded-lg border-orbitly-soft-gray py-2.5 text-orbitly-charcoal shadow-sm placeholder:text-orbitly-soft-gray focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <><FiLoader className="mr-2 h-4 w-4 animate-spin" /> Signing In...</>
                ) : (
                  <><FiLogIn className="mr-2 h-4 w-4" /> Sign In</>
                )}
              </button>
            </div>
          </form>

          {/* Optional: Link to registration or other sites */}
          {/* <p className="mt-8 text-center text-sm text-orbitly-dark-sage">
            New to Dhruva Wellness?{' '}
            <a href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Create an account
            </a>
          </p> */}
        </div>
      </div>
    </div>
  );
} 