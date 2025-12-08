import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Search, 
  RefreshCw, 
  Eye, 
  Mail, 
  Clock, 
  Building2, 
  User,
  FileText,
  ChevronDown,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

interface ServiceApplication {
  id: string;
  service_type: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-yellow-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-500' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-500' },
];

const serviceTypeLabels: Record<string, string> = {
  'influencer-sites': 'Premium Influencer Sites',
  'ai-agents': 'Custom AI Agents',
  'automation': 'Process Automation',
};

export const ApplicationsManagement = () => {
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ServiceApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<ServiceApplication | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((item) => ({
        ...item,
        custom_fields: (item.custom_fields as Record<string, unknown>) || {},
      }));
      setApplications(mapped);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    let filtered = [...applications];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.full_name.toLowerCase().includes(query) ||
          app.email.toLowerCase().includes(query) ||
          (app.phone && app.phone.includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Service type filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter((app) => app.service_type === serviceFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchQuery, statusFilter, serviceFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: newStatus, updated_at: new Date().toISOString() } : app
        )
      );
      
      if (selectedApplication?.id === id) {
        setSelectedApplication((prev) => prev ? { ...prev, status: newStatus } : null);
      }

      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    return (
      <Badge className={`${statusOption?.color || 'bg-gray-500'} text-white`}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const formatCustomField = (key: string, value: unknown): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'string') {
      return value.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return String(value);
  };

  const viewDetails = (app: ServiceApplication) => {
    setSelectedApplication(app);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Service Applications</h2>
          <p className="text-muted-foreground text-sm">
            Manage incoming service requests
          </p>
        </div>
        <Button onClick={fetchApplications} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Service Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="influencer-sites">Influencer Sites</SelectItem>
            <SelectItem value="ai-agents">AI Agents</SelectItem>
            <SelectItem value="automation">Automation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusOptions.map((status) => {
          const count = applications.filter((a) => a.status === status.value).length;
          return (
            <motion.div
              key={status.value}
              className="bg-muted/30 rounded-xl p-4 border border-border/50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                <span className="text-sm text-muted-foreground">{status.label}</span>
              </div>
              <p className="text-2xl font-bold">{count}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Applications List */}
      <ScrollArea className="h-[400px] rounded-xl border border-border/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="w-12 h-12 mb-2 opacity-50" />
            <p>No applications found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredApplications.map((app) => (
              <motion.div
                key={app.id}
                className="p-4 hover:bg-muted/30 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{app.full_name}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {app.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {serviceTypeLabels[app.service_type] || app.service_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(app.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={app.status}
                      onValueChange={(value) => updateStatus(app.id, value)}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewDetails(app)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`mailto:${app.email}`, '_blank')}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {selectedApplication.full_name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  {serviceTypeLabels[selectedApplication.service_type] || selectedApplication.service_type}
                  <span>•</span>
                  {format(new Date(selectedApplication.created_at), 'MMMM d, yyyy h:mm a')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Select
                    value={selectedApplication.status}
                    onValueChange={(value) => updateStatus(selectedApplication.id, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                    Contact Information
                  </h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${selectedApplication.email}`} className="text-primary hover:underline">
                        {selectedApplication.email}
                      </a>
                    </div>
                    {selectedApplication.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        {selectedApplication.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Fields */}
                {selectedApplication.custom_fields && Object.keys(selectedApplication.custom_fields).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                      Application Details
                    </h4>
                    <div className="grid gap-2 bg-muted/30 rounded-lg p-4">
                      {Object.entries(selectedApplication.custom_fields).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start gap-4 text-sm">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                          </span>
                          <span className="text-right font-medium">
                            {formatCustomField(key, value) || 'Not provided'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                {selectedApplication.message && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                      Additional Message
                    </h4>
                    <p className="text-sm bg-muted/30 rounded-lg p-4 whitespace-pre-wrap">
                      {selectedApplication.message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    className="flex-1"
                    onClick={() => window.open(`mailto:${selectedApplication.email}?subject=Re: Your ${serviceTypeLabels[selectedApplication.service_type]} Application`, '_blank')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Reply via Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
