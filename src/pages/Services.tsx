import { Check, ChevronRight, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';
import PageLayout from '@/components/PageLayout';

const Services = () => {
  const { language } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const services = [
    {
      title: language === 'ar' ? 'مواقع المؤثرين' : 'Influencer Portfolio Sites',
      description: language === 'ar' ? 'تميّز عن الآخرين' : 'Stand out from the crowd',
      features: language === 'ar' 
        ? ['تصميم احترافي مخصص', 'استجابة كاملة للموبايل', 'تحسين SEO متقدم', 'استضافة سريعة وآمنة']
        : ['Custom professional design', 'Fully mobile responsive', 'Advanced SEO optimization', 'Fast and secure hosting']
    },
    {
      title: language === 'ar' ? 'روبوتات AI مخصصة' : 'Custom AI Agents',
      description: language === 'ar' ? 'احصل على ميزة تنافسية' : 'Gain competitive advantage',
      features: language === 'ar' 
        ? ['مساعد ذكي مدرّب على بياناتك', 'تكامل مع أنظمتك الحالية', 'دعم متعدد اللغات', 'تعلّم وتحسّن مستمر']
        : ['AI trained on your data', 'Integrate with existing systems', 'Multilingual support', 'Continuous learning']
    },
    {
      title: language === 'ar' ? 'أتمتة العمليات' : 'Process Automation',
      description: language === 'ar' ? 'وفّر الوقت والمال' : 'Save time and money',
      features: language === 'ar' 
        ? ['أتمتة المهام المتكررة', 'تكامل بين الأنظمة', 'تقارير وتحليلات آلية', 'تقليل الأخطاء البشرية']
        : ['Automate repetitive tasks', 'Connect different systems', 'Automated reports and analytics', 'Reduce human errors']
    }
  ];

  return (
    <PageLayout>
      <section className="py-24 bg-black text-white min-h-screen">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 text-white border-white/20">
              {language === 'ar' ? 'الخدمات' : 'SERVICES'}
            </Badge>
            <h2 className="text-5xl font-bold mb-4 tracking-tight">
              {language === 'ar' ? 'ما نقدمه' : 'What We Offer'}
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              {language === 'ar' ? 'حلول متكاملة لنجاح أعمالك' : 'Complete solutions for your business success'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {services.map((service, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
                <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                <p className="text-white/60 mb-6">{service.description}</p>
                <ul className="space-y-3 mb-6">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => setShowAuthModal(true)} 
                  className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/20"
                >
                  {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>

          {/* AYN Eng - Coming Soon */}
          <div 
            className="relative rounded-2xl p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-transparent bg-clip-padding"
            style={{
              backgroundImage: 'linear-gradient(black, black), linear-gradient(90deg, #0066FF, #8B5CF6)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box'
            }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-8 h-8 text-blue-400" />
                  <h3 className="text-3xl font-bold">
                    {language === 'ar' ? 'AYN Eng: الذكاء الاصطناعي للهندسة المدنية' : 'AYN Eng: Civil Engineering AI'}
                  </h3>
                  <Badge className="bg-blue-500 text-white">
                    {language === 'ar' ? 'قريباً' : 'Coming Soon'}
                  </Badge>
                </div>
                <p className="text-white/60 text-lg">
                  {language === 'ar' 
                    ? 'أول مساعد ذكي متخصص في الهندسة المدنية - تحليل، تصميم، وحسابات دقيقة'
                    : 'The first AI assistant specialized in civil engineering - analysis, design, and precise calculations'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
      />
    </PageLayout>
  );
};

export default Services;
