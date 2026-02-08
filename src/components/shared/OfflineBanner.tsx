import { useEffect, useRef } from 'react';
import { WifiOff, Wifi, Send } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { offlineQueue } from '@/lib/offlineQueue';

export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      const queuedCount = offlineQueue.length;
      if (queuedCount > 0) {
        toast({
          description: (
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              <span>Sending {queuedCount} queued message{queuedCount > 1 ? 's' : ''}...</span>
            </div>
          ),
        });
        offlineQueue.processQueue();
      } else {
        toast({
          description: (
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-500" />
              <span>Back online</span>
            </div>
          ),
        });
      }
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2 shadow-lg"
        >
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">No internet connection</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
