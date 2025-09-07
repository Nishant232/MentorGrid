import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Star, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  completed: boolean;
  xpReward: number;
  category: string;
};

type AchievementCardProps = {
  achievement: Achievement;
  onClick?: () => void;
  selected?: boolean;
};

export function AchievementCard({ achievement, onClick, selected = false }: AchievementCardProps) {
  const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-200 overflow-hidden",
              selected ? "ring-2 ring-primary" : "",
              achievement.completed ? "border-primary/20" : "border-muted"
            )}
            onClick={onClick}
          >
            <div 
              className={cn(
                "h-1", 
                achievement.completed ? "bg-primary" : "bg-muted"
              )}
              style={{ 
                width: `${achievement.completed ? 100 : progressPercentage}%` 
              }}
            />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    achievement.completed ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
                  )}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{achievement.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                {achievement.completed ? (
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    <Star className="h-3 w-3 mr-1" />
                    {achievement.xpReward} XP
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {Math.round(progressPercentage)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-2 p-1">
            <p className="font-medium">{achievement.name}</p>
            <p className="text-sm">{achievement.description}</p>
            {!achievement.completed && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{achievement.progress} / {achievement.maxProgress}</span>
                </div>
                <Progress value={progressPercentage} className="h-1.5" />
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-1">
              {achievement.completed 
                ? "Achievement completed!" 
                : `Complete to earn ${achievement.xpReward} XP`}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type AchievementsListProps = {
  achievements: Achievement[];
  title?: string;
  description?: string;
  onSelect?: (achievement: Achievement) => void;
  selectedId?: string;
};

export function AchievementsList({ 
  achievements, 
  title = "Achievements", 
  description,
  onSelect,
  selectedId 
}: AchievementsListProps) {
  const completedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;
  const completionPercentage = (completedCount / totalCount) * 100;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {title}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <Badge variant="outline" className="px-2 py-1">
            {completedCount}/{totalCount} Completed
          </Badge>
        </div>
        <Progress value={completionPercentage} className="h-1 mt-2" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-3 md:grid-cols-2">
          {achievements.map((achievement) => (
            <AchievementCard 
              key={achievement.id}
              achievement={achievement}
              onClick={() => onSelect?.(achievement)}
              selected={selectedId === achievement.id}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}