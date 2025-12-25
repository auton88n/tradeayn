import { motion } from 'framer-motion';
import { Eye, EyeOff, Trash2, Building2, Columns3, Box, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  project_type: string;
  key_specs: Record<string, any> | null;
  is_public: boolean | null;
  created_at: string;
  calculation_id: string | null;
}

interface PortfolioCardProps {
  item: PortfolioItem;
  index: number;
  onTogglePublic: () => void;
  onDelete: () => void;
}

const projectTypeConfig: Record<string, { icon: typeof Building2; gradient: string }> = {
  beam: { icon: Columns3, gradient: 'from-blue-500 to-cyan-500' },
  foundation: { icon: Building2, gradient: 'from-amber-500 to-orange-500' },
  column: { icon: Box, gradient: 'from-purple-500 to-pink-500' },
  slab: { icon: Calculator, gradient: 'from-green-500 to-emerald-500' },
  retaining_wall: { icon: Building2, gradient: 'from-rose-500 to-orange-500' },
};

const PortfolioCard = ({ item, index, onTogglePublic, onDelete }: PortfolioCardProps) => {
  const config = projectTypeConfig[item.project_type] || projectTypeConfig.beam;
  const Icon = config.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Thumbnail / Icon Header */}
      <div className={cn(
        "h-32 flex items-center justify-center bg-gradient-to-br",
        config.gradient
      )}>
        {item.thumbnail_url ? (
          <img 
            src={item.thumbnail_url} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon className="w-16 h-16 text-white/80" />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="font-semibold line-clamp-1">{item.title}</h4>
            <p className="text-xs text-muted-foreground capitalize">
              {item.project_type.replace('_', ' ')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {item.is_public ? (
              <Eye className="w-4 h-4 text-green-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>
        )}

        {/* Key Specs Preview */}
        {item.key_specs && Object.keys(item.key_specs).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(item.key_specs).slice(0, 3).map(([key, value]) => (
              <span 
                key={key}
                className="px-2 py-0.5 text-xs bg-muted rounded-full"
              >
                {String(value)}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {formatDate(item.created_at)}
          </span>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Public</span>
              <Switch
                checked={item.is_public ?? false}
                onCheckedChange={onTogglePublic}
                className="scale-75"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PortfolioCard;
