/**
 * ContactAvatar Component
 * Displays contact profile picture with automatic fetching from Evolution API
 * Includes loading states and fallback to initials
 */

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useContactProfilePicture } from '@/hooks/api/useEvolutionApi';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface ContactAvatarProps {
  /**
   * Contact phone number (used to fetch profile picture)
   */
  phoneNumber: string;

  /**
   * Contact name (used for initials fallback)
   */
  name?: string;

  /**
   * WhatsApp instance name
   */
  instanceName: string;

  /**
   * Optional pre-loaded profile picture URL
   */
  profilePictureUrl?: string | null;

  /**
   * Size of the avatar
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show online indicator
   */
  showOnline?: boolean;

  /**
   * Is contact online
   */
  isOnline?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function ContactAvatar({
  phoneNumber,
  name,
  instanceName,
  profilePictureUrl: preLoadedUrl,
  size = 'md',
  className,
  showOnline = false,
  isOnline = false,
}: ContactAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Fetch profile picture from Evolution API if not pre-loaded
  const shouldFetch = !preLoadedUrl && !imageError && !!instanceName && !!phoneNumber;

  const { data: fetchedUrl, isLoading, error } = useContactProfilePicture(
    shouldFetch ? instanceName : '',
    shouldFetch ? phoneNumber : ''
  );

  // Use pre-loaded URL first, then fetched URL
  const profilePictureUrl = preLoadedUrl || fetchedUrl;

  // Reset error state when URL changes
  useEffect(() => {
    setImageError(false);
  }, [profilePictureUrl]);

  // Get initials from name
  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';

    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        {profilePictureUrl && !imageError ? (
          <AvatarImage
            src={profilePictureUrl}
            alt={name || phoneNumber}
            onError={() => setImageError(true)}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback
          className={cn(
            'bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold',
            isLoading && 'animate-pulse'
          )}
        >
          {isLoading ? (
            <User className="h-1/2 w-1/2 animate-pulse" />
          ) : (
            getInitials(name)
          )}
        </AvatarFallback>
      </Avatar>

      {/* Online indicator */}
      {showOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
            size === 'sm' && 'h-2 w-2',
            size === 'md' && 'h-2.5 w-2.5',
            size === 'lg' && 'h-3 w-3',
            size === 'xl' && 'h-4 w-4',
            isOnline ? 'bg-[#DBEB00]' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  );
}

/**
 * ContactAvatarGroup Component
 * Displays a group of overlapping contact avatars
 */
interface ContactAvatarGroupProps {
  contacts: Array<{
    phoneNumber: string;
    name?: string;
    profilePictureUrl?: string | null;
  }>;
  instanceName: string;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ContactAvatarGroup({
  contacts,
  instanceName,
  maxVisible = 3,
  size = 'sm',
  className,
}: ContactAvatarGroupProps) {
  const visibleContacts = contacts.slice(0, maxVisible);
  const remainingCount = Math.max(0, contacts.length - maxVisible);

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleContacts.map((contact, index) => (
        <div
          key={contact.phoneNumber}
          className="ring-2 ring-background rounded-full"
          style={{ zIndex: visibleContacts.length - index }}
        >
          <ContactAvatar
            phoneNumber={contact.phoneNumber}
            name={contact.name}
            profilePictureUrl={contact.profilePictureUrl}
            instanceName={instanceName}
            size={size}
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold ring-2 ring-background',
            sizeClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
