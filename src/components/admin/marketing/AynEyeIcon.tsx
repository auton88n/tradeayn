import { cn } from '@/lib/utils';

interface AynEyeIconProps {
  className?: string;
  size?: number;
  accentColor?: string;
}

export const AynEyeIcon = ({ className, size = 24, accentColor = 'hsl(199, 89%, 48%)' }: AynEyeIconProps) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    fill="none"
    className={cn('shrink-0', className)}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer eye shape */}
    <path
      d="M32 12C18 12 6 32 6 32s12 20 26 20 26-20 26-20S46 12 32 12Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Iris */}
    <circle
      cx="32"
      cy="32"
      r="11"
      stroke="currentColor"
      strokeWidth="2.5"
    />
    {/* Pupil */}
    <circle cx="32" cy="32" r="5" fill="currentColor" />
    {/* Accent sparkle top-right */}
    <circle cx="36" cy="27" r="2.5" fill={accentColor} />
    {/* Accent sparkle small */}
    <circle cx="28" cy="29" r="1" fill={accentColor} opacity="0.6" />
  </svg>
);
