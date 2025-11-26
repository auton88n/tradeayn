import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

const menuVariants = {
  closed: {
    x: '100%',
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as any,
    },
  },
  open: {
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as any,
    },
  },
};

const backdropVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

const itemVariants = {
  closed: { opacity: 0, x: 20 },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as any,
    },
  }),
};

export const MobileNav = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: language === 'ar' ? 'الرئيسية' : 'Home', path: '/' },
    { label: language === 'ar' ? 'المميزات' : 'Features', path: '/features' },
    { label: language === 'ar' ? 'الخدمات' : 'Services', path: '/services' },
    { label: language === 'ar' ? 'اتصل بنا' : 'Contact', path: '/contact' },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-6 right-6 z-[60] w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={backdropVariants}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Menu Panel */}
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
              className="md:hidden fixed top-0 right-0 bottom-0 w-[80%] max-w-sm z-50 backdrop-blur-3xl bg-charcoal/95 border-l border-white/10 shadow-2xl"
            >
              <div className="flex flex-col h-full pt-24 px-8">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item.path}
                    custom={i}
                    initial="closed"
                    animate="open"
                    variants={itemVariants}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className="block py-4 text-2xl font-bold text-white hover:text-blue-400 transition-colors border-b border-white/5"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
