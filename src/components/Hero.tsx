import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Plus, ChevronDown, Brain } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { TypewriterText } from '@/components/TypewriterText';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
interface HeroProps {
  onGetStarted: () => void;
  onDemoMessage?: (message: string) => void;
}
const CARDS_EN = ["Always watching over you.", "I understand context.", "Ready when you are.", "Let me handle that.", "Optimizing your workflow.", "Done. What's next?"];
const CARDS_AR = ["معك في كل خطوة.", "أفهم ما تحتاجه.", "جاهز لخدمتك.", "اترك الأمر لي.", "أُنجز المهام بذكاء.", "تمّ. ماذا بعد؟"];
export const Hero = ({
  onGetStarted,
  onDemoMessage
}: HeroProps) => {
  const {
    language
  } = useLanguage();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [visibleCardIndex, setVisibleCardIndex] = useState<number | null>(null);
  const [absorptionPulse, setAbsorptionPulse] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousCardRef = useRef<number | null>(null);

  // Responsive card positions - mobile uses top/bottom layout to avoid horizontal clipping
  const getCardPositions = () => {
    if (isMobile) {
      // Position cards above and below the eye on mobile (vertical layout)
      return {
        topLeft: { x: -50, y: -95 },      // Top-left above eye
        middleLeft: { x: 0, y: -105 },     // Center-top above eye
        bottomLeft: { x: 50, y: -95 },     // Top-right above eye
        topRight: { x: -50, y: 95 },       // Bottom-left below eye
        middleRight: { x: 0, y: 105 },     // Center-bottom below eye
        bottomRight: { x: 50, y: 95 }      // Bottom-right below eye
      };
    }
    return {
      topLeft: { x: -180, y: -110 },
      middleLeft: { x: -210, y: 0 },
      bottomLeft: { x: -180, y: 110 },
      topRight: { x: 180, y: -110 },
      middleRight: { x: 210, y: 0 },
      bottomRight: { x: 180, y: 110 }
    };
  };
  const cardPositions = getCardPositions();

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

  // Parallax transforms for floating particles (reduced to 3 for performance)
  const parallax1X = useTransform(mouseX, v => v * 0.02);
  const parallax1Y = useTransform(mouseY, v => v * 0.02);
  const parallax2X = useTransform(mouseX, v => v * 0.03);
  const parallax2Y = useTransform(mouseY, v => v * 0.03);
  const parallax3X = useTransform(mouseX, v => v * 0.015);
  const parallax3Y = useTransform(mouseY, v => v * 0.015);
  // Throttled mouse tracking for performance
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let lastUpdate = 0;
    const throttleMs = 16; // ~60fps
    
    function onMove(e: MouseEvent) {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;
      
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX.set((e.clientX - cx) * 0.12);
      mouseY.set((e.clientY - cy) * 0.12);
    }
    function onLeave() {
      mouseX.set(0);
      mouseY.set(0);
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [mouseX, mouseY]);

  // Placeholder texts for demo input
  const placeholderTexts = language === 'ar' ? ['كيف أضاعف أرباحي؟', 'أعطني خطة تسويق فعّالة', 'ما الفرص الجديدة في سوقي؟'] : ['How can I increase my revenue?', 'Suggest a marketing strategy', 'Analyze market trends in my industry'];

  // Rotate placeholder texts
  useEffect(() => {
    if (inputMessage.length > 0 || isFocused) return;
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholderTexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [inputMessage, isFocused, placeholderTexts.length]);

  // Unified animation cycle - 3 second rhythm
  // 0.0s: Eye blinks (preparing to speak)
  // 0.15s: Card bursts out (eye speaks)
  // 2.4s: Card returns + absorption pulse
  // 3.0s: Cycle repeats
  useEffect(() => {
    const runAnimationCycle = () => {
      // Phase 1: Blink (0ms) - eye prepares to speak
      setIsBlinking(true);

      // Phase 2: Emit card (150ms after blink completes)
      setTimeout(() => {
        setIsBlinking(false);
        // Get a random card that's different from the previous one
        let availableIndices = [0, 1, 2, 3, 4, 5];
        if (previousCardRef.current !== null) {
          availableIndices = availableIndices.filter(i => i !== previousCardRef.current);
        }
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        previousCardRef.current = randomIndex;
        setVisibleCardIndex(randomIndex);
      }, 150);

      // Phase 3: Start absorption (2400ms - card returns)
      setTimeout(() => {
        setAbsorptionPulse(true);
        setVisibleCardIndex(null);
      }, 2400);

      // Phase 4: Reset absorption pulse (2700ms)
      setTimeout(() => {
        setAbsorptionPulse(false);
      }, 2700);
    };

    // Initial run
    runAnimationCycle();

    // Repeat every 4 seconds (slower for performance)
    const interval = setInterval(runAnimationCycle, 4000);
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
  return <section ref={containerRef} className="relative min-h-[100dvh] flex flex-col items-center justify-between pt-20 md:pt-24 pb-6 md:pb-8 px-4 md:px-12 lg:px-24 overflow-hidden" aria-label="Hero">
      {/* Subtle vignette / soft gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-muted/10" />

      {/* Headline */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1]
    }} className="w-full max-w-4xl text-center mb-4 md:mb-6">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-2 md:mb-3">
          {language === 'ar' ? 'تعرّف على AYN' : 'Meet AYN'}
        </h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-light max-w-2xl mx-auto"
        >
          {language === 'ar' 
            ? 'الذكاء الاصطناعي الذي يرى، يستمع، ويفهم عالمك.' 
            : 'The AI that sees, listens, and understands your world.'}
        </motion.p>
      </motion.div>

      {/* Central area with eye and cards */}
      <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center">
        {/* ring / subtle light behind the eye */}
        <div className="absolute w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] md:w-[360px] md:h-[360px] lg:w-[480px] lg:h-[480px] rounded-full -z-10 pointer-events-none
                        bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

        {/* Floating particles - reduced to 3 for performance */}
        <div className="absolute inset-0 pointer-events-none overflow-visible hidden md:block will-change-transform">
          {/* Particle 1 */}
          <motion.div 
            className="absolute w-2 h-2 rounded-full bg-foreground/15" 
            style={{ top: '20%', left: '30%', x: parallax1X, y: parallax1Y }}
            animate={{ y: [0, -15, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Particle 2 */}
          <motion.div 
            className="absolute w-2.5 h-2.5 rounded-full bg-foreground/10" 
            style={{ top: '15%', right: '25%', x: parallax2X, y: parallax2Y }}
            animate={{ y: [0, 12, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          {/* Particle 3 */}
          <motion.div 
            className="absolute w-1.5 h-1.5 rounded-full bg-foreground/12" 
            style={{ bottom: '25%', left: '20%', x: parallax3X, y: parallax3Y }}
            animate={{ y: [0, -10, 0], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>

        {/* Cards - optimized animations without blur filters - visible on all devices */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform overflow-visible">
          {/* Top-left card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 0 && (
              <motion.div 
                key="card-0" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.topLeft.x, y: cardPositions.topLeft.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[0]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Middle-left card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 1 && (
              <motion.div 
                key="card-1" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.middleLeft.x, y: cardPositions.middleLeft.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[1]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom-left card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 2 && (
              <motion.div 
                key="card-2" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.bottomLeft.x, y: cardPositions.bottomLeft.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[2]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top-right card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 3 && (
              <motion.div 
                key="card-3" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.topRight.x, y: cardPositions.topRight.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[3]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Middle-right card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 4 && (
              <motion.div 
                key="card-4" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.middleRight.x, y: cardPositions.middleRight.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[4]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom-right card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 5 && (
              <motion.div 
                key="card-5" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.bottomRight.x, y: cardPositions.bottomRight.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[5]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Absorption glow - simplified without blur */}
        <AnimatePresence>
          {absorptionPulse && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 0.4 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] lg:w-[200px] lg:h-[200px] rounded-full bg-foreground/8 pointer-events-none z-10" 
            />
          )}
        </AnimatePresence>

        {/* Single pulse ring - simplified */}
        <AnimatePresence mode="wait">
          {visibleCardIndex !== null && (
            <motion.div 
              key={visibleCardIndex} 
              initial={{ scale: 0.6, opacity: 0.3 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] md:w-[200px] md:h-[200px] lg:w-[240px] lg:h-[240px] rounded-full border border-foreground/10 pointer-events-none" 
            />
          )}
        </AnimatePresence>

        {/* Eye - centered with spring physics - simplified shadows */}
        <motion.div 
          style={{ x: eyeX, y: eyeY }}
          className="relative z-10 flex items-center justify-center group cursor-pointer will-change-transform" 
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onMouseEnter={() => setIsHovered(true)} 
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Outer casing - simplified hover effects */}
          <motion.div 
            className="relative w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] md:w-[200px] md:h-[200px] lg:w-[240px] lg:h-[240px] rounded-full bg-background flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-[1.03] overflow-hidden transition-shadow duration-300" 
            animate={{ scale: [1, 1.01, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* soft inner ring */}
            <div className="absolute inset-4 rounded-full bg-background/80 shadow-inner"></div>

            {/* actual eye (pupil + iris) - state-controlled blink */}
            <motion.svg viewBox="0 0 100 100" className="w-[70%] h-[70%] relative" xmlns="http://www.w3.org/2000/svg" animate={{
            scaleY: isBlinking ? 0.05 : 1,
            opacity: isBlinking ? 0.7 : 1
          }} transition={{
            duration: isBlinking ? 0.08 : 0.12,
            ease: isBlinking ? [0.55, 0.055, 0.675, 0.19] : [0.34, 1.56, 0.64, 1]
          }} style={{
            transformOrigin: 'center center'
          }}>
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

              {/* iris / pupil - black circle that dilates on blink (anticipation), contracts on absorption */}
              <circle cx="50" cy="50" r={absorptionPulse ? "22" : isBlinking ? "30" : isHovered ? "32" : "28"} fill="black" style={{
              transition: absorptionPulse ? "r 0.15s cubic-bezier(0.55, 0.055, 0.675, 0.19)" : isBlinking ? "r 0.08s cubic-bezier(0.55, 0.055, 0.675, 0.19)" : "r 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }} />
              
              {/* Brain logo centered inside the black pupil - smaller */}
              <foreignObject x={absorptionPulse ? "36" : isBlinking ? "32" : isHovered ? "30" : "32"} y={absorptionPulse ? "36" : isBlinking ? "32" : isHovered ? "30" : "32"} width={absorptionPulse ? "28" : isBlinking ? "36" : isHovered ? "40" : "36"} height={absorptionPulse ? "28" : isBlinking ? "36" : isHovered ? "40" : "36"} style={{
              transition: absorptionPulse ? "all 0.15s cubic-bezier(0.55, 0.055, 0.675, 0.19)" : isBlinking ? "all 0.08s cubic-bezier(0.55, 0.055, 0.675, 0.19)" : "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}>
                <Brain className="w-full h-full text-white/90" />
              </foreignObject>
            </motion.svg>
          </motion.div>
        </motion.div>
      </div>

      {/* Demo Chat Input - TWO ROW LAYOUT - matches dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, delay: 0.6, ease: [0.32, 0.72, 0, 1] }} 
        className="mt-8 md:mt-10 w-full max-w-2xl"
      >
        <div className="relative bg-background/90 dark:bg-background/90 backdrop-blur-md border border-border rounded-2xl shadow-lg overflow-hidden">
          
          {/* ROW 1: Input Area */}
          <div className="relative px-4 pt-3 pb-2">
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
              className="w-full resize-none min-h-[44px] max-h-[200px] text-base bg-transparent pr-12" 
            />

            {/* Typewriter Placeholder */}
            {inputMessage.length === 0 && !isFocused && (
              <div className={cn("absolute top-[14px] pointer-events-none z-10", language === 'ar' ? 'right-[16px]' : 'left-[16px]')}>
                <TypewriterText 
                  key={`${placeholderIndex}-${language}`} 
                  text={placeholderTexts[placeholderIndex]} 
                  speed={50} 
                  className="text-muted-foreground text-base" 
                  showCursor={true} 
                />
              </div>
            )}

            {/* Send button - absolute positioned in corner, only shows when text exists */}
            {inputMessage.trim() && (
              <button 
                onClick={handleSend}
                className="absolute bottom-2 right-3 w-9 h-9 rounded-xl bg-gradient-to-br from-foreground to-foreground/90 text-background flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                title={language === 'ar' ? 'إرسال' : 'Send message'}
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
          </div>
          
          {/* ROW 2: Action Buttons - with border separator */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-muted/20">
            {/* Left: Plus Button only */}
            <div className="flex items-center gap-1">
              <button onClick={onGetStarted} className="w-9 h-9 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200" title={language === 'ar' ? 'إرفاق ملف' : 'Attach file'}>
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Mode Selector only */}
            <button onClick={onGetStarted} className="h-8 px-3 rounded-lg border border-border/50 flex items-center gap-1 hover:bg-muted/80 transition-all">
              <span className="text-sm font-medium">
                {language === 'ar' ? 'عام' : 'General'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
          </div>
          
        </div>
      </motion.div>
    </section>;
};