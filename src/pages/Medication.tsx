import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingStats, LoadingCard } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useApiData } from '@/hooks/useApiData';
import { useApiAction } from '@/hooks/useApiAction';
import medicationService, { Medication, MedicationScheduleItem, MedicationStats } from '@/services/medicationService';
import glucoseService, { GlucoseReading, GlucoseStats } from '@/services/glucoseService';
import notificationService from '@/services/notificationService';
import {
  Pill,
  Droplet,
  Clock,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Plus,
  ChevronRight,
  Bell,
  Activity,
  Phone,
  Mail
} from 'lucide-react';

const MedicationPage = () => {
  const { data: medications, loading: medsLoading } = useApiData<Medication[]>(
    () => medicationService.getAll(), [], { refetchOnFocus: true }
  );
  const { data: schedule, loading: schedLoading, refetch: refetchSchedule } = useApiData<MedicationScheduleItem[]>(
    () => medicationService.getTodaySchedule(), [], { refetchOnFocus: true, pollingInterval: 60000 }
  );
  const { data: glucoseReadings } = useApiData<GlucoseReading[]>(
    () => glucoseService.getAll(), [], { refetchOnFocus: true }
  );
  const { data: medicationStats } = useApiData<MedicationStats>(
    () => medicationService.getStats(), [], { refetchOnFocus: true }
  );
  const { data: glucoseStats } = useApiData<GlucoseStats>(
    () => glucoseService.getStats(), [], { refetchOnFocus: true }
  );

  const loading = medsLoading || schedLoading;
  const [error] = useState<string | null>(null);

  const { execute: handleTakeMedication } = useApiAction(
    (id: string) => medicationService.updateSchedule(id, { 
      status: 'taken', 
      taken_at: new Date().toTimeString().slice(0, 5) 
    }),
    { successMessage: 'Medication marked as taken', onSuccess: refetchSchedule }
  );

  const { execute: handleTakeLate } = useApiAction(
    (id: string) => medicationService.updateSchedule(id, { 
      status: 'taken', 
      taken_at: new Date().toTimeString().slice(0, 5),
      notes: 'Taken late'
    }),
    { successMessage: 'Medication marked as taken (late)', onSuccess: refetchSchedule }
  );

  const { execute: handleSkipMedication } = useApiAction(
    (id: string) => medicationService.updateSchedule(id, { status: 'skipped' }),
    { successMessage: 'Medication skipped', onSuccess: refetchSchedule }
  );

  const { execute: handleSendReminder, loading: reminderLoading } = useApiAction(
    (med: Medication) => notificationService.sendMedicationReminder({
      medication_name: med.name,
      dosage: med.dosage,
      scheduled_time: med.times?.join(', ') || 'As scheduled',
    }),
    { successMessage: 'Reminder email sent!' }
  );

  const getMedicationById = (id: string) => (medications || []).find(m => m.id === id);

  const getStatusBadge = (status: MedicationScheduleItem['status']) => {
    switch (status) {
      case 'taken':
        return <Badge className="bg-primary/20 text-primary"><Check className="mr-1 h-3 w-3" />Taken</Badge>;
      case 'skipped':
        return <Badge className="bg-muted text-muted-foreground"><X className="mr-1 h-3 w-3" />Skipped</Badge>;
      case 'missed':
        return <Badge className="bg-destructive/20 text-destructive"><AlertTriangle className="mr-1 h-3 w-3" />Missed</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning"><AlertCircle className="mr-1 h-3 w-3" />Due</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Upcoming</Badge>;
    }
  };

  const getGlucoseColor = (value: number) => {
    if (value < 70) return 'text-blue-500';
    if (value <= 140) return 'text-primary';
    if (value <= 180) return 'text-warning';
    return 'text-destructive';
  };

  const takenCount = (schedule || []).filter(s => s.status === 'taken').length;
  const missedCount = (schedule || []).filter(s => s.status === 'missed').length;
  const totalCount = (schedule || []).length;

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="h-7 w-7 text-primary" />
            Medication Management
          </h1>
          <p className="text-muted-foreground">Track your medications and glucose levels</p>
        </div>
        <ErrorState message={error} onRetry={refetchSchedule} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="h-7 w-7 text-primary" />
            Medication Management
          </h1>
          <p className="text-muted-foreground">Track your medications and glucose levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Phone className="h-4 w-4" />
            Contact Doctor
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Log Glucose
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      {loading ? (
        <LoadingStats count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{takenCount}/{totalCount}</div>
              <Progress value={totalCount > 0 ? (takenCount / totalCount) * 100 : 0} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">medications taken</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Adherence Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{medicationStats?.current_streak || 0} days</div>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${i < (medicationStats?.current_streak || 0) % 7 ? 'bg-primary' : 'bg-muted'}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Best: {medicationStats?.longest_streak || 0} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Weekly Adherence</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{medicationStats?.weekly_adherence || 0}%</div>
              <Progress value={medicationStats?.weekly_adherence || 0} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                Last month: {medicationStats?.monthly_adherence || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Glucose</CardTitle>
              <Droplet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {glucoseStats?.average || '--'}
                <span className="ml-1 text-sm font-normal text-muted-foreground">mg/dL</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Missed Medications Banner */}
      {!loading && missedCount > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-destructive">
                {missedCount} missed medication{missedCount > 1 ? 's' : ''} today
              </p>
              <p className="text-sm text-muted-foreground">
                You can still log them as taken late using the button below
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        {loading ? (
          <div className="lg:col-span-2"><LoadingCard /></div>
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>Your medication schedule for today</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(schedule || []).length > 0 ? (schedule || []).map((item) => {
                const med = getMedicationById(item.medication_id);
                if (!med) return null;
                
                return (
                  <div 
                    key={item.id}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      item.status === 'missed' 
                        ? 'border-destructive/50 bg-destructive/5' 
                        : 'border-border/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          item.status === 'missed' ? 'bg-destructive/20' : ''
                        }`}
                        style={item.status !== 'missed' ? { backgroundColor: `${med.color || '#10b981'}20` } : undefined}
                      >
                        <Pill className={`h-6 w-6 ${item.status === 'missed' ? 'text-destructive' : ''}`} 
                          style={item.status !== 'missed' ? { color: med.color || '#10b981' } : undefined}
                        />
                      </div>
                      <div>
                        <p className={`font-medium ${item.status === 'missed' ? 'text-destructive' : ''}`}>{med.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {med.dosage} • {item.scheduled_time}
                          {item.status === 'missed' && (
                            <span className="ml-2 text-destructive text-xs font-medium">• Missed</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(item.status)}
                      {item.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleTakeMedication(item.id)}
                          >
                            <Check className="mr-1 h-3 w-3" /> Take
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSkipMedication(item.id)}
                          >
                            <X className="mr-1 h-3 w-3" /> Skip
                          </Button>
                        </div>
                      )}
                      {item.status === 'missed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          onClick={() => handleTakeLate(item.id)}
                        >
                          <Clock className="mr-1 h-3 w-3" /> Take Late
                        </Button>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">No medications scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Reminders */}
        {loading ? (
          <LoadingCard />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Upcoming
              </CardTitle>
              <CardDescription>Next scheduled medications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(schedule || []).filter(s => s.status !== 'taken' && s.status !== 'skipped' && s.status !== 'missed').slice(0, 4).map((item) => {
                const med = getMedicationById(item.medication_id);
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <div 
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: med ? `${med.color || '#10b981'}20` : undefined }}
                    >
                      <Pill className="h-4 w-4" style={{ color: med?.color || '#10b981' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{med?.name}</p>
                      <p className="text-xs text-muted-foreground">{item.scheduled_time}</p>
                    </div>
                  </div>
                );
              })}
              {(schedule || []).filter(s => s.status !== 'taken' && s.status !== 'skipped' && s.status !== 'missed').length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No upcoming medications</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Glucose Readings */}
      {loading ? (
        <LoadingCard />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                Glucose Log
              </CardTitle>
              <CardDescription>Your recent blood glucose readings</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {(glucoseReadings || []).slice(0, 5).map((reading) => (
                <div key={reading.id} className="rounded-lg border border-border/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground capitalize">
                    {reading.reading_type?.replace('-', ' ') || 'Reading'}
                  </p>
                  <p className={`text-2xl font-bold ${getGlucoseColor(reading.value)}`}>
                    {reading.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(reading.timestamp).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              ))}
            </div>
            {(glucoseReadings || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Droplet className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">No glucose readings recorded</p>
              </div>
            )}
            {(glucoseReadings || []).length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Low (&lt;70)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Normal (70-140)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-warning" /> High (140-180)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-destructive" /> Very High (&gt;180)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Medications */}
      {loading ? (
        <LoadingCard />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Medications</CardTitle>
              <CardDescription>All your prescribed medications</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add Medication
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {(medications || []).map((med) => (
                <div 
                  key={med.id} 
                  className="rounded-lg border border-border/50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${med.color || '#10b981'}20` }}
                    >
                      <Pill className="h-5 w-5" style={{ color: med.color || '#10b981' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{med.name}</h4>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs"
                            disabled={reminderLoading}
                            onClick={() => handleSendReminder(med)}
                          >
                            <Mail className="h-3 w-3" /> Remind
                          </Button>
                          <Badge variant="outline">{med.dosage}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{med.frequency}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{med.instructions}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {med.times?.join(', ') || 'No schedule set'}
                      </div>
                      {med.refill_date && (
                        <p className="mt-1 text-xs text-warning">
                          Refill by: {new Date(med.refill_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(medications || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">No medications added yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MedicationPage;
