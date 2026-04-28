import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, BookOpen, Utensils, Activity, Pill, Bell, Settings,
  Users, BarChart3, FileText, Search, Heart, LogIn, UserPlus, Shield,
  HeartPulse,
} from "lucide-react";

interface CommandEntry {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  keywords?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, canAccessMedication, canAccessAdmin } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = useCallback(
    (to: string) => {
      setOpen(false);
      navigate(to);
    },
    [navigate],
  );

  const publicPages: CommandEntry[] = [
    { label: "Home", icon: Heart, to: "/", keywords: "landing" },
    { label: "Sign In", icon: LogIn, to: "/login", keywords: "login" },
    { label: "Create Account", icon: UserPlus, to: "/register", keywords: "signup register" },
  ];

  const mainPages: CommandEntry[] = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Education", icon: BookOpen, to: "/education", keywords: "learn articles" },
    { label: "Diet & Recipes", icon: Utensils, to: "/diet", keywords: "food nutrition meals" },
    { label: "Activity & Exercise", icon: Activity, to: "/activity", keywords: "fitness workout" },
    { label: "Notifications", icon: Bell, to: "/notifications", keywords: "alerts" },
    { label: "Settings", icon: Settings, to: "/settings", keywords: "profile preferences" },
  ];

  const patientPages: CommandEntry[] = canAccessMedication
    ? [{ label: "Medication", icon: Pill, to: "/medication", keywords: "drugs prescriptions reminders" }]
    : [];

  const adminPages: CommandEntry[] = canAccessAdmin
    ? [
        { label: "User Management", icon: Users, to: "/admin/users", keywords: "accounts roles" },
        { label: "Content Management", icon: FileText, to: "/admin/content", keywords: "articles education" },
        { label: "Analytics", icon: BarChart3, to: "/admin/analytics", keywords: "stats reports" },
      ]
    : [];

  const quickActions: CommandEntry[] = [
    { label: "Patient Dashboard", icon: HeartPulse, to: "/dashboard", keywords: "glucose health" },
    { label: "Prevention Guide", icon: Shield, to: "/education", keywords: "prevent risk" },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, content, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {!isAuthenticated && (
          <CommandGroup heading="Pages">
            {publicPages.map((p) => (
              <CommandItem key={p.to} onSelect={() => go(p.to)} keywords={[p.keywords ?? ""]}>
                <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {isAuthenticated && (
          <>
            <CommandGroup heading="Navigation">
              {mainPages.map((p) => (
                <CommandItem key={p.to} onSelect={() => go(p.to)} keywords={[p.keywords ?? ""]}>
                  <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {p.label}
                </CommandItem>
              ))}
              {patientPages.map((p) => (
                <CommandItem key={p.to} onSelect={() => go(p.to)} keywords={[p.keywords ?? ""]}>
                  <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {p.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {adminPages.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Admin">
                  {adminPages.map((p) => (
                    <CommandItem key={p.to} onSelect={() => go(p.to)} keywords={[p.keywords ?? ""]}>
                      <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {p.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              {quickActions.map((p) => (
                <CommandItem key={p.label} onSelect={() => go(p.to)} keywords={[p.keywords ?? ""]}>
                  <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
