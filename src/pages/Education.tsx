import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingGrid } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useApiData } from '@/hooks/useApiData';
import educationService, { EducationContent, ContentType } from '@/services/educationService';
import {
  BookOpen,
  Video,
  FileText,
  Search,
  Clock,
  User,
  Play,
  CheckCircle,
  Star,
  Filter,
  Shield,
  Heart,
  Utensils,
  Activity,
  Brain
} from 'lucide-react';

type ContentCategory = 'prevention' | 'management' | 'nutrition' | 'exercise' | 'mental-health';

const Education = () => {
  const { user } = useAuth();
  const { data: content, loading, error, refetch } = useApiData<EducationContent[]>(
    () => educationService.getAll(), [], { refetchOnFocus: true }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');

  // Apply search and filters
  const filteredContent = useMemo(() => {
    return (content || []).filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesType = selectedType === 'all' || item.type === selectedType;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [content, searchQuery, selectedCategory, selectedType]);

  // Get featured content
  const featuredContent = useMemo(() => {
    return (content || []).filter(c => c.featured).slice(0, 3);
  }, [content]);

  const completedCount = (content || []).filter(c => c.user_progress?.completed).length;
  const inProgressCount = (content || []).filter(c => c.user_progress && !c.user_progress.completed && c.user_progress.progress > 0).length;

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'prevention': <Shield className="h-4 w-4" />,
      'management': <Heart className="h-4 w-4" />,
      'nutrition': <Utensils className="h-4 w-4" />,
      'exercise': <Activity className="h-4 w-4" />,
      'mental-health': <Brain className="h-4 w-4" />,
    };
    return icons[category] || <BookOpen className="h-4 w-4" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'prevention': 'Prevention',
      'management': 'Management',
      'nutrition': 'Nutrition',
      'exercise': 'Exercise',
      'mental-health': 'Mental Health',
    };
    return labels[category] || category;
  };

  const getTypeIcon = (type: ContentType) => {
    const icons: Record<ContentType, React.ReactNode> = {
      'article': <FileText className="h-4 w-4" />,
      'video': <Video className="h-4 w-4" />,
      'guide': <BookOpen className="h-4 w-4" />,
    };
    return icons[type];
  };

  const getTypeLabel = (type: ContentType) => {
    const labels: Record<ContentType, string> = {
      'article': 'Article',
      'video': 'Video',
      'guide': 'Guide',
    };
    return labels[type];
  };

  const ContentCard = ({ item }: { item: EducationContent }) => {
    const progress = item.user_progress;
    
    return (
      <Card className="group overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <div className="relative aspect-video bg-muted">
          <img 
            src={item.thumbnail || '/placeholder.svg'} 
            alt={item.title}
            className="h-full w-full object-cover"
          />
          {item.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
                <Play className="h-6 w-6 text-primary-foreground" fill="currentColor" />
              </div>
            </div>
          )}
          {item.featured && (
            <Badge className="absolute left-2 top-2 bg-warning text-warning-foreground">
              <Star className="mr-1 h-3 w-3" /> Featured
            </Badge>
          )}
          {progress?.completed && (
            <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <CheckCircle className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {getTypeIcon(item.type)}
              {getTypeLabel(item.type)}
            </Badge>
            <Badge variant="outline" className="gap-1">
              {getCategoryIcon(item.category)}
              {getCategoryLabel(item.category)}
            </Badge>
          </div>
          <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
          <CardDescription className="line-clamp-2">{item.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {item.duration}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {item.author?.split(' ').slice(-1)[0]}
            </span>
          </div>
          
          {progress && !progress.completed && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-primary">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-1.5" />
            </div>
          )}

          <Button className="mt-4 w-full" variant={progress?.completed ? 'outline' : 'default'}>
            {progress?.completed ? 'Review' : progress ? 'Continue' : 'Start Learning'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Education & Library
          </h1>
          <p className="text-muted-foreground">Learn about diabetes prevention and management</p>
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
            <BookOpen className="h-7 w-7 text-primary" />
            Education & Library
          </h1>
          <p className="text-muted-foreground">Learn about diabetes prevention and management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 rounded-lg bg-muted p-1 text-sm">
            <div className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-primary">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{completedCount}</span>
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{inProgressCount}</span>
              <span>In Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles, videos, guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ContentCategory | 'all')}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Categories</option>
            <option value="prevention">Prevention</option>
            <option value="management">Management</option>
            <option value="nutrition">Nutrition</option>
            <option value="exercise">Exercise</option>
            <option value="mental-health">Mental Health</option>
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ContentType | 'all')}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="article">Articles</option>
            <option value="video">Videos</option>
            <option value="guide">Guides</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingGrid count={6} />
      ) : (
        <>
          {/* Featured Section */}
          {selectedCategory === 'all' && selectedType === 'all' && !searchQuery && featuredContent.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Featured Content
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredContent.map(item => (
                  <ContentCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* All Content */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" className="gap-1">
                <Filter className="h-4 w-4" />
                All ({filteredContent.length})
              </TabsTrigger>
              <TabsTrigger value="articles" className="gap-1">
                <FileText className="h-4 w-4" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-1">
                <Video className="h-4 w-4" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="guides" className="gap-1">
                <BookOpen className="h-4 w-4" />
                Guides
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {filteredContent.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredContent.map(item => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No content found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="articles">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredContent.filter(c => c.type === 'article').map(item => (
                  <ContentCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredContent.filter(c => c.type === 'video').map(item => (
                  <ContentCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="guides">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredContent.filter(c => c.type === 'guide').map(item => (
                  <ContentCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Education;
