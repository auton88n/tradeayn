import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  RefreshCw,
  CheckCircle,
  Clock,
  MessageSquare,
  Trash2,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReplyModal } from './ReplyModal';

interface Application {
  id: string;
  service_type: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  custom_fields: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

const SERVICE_NAMES: Record<string, string> = {
  content_creator: 'Influencer Site',
  ai_agents: 'AI Agent',
  automation: 'Automation'
};

const SERVICE_COLORS: Record<string, string> = {
  content_creator: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  ai_agents: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  automation: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  new: { icon: Clock, color: 'bg-amber-500/10 text-amber-600', label: 'New' },
  replied: { icon: CheckCircle, color: 'bg-green-500/10 text-green-600', label: 'Replied' },
  closed: { icon: CheckCircle, color: 'bg-muted text-muted-foreground', label: 'Closed' }
};

export const ApplicationsManagement = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data || []) as Application[]);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const { error } = await supabase
        .from('service_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Application deleted');
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('service_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status updated');
      fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesService = serviceFilter === 'all' || app.service_type === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Service Applications</h2>
          <p className="text-sm text-muted-foreground">
            {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchApplications}
          disabled={isLoading}
          className="rounded-xl gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px] rounded-xl">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="content_creator">Influencer Site</SelectItem>
            <SelectItem value="ai_agents">AI Agent</SelectItem>
            <SelectItem value="automation">Automation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-3">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {isLoading ? 'Loading applications...' : 'No applications found'}
            </div>
          ) : (
            filteredApplications.map((app, index) => {
              const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.new;
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold truncate">{app.full_name}</h3>
                        <Badge className={SERVICE_COLORS[app.service_type]}>
                          {SERVICE_NAMES[app.service_type] || app.service_type}
                        </Badge>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          {app.email}
                        </span>
                        {app.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4" />
                            {app.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {formatDate(app.created_at)}
                        </span>
                      </div>

                      {app.message && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {app.message}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(app);
                          setIsReplyModalOpen(true);
                        }}
                        className="rounded-xl gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Reply
                      </Button>
                      <Select
                        value={app.status}
                        onValueChange={(status) => handleUpdateStatus(app.id, status)}
                      >
                        <SelectTrigger className="w-[120px] rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="replied">Replied</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(app.id)}
                        className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Reply Modal */}
      <ReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => {
          setIsReplyModalOpen(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        onReplySent={fetchApplications}
      />
    </div>
  );
};
