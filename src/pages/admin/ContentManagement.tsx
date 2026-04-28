import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search, Plus, FileText, Video, BookOpen, MoreHorizontal, Edit, Trash2, Eye, Archive, Send, Shield, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { educationService, EducationContent, ContentType, ContentStatus } from '@/services/educationService';
import { useAuthenticatedData } from '@/hooks/useApiData';
import { useApiAction } from '@/hooks/useApiAction';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

const CATEGORIES = ['basics', 'nutrition', 'medication', 'exercise', 'monitoring', 'complications', 'lifestyle', 'prevention'];

const ContentManagement = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<EducationContent | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'article' as ContentType,
    category: '',
    target_audience: 'all' as 'all' | 'infected' | 'non-infected',
    status: 'draft' as ContentStatus,
  });

  const fetchContent = useCallback(() => educationService.getAll(), []);
  const { data: contentList, loading, error, refetch } = useAuthenticatedData(fetchContent, isAuthenticated);

  const { execute: createContent } = useApiAction(
    (data: typeof formData) => educationService.create(data),
    { successMessage: 'Content created', onSuccess: () => { setIsEditorOpen(false); refetch(); } }
  );
  const { execute: updateContent } = useApiAction(
    ({ id, data }: { id: string; data: Partial<typeof formData> }) => educationService.update(id, data),
    { successMessage: 'Content updated', onSuccess: () => { setIsEditorOpen(false); refetch(); } }
  );
  const { execute: deleteContent } = useApiAction(
    (id: string) => educationService.delete(id),
    { successMessage: 'Content deleted', onSuccess: refetch }
  );

  const filteredContent = useMemo(() => {
    if (!contentList) return [];
    return contentList.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [contentList, searchQuery, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: contentList?.length ?? 0,
    published: contentList?.filter((c) => c.status === 'published').length ?? 0,
    draft: contentList?.filter((c) => c.status === 'draft').length ?? 0,
    archived: contentList?.filter((c) => c.status === 'archived').length ?? 0,
  }), [contentList]);

  if (loading && !contentList) return <LoadingSpinner message="Loading content..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'published': return <Badge className="bg-primary/20 text-primary">Published</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'archived': return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>;
    }
  };

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'guide': return <BookOpen className="h-4 w-4" />;
    }
  };

  const openEditor = (content?: EducationContent) => {
    if (content) {
      setEditingContent(content);
      setFormData({
        title: content.title,
        description: content.description,
        content: content.content,
        type: content.type,
        category: content.category,
        target_audience: (content.target_audience as 'all' | 'infected' | 'non-infected') || 'all',
        status: content.status,
      });
    } else {
      setEditingContent(null);
      setFormData({ title: '', description: '', content: '', type: 'article', category: '', target_audience: 'all', status: 'draft' });
    }
    setIsEditorOpen(true);
  };

  const handleSave = (status: ContentStatus = 'draft') => {
    const payload = { ...formData, status };
    if (editingContent) {
      updateContent({ id: editingContent.id, data: payload });
    } else {
      createContent(payload);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Create and manage educational content</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => openEditor()} className="gap-2"><Plus className="h-4 w-4" />Create Content</Button>
          <div className="flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <span className="font-medium text-purple-400">Admin Only</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Content</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-primary">{stats.published}</p><p className="text-sm text-muted-foreground">Published</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-warning">{stats.draft}</p><p className="text-sm text-muted-foreground">Drafts</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-muted-foreground">{stats.archived}</p><p className="text-sm text-muted-foreground">Archived</p></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content ({filteredContent.length})</CardTitle>
          <CardDescription>All educational materials and resources</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                    </div>
                  </TableCell>
                  <TableCell><div className="flex items-center gap-2 capitalize">{getTypeIcon(item.type)}{item.type}</div></TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(item.updated_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditor(item)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        {item.status === 'draft' && (
                          <DropdownMenuItem onClick={() => updateContent({ id: item.id, data: { status: 'published' } })} className="text-primary"><Send className="mr-2 h-4 w-4" />Publish</DropdownMenuItem>
                        )}
                        {item.status !== 'archived' && (
                          <DropdownMenuItem onClick={() => updateContent({ id: item.id, data: { status: 'archived' } })}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteContent(item.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredContent.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No content found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Content Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContent ? 'Edit Content' : 'Create New Content'}</DialogTitle>
            <DialogDescription>{editingContent ? 'Update the content details below' : 'Fill in the details for your new content'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} placeholder="Enter content title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder="Brief description" rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v as ContentType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={formData.target_audience} onValueChange={(v) => setFormData((prev) => ({ ...prev, target_audience: v as typeof formData.target_audience }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="infected">Patients Only</SelectItem>
                  <SelectItem value="non-infected">Prevention Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body Content</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))} placeholder="Write your content here..." rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleSave('draft')}>Save as Draft</Button>
            <Button onClick={() => handleSave('published')}><Send className="mr-2 h-4 w-4" />Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;
