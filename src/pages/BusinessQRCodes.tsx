import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Plus, Trash2, Eye, EyeOff, Clock, Users, Shield, BarChart2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useBusinessQRCodes, LoopQRCode } from '@/hooks/useLoopQRCodes';
import { QRCodeDisplay } from '@/components/loop/QRCodeDisplay';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const QR_TYPES = [
  { value: 'visit', label: 'Visit Completed', description: 'Customer visited your business' },
  { value: 'job_complete', label: 'Job/Service Completed', description: 'Service or job was finished' },
  { value: 'referral', label: 'Referral', description: 'Customer referred someone' },
  { value: 'event', label: 'Event Attendance', description: 'Customer attended an event' },
  { value: 'campaign', label: 'Campaign/Promo', description: 'Time-limited promotional QR' },
];

export default function BusinessQRCodes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { qrCodes, isLoading, createQRCode, updateQRCode, deleteQRCode } = useBusinessQRCodes();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedQR, setSelectedQR] = useState<LoopQRCode | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    qr_type: 'visit' as LoopQRCode['qr_type'],
    points_value: 10,
    is_single_use: false,
    requires_staff_confirm: true,
    max_scans_per_user: 0,
    scan_cooldown_hours: 24,
    valid_from: '',
    valid_until: '',
    is_active: true,
  });

  // Scan analytics — queries loop_qr_scans for this business's QR codes
  const qrIds = qrCodes?.map(q => q.id) ?? [];
  const { data: scanStats, isLoading: statsLoading } = useQuery({
    queryKey: ['qr-scan-stats', qrIds],
    queryFn: async () => {
      if (!qrIds.length) return { today: 0, week: 0, month: 0, recent: [] as any[] };
      const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data } = await supabase
        .from('loop_qr_scans')
        .select('id, created_at, status, qr_code_id, loop_qr_codes(name, points_value)')
        .in('qr_code_id', qrIds)
        .gte('created_at', monthAgo)
        .order('created_at', { ascending: false });
      const scans = data ?? [];
      const todayStr = new Date().toDateString();
      const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
      return {
        today: scans.filter(s => new Date(s.created_at).toDateString() === todayStr).length,
        week: scans.filter(s => s.created_at >= weekAgo).length,
        month: scans.length,
        recent: scans.slice(0, 10),
      };
    },
    enabled: qrIds.length > 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      qr_type: 'visit',
      points_value: 10,
      is_single_use: false,
      requires_staff_confirm: true,
      max_scans_per_user: 0,
      scan_cooldown_hours: 24,
      valid_from: '',
      valid_until: '',
      is_active: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }

    try {
      await createQRCode.mutateAsync({
        ...formData,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
      });
      toast({ title: 'QR code created successfully' });
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Failed to create QR code', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (qr: LoopQRCode) => {
    try {
      await updateQRCode.mutateAsync({ id: qr.id, is_active: !qr.is_active });
      toast({ title: `QR code ${qr.is_active ? 'deactivated' : 'activated'}` });
    } catch (error) {
      toast({ title: 'Failed to update QR code', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return;
    
    try {
      await deleteQRCode.mutateAsync(id);
      toast({ title: 'QR code deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete QR code', variant: 'destructive' });
    }
  };

  const getQRTypeLabel = (type: string) => {
    return QR_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <>
      <Header title="QR Codes" />
      <PageContainer className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loop QR Codes</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage QR codes to issue points to customers
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create QR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create QR Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., Visit Reward, Job Complete"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>QR Type</Label>
                  <Select
                    value={formData.qr_type}
                    onValueChange={v => setFormData(f => ({ ...f, qr_type: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QR_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Points Value</Label>
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.points_value}
                    onChange={e => setFormData(f => ({ ...f, points_value: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Staff Confirmation</Label>
                    <p className="text-xs text-muted-foreground">Staff must approve each scan</p>
                  </div>
                  <Switch
                    checked={formData.requires_staff_confirm}
                    onCheckedChange={v => setFormData(f => ({ ...f, requires_staff_confirm: v }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Single Use</Label>
                    <p className="text-xs text-muted-foreground">Can only be scanned once per user</p>
                  </div>
                  <Switch
                    checked={formData.is_single_use}
                    onCheckedChange={v => setFormData(f => ({ ...f, is_single_use: v }))}
                  />
                </div>

                {!formData.is_single_use && (
                  <>
                    <div>
                      <Label>Max Scans Per User (0 = unlimited)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.max_scans_per_user}
                        onChange={e => setFormData(f => ({ ...f, max_scans_per_user: parseInt(e.target.value) || 0 }))}
                      />
                    </div>

                    <div>
                      <Label>Cooldown (hours between scans)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.scan_cooldown_hours}
                        onChange={e => setFormData(f => ({ ...f, scan_cooldown_hours: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valid From (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.valid_from}
                      onChange={e => setFormData(f => ({ ...f, valid_from: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Valid Until (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.valid_until}
                      onChange={e => setFormData(f => ({ ...f, valid_until: e.target.value }))}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleCreate}
                  disabled={createQRCode.isPending}
                >
                  {createQRCode.isPending ? 'Creating...' : 'Create QR Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-secondary animate-pulse rounded-xl" />
            ))}
          </div>
        ) : qrCodes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No QR Codes Yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create your first QR code to start issuing Loop Points
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First QR
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {qrCodes.map(qr => (
              <Card key={qr.id} className={!qr.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => setSelectedQR(qr)}
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                        <QrCode className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{qr.name}</h3>
                        {!qr.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                        <Badge variant="outline">{getQRTypeLabel(qr.qr_type)}</Badge>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-primary">{qr.points_value}</span> pts
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {qr.total_scans} scans
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {qr.requires_staff_confirm && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Shield className="h-3 w-3" />
                            Staff confirm
                          </span>
                        )}
                        {qr.is_single_use && (
                          <span className="text-muted-foreground">Single-use</span>
                        )}
                        {qr.scan_cooldown_hours > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {qr.scan_cooldown_hours}h cooldown
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(qr)}
                      >
                        {qr.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(qr.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Scan Analytics */}
        {(qrCodes.length > 0 || statsLoading) && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Scan Analytics</h2>
            </div>

            {/* Stat cards */}
            {statsLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map(i => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Today', value: scanStats?.today ?? 0 },
                  { label: 'This Week', value: scanStats?.week ?? 0 },
                  { label: 'This Month', value: scanStats?.month ?? 0 },
                ].map(stat => (
                  <div key={stat.label} className="card-elevated p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Recent scans list */}
            {!statsLoading && (scanStats?.recent.length ?? 0) > 0 && (
              <div className="card-elevated overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                    Recent Scans
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {scanStats!.recent.map((scan: any) => {
                    const status = scan.status ?? 'pending';
                    const isEarned = status === 'success';
                    const isPending = status === 'pending' || status === 'pending_confirmation';
                    const isRejected = status === 'rejected';
                    const qrName = (scan.loop_qr_codes as any)?.name ?? 'QR Code';
                    return (
                      <div key={scan.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{qrName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'text-xs font-semibold px-2.5 py-1 rounded-full',
                            isEarned && 'bg-success/10 text-success',
                            isPending && 'bg-lokal-amber/10 text-lokal-amber',
                            isRejected && 'bg-destructive/10 text-destructive',
                            !isEarned && !isPending && !isRejected && 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {isEarned ? 'Earned' : isPending ? 'Pending' : isRejected ? 'Rejected' : status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!statsLoading && (scanStats?.recent.length ?? 0) === 0 && (
              <div className="card-elevated p-6 text-center">
                <p className="text-sm text-muted-foreground">No scans yet this month</p>
              </div>
            )}
          </div>
        )}

        {/* QR Code Display Dialog */}
        <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{selectedQR?.name}</DialogTitle>
            </DialogHeader>
            {selectedQR && <QRCodeDisplay qrCodeId={selectedQR.id} pointsValue={selectedQR.points_value} />}
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
