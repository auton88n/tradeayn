import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Session } from '@supabase/supabase-js';
import { supabaseApi } from '@/lib/supabaseApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Search, 
  Download, 
  MoreVertical,
  Filter,
  Eye,
  Mail,
  CheckCircle,
  Clock,
  MessageSquare,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import { ReplyModal } from './ReplyModal';

export interface ServiceApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  service_type: string;
  status: string;
  custom_fields: Record<string, unknown> | null;
  assigned_to: string | null;
  email_sent: boolean | null;
  email_error: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationReply {
  id: string;
  application_id: string;
  subject: string;
  message: string;
  sent_by: string | null;
  email_sent: boolean | null;
  email_error: string | null;
  created_at: string;
}

interface ApplicationManagementProps {
  session: Session;
  applications: ServiceApplication[];
  onRefresh: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2 }
  }
};

const SERVICE_TYPES = [
  { value: 'all', label: 'All Services' },
  { value: 'content_creator', label: 'Content Creator Sites' },
  { value: 'ai_agents', label: 'AI Agents' },
  { value: 'automation', label: 'Automation' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'new':
      return { icon: Clock, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    case 'reviewed':
      return { icon: Eye, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' };
    case 'contacted':
      return { icon: MessageSquare, color: 'bg-green-500/10 text-green-600 border-green-500/20' };
    case 'closed':
      return { icon: CheckCircle, color: 'bg-muted text-muted-foreground border-muted' };
    default:
      return { icon: Clock, color: 'bg-muted text-muted-foreground border-muted' };
  }
};

const getServiceLabel = (type: string) => {
  switch (type) {
    case 'content_creator':
      return 'Content Creator';
    case 'ai_agents':
      return 'AI Agents';
    case 'automation':
      return 'Automation';
    default:
      return type;
  }
};

const ITEMS_PER_PAGE = 20;

export const ApplicationManagement = ({ session, applications, onRefresh }: ApplicationManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<ServiceApplication | null>(null);
  const [replyingTo, setReplyingTo] = useState<ServiceApplication | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = 
        app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.phone?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesService = serviceFilter === 'all' || app.service_type === serviceFilter;
      
      return (matchesSearch || !searchQuery) && matchesStatus && matchesService;
    });
  }, [applications, searchQuery, statusFilter, serviceFilter]);

  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredApplications.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredApplications, currentPage]);

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const handleStatusChange = useCallback(async (appId: string, newStatus: string) => {
    try {
      await supabaseApi.patch(
        `service_applications?id=eq.${appId}`,
        session.access_token,
        { status: newStatus, updated_at: new Date().toISOString() }
      );
      toast.success(`Status updated to ${newStatus}`);
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  }, [session.access_token, onRefresh]);

  const handleViewApplication = (app: ServiceApplication) => {
    // Mark as reviewed if new
    if (app.status === 'new') {
      handleStatusChange(app.id, 'reviewed');
    }
    setSelectedApplication(app);
  };

  const exportApplications = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Service', 'Status', 'Message', 'Date'],
      ...filteredApplications.map(app => [
        app.full_name,
        app.email,
        app.phone || '',
        getServiceLabel(app.service_type),
        app.status,
        app.message?.replace(/,/g, ';') || '',
        format(new Date(app.created_at), 'yyyy-MM-dd HH:mm'),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const newCount = applications.filter(a => a.status === 'new').length;

  return (
    <>
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Applications
                  {newCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {newCount} new
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{filteredApplications.length} total applications</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={exportApplications}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {STATUS_OPTIONS.find(s => s.value === statusFilter)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {STATUS_OPTIONS.map(option => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {SERVICE_TYPES.find(s => s.value === serviceFilter)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {SERVICE_TYPES.map(option => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => setServiceFilter(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Application List */}
          <ScrollArea className="h-[450px]">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {paginatedApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No applications found
                </p>
              ) : (
                paginatedApplications.map((app) => {
                  const statusConfig = getStatusConfig(app.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <motion.div
                      key={app.id}
                      variants={itemVariants}
                      className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewApplication(app)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{app.full_name}</p>
                            {app.status === 'new' && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{app.email}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {getServiceLabel(app.service_type)}
                        </Badge>
                        <Badge variant="outline" className={`shrink-0 ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {app.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(app.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewApplication(app)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setReplyingTo(app)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'reviewed')}>
                              <Eye className="w-4 h-4 mr-2" />
                              Mark as Reviewed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'contacted')}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Mark as Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'closed')}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Mark as Closed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          isOpen={true}
          onClose={() => setSelectedApplication(null)}
          application={selectedApplication}
          session={session}
          onStatusChange={handleStatusChange}
          onReply={() => {
            setReplyingTo(selectedApplication);
            setSelectedApplication(null);
          }}
          onRefresh={onRefresh}
        />
      )}

      {/* Reply Modal */}
      {replyingTo && (
        <ReplyModal
          isOpen={true}
          onClose={() => setReplyingTo(null)}
          application={replyingTo}
          session={session}
          onSuccess={() => {
            setReplyingTo(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
};