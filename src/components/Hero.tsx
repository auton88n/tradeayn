import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Plus, ChevronDown, Brain } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { TypewriterText } from '@/components/TypewriterText';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeroProps {
  onGetStarted: () => void;
  onDemoMessage?: (message: string) => void;
}

const CARDS_EN = [
  "Always watching over you.",
  "I understand context.",
  "Ready when you are.",
  "Let me handle that.",
  "Optimizing your workflow.",
  "Done. What's next?",
];

const CARDS_AR = [
  "دائماً أراقب من أجلك.",
  "أفهم السياق.",
  "جاهز عندما تريد.",
  "دعني أتولى ذلك.",
  "أحسّن سير عملك.",
  "انتهيت. ما التالي؟",
];

export const Hero = ({ onGetStarted, onDemoMessage }: HeroProps) => {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isAreaHovered, setIsAreaHovered] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [visibleCardIndex, setVisibleCardIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // track pointer relative to container center for subtle eye follow with spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring physics for smooth, natural eye movement
  const eyeX = useSpring(mouseX, { 
    stiffness: 150, 
    damping: 20, 
    mass: 0.5 
  });
  const eyeY = useSpring(mouseY, { 
    stiffness: 150, 
    damping: 20, 
    mass: 0.5 
  });

  // Parallax transforms for floating particles (different speeds for depth)
  const parallax1X = useTransform(mouseX, (v) => v * 0.02);
  const parallax1Y = useTransform(mouseY, (v) => v * 0.02);
  const parallax2X = useTransform(mouseX, (v) => v * 0.035);
  const parallax2Y = useTransform(mouseY, (v) => v * 0.035);
  const parallax3X = useTransform(mouseX, (v) => v * 0.015);
  const parallax3Y = useTransform(mouseY, (v) => v * 0.015);
  const parallax4X = useTransform(mouseX, (v) => v * 0.028);
  const parallax4Y = useTransform(mouseY, (v) => v * 0.028);
  const parallax5X = useTransform(mouseX, (v) => v * 0.022);
  const parallax5Y = useTransform(mouseY, (v) => v * 0.022);
  const parallax6X = useTransform(mouseX, (v) => v * 0.032);
  const parallax6Y = useTransform(mouseY, (v) => v * 0.032);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMove(e: MouseEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Scale down the movement for subtle effect
      mouseX.set((e.clientX - cx) * 0.12);
      mouseY.set((e.clientY - cy) * 0.12);
    }
    function onLeave() {
      mouseX.set(0);
      mouseY.set(0);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [mouseX, mouseY]);

  // Placeholder texts for demo input
  const placeholderTexts = language === 'ar' 
    ? ['كيف يمكنني زيادة إيراداتي؟', 'اقترح استراتيجية تسويقية', 'حلل اتجاهات السوق في مجالي']
    : ['How can I increase my revenue?', 'Suggest a marketing strategy', 'Analyze market trends in my industry'];

  // Rotate placeholder texts
  useEffect(() => {
    if (inputMessage.length > 0 || isFocused) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [inputMessage, isFocused, placeholderTexts.length]);

  // Random card cycling animation
  useEffect(() => {
    const showRandomCard = () => {
      const randomIndex = Math.floor(Math.random() * 6);
      setVisibleCardIndex(randomIndex);
    };
    
    showRandomCard();
    const interval = setInterval(showRandomCard, 2500);
    return () => clearInterval(interval);
  }, []);

  // Handle send
  const handleSend = () => {
    if (!inputMessage.trim()) return;
    // Store message for after authentication
    sessionStorage.setItem('demoMessage', inputMessage);
    if (onDemoMessage) onDemoMessage(inputMessage);
    onGetStarted();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle textarea change
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = newHeight + 'px';
  };

  const CARDS = language === 'ar' ? CARDS_AR : CARDS_EN;

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center py-24 px-6 md:px-12 lg:px-24 overflow-hidden"
      aria-label="Hero"
    >
      {/* Subtle vignette / soft gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-muted/10" />

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-4xl text-center mb-12"
      >
        <h1 className="text-6xl md:text-7xl lg:text-8xl leading-[0.9] font-display tracking-tight text-foreground drop-shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
          {language === 'ar' ? (
            <>تعرّف على <span className="text-neutral-500 dark:text-neutral-400">AYN</span></>
          ) : (
            <>Meet <span className="text-neutral-500 dark:text-neutral-400">AYN</span></>
          )}
        </h1>
        <p className="mt-6 text-lg md:text-2xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto font-light">
          {language === 'ar'
            ? 'الذكاء الاصطناعي الذي يرى، يسمع، ويفهم عالمك'
            : 'The AI that sees, listens, and understands your world.'}
        </p>
      </motion.div>

      {/* Central area with eye and cards */}
      <div 
        className="relative w-full max-w-5xl mt-8 flex items-center justify-center"
        onMouseEnter={() => setIsAreaHovered(true)}
        onMouseLeave={() => setIsAreaHovered(false)}
      >
        {/* ring / subtle light behind the eye */}
        <div className="absolute w-[420px] h-[420px] md:w-[520px] md:h-[520px] lg:w-[640px] lg:h-[640px] rounded-full -z-10 pointer-events-none
                        bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

        {/* Floating particles around eye */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {/* Particle 1 */}
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-foreground/10 blur-[1px]"
            style={{ top: '20%', left: '30%', x: parallax1X, y: parallax1Y }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Particle 2 */}
          <motion.div
            className="absolute w-3 h-3 rounded-full bg-foreground/8 blur-[2px]"
            style={{ top: '15%', right: '25%', x: parallax2X, y: parallax2Y }}
            animate={{
              y: [0, 40, 0],
              x: [0, -25, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          {/* Particle 3 */}
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-foreground/12 blur-[1px]"
            style={{ bottom: '25%', left: '20%', x: parallax3X, y: parallax3Y }}
            animate={{
              y: [0, -20, 0],
              x: [0, 15, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          {/* Particle 4 */}
          <motion.div
            className="absolute w-2.5 h-2.5 rounded-full bg-foreground/10 blur-[2px]"
            style={{ bottom: '30%', right: '22%', x: parallax4X, y: parallax4Y }}
            animate={{
              y: [0, 35, 0],
              x: [0, -18, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          {/* Particle 5 */}
          <motion.div
            className="absolute w-1 h-1 rounded-full bg-foreground/15 blur-[1px]"
            style={{ top: '40%', left: '15%', x: parallax5X, y: parallax5Y }}
            animate={{
              y: [0, -25, 0],
              x: [0, 12, 0],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          {/* Particle 6 */}
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-foreground/8 blur-[2px]"
            style={{ top: '45%', right: '18%', x: parallax6X, y: parallax6Y }}
            animate={{
              y: [0, 28, 0],
              x: [0, -22, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5,
            }}
          />
        </div>

        {/* Cards - emanate from eye center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Top-left card */}
          <motion.div
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
            animate={{ 
              x: visibleCardIndex === 0 ? -180 : 0,
              y: visibleCardIndex === 0 ? -120 : 0,
              opacity: visibleCardIndex === 0 ? 1 : 0,
              scale: visibleCardIndex === 0 ? 1 : 0.3,
              filter: visibleCardIndex === 0 ? 'blur(0px)' : 'blur(4px)'
            }}
            transition={{ 
              duration: 0.5, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.3 }
            }}
            className="absolute w-[150px] md:w-[190px] rounded-2xl backdrop-blur-xl bg-background/60 border border-border/20 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-3 z-20"
          >
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-foreground/70 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-foreground">{CARDS[0]}</span>
            </div>
          </motion.div>

          {/* Middle-left card */}
          <motion.div
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
            animate={{ 
              x: visibleCardIndex === 1 ? -220 : 0,
              y: visibleCardIndex === 1 ? 0 : 0,
              opacity: visibleCardIndex === 1 ? 1 : 0,
              scale: visibleCardIndex === 1 ? 1 : 0.3,
              filter: visibleCardIndex === 1 ? 'blur(0px)' : 'blur(4px)'
            }}
            transition={{ 
              duration: 0.5, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.3 }
            }}
            className="absolute w-[160px] md:w-[200px] rounded-2xl backdrop-blur-xl bg-background/60 border border-border/20 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-4 z-20"
          >
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-foreground/70 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-foreground">{CARDS[1]}</span>
            </div>
          </motion.div>

          {/* Bottom-left card */}
          <motion.div
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
            animate={{ 
              x: visibleCardIndex === 2 ? -180 : 0,
              y: visibleCardIndex === 2 ? 120 : 0,
              opacity: visibleCardIndex === 2 ? 1 : 0,
              scale: visibleCardIndex === 2 ? 1 : 0.3,
              filter: visibleCardIndex === 2 ? 'blur(0px)' : 'blur(4px)'
            }}
            transition={{ 
              duration: 0.5, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.3 }
            }}
            className="absolute w-[150px] md:w-[190px] rounded-2xl backdrop-blur-xl bg-background/60 border border-border/20 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-3 z-20"
          >
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-foreground/70 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-foreground">{CARDS[2]}</span>
            </div>
          </motion.div>

          {/* Top-right card */}
          <motion.div
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
            animate={{ 
              x: visibleCardIndex === 3 ? 180 : 0,
              y: visibleCardIndex === 3 ? -120 : 0,
              opacity: visibleCardIndex === 3 ? 1 : 0,
              scale: visibleCardIndex === 3 ? 1 : 0.3,
              filter: visibleCardIndex === 3 ? 'blur(0px)' : 'blur(4px)'
            }}
            transition={{ 
              duration: 0.5, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.3 }
            }}
            className="absolute w-[150px] md:w-[190px] rounded-2xl backdrop-blur-xl bg-background/60 border border-border/20 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-3 z-20"
          >
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-foreground/70 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-foreground">{CARDS[3]}</span>
            </div>
          </motion.div>

          {/* Middle-right card */}
          <motion.div
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
            animate={{ 
              x: visibleCardIndex === 4 ? 220 : 0,
              y: visibleCardIndex === 4 ? 0 : 0,
              opacity: visibleCardIndex === 4 ? 1 : 0,
              scale: visibleCardIndex === 4 ? 1 : 0.3,
              filter: visibleCardIndex === 4 ? 'blur(0px)' : 'blur(4px)'
            }}
            transition={{ 
              duration: 0.5, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.3 }
            }}
            className="absolute w-[160px] md:w-[200px] rounded-2xl backdrop-blur-xl bg-background/60 border border-border/20 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-4 z-20"
          >
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-foreground/70 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-foreground">{CARDS[4]}</span>
            </div>
          </motion.div>

          {/* Bottom-right card */}
          <motion.div
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
            animate={{ 
              x: visibleCardIndex === 5 ? 180 : 0,
              y: visibleCardIndex === 5 ? 120 : 0,
              opacity: visibleCardIndex === 5 ? 1 : 0,
              scale: visibleCardIndex === 5 ? 1 : 0.3,
              filter: visibleCardIndex === 5 ? 'blur(0px)' : 'blur(4px)'
            }}
            transition={{ 
              duration: 0.5, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.3 }
            }}
            className="absolute w-[150px] md:w-[190px] rounded-2xl backdrop-blur-xl bg-background/60 border border-border/20 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-3 z-20"
          >
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-foreground/70 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-foreground">{CARDS[5]}</span>
            </div>
          </motion.div>
        </div>

        {/* Pulse ring - emanates when card appears */}
        <AnimatePresence mode="wait">
          <motion.div
            key={visibleCardIndex}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-5"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              className="w-[160px] h-[160px] md:w-[220px] md:h-[220px] lg:w-[260px] lg:h-[260px] rounded-full border border-foreground/10"
            />
          </motion.div>
        </AnimatePresence>

        {/* Eye - centered with spring physics */}
        <motion.div
          style={{ x: eyeX, y: eyeY }}
          className="relative z-10 flex items-center justify-center group cursor-pointer"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            filter: isAreaHovered 
              ? 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.3))' 
              : 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.15))'
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Outer casing with breathing pulse and hover glow */}
          <motion.div 
            className="relative w-[160px] h-[160px] md:w-[220px] md:h-[220px] lg:w-[260px] lg:h-[260px] rounded-full bg-background flex items-center justify-center transition-all duration-500 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.15),0_0_60px_rgba(0,0,0,0.08)] dark:group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(255,255,255,0.15)] group-hover:scale-105 overflow-hidden"
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.95, 1, 0.95],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Shine sweep effect */}
            <div 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.6) 50%, transparent 70%)',
                animation: 'eye-shine 6s ease-in-out infinite',
                animationDelay: '2s',
              }}
            />
            {/* soft inner ring */}
            <div className="absolute inset-4 rounded-full bg-background/80 shadow-inner"></div>

            {/* actual eye (pupil + iris) */}
            <svg
              viewBox="0 0 100 100"
              className="w-[70%] h-[70%] relative"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                animation: 'eye-blink 4s ease-in-out infinite',
                transformOrigin: 'center center'
              }}
            >
              {/* iris subtle gradient */}
              <defs>
                <radialGradient id="g1" cx="50%" cy="40%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
                  <stop offset="45%" stopColor="hsl(var(--foreground))" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.9" />
                </radialGradient>
                <radialGradient id="g2" cx="40%" cy="30%">
                  <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0.9" />
                  <stop offset="80%" stopColor="hsl(var(--foreground))" stopOpacity="0.95" />
                </radialGradient>
              </defs>

              {/* sclera subtle */}
              <circle cx="50" cy="50" r="48" fill="url(#g2)" opacity="0.06" />

              {/* iris / pupil - black circle that dilates on hover */}
              <circle
                cx="50"
                cy="50"
                r={isHovered ? "32" : "28"}
                fill="black"
                style={{ 
                  transition: "r 0.3s cubic-bezier(0.32, 0.72, 0, 1)" 
                }}
              />
              
              {/* Brain logo centered inside the black pupil - smaller */}
              <foreignObject 
                x={isHovered ? "30" : "32"} 
                y={isHovered ? "30" : "32"} 
                width={isHovered ? "40" : "36"} 
                height={isHovered ? "40" : "36"}
                style={{ transition: "all 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                <Brain 
                  className="w-full h-full text-white/90"
                />
              </foreignObject>
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* Demo Chat Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="mt-16 w-full max-w-2xl"
      >
        <div className="relative bg-background/80 dark:bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl p-3">
          {/* Textarea */}
          <div className="w-full relative">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder=""
              rows={1}
              unstyled={true}
              className="w-full resize-none min-h-[44px] max-h-[120px] text-base bg-transparent px-2 py-2"
            />

            {/* Typewriter Placeholder */}
            {inputMessage.length === 0 && !isFocused && (
              <div className={cn(
                "absolute top-[10px] pointer-events-none z-10",
                language === 'ar' ? 'right-[8px]' : 'left-[8px]'
              )}>
                <TypewriterText
                  key={`${placeholderIndex}-${language}`}
                  text={placeholderTexts[placeholderIndex]}
                  speed={50}
                  className="text-muted-foreground"
                  showCursor={true}
                />
              </div>
            )}
          </div>

          {/* Toolbar Row */}
          <div className="flex items-center justify-between w-full pt-2">
            {/* Left: Plus Button */}
            <div className="flex items-center gap-1">
              <button
                onClick={onGetStarted}
                className="w-10 h-10 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                title={language === 'ar' ? 'إرفاق ملف' : 'Attach file'}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Mode Selector + Send Button */}
            <div className="flex items-center gap-2">
              {/* Static Mode Selector (triggers auth on click) */}
              <button
                onClick={onGetStarted}
                className="h-8 px-3 rounded-lg border border-border/50 flex items-center gap-1 hover:bg-muted/80 transition-all"
              >
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'عام' : 'General'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>

              {/* Send Button */}
              <button
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-foreground to-foreground/90 text-background flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={handleSend}
                disabled={!inputMessage.trim()}
                title={language === 'ar' ? 'إرسال' : 'Send message'}
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
