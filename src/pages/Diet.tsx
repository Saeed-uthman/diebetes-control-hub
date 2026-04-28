import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingGrid, LoadingStats } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useApiData } from '@/hooks/useApiData';
import recipeService, { Recipe } from '@/services/recipeService';
import {
  Utensils,
  Search,
  Clock,
  Flame,
  Users,
  Star,
  ChevronRight,
  Lightbulb,
  Apple,
  Coffee,
  Sun,
  Moon,
  Cookie
} from 'lucide-react';

// Weekly nutrition data (could be moved to API later)
const weeklyNutrition = {
  calories: { current: 12500, goal: 14000 },
  protein: { current: 420, goal: 500 },
  carbs: { current: 1400, goal: 1750 },
  fat: { current: 380, goal: 450 },
  fiber: { current: 168, goal: 210 },
};

const nutritionTips = [
  { title: 'Low Glycemic Foods', content: 'Choose foods with a low glycemic index to help maintain stable blood sugar levels throughout the day.' },
];

type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

const Diet = () => {
  const { data: recipes, loading, error, refetch } = useApiData<Recipe[]>(
    () => recipeService.getAll(), [], { refetchOnFocus: true }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'all'>('all');

  const filteredRecipes = useMemo(() => {
    return (recipes || []).filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchQuery, selectedCategory]);

  const featuredRecipes = useMemo(() => {
    return (recipes || []).filter(r => r.diabetes_friendly).slice(0, 3);
  }, [recipes]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      breakfast: <Coffee className="h-4 w-4" />,
      lunch: <Sun className="h-4 w-4" />,
      dinner: <Moon className="h-4 w-4" />,
      snack: <Cookie className="h-4 w-4" />,
      dessert: <Cookie className="h-4 w-4" />,
    };
    return icons[category] || <Utensils className="h-4 w-4" />;
  };

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <Card className="group overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-video bg-muted">
        <img 
          src={recipe.image || '/placeholder.svg'} 
          alt={recipe.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {recipe.diabetes_friendly && (
          <Badge className="absolute right-2 top-2 bg-primary/90">
            Diabetes Friendly
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 capitalize">
            {getCategoryIcon(recipe.category)}
            {recipe.category}
          </Badge>
        </div>
        <CardTitle className="line-clamp-1 text-lg">{recipe.name}</CardTitle>
        <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {recipe.prep_time + recipe.cook_time} min
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-4 w-4" />
            {recipe.calories} cal
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {recipe.servings}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded bg-muted p-1.5">
            <p className="font-semibold text-foreground">{recipe.macros.carbs}g</p>
            <p className="text-muted-foreground">Carbs</p>
          </div>
          <div className="rounded bg-muted p-1.5">
            <p className="font-semibold text-foreground">{recipe.macros.protein}g</p>
            <p className="text-muted-foreground">Protein</p>
          </div>
          <div className="rounded bg-muted p-1.5">
            <p className="font-semibold text-foreground">{recipe.macros.fat}g</p>
            <p className="text-muted-foreground">Fat</p>
          </div>
          <div className="rounded bg-muted p-1.5">
            <p className="font-semibold text-foreground">{recipe.macros.fiber}g</p>
            <p className="text-muted-foreground">Fiber</p>
          </div>
        </div>

        <Button className="mt-4 w-full">View Recipe</Button>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Utensils className="h-7 w-7 text-primary" />
            Diet & Nutrition
          </h1>
          <p className="text-muted-foreground">Healthy recipes and nutrition tracking</p>
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
            <Utensils className="h-7 w-7 text-primary" />
            Diet & Nutrition
          </h1>
          <p className="text-muted-foreground">Healthy recipes and nutrition tracking</p>
        </div>
      </div>

      {/* Weekly Nutrition Overview */}
      {loading ? (
        <LoadingStats count={3} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Nutrition Summary</CardTitle>
              <CardDescription>Track your macro intake this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(weeklyNutrition).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{key}</span>
                      <span className="text-muted-foreground">
                        {value.current.toLocaleString()} / {value.goal.toLocaleString()}
                        {key === 'calories' ? '' : 'g'}
                      </span>
                    </div>
                    <Progress value={(value.current / value.goal) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Tip */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-primary" />
                Today's Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-medium">{nutritionTips[0].title}</h4>
              <p className="mt-2 text-sm text-muted-foreground">{nutritionTips[0].content}</p>
              <Button variant="link" className="mt-2 h-auto p-0 text-primary">
                More tips <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as RecipeCategory | 'all')}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Meals</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snacks</option>
          <option value="dessert">Desserts</option>
        </select>
      </div>

      {loading ? (
        <LoadingGrid count={6} />
      ) : (
        <>
          {/* Featured Recipes */}
          {selectedCategory === 'all' && !searchQuery && featuredRecipes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5 text-warning" />
                  Featured Recipes
                </h2>
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredRecipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          )}

          {/* All Recipes */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" className="gap-1">
                <Apple className="h-4 w-4" />
                All ({filteredRecipes.length})
              </TabsTrigger>
              <TabsTrigger value="breakfast" className="gap-1">
                <Coffee className="h-4 w-4" />
                Breakfast
              </TabsTrigger>
              <TabsTrigger value="lunch" className="gap-1">
                <Sun className="h-4 w-4" />
                Lunch
              </TabsTrigger>
              <TabsTrigger value="dinner" className="gap-1">
                <Moon className="h-4 w-4" />
                Dinner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {filteredRecipes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredRecipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Utensils className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No recipes found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              )}
            </TabsContent>

            {['breakfast', 'lunch', 'dinner'].map(category => (
              <TabsContent key={category} value={category}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredRecipes
                    .filter(r => r.category === category)
                    .map(recipe => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Diet;
