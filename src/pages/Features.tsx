import { BarChart3, Target, TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from '@/components/PageLayout';
import { ScrollAnimation } from '@/components/ScrollAnimation';

const Features = () => {
  const { language } = useLanguage();

  const features = [
    {
      icon: BarChart3,
      title: language === 'ar' ? 'أبحاث السوق' : 'Market Research',
      description: language === 'ar' ? 'احصل على رؤى عميقة حول السوق والمنافسين' : 'Get deep insights into your market and competitors'
    },
    {
      icon: Target,
      title: language === 'ar' ? 'تحسين المبيعات' : 'Sales Optimization',
      description: language === 'ar' ? 'حسّن قمع المبيعات وزد معدلات التحويل' : 'Optimize your sales funnel and increase conversion rates'
    },
    {
      icon: TrendingUp,
      title: language === 'ar' ? 'تحليل الاتجاهات' : 'Trend Analysis',
      description: language === 'ar' ? 'راقب اتجاهات الصناعة وتوقع التغييرات' : 'Monitor industry trends and predict changes'
    },
    {
      icon: Zap,
      title: language === 'ar' ? 'التخطيط الاستراتيجي' : 'Strategic Planning',
      description: language === 'ar' ? 'احصل على استراتيجيات قابلة للتنفيذ' : 'Get actionable strategies for growth'
    }
  ];

  return (
    <PageLayout>
      <section className="py-24 bg-white text-black min-h-screen">
        <div className="container mx-auto px-6">
          <ScrollAnimation variant="fadeUp">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-6 text-black border-black/20">
                {language === 'ar' ? 'القدرات' : 'CAPABILITIES'}
              </Badge>
              <h2 className="text-5xl font-bold mb-4 tracking-tight">
                {language === 'ar' ? 'كل ما تحتاجه' : 'Everything You Need'}
              </h2>
              <p className="text-xl text-black/60 max-w-2xl mx-auto">
                {language === 'ar' ? 'أدوات قوية لتنمية أعمالك' : 'Powerful tools to grow your business'}
              </p>
            </div>
          </ScrollAnimation>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <ScrollAnimation key={index} variant="fadeUp" delay={index * 0.1}>
                <div className="bg-white border border-black/10 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 h-full">
                  <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-black/60 leading-relaxed">{feature.description}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Features;
