import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Loader2, Mail, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'textarea';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}
interface ServiceApplicationFormProps {
  serviceType: 'content_creator' | 'ai_agents' | 'automation';
  serviceName: string;
  accentColor: string;
  customFields?: CustomField[];
}
const baseSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  message: z.string().max(1000).optional()
});
export const ServiceApplicationForm = ({
  serviceType,
  serviceName,
  accentColor,
  customFields = []
}: ServiceApplicationFormProps) => {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: '',
    customFields: {} as Record<string, string>
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleCopyEmail = () => {
    navigator.clipboard.writeText('info@aynn.io');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };
  const handleCustomFieldChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [name]: value
      }
    }));
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate base fields
    const result = baseSchema.safeParse(formData);
    if (!result.success) {
      result.error.errors.forEach(err => {
        newErrors[err.path[0] as string] = err.message;
      });
    }

    // Validate required custom fields
    customFields.forEach(field => {
      if (field.required && !formData.customFields[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/send-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceType,
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone?.trim() || undefined,
          message: formData.message?.trim() || undefined,
          customFields: formData.customFields
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }
      setIsSuccess(true);
      toast({
        title: 'Application submitted!',
        description: 'Check your email for confirmation.'
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Please try again or email us directly.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isSuccess) {
    return <motion.div initial={{
      opacity: 0,
      scale: 0.95
    }} animate={{
      opacity: 1,
      scale: 1
    }} className="bg-neutral-900/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-neutral-800 text-center">
        <motion.div initial={{
        scale: 0
      }} animate={{
        scale: 1
      }} transition={{
        delay: 0.2,
        type: 'spring'
      }} className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{
        backgroundColor: `${accentColor}20`
      }}>
          <CheckCircle className="w-10 h-10" style={{
          color: accentColor
        }} />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-3">Application Received!</h3>
        <p className="text-neutral-400 mb-6">
          We've sent a confirmation to <span className="text-white">{formData.email}</span>.
          <br />
          Our team will reach out within 24-48 hours.
        </p>
        <Button variant="outline" onClick={() => {
        setIsSuccess(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          message: '',
          customFields: {}
        });
      }} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
          Submit Another Application
        </Button>
      </motion.div>;
  }
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} whileInView={{
    opacity: 1,
    y: 0
  }} viewport={{
    once: true
  }} className="bg-neutral-900/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-neutral-800">
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Start Your {serviceName} Project
        </h3>
        <p className="text-neutral-400">
          Fill out the form below and we'll get back to you within 24-48 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name & Email Row */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Full Name <span className="text-red-400">*</span>
            </label>
            <Input value={formData.fullName} onChange={e => handleChange('fullName', e.target.value)} placeholder="John Doe" className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500" />
            {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="john@example.com" className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500" />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* Phone (optional) */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Phone <span className="text-neutral-500">(optional)</span>
          </label>
          <Input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+1 (555) 000-0000" className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500" />
        </div>

        {/* Custom Fields */}
        <AnimatePresence>
          {customFields.map((field, index) => <motion.div key={field.name} initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: index * 0.05
        }}>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                {field.label}
                {field.required && <span className="text-red-400"> *</span>}
              </label>
              {field.type === 'select' && field.options ? <select value={formData.customFields[field.name] || ''} onChange={e => handleCustomFieldChange(field.name, e.target.value)} className="w-full h-10 px-3 rounded-md bg-neutral-800/50 border border-neutral-700 text-white focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500">
                  <option value="" className="bg-neutral-900">
                    {field.placeholder || 'Select an option'}
                  </option>
                  {field.options.map(opt => <option key={opt} value={opt} className="bg-neutral-900">
                      {opt}
                    </option>)}
                </select> : field.type === 'textarea' ? <Textarea value={formData.customFields[field.name] || ''} onChange={e => handleCustomFieldChange(field.name, e.target.value)} placeholder={field.placeholder} rows={3} className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500 resize-none" /> : <Input value={formData.customFields[field.name] || ''} onChange={e => handleCustomFieldChange(field.name, e.target.value)} placeholder={field.placeholder} className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500" />}
              {errors[field.name] && <p className="text-red-400 text-sm mt-1">{errors[field.name]}</p>}
            </motion.div>)}
        </AnimatePresence>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Tell us about your project <span className="text-neutral-500">(optional)</span>
          </label>
          <Textarea value={formData.message} onChange={e => handleChange('message', e.target.value)} placeholder="Describe your vision, goals, or any specific requirements..." rows={4} className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500 resize-none" />
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg font-semibold text-white transition-all duration-300" style={{
        backgroundColor: accentColor,
        boxShadow: `0 0 30px ${accentColor}40`
      }}>
          {isSubmitting ? <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </> : <>
              <Send className="w-5 h-5 mr-2" />
              Submit Application
            </>}
        </Button>
      </form>

      {/* Alternative Contact */}
      
    </motion.div>;
};