import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Brain, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "Please ensure your passwords match.",
            variant: "destructive"
          });
          return;
        }
        
        // Store user data in localStorage for demo
        localStorage.setItem('ayn_user', JSON.stringify({
          name: formData.name,
          email: formData.email,
          joinedAt: new Date().toISOString()
        }));
        
        toast({
          title: "Welcome to AYN!",
          description: "Your account has been created successfully.",
        });
      } else {
        // Sign in logic
        localStorage.setItem('ayn_user', JSON.stringify({
          name: formData.name || 'AYN User',
          email: formData.email,
          lastLogin: new Date().toISOString()
        }));
        
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
      }
      
      localStorage.setItem('ayn_auth_token', 'demo_token_' + Date.now());
      onOpenChange(false);
      
      // Trigger page reload to show dashboard
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-primary/20 max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center animate-pulse-glow">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold gradient-text-hero">
            {isSignUp ? 'Join AYN' : 'Welcome Back'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-10 glass border-primary/20 focus:border-primary/40"
                  required
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10 glass border-primary/20 focus:border-primary/40"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pl-10 pr-10 glass border-primary/20 focus:border-primary/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-10 glass border-primary/20 focus:border-primary/40"
                  required
                />
              </div>
            </div>
          )}
          
          <Button
            type="submit"
            disabled={loading}
            variant="hero"
            size="lg"
            className="w-full"
          >
            {loading 
              ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
              : (isSignUp ? 'Create Account' : 'Sign In')
            }
          </Button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-accent hover:text-accent/80 transition-colors"
            >
              {isSignUp 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>
        
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="text-xs text-muted-foreground text-center space-y-2">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
            <p className="text-accent">🔒 Your data is encrypted and secure</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};