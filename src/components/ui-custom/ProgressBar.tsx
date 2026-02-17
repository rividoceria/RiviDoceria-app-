import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  sublabel?: string;
  color?: 'pink' | 'blue' | 'green' | 'orange' | 'purple';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorClasses = {
  pink: 'bg-gradient-to-r from-pink-500 to-rose-500',
  blue: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  green: 'bg-gradient-to-r from-emerald-500 to-green-500',
  orange: 'bg-gradient-to-r from-orange-500 to-amber-500',
  purple: 'bg-gradient-to-r from-violet-500 to-purple-500',
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  sublabel,
  color = 'pink',
  showPercentage = true,
  size = 'md',
  className 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-bold text-gray-900">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", sizeClasses[size])}>
        <div 
          className={cn("transition-all duration-500 ease-out rounded-full", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {sublabel && (
        <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
      )}
    </div>
  );
}
