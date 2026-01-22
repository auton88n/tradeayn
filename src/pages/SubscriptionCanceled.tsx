import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEO } from '@/components/SEO';

const SubscriptionCanceled = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO 
        title="Checkout Canceled - AYN"
        description="Your checkout was canceled."
        noIndex={true}
      />
      
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <XCircle className="w-16 h-16 text-muted-foreground mx-auto" />
            </motion.div>

            <h1 className="text-2xl font-bold mb-2">
              Checkout Canceled
            </h1>
            
            <p className="text-muted-foreground mb-6">
              No worries! Your checkout was canceled and you haven't been charged.
              You can try again whenever you're ready.
            </p>

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/pricing')} className="w-full">
                View Plans
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default SubscriptionCanceled;
