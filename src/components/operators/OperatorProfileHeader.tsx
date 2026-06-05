
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Shield } from 'lucide-react';
import { OperatorData } from '@/types/operator';

interface OperatorProfileHeaderProps {
  operator: OperatorData;
}

const OperatorProfileHeader: React.FC<OperatorProfileHeaderProps> = ({ operator }) => {
  const displayName = operator.profile.display_name || operator.profile.name || 'Unknown';
  const fullName = operator.profile.name || operator.profile.display_name || 'Unknown';

  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-shrink-0 mx-auto sm:mx-0 relative">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
              <AvatarImage src={operator.profile.picture} alt={fullName} />
              <AvatarFallback className="dark:bg-muted dark:text-foreground">
                {fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {operator.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-foreground">
                {fullName}
              </h1>
              {operator.isVerified && (
                <Badge className="bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-base sm:text-lg text-gray-600 dark:text-muted-foreground">
              @{displayName}
            </p>
            {operator.profile.about && (
              <p className="text-gray-700 dark:text-muted-foreground mt-2 text-sm sm:text-base">
                {operator.profile.about}
              </p>
            )}
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-6 mt-4 text-sm text-gray-600 dark:text-muted-foreground">
              <span>
                <strong className="dark:text-foreground">{operator.following}</strong> Following
              </span>
              <span>
                <strong className="dark:text-foreground">{operator.followers}</strong> Followers
              </span>
              {operator.profile.website && (
                <a 
                  href={operator.profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:text-primary/80 hover:underline"
                >
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t dark:border-border">
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground font-mono break-all">
                <span className="font-medium">Nostr Public Key:</span> {operator.npub}
              </p>
              {operator.profile.nip05 && (
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  <span className="font-medium">NIP-05:</span> {operator.profile.nip05}
                </p>
              )}
            </div>
            <div>
              {operator.profile.location && (
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  <span className="font-medium">Location:</span> {operator.profile.location}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-muted-foreground font-mono mt-1">
                <span className="font-medium">Geohash:</span> {operator.geoHash}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperatorProfileHeader;
