import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Heart, Mail, Lock, User, AlertCircle, Shield, HeartPulse, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('non-infected');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const result = await register(email, password, name, role);

    if (result.success) {
      setIsRegistered(true);
    } else {
      setError(result.error || 'Registration failed');
    }

    setIsLoading(false);
  };

  const inputClass = "h-11 border-border/50 bg-secondary/40 pl-11 text-sm placeholder:text-muted-foreground/50 transition-all duration-200 focus:border-primary/50 focus:bg-secondary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]";

  const labelClass = (field: string) =>
    `text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
      focusedField === field ? 'text-primary' : 'text-muted-foreground'
    }`;

  const iconClass = (field: string) =>
    `absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${
      focusedField === field ? 'text-primary' : 'text-muted-foreground'
    }`;

  if (isRegistered) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[100px]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 w-full max-w-[420px] animate-fade-in space-y-8">
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Heart className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-md" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">DiabetesCare</h1>
          </div>

          <Card className="border-border/40 bg-card/60 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <CardHeader className="text-center space-y-1.5 pb-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold tracking-tight">Check Your Email</CardTitle>
              <CardDescription className="text-sm">
                We've sent a verification link to <strong className="text-foreground">{email}</strong>.
                Please click the link to verify your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or sign in to request a new link.
              </p>
            </CardContent>
            <CardFooter className="px-6 pb-6">
              <Button asChild className="h-11 w-full text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]">
                <Link to="/login">Go to Sign In</Link>
              </Button>
            </CardFooter>
          </Card>

          <p className="text-center text-xs text-muted-foreground/50">
            Secure, HIPAA-compliant healthcare platform
          </p>
        </div>
      </div>
    );
  }

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
            <p className="text-sm font-medium text-muted-foreground">Create your account to get started</p>
          </div>
        </div>

        {/* Register Card */}
        <Card className="border-border/40 bg-card/60 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <CardHeader className="space-y-1.5 pb-2">
            <CardTitle className="text-center text-xl font-semibold tracking-tight">Create Account</CardTitle>
            <CardDescription className="text-center text-sm">Fill in your information to register</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 px-6 pt-2">
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive animate-fade-in">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className={labelClass('name')}>Full Name</Label>
                <div className="group relative">
                  <User className={iconClass('name')} />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className={labelClass('email')}>Email Address</Label>
                <div className="group relative">
                  <Mail className={iconClass('email')} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={inputClass}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className={labelClass('password')}>Password</Label>
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
                    className={`${inputClass} pr-11`}
                    required
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
                    className={`${inputClass} pr-11`}
                    required
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

              {/* Role Selection */}
              <div className="space-y-3">
                <Label className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground`}>Diabetes Status</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                  className="space-y-2"
                >
                  <div className={`flex items-center space-x-3 rounded-lg border p-3 transition-all duration-200 cursor-pointer ${
                    role === 'non-infected'
                      ? 'border-primary/40 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]'
                      : 'border-border/40 bg-secondary/30 hover:bg-secondary/50'
                  }`}>
                    <RadioGroupItem value="non-infected" id="non-infected" />
                    <Label htmlFor="non-infected" className="flex flex-1 cursor-pointer items-center gap-3">
                      <Shield className="h-5 w-5 text-primary/70" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Prevention Focus</p>
                        <p className="text-xs text-muted-foreground">I don't have diabetes</p>
                      </div>
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-3 rounded-lg border p-3 transition-all duration-200 cursor-pointer ${
                    role === 'infected'
                      ? 'border-primary/40 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]'
                      : 'border-border/40 bg-secondary/30 hover:bg-secondary/50'
                  }`}>
                    <RadioGroupItem value="infected" id="infected" />
                    <Label htmlFor="infected" className="flex flex-1 cursor-pointer items-center gap-3">
                      <HeartPulse className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Patient Care</p>
                        <p className="text-xs text-muted-foreground">I have been diagnosed with diabetes</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {role === 'infected' && (
                  <p className="text-xs text-muted-foreground/70 animate-fade-in">
                    * Your status will be verified by an administrator for access to medication features.
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-5 px-6 pb-6 pt-1">
              <Button
                type="submit"
                className="h-11 w-full text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Creating account…
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40" />
                </div>
                <span className="relative bg-card/60 px-3 text-xs text-muted-foreground backdrop-blur-xl">
                  Already registered?
                </span>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="font-semibold text-primary/90 transition-colors duration-200 hover:text-primary">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground/50">
          Secure, HIPAA-compliant healthcare platform
        </p>
      </div>
    </div>
  );
};

export default Register;
