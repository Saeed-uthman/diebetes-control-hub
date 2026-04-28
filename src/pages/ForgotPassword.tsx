import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setIsSubmitted(true);
      } else {
        setError(response.error?.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Unable to connect to the server.');
    }

    setIsLoading(false);
  };

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
          {isSubmitted ? (
            <>
              <CardHeader className="space-y-1.5 pb-2 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold tracking-tight">Check your email</CardTitle>
                <CardDescription className="text-sm">
                  If an account exists for <strong className="text-foreground">{email}</strong>, we've sent password reset instructions.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-4 px-6 pb-6">
                <Button
                  variant="outline"
                  className="h-11 w-full border-border/50 bg-secondary/30 text-sm font-semibold transition-all duration-200 hover:bg-secondary/50 active:scale-[0.98]"
                  onClick={() => { setIsSubmitted(false); setEmail(''); }}
                >
                  Try another email
                </Button>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary/90 transition-colors duration-200 hover:text-primary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1.5 pb-2">
                <CardTitle className="text-center text-xl font-semibold tracking-tight">Forgot password?</CardTitle>
                <CardDescription className="text-center text-sm">
                  Enter your email and we'll send you instructions to reset your password.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 px-6 pt-2">
                  {error && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive animate-fade-in">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="leading-snug">{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      Email Address
                    </Label>
                    <div className="group relative">
                      <Mail
                        className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${
                          focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="h-11 border-border/50 bg-secondary/40 pl-11 text-sm placeholder:text-muted-foreground/50 transition-all duration-200 focus:border-primary/50 focus:bg-secondary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                        required
                        autoComplete="email"
                      />
                    </div>
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
                        Sending…
                      </span>
                    ) : (
                      'Send Reset Instructions'
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

export default ForgotPassword;
