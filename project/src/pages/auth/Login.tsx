import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icon } from '../../components/ui/Icon';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { user, login } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  if (user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        toast.success('Login successful!');
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-amber-50 via-white to-amber-100">
      {/* Left hero/branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[radial-gradient(circle_at_20%_20%,#f59e0b22,transparent_50%),radial-gradient(circle_at_80%_80%,#f59e0b22,transparent_50%)]">
        <div className="flex items-center gap-3">
          <Icon name="car" className="h-10 w-10 text-amber-600" />
          <span className="text-2xl font-bold text-gray-900">Car Fleet</span>
        </div>
        <div className="max-w-xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">Manage your fleet with ease</h1>
          <p className="text-gray-600 text-lg">Bookings, drivers, vehicles, and finances — all in one fast, modern dashboard. Sign in to continue.</p>
        </div>
        <div className="text-gray-500 text-sm">© {new Date().getFullYear()} Car Fleet. All rights reserved.</div>
      </div>

      {/* Right card */}
      <div className="flex items-center justify-center p-6 sm:p-10 b">
        <div className="w-full max-w-md bg-orange-200 rounded-xl">
          <div className="backdrop-blur bg-white/80 border border-amber-100 shadow-xl rounded-2xl p-8">
            <div className="flex items-center justify-center gap-2 mb-2 lg:hidden">
              <Icon name="car" className="h-8 w-8 text-amber-600" />
              <span className="text-xl font-bold text-gray-900">Car Fleet</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 mb-6">Please sign in to your account</p>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <Input
                {...register('email')}
                type="email"
                label="Email address"
                error={errors.email?.message}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <button type="button" className="text-xs text-amber-600 hover:text-amber-700" onClick={()=>setShowPassword(s=>!s)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 select-none">
                  <input type="checkbox" className="h-4 w-4 text-amber-600 border-gray-300 rounded" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <a className="text-amber-600 hover:text-amber-700" href="#" onClick={(e)=>e.preventDefault()}>Forgot password?</a>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign in
              </Button>

              <div className="text-center text-sm text-gray-600">
                Don’t have an account?
                <span className="text-gray-400"> Contact your administrator.</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};