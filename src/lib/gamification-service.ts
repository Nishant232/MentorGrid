import { supabase } from "@/integrations/supabase/client";
import { mockLeaderboard } from "./mock-data";

export interface UserStats {
  user_id: string;
  total_xp: number;
  level: number;
  streak_days: number;
  sessions_completed: number;
  achievements_count: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  max_progress: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  achievement?: Achievement;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  rank: number;
  achievements_count: number;
  streak_days?: number;
}

export class GamificationService {
  // Calculate XP based on different actions
  static calculateXP(action: 'session_completed' | 'session_hosted' | 'review_given' | 'review_received', rating?: number) {
    const baseXP = {
      session_completed: 50,
      session_hosted: 100,
      review_given: 10,
      review_received: rating ? rating * 5 : 25,
    };
    
    return baseXP[action];
  }

  // Calculate level based on total XP
  static calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / 1000) + 1;
  }

  // Get achievements for a user (mock implementation)
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      // Mock achievements based on user activity
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          name: 'First Session',
          description: 'Complete your first mentoring session',
          icon: '🎯',
          category: 'sessions',
          xp_reward: 100,
          condition_type: 'sessions_completed',
          condition_value: 1
        },
        {
          id: '2', 
          name: 'Mentor of the Month',
          description: 'Complete 10 sessions in a month',
          icon: '⭐',
          category: 'sessions',
          xp_reward: 500,
          condition_type: 'sessions_completed',
          condition_value: 10
        }
      ];
      
      return mockAchievements;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  }

  // Get user stats from leaderboard table (using existing data)
  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      // Get user stats from leaderboard table instead of user_stats
      const { data: userStats, error: statsError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') { // PGRST116 is not found error
        throw statsError;
      }

      // Get user achievements count (using a mock count since table doesn't exist)
      const achievementsCount = 0; // Mock achievements count

      // Get completed sessions count
      const { data: sessions, error: sessionsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('mentee_user_id', userId)
        .eq('status', 'completed');

      const { data: mentorSessions, error: mentorSessionsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('mentor_user_id', userId)
        .eq('status', 'completed');

      if (sessionsError || mentorSessionsError) {
        throw sessionsError || mentorSessionsError;
      }

      // If no user stats, return default values
      if (!userStats) {
        return {
          user_id: userId,
          total_xp: 0,
          level: 1,
          streak_days: 0,
          sessions_completed: (sessions?.length || 0) + (mentorSessions?.length || 0),
          achievements_count: achievementsCount
        };
      }
      
      return {
        user_id: userId,
        total_xp: userStats.xp || 0,
        level: this.calculateLevel(userStats.xp || 0),
        streak_days: userStats.current_streak_days || 0,
        sessions_completed: (sessions?.length || 0) + (mentorSessions?.length || 0),
        achievements_count: achievementsCount
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  // Get leaderboard data with time frame filter
  static async getLeaderboard(timeFrame: 'weekly' | 'monthly' | 'all-time' = 'all-time', limit = 10): Promise<LeaderboardEntry[]> {
    try {
      // Get leaderboard data from existing leaderboard table
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('xp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Map to LeaderboardEntry type
      return data?.map((entry: any, index: number) => ({
        rank: index + 1,
        user_id: entry.user_id,
        username: entry.full_name || 'Unknown User',
        avatar_url: entry.avatar_url || '',
        total_xp: entry.xp || 0,
        level: this.calculateLevel(entry.xp || 0),
        streak_days: entry.current_streak_days || 0,
        achievements_count: 0 // Mock value since achievements table doesn't exist
      })) || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return mockLeaderboard.map((entry, index) => ({
        rank: index + 1,
        user_id: entry.user_id,
        username: entry.full_name,
        avatar_url: entry.avatar_url,
        total_xp: entry.xp,
        level: this.calculateLevel(entry.xp),
        streak_days: entry.current_streak_days,
        achievements_count: 0
      }));
    }
  }

  // Get all available achievements (mock implementation)
  static async getAllAchievements(): Promise<Achievement[]> {
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        name: 'First Session',
        description: 'Complete your first mentoring session',
        icon: '🎯',
        category: 'sessions',
        xp_reward: 100,
        condition_type: 'sessions_completed',
        condition_value: 1
      },
      {
        id: '2',
        name: 'Mentor of the Month',
        description: 'Complete 10 sessions in a month',
        icon: '⭐',
        category: 'sessions',
        xp_reward: 500,
        condition_type: 'sessions_completed',
        condition_value: 10
      },
      {
        id: '3',
        name: 'Review Master',
        description: 'Receive 50 5-star reviews',
        icon: '🌟',
        category: 'reviews',
        xp_reward: 300,
        condition_type: 'reviews_received',
        condition_value: 50
      }
    ];
    
    return mockAchievements;
  }

  // Award XP to user and update streak (using leaderboard table)
  static async awardXP(userId: string, xp: number, action: string) {
    try {
      // Update or create leaderboard entry
      const { data: existingEntry, error: fetchError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingEntry) {
        // Create new leaderboard entry
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, role')
          .eq('user_id', userId)
          .single();

        const { error: insertError } = await supabase
          .from('leaderboard')
          .insert({
            user_id: userId,
            full_name: profile?.full_name || 'Unknown User',
            avatar_url: profile?.avatar_url,
            role: profile?.role || 'mentee',
            xp: xp,
            current_streak_days: 1
          });

        if (insertError) throw insertError;
      } else {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('leaderboard')
          .update({
            xp: (existingEntry.xp || 0) + xp,
            current_streak_days: (existingEntry.current_streak_days || 0) + 1
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      }

      return true;
    } catch (error) {
      console.error('Error awarding XP:', error);
      return false;
    }
  }

  // Check and unlock achievements based on user activity (using mock data)
  static async checkAchievements(userId: string) {
    try {
      // Get user stats from leaderboard
      const userStats = await this.getUserStats(userId);
      
      if (!userStats) return false;
      
      // Get all achievements
      const achievements = await this.getAllAchievements();
      
      // Check each achievement condition
      for (const achievement of achievements) {
        if (achievement.condition_type === 'sessions_completed' && 
            userStats.sessions_completed >= achievement.condition_value) {
          await this.awardAchievement(userId, achievement.id);
        }
        
        if (achievement.condition_type === 'streak_days' && 
            userStats.streak_days >= achievement.condition_value) {
          await this.awardAchievement(userId, achievement.id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return false;
    }
  }
  
  // Award an achievement to a user (mock implementation)
  static async awardAchievement(userId: string, achievementId: string) {
    try {
      // Mock achievement awarding since user_achievements table doesn't exist
      console.log(`Awarding achievement ${achievementId} to user ${userId}`);
      
      // Get achievement details to award XP
      const allAchievements = await this.getAllAchievements();
      const achievement = allAchievements.find(a => a.id === achievementId);
      if (achievement && achievement.xp_reward) {
        await this.awardXP(userId, achievement.xp_reward, 'achievement_unlocked');
      }
      
      return true;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return false;
    }
  }
  
  // Get achievement by ID (mock implementation)
  static async getAchievementById(achievementId: string): Promise<Achievement | null> {
    try {
      const allAchievements = await this.getAllAchievements();
      return allAchievements.find(a => a.id === achievementId) || null;
    } catch (error) {
      console.error('Error getting achievement:', error);
      return null;
    }
  }
  
  // Check and award streak achievements (mock implementation)
  static async checkAndAwardStreakAchievement(userId: string, streakDays: number) {
    try {
      // Get all achievements and filter for streak achievements
      const allAchievements = await this.getAllAchievements();
      const streakAchievements = allAchievements.filter(a => a.condition_type === 'streak_days');
      
      // Check each streak achievement
      for (const achievement of streakAchievements) {
        if (streakDays >= achievement.condition_value) {
          await this.awardAchievement(userId, achievement.id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking streak achievements:', error);
      return false;
    }
  }
}

export const gamificationService = new GamificationService();