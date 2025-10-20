
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Repeat2, MessageSquare } from 'lucide-react';
import { NostrPost } from '@/types/operator';

interface OperatorProfilePostsProps {
  posts: NostrPost[];
}

const OperatorProfilePosts: React.FC<OperatorProfilePostsProps> = ({ posts }) => {
  return (
    <Card className="dark:bg-card/40 dark:backdrop-blur-sm dark:border-border">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-2xl dark:text-foreground">Latest Posts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-100 dark:border-border pb-4 last:border-b-0">
            <p className="text-gray-900 dark:text-foreground mb-2 text-sm sm:text-base leading-relaxed">
              {post.content}
            </p>
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-sm text-gray-500 dark:text-muted-foreground">
              <span className="text-xs xs:text-sm">{post.timestamp}</span>
              <div className="flex items-center space-x-3 xs:space-x-4">
                <span className="flex items-center space-x-1">
                  <Heart className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span className="text-xs xs:text-sm">{post.likes}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Repeat2 className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span className="text-xs xs:text-sm">{post.reposts}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MessageSquare className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span className="text-xs xs:text-sm">{post.replies}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OperatorProfilePosts;
