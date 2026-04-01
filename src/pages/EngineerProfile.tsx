import { useParams, useNavigate } from 'react-router-dom';
import { useEngineerProfile } from '@/hooks/useEngineerProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building, MapPin, Clock, Calendar, GraduationCap, Wrench, Cpu, Award, Briefcase } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(d) ? format(d, 'dd.MM.yyyy') : iso;
}

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Aktivní', variant: 'default' },
  contractor: { label: 'Kontraktor', variant: 'secondary' },
  inactive: { label: 'Neaktivní', variant: 'destructive' },
  on_leave: { label: 'Na dovolené', variant: 'outline' },
};

export default function EngineerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEngineerProfile(id);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Zpět</Button>
        <p className="mt-4 text-destructive">Konstruktér nenalezen.</p>
      </div>
    );
  }

  const { engineer: eng, software, pdmPlm, specializations, trainings, planning } = data;
  const st = statusMap[eng.status] || statusMap.active;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-5xl">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />Zpět
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {getInitials(eng.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground">{eng.display_name}</h1>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant={st.variant}>{st.label}</Badge>
                {eng.company && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building className="h-3.5 w-3.5" />{eng.company}
                  </span>
                )}
                {eng.location && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />{eng.location}
                  </span>
                )}
              </div>
            </div>
            {eng.status === 'contractor' && eng.hourly_rate && (
              <div className="text-right">
                <span className="text-xl font-semibold text-foreground">{eng.hourly_rate} {eng.currency || 'EUR'}</span>
                <span className="text-sm text-muted-foreground block">/hod</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4" />Základní údaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="FTE" value={`${eng.fte_percent}%`} />
            <Row label="Email" value={eng.email || '—'} />
            <Row label="Slug" value={eng.slug} mono />
            {eng.start_date && <Row label="Nástup" value={fmtDate(eng.start_date)} />}
            {eng.end_date && <Row label="Odchod" value={fmtDate(eng.end_date)} />}
          </CardContent>
        </Card>

        {/* Software */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" />Software</CardTitle>
          </CardHeader>
          <CardContent>
            {software.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {software.map(s => <Badge key={s.name} variant="secondary">{s.name} <span className="ml-1 opacity-70">⭐{s.level}</span></Badge>)}
              </div>
            ) : <p className="text-sm text-muted-foreground">Žádný software</p>}
          </CardContent>
        </Card>

        {/* PDM/PLM */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4" />PDM / PLM</CardTitle>
          </CardHeader>
          <CardContent>
            {pdmPlm.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pdmPlm.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
              </div>
            ) : <p className="text-sm text-muted-foreground">Žádné PDM/PLM</p>}
          </CardContent>
        </Card>

        {/* Specializations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" />Specializace</CardTitle>
          </CardHeader>
          <CardContent>
            {specializations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oblast</TableHead>
                    <TableHead>Specializace</TableHead>
                    <TableHead>Úroveň</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specializations.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s.oblast}</TableCell>
                      <TableCell>{s.specialization}</TableCell>
                      <TableCell><Badge variant="outline">{s.level}</Badge></TableCell>
                      <TableCell>{fmtDate(s.granted_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground">Žádné specializace</p>}
          </CardContent>
        </Card>
      </div>

      {/* Training - full width */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" />Trénink / Školení</CardTitle>
        </CardHeader>
        <CardContent>
          {trainings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Název</TableHead>
                    <TableHead>Od</TableHead>
                    <TableHead>Do</TableHead>
                    <TableHead>Firma / Školitel</TableHead>
                    <TableHead>Zkouška</TableHead>
                    <TableHead>Poznámka</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{fmtDate(t.date_from)}</TableCell>
                      <TableCell>{fmtDate(t.date_to)}</TableCell>
                      <TableCell>{t.company_trainer || '—'}</TableCell>
                      <TableCell>{t.has_exam ? '✅' : '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{t.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : <p className="text-sm text-muted-foreground">Žádná školení</p>}
        </CardContent>
      </Card>

      {/* Planning */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />Aktuální plánování</CardTitle>
        </CardHeader>
        <CardContent>
          {planning.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CW</TableHead>
                    <TableHead>Projekt</TableHead>
                    <TableHead>MH/týden</TableHead>
                    <TableHead>Tentativní</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planning.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{p.cw}</TableCell>
                      <TableCell>{p.projekt}</TableCell>
                      <TableCell>{p.mh_tyden ?? '—'}</TableCell>
                      <TableCell>{p.is_tentative ? '⚠️' : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : <p className="text-sm text-muted-foreground">Žádné aktuální přiřazení</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  );
}
