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
    {/* Outer eye shape – smooth almond */}
    <path
      d="M6 32C6 32 16 16 32 16s26 16 26 16-16 16-26 16S6 32 6 32Z"
      fill="currentColor"
      opacity="0.08"
    />
    <path
      d="M6 32C6 32 16 16 32 16s26 16 26 16-16 16-26 16S6 32 6 32Z"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Iris ring */}
    <circle cx="32" cy="32" r="10" className="stroke-foreground/50 fill-muted" strokeWidth="2.5" />
    {/* Pupil */}
    <circle cx="32" cy="32" r="5.5" className="fill-foreground" />
    {/* Blue accent dot */}
    <circle cx="34.5" cy="29" r="2" fill={accentColor} />
  </svg>
);
