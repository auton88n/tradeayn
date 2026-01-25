import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Gift, Loader2, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface BetaFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  rewardAmount: number;
  onSuccess?: () => void;
}

const FEATURES = [
  { id: 'ai_chat', labelKey: 'beta.feature.aiChat' },
  { id: 'engineering', labelKey: 'beta.feature.engineering' },
  { id: 'support', labelKey: 'beta.feature.support' },
  { id: 'design_analysis', labelKey: 'beta.feature.designAnalysis' },
  { id: 'file_upload', labelKey: 'beta.feature.fileUpload' },
  { id: 'modes', labelKey: 'beta.feature.modes' },
];

export const BetaFeedbackModal = ({ 
  isOpen, 
  onClose, 
  userId, 
  rewardAmount,
  onSuccess 
}: BetaFeedbackModalProps) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [improvements, setImprovements] = useState('');
  const [bugs, setBugs] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t('beta.provideRating'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('beta_feedback')
        .insert({
          user_id: userId,
          overall_rating: rating,
          favorite_features: selectedFeatures,
          improvement_suggestions: improvements.trim() || null,
          bugs_encountered: bugs.trim() || null,
          would_recommend: wouldRecommend,
          credits_awarded: rewardAmount
        });

      if (feedbackError) throw feedbackError;

      // Add bonus credits
      const { error: creditsError } = await supabase.rpc('add_bonus_credits', {
        p_user_id: userId,
        p_amount: rewardAmount,
        p_reason: 'Beta feedback survey completion',
        p_gift_type: 'feedback_reward'
      });

      if (creditsError) throw creditsError;

      setStep('success');
      onSuccess?.();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error(t('form.submitFailed'), {
        description: t('form.submitFailedDesc')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      // Reset form
      setStep('form');
      setRating(0);
      setSelectedFeatures([]);
      setImprovements('');
      setBugs('');
      setWouldRecommend(null);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mb-4"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-foreground mb-2">{t('beta.thankYou')}</h3>
              <p className="text-muted-foreground text-center mb-4">
                {t('beta.feedbackHelps')}
              </p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-full"
              >
                <span className="text-lg font-bold bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                  +{rewardAmount} {t('beta.creditsAdded')}
                </span>
              </motion.div>
              <Button onClick={handleClose} className="mt-6">
                {t('beta.continueUsing')}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  {t('beta.title')}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  {t('beta.earnCredits')}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-full text-purple-600 dark:text-purple-400 font-medium">
                    <Gift className="w-3 h-3" />
                    {rewardAmount} {t('beta.bonusCredits')}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Rating */}
                <div className="space-y-2">
                  <Label>{t('beta.overallExperience')} *</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "w-8 h-8 transition-colors",
                            (hoveredRating || rating) >= star
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Favorite Features */}
                <div className="space-y-2">
                  <Label>{t('beta.featuresLove')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FEATURES.map((feature) => (
                      <label
                        key={feature.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                          selectedFeatures.includes(feature.id)
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={selectedFeatures.includes(feature.id)}
                          onCheckedChange={() => handleFeatureToggle(feature.id)}
                        />
                        <span className="text-sm">{t(feature.labelKey)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div className="space-y-2">
                  <Label htmlFor="improvements">{t('beta.whatImproved')}</Label>
                  <Textarea
                    id="improvements"
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder={t('beta.shareSuggestions')}
                    className="resize-none"
                    rows={2}
                  />
                </div>

                {/* Bugs */}
                <div className="space-y-2">
                  <Label htmlFor="bugs">{t('beta.anyBugs')}</Label>
                  <Textarea
                    id="bugs"
                    value={bugs}
                    onChange={(e) => setBugs(e.target.value)}
                    placeholder={t('beta.describeBugs')}
                    className="resize-none"
                    rows={2}
                  />
                </div>

                {/* Would Recommend */}
                <div className="space-y-2">
                  <Label>{t('beta.wouldRecommend')}</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={wouldRecommend === true ? "default" : "outline"}
                      onClick={() => setWouldRecommend(true)}
                      className={cn(
                        "flex-1",
                        wouldRecommend === true && "bg-green-500 hover:bg-green-600"
                      )}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {t('beta.yes')}
                    </Button>
                    <Button
                      type="button"
                      variant={wouldRecommend === false ? "default" : "outline"}
                      onClick={() => setWouldRecommend(false)}
                      className={cn(
                        "flex-1",
                        wouldRecommend === false && "bg-red-500 hover:bg-red-600"
                      )}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      {t('beta.notYet')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  {t('beta.maybeLater')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || rating === 0}
                  className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Gift className="w-4 h-4 mr-2" />
                  )}
                  {t('beta.submitEarn')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
