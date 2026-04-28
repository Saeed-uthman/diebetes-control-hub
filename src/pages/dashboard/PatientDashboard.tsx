import { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  HeartPulse, Pill, Activity, Clock, ChevronRight, Phone, Droplet, TrendingUp, Check, X, AlertCircle, BookOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedData } from '@/hooks/useApiData';
import { useApiAction } from '@/hooks/useApiAction';
import { medicationService } from '@/services/medicationService';
import { glucoseService } from '@/services/glucoseService';
import { educationService } from '@/services/educationService';
import { notificationService } from '@/services/notificationService';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchSchedule = useCallback(() => medicationService.getTodaySchedule(), []);
  const fetchMedStats = useCallback(() => medicationService.getStats(), []);
  const fetchGlucoseToday = useCallback(() => glucoseService.getToday(), []);
  const fetchEducation = useCallback(() => educationService.getAll(), []);
  const fetchUnread = useCallback(() => notificationService.getUnreadCount(), []);

  const { data: schedule, refetch: refetchSchedule } = useAuthenticatedData(fetchSchedule, isAuthenticated, [], { pollingInterval: 60000 });
  const { data: medStats } = useAuthenticatedData(fetchMedStats, isAuthenticated);
  const { data: glucoseReadings } = useAuthenticatedData(fetchGlucoseToday, isAuthenticated);
  const { data: education } = useAuthenticatedData(fetchEducation, isAuthenticated);

  const { execute: updateSchedule } = useApiAction(
    ({ id, status }: { id: string; status: 'taken' | 'skipped' }) =>
      medicationService.updateSchedule(id, { status, taken_at: status === 'taken' ? new Date().toISOString() : undefined }),
    { successMessage: 'Medication updated', onSuccess: refetchSchedule }
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'taken': return <Badge className="bg-primary/15 text-primary border-0"><Check className="mr-1 h-3 w-3" />Taken</Badge>;
      case 'pending': return <Badge className="bg-warning/15 text-warning border-0"><AlertCircle className="mr-1 h-3 w-3" />Due Now</Badge>;
      case 'missed': return <Badge variant="destructive" className="border-0"><X className="mr-1 h-3 w-3" />Missed</Badge>;
      default: return <Badge variant="secondary" className="border-0"><Clock className="mr-1 h-3 w-3" />Upcoming</Badge>;
    }
  };

  const getGlucoseColor = (value: number) => {
    if (value < 70) return 'text-destructive';
    if (value > 180) return 'text-destructive';
    if (value > 140) return 'text-warning';
    return 'text-primary';
  };

  const educationWithProgress = (education ?? []).filter((e) => e.user_progress).slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Portal</h1>
          <p className="text-sm text-muted-foreground">Manage your diabetes care</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 text-xs"><Phone className="h-3.5 w-3.5" />Contact Doctor</Button>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 ring-1 ring-primary/20">
            <HeartPulse className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Patient Care</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Medication Schedule */}
        <Card className="border-border/40 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Pill className="h-4 w-4 text-primary" />Today's Medication</CardTitle>
              <CardDescription className="text-xs">Your medication schedule for today</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/medication')}>View All <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {(schedule ?? []).map((med) => (
                <div key={med.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Pill className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{med.medication_name}</p>
                      <p className="text-xs text-muted-foreground">{med.dosage} • {med.scheduled_time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {getStatusBadge(med.status)}
                    {med.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 text-xs" onClick={() => updateSchedule({ id: med.id, status: 'taken' })}><Check className="mr-1 h-3 w-3" /> Take</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateSchedule({ id: med.id, status: 'skipped' })}><X className="mr-1 h-3 w-3" /> Skip</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!schedule || schedule.length === 0) && <p className="py-6 text-center text-sm text-muted-foreground">No medications scheduled today</p>}
            </div>
          </CardContent>
        </Card>

        {/* Adherence Streak */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-primary" />Adherence Streak</CardTitle>
            <CardDescription className="text-xs">Days of consistent medication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-2">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                <span className="text-3xl font-bold text-primary">{medStats?.current_streak ?? 0}</span>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">days in a row! Keep it up!</p>
              <div className="mt-4 grid w-full grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-lg font-bold text-primary">{medStats?.adherence_rate ?? 0}%</p>
                  <p className="text-[10px] font-medium text-muted-foreground">Adherence</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-lg font-bold text-primary">{medStats?.taken_today ?? 0}/{medStats?.today_doses ?? 0}</p>
                  <p className="text-[10px] font-medium text-muted-foreground">Today</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Glucose Readings */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Droplet className="h-4 w-4 text-primary" />Glucose Log</CardTitle>
              <CardDescription className="text-xs">Today's readings</CardDescription>
            </div>
            <Button size="sm" className="h-7 text-xs" onClick={() => navigate('/medication')}>Log New</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {(glucoseReadings ?? []).slice(0, 4).map((reading) => (
                <div key={reading.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                  <div>
                    <p className="text-xs font-medium capitalize text-foreground">{reading.reading_type.replace('_', ' ')}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className={`text-xl font-bold ${getGlucoseColor(reading.value)}`}>
                    {reading.value}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">mg/dL</span>
                  </div>
                </div>
              ))}
              {(!glucoseReadings || glucoseReadings.length === 0) && <p className="py-6 text-center text-sm text-muted-foreground">No readings today</p>}
              <div className="pt-1 text-center"><p className="text-[10px] text-muted-foreground">Target range: 70–140 mg/dL</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Education Progress */}
        <Card className="border-border/40 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" />Education</CardTitle>
              <CardDescription className="text-xs">Continue learning</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/education')}>View All <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {educationWithProgress.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border/30 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate text-sm font-medium">{item.title}</h4>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={item.user_progress?.progress ?? 0} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-medium text-muted-foreground">{item.user_progress?.progress ?? 0}%</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs">{item.user_progress?.completed ? 'Review' : 'Continue'}</Button>
                </div>
              ))}
              {educationWithProgress.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Start learning to see progress here</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;
