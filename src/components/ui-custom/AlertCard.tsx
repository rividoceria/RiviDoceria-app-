import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'info';
  className?: string;
}

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-800',
    messageColor: 'text-amber-700',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    titleColor: 'text-red-800',
    messageColor: 'text-red-700',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700',
  },
};

export function AlertCard({ 
  title, 
  message, 
  type = 'warning',
  className 
}: AlertCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card className={cn(
      "border-l-4",
      config.bgColor,
      config.borderColor,
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.iconColor)} />
          <div>
            <h4 className={cn("font-semibold text-sm", config.titleColor)}>
              {title}
            </h4>
            <p className={cn("text-sm mt-1", config.messageColor)}>
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
