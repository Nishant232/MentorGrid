import { Trophy, TrendingUp, Award, Star } from "lucide-react"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api-service"
import { useNavigate } from "react-router-dom"

type UiEntry = {
  rank: number
  name: string
  title: string
  points: number
  streak: number
  badges: string[]
  avatar: string
  change: string
}

const LeaderboardPreview = () => {
  const topMentees = [
    {
      rank: 1,
      name: "Ethan Carter",
      progress: 85,
      badge: "Rising Star"
    },
    {
      rank: 2,
      name: "Olivia Bennett", 
      progress: 78,
      badge: "Goal Getter"
    },
    {
      rank: 3,
      name: "Noah Thompson",
      progress: 72,
      badge: "Most Improved"
    },
    {
      rank: 4,
      name: "Ava Rodriguez",
      progress: 68,
      badge: "Active Learner"
    }
  ];

  return (
    <section className="py-20 bg-gray-800">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Top Mentees Leaderboard
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Celebrating the dedication and progress of our community members.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-700/50 rounded-xl p-8">
            <div className="grid grid-cols-4 gap-6 mb-6 pb-4 border-b border-gray-600">
              <div className="text-white font-semibold text-lg">Rank</div>
              <div className="text-white font-semibold text-lg">Mentee</div>
              <div className="text-white font-semibold text-lg">Progress</div>
              <div className="text-white font-semibold text-lg">Badges</div>
            </div>
            
            {topMentees.map((mentee, index) => (
              <div key={index} className="grid grid-cols-4 gap-6 py-4 items-center">
                <div className="text-white font-bold text-xl">{mentee.rank}</div>
                <div className="text-white font-medium">{mentee.name}</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-600 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${mentee.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-white text-sm font-medium">{mentee.progress}%</span>
                </div>
                <div className="text-white text-sm font-medium">{mentee.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardPreview;