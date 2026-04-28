import { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Shield, Utensils, Footprints, BookOpen, TrendingUp, Clock, ChevronRight, Flame,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedData } from '@/hooks/useApiData';
import { exerciseService } from '@/services/exerciseService';
import { recipeService } from '@/services/recipeService';
import { educationService } from '@/services/educationService';
import { useNavigate } from 'react-router-dom';

const PreventionDashboard = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchWeekly = useCallback(() => exerciseService.getWeeklySummary(), []);
  const fetchRecipes = useCallback(() => recipeService.getAll({ diabetes_friendly: true }), []);
  const fetchEducation = useCallback(() => educationService.getAll(), []);

  const { data: weeklySummary } = useAuthenticatedData(fetchWeekly, isAuthenticated);
  const { data: recipes } = useAuthenticatedData(fetchRecipes, isAuthenticated);
  const { data: education } = useAuthenticatedData(fetchEducation, isAuthenticated);

  const todayRecipe = recipes?.[0];
  const educationItems = (education ?? []).filter((e) => e.user_progress).slice(0, 3);

  const stepsProgress = weeklySummary?.goal_progress?.steps;
  const workoutsProgress = weeklySummary?.goal_progress?.workouts;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prevention Portal</h1>
          <p className="text-sm text-muted-foreground">Your diabetes prevention journey</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 ring-1 ring-primary/20">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Prevention Focus</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Weekly Activity Summary */}
        <Card className="border-border/40 col-span-full lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-primary" />Weekly Summary</CardTitle>
            <CardDescription className="text-xs">Your activity this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <svg className="h-24 w-24 -rotate-90 transform">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/50" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${((stepsProgress?.percentage ?? 0) / 100) * 251} 251`} className="text-primary transition-all duration-700" />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xl font-bold">{stepsProgress?.percentage ?? 0}%</span>
                    <span className="block text-[10px] text-muted-foreground">Steps Goal</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {[
                  { value: (weeklySummary?.total_steps ?? 0).toLocaleString(), label: 'Steps' },
                  { value: weeklySummary?.workouts_completed ?? 0, label: 'Workouts' },
                  { value: weeklySummary?.total_active_minutes ?? 0, label: 'Active Min' },
                  { value: (weeklySummary?.total_calories_burned ?? 0).toLocaleString(), label: 'Cal Burned' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-muted/30 p-2.5 text-center">
                    <p className="text-base font-bold text-primary">{stat.value}</p>
                    <p className="text-[10px] font-medium text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Recipe */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Utensils className="h-4 w-4 text-primary" />Today's Recipe</CardTitle>
            <CardDescription className="text-xs">Recommended for you</CardDescription>
          </CardHeader>
          <CardContent>
            {todayRecipe ? (
              <div className="space-y-3">
                <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                  <img src={todayRecipe.image || '/placeholder.svg'} alt={todayRecipe.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{todayRecipe.name}</h3>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{todayRecipe.prep_time + todayRecipe.cook_time} min</span>
                    <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" />{todayRecipe.calories} cal</span>
                  </div>
                </div>
                <Button className="w-full text-xs" size="sm" onClick={() => navigate('/diet')}>View Recipe</Button>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading recipes...</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Activity Progress */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Footprints className="h-4 w-4 text-primary" />Activity Goals</CardTitle>
            <CardDescription className="text-xs">This week's progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Steps', icon: <Footprints className="h-3.5 w-3.5 text-blue-400" />, current: (stepsProgress?.current ?? 0).toLocaleString(), goal: (stepsProgress?.goal ?? 70000).toLocaleString(), pct: stepsProgress?.percentage ?? 0 },
              { label: 'Calories Burned', icon: <Flame className="h-3.5 w-3.5 text-orange-400" />, current: (weeklySummary?.total_calories_burned ?? 0).toLocaleString(), goal: null, pct: Math.min(100, ((weeklySummary?.total_calories_burned ?? 0) / 2000) * 100) },
              { label: 'Workouts', icon: <TrendingUp className="h-3.5 w-3.5 text-primary" />, current: workoutsProgress?.current ?? 0, goal: workoutsProgress?.goal ?? 5, pct: workoutsProgress?.percentage ?? 0 },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">{item.icon}{item.label}</span>
                  <span className="text-muted-foreground tabular-nums">{item.current}{item.goal ? ` / ${item.goal}` : ''}</span>
                </div>
                <Progress value={item.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Knowledge Base */}
        <Card className="border-border/40 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" />Knowledge Base</CardTitle>
              <CardDescription className="text-xs">Continue your learning journey</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/education')}>View All <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {educationItems.length > 0 ? educationItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border/30 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium">{item.title}</h4>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={item.user_progress?.progress ?? 0} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-medium text-muted-foreground">{item.user_progress?.progress ?? 0}%</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" onClick={() => navigate('/education')}>{item.user_progress?.completed ? 'Review' : 'Continue'}</Button>
                </div>
              )) : (
                <div className="space-y-2.5">
                  {(education ?? []).slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border/30 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium">{item.title}</h4>
                        <p className="text-xs capitalize text-muted-foreground">{item.category} • {item.type}</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" onClick={() => navigate('/education')}>Start</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Breakdown */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daily Breakdown</CardTitle>
            <CardDescription className="text-xs">This week's daily activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {(weeklySummary?.daily_breakdown ?? []).slice(0, 7).map((day) => (
                <div key={day.date} className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2 text-xs">
                  <span className="font-medium text-muted-foreground">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <div className="flex items-center gap-4 tabular-nums">
                    <span>{day.steps.toLocaleString()} steps</span>
                    <span className="text-muted-foreground">{day.calories} cal</span>
                  </div>
                </div>
              ))}
              {(!weeklySummary?.daily_breakdown || weeklySummary.daily_breakdown.length === 0) && (
                <p className="py-6 text-center text-sm text-muted-foreground">No activity data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreventionDashboard;
