"use client";

import { cn, dateFormat } from "@/lib/utils";
import { Check, FileText, MessageSquare, Phone, X } from "lucide-react";

interface Activity {
  id: string;
  type: 'call' | 'message' | 'file';
  contact: string;
  timestamp: Date;
  duration?: string;
  preview?: string;
  fileName?: string;
  status: 'completed' | 'missed' | 'sent' | 'received' | 'failed';
}

interface RecentActivityCardProps {
  activity: Activity;
}

export default function RecentActivityCard({ activity }: RecentActivityCardProps) {
  const getIcon = () => {
    switch (activity.type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'file':
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (activity.status) {
      case 'completed':
      case 'sent':
      case 'received':
        return 'text-green-500';
      case 'missed':
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (activity.status) {
      case 'completed':
      case 'sent':
      case 'received':
        return <Check className="w-4 h-4" />;
      case 'missed':
      case 'failed':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/40 transition-colors">
      <div className="bg-muted/40 p-2 rounded-lg">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{activity.contact}</p>
          <span className={cn("flex items-center gap-1 text-sm", getStatusColor())}>
            {getStatusIcon()}
            {activity.status}
          </span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {activity.type === 'call' && activity.duration && (
            <span>{activity.duration}</span>
          )}
          {activity.type === 'message' && activity.preview && (
            <span className="truncate">{activity.preview}</span>
          )}
          {activity.type === 'file' && activity.fileName && (
            <span>{activity.fileName}</span>
          )}
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {dateFormat(activity.timestamp, 'h:mm a')}
      </div>
    </div>
  );
}