import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { authService } from '@/services/authService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(token, password);
      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.error?.message || 'Failed to reset password. The link may have expired.');
      }
    } catch {
      setError('Unable to connect to the server.');
    }

    setIsLoading(false);
  };

  const inputClass = "h-11 border-border/50 bg-secondary/40 pl-11 pr-11 text-sm placeholder:text-muted-foreground/50 transition-all duration-200 focus:border-primary/50 focus:bg-secondary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]";

  const labelClass = (field: string) =>
    `text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
      focusedField === field ? 'text-primary' : 'text-muted-foreground'
    }`;

  const iconClass = (field: string) =>
    `absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${
      focusedField === field ? 'text-primary' : 'text-muted-foreground'
    }`;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-[80px]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] animate-fade-in space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 transition-transform duration-300 hover:scale-105">
            <Heart className="h-8 w-8 text-primary" />
            <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-md" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">DiabetesCare</h1>
            <p className="text-sm font-medium text-muted-foreground">Prevention & Control Education Platform</p>
          </div>
        </div>

        {/* Card */}
        <Card className="border-border/40 bg-card/60 shadow-2xl shadow-black/20 backdrop-blur-xl">
          {isSuccess ? (
            <>
              <CardHeader className="space-y-1.5 pb-2 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold tracking-tight">Password reset!</CardTitle>
                <CardDescription className="text-sm">
                  Your password has been updated successfully. You can now sign in with your new password.
                </CardDescription>
              </CardHeader>
              <CardFooter className="px-6 pb-6">
                <Button
                  className="h-11 w-full text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                  onClick={() => navigate('/login')}
                >
                  Go to Sign In
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1.5 pb-2">
                <CardTitle className="text-center text-xl font-semibold tracking-tight">Set new password</CardTitle>
                <CardDescription className="text-center text-sm">Enter your new password below.</CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 px-6 pt-2">
                  {error && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive animate-fade-in">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="leading-snug">{error}</span>
                    </div>
                  )}

                  {!token && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="leading-snug">No reset token found. Please use the link from your email.</span>
                    </div>
                  )}

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className={labelClass('password')}>New Password</Label>
                    <div className="group relative">
                      <Lock className={iconClass('password')} />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={inputClass}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 hover:text-foreground focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className={labelClass('confirmPassword')}>Confirm Password</Label>
                    <div className="group relative">
                      <Lock className={iconClass('confirmPassword')} />
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        className={inputClass}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 hover:text-foreground focus:outline-none"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-5 px-6 pb-6 pt-1">
                  <Button
                    type="submit"
                    className="h-11 w-full text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                    disabled={isLoading || !token}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                        Resetting…
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                  </Link>
                </CardFooter>
              </form>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground/50">
          Secure, HIPAA-compliant healthcare platform
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
