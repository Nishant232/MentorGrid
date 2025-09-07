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

  // Get user stats from user_stats table
  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      // Get user stats from user_stats table
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') { // PGRST116 is not found error
        throw statsError;
      }

      // Get user achievements count
      const { data: achievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      if (achievementsError) {
        throw achievementsError;
      }

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
          achievements_count: achievements?.length || 0
        };
      }
      
      return {
        user_id: userId,
        total_xp: userStats.xp || 0,
        level: this.calculateLevel(userStats.xp || 0),
        streak_days: userStats.current_streak_days || 0,
        sessions_completed: userStats.total_sessions_completed || (sessions?.length || 0) + (mentorSessions?.length || 0),
        achievements_count: achievements?.length || 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  // Get leaderboard data with time frame filter
  static async getLeaderboard(timeFrame: 'weekly' | 'monthly' | 'all-time' = 'all-time', limit = 10): Promise<LeaderboardEntry[]> {
    try {
      // Get user stats with profiles
      let query = supabase
        .from('user_stats')
        .select(`
          user_id,
          xp,
          current_streak_days,
          total_sessions_completed,
          profiles!inner(username, avatar_url, primary_category)
        `);

      // Apply time frame filter if not all-time
      if (timeFrame === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gte('last_updated', oneWeekAgo.toISOString());
      } else if (timeFrame === 'monthly') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        query = query.gte('last_updated', oneMonthAgo.toISOString());
      }

      // Execute query and order by XP
      const { data, error } = await query.order('xp', { ascending: false }).limit(limit);

      if (error) throw error;

      // Get user achievements counts
      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('user_id, achievement_id');

      if (achievementsError) {
        console.error('Error fetching user achievements:', achievementsError);
      }

      // Count achievements per user
      const achievementCounts: Record<string, number> = {};
      userAchievements?.forEach(ua => {
        achievementCounts[ua.user_id] = (achievementCounts[ua.user_id] || 0) + 1;
      });

      // Map to LeaderboardEntry type
      return data?.map((entry: any, index: number) => ({
        rank: index + 1,
        user_id: entry.user_id,
        username: entry.profiles?.username || 'Unknown User',
        avatar_url: entry.profiles?.avatar_url || '',
        total_xp: entry.xp || 0,
        level: this.calculateLevel(entry.xp || 0),
        streak_days: entry.current_streak_days || 0,
        achievements_count: achievementCounts[entry.user_id] || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
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

  // Award XP to user and update streak
  static async awardXP(userId: string, xp: number, action: string) {
    try {
      // Get current date in UTC
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get user stats to check last active date
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (statsError && statsError.code !== 'PGRST116') { // PGRST116 is not found error
        throw statsError;
      }
      
      // If user stats don't exist, create them
      if (!userStats) {
        const { error: insertError } = await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            xp: xp,
            current_streak_days: 1,
            longest_streak_days: 1,
            last_active_date: today.toISOString().split('T')[0]
          });
          
        if (insertError) throw insertError;
        
        // Insert XP event
        await supabase.from('xp_events').insert({
          user_id: userId,
          event_type: action,
          amount: xp
        });
        
        return true;
      }
      
      // Calculate streak
      let newStreak = userStats.current_streak_days || 0;
      let longestStreak = userStats.longest_streak_days || 0;
      const lastActiveDate = userStats.last_active_date ? new Date(userStats.last_active_date) : null;
      
      // If last active date is yesterday, increment streak
      if (lastActiveDate) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActiveDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
          // Yesterday - increment streak
          newStreak += 1;
        } else if (lastActiveDate.toISOString().split('T')[0] !== today.toISOString().split('T')[0]) {
          // Not yesterday and not today - reset streak
          newStreak = 1;
        }
        // If today, keep streak the same
      } else {
        // No last active date - start streak
        newStreak = 1;
      }
      
      // Update longest streak if current streak is longer
      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }
      
      // Update user stats
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({
          xp: (userStats.xp || 0) + xp,
          current_streak_days: newStreak,
          longest_streak_days: longestStreak,
          last_active_date: today.toISOString().split('T')[0]
        })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // Insert XP event
      await supabase.from('xp_events').insert({
        user_id: userId,
        event_type: action,
        amount: xp
      });
      
      // Check for streak achievements
      if (newStreak >= 7) {
        await this.checkAndAwardStreakAchievement(userId, newStreak);
      }
      
      return true;
    } catch (error) {
      console.error('Error awarding XP:', error);
      return false;
    }
  }

  // Check and unlock achievements based on user activity
  static async checkAchievements(userId: string) {
    try {
      // Get user stats
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (statsError) throw statsError;
      
      // Get all achievements
      const achievements = await this.getAllAchievements();
      
      // Check each achievement condition
      for (const achievement of achievements) {
        if (achievement.condition_type === 'sessions_completed' && 
            userStats.total_sessions_completed >= achievement.condition_value) {
          await this.awardAchievement(userId, achievement.id);
        }
        
        if (achievement.condition_type === 'streak_days' && 
            userStats.current_streak_days >= achievement.condition_value) {
          await this.awardAchievement(userId, achievement.id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return false;
    }
  }
  
  // Award an achievement to a user
  static async awardAchievement(userId: string, achievementId: string) {
    try {
      // Check if user already has this achievement
      const { data, error: checkError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId);
      
      if (checkError) throw checkError;
      
      // If user doesn't have this achievement, award it
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            completed: true,
            completed_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
        
        // Get achievement details to award XP
        const achievement = await this.getAchievementById(achievementId);
        if (achievement && achievement.xp_reward) {
          await this.awardXP(userId, achievement.xp_reward, 'achievement_unlocked');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return false;
    }
  }
  
  // Get achievement by ID
  static async getAchievementById(achievementId: string): Promise<Achievement | null> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();
      
      if (error) throw error;
      
      return data as Achievement;
    } catch (error) {
      console.error('Error getting achievement:', error);
      return null;
    }
  }
  
  // Check and award streak achievements
  static async checkAndAwardStreakAchievement(userId: string, streakDays: number) {
    try {
      // Get streak achievements
      const { data: achievements, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('condition_type', 'streak_days');
      
      if (error) throw error;
      
      // Check each streak achievement
      for (const achievement of achievements) {
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