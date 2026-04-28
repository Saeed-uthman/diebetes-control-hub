import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingGrid, LoadingStats } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useApiData } from '@/hooks/useApiData';
import exerciseService, { Exercise, WeeklySummary } from '@/services/exerciseService';
import {
  Activity,
  Footprints,
  Flame,
  Clock,
  Dumbbell,
  Heart,
  Play,
  CheckCircle,
  Calendar,
  Zap,
  Timer
} from 'lucide-react';

// Default weekly goals
const defaultGoals = {
  steps: { current: 0, target: 70000 },
  workouts: { current: 0, target: 5 },
  activeMinutes: { current: 0, target: 150 },
  calories: { current: 0, target: 2500 },
};

// Workout schedule (could be moved to API later)
const workoutSchedule = [
  { day: 'Monday', workout: 'Cardio', completed: true },
  { day: 'Tuesday', workout: 'Strength', completed: true },
  { day: 'Wednesday', workout: 'Rest', completed: true },
  { day: 'Thursday', workout: 'HIIT', completed: true },
  { day: 'Friday', workout: 'Flexibility', completed: false },
  { day: 'Saturday', workout: 'Cardio', completed: false },
  { day: 'Sunday', workout: 'Rest', completed: false },
];

type ExerciseCategory = 'cardio' | 'strength' | 'flexibility' | 'balance' | 'hiit';

const ActivityPage = () => {
  const { data: exercises, loading: exLoading, error: exError, refetch } = useApiData<Exercise[]>(
    () => exerciseService.getAll(), [], { refetchOnFocus: true }
  );
  const { data: weeklySummary } = useApiData<WeeklySummary>(
    () => exerciseService.getWeeklySummary(), [], { refetchOnFocus: true }
  );
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');

  const loading = exLoading;
  const error = exError;

  const filteredExercises = selectedCategory === 'all' 
    ? (exercises || [])
    : (exercises || []).filter(e => e.category === selectedCategory);

  const goals = weeklySummary ? {
    steps: { current: weeklySummary.total_steps, target: 70000 },
    workouts: { current: weeklySummary.workouts_completed, target: 5 },
    activeMinutes: { current: weeklySummary.total_active_minutes, target: 150 },
    calories: { current: weeklySummary.total_calories_burned, target: 2500 },
  } : defaultGoals;

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      cardio: <Heart className="h-4 w-4" />,
      strength: <Dumbbell className="h-4 w-4" />,
      flexibility: <Activity className="h-4 w-4" />,
      balance: <Activity className="h-4 w-4" />,
      hiit: <Zap className="h-4 w-4" />,
    };
    return icons[category] || <Activity className="h-4 w-4" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500/20 text-green-500',
      intermediate: 'bg-yellow-500/20 text-yellow-500',
      advanced: 'bg-red-500/20 text-red-500',
    };
    return colors[difficulty] || 'bg-muted text-muted-foreground';
  };

  const ExerciseCard = ({ exercise }: { exercise: Exercise }) => (
    <Card className="group overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-video bg-muted">
        <img 
          src={exercise.image || '/placeholder.svg'} 
          alt={exercise.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Play className="h-6 w-6 text-primary-foreground" fill="currentColor" />
          </div>
        </div>
      </div>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1 capitalize">
            {getCategoryIcon(exercise.category)}
            {exercise.category}
          </Badge>
          <Badge className={getDifficultyColor(exercise.difficulty)}>
            {exercise.difficulty}
          </Badge>
        </div>
        <CardTitle className="line-clamp-1 text-lg">{exercise.name}</CardTitle>
        <CardDescription className="line-clamp-2">{exercise.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {exercise.duration} min
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-4 w-4" />
            {exercise.calories} cal
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {exercise.muscle_groups?.slice(0, 3).map((group, i) => (
            <Badge key={i} variant="outline" className="text-xs capitalize">
              {group}
            </Badge>
          ))}
        </div>

        <Button className="mt-4 w-full">Start Workout</Button>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            Activity & Exercise
          </h1>
          <p className="text-muted-foreground">Track your workouts and stay active</p>
        </div>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            Activity & Exercise
          </h1>
          <p className="text-muted-foreground">Track your workouts and stay active</p>
        </div>
      </div>

      {/* Stats Overview */}
      {loading ? (
        <LoadingStats count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Weekly Steps</CardTitle>
              <Footprints className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goals.steps.current.toLocaleString()}</div>
              <Progress value={(goals.steps.current / goals.steps.target) * 100} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {goals.steps.target.toLocaleString()} goal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Minutes</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goals.activeMinutes.current}</div>
              <Progress value={(goals.activeMinutes.current / goals.activeMinutes.target) * 100} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {goals.activeMinutes.target} min goal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Workouts</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goals.workouts.current}</div>
              <Progress value={(goals.workouts.current / goals.workouts.target) * 100} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {goals.workouts.target} workouts goal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Calories Burned</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goals.calories.current.toLocaleString()}</div>
              <Progress value={(goals.calories.current / goals.calories.target) * 100} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {goals.calories.target.toLocaleString()} cal goal
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weekly Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Schedule
            </CardTitle>
            <CardDescription>Your planned workouts for the week</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Edit Schedule
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-7">
            {workoutSchedule.map((day, i) => (
              <div 
                key={i}
                className={`rounded-lg border p-3 text-center transition-colors ${
                  day.completed 
                    ? 'border-primary/50 bg-primary/5' 
                    : 'border-border'
                }`}
              >
                <p className="text-xs font-medium text-muted-foreground">{day.day.slice(0, 3)}</p>
                <p className="mt-1 text-sm font-medium line-clamp-1">{day.workout}</p>
                {day.completed ? (
                  <CheckCircle className="mx-auto mt-2 h-5 w-5 text-primary" />
                ) : (
                  <div className="mx-auto mt-2 h-5 w-5 rounded-full border-2 border-muted" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exercise Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Exercise Library
          </h2>
        </div>

        {loading ? (
          <LoadingGrid count={8} />
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>
                All
              </TabsTrigger>
              <TabsTrigger value="cardio" onClick={() => setSelectedCategory('cardio')}>
                <Heart className="mr-1 h-4 w-4" /> Cardio
              </TabsTrigger>
              <TabsTrigger value="strength" onClick={() => setSelectedCategory('strength')}>
                <Dumbbell className="mr-1 h-4 w-4" /> Strength
              </TabsTrigger>
              <TabsTrigger value="flexibility" onClick={() => setSelectedCategory('flexibility')}>
                <Activity className="mr-1 h-4 w-4" /> Flexibility
              </TabsTrigger>
              <TabsTrigger value="hiit" onClick={() => setSelectedCategory('hiit')}>
                <Zap className="mr-1 h-4 w-4" /> HIIT
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredExercises.map(exercise => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </TabsContent>

            {['cardio', 'strength', 'flexibility', 'hiit'].map(category => (
              <TabsContent key={category} value={category}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {(exercises || [])
                    .filter(e => e.category === category)
                    .map(exercise => (
                      <ExerciseCard key={exercise.id} exercise={exercise} />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
