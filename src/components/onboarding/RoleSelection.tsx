import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Users, Loader2 } from "lucide-react";

interface RoleSelectionProps {
  onRoleSelect: (role: "mentor" | "mentee") => void;
  loading: boolean;
}

const RoleSelection = ({ onRoleSelect, loading }: RoleSelectionProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
      <Card className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/50">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Become a Mentor</CardTitle>
          <CardDescription>
            Share your expertise and guide others on their learning journey
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Share your knowledge and experience</li>
            <li>• Set your own schedule and rates</li>
            <li>• Build a community of learners</li>
            <li>• Earn money helping others</li>
          </ul>
          <Button
            onClick={() => onRoleSelect("mentor")}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "I want to be a Mentor"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/50">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Find a Mentor</CardTitle>
          <CardDescription>
            Connect with experienced professionals to accelerate your growth
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Learn from industry experts</li>
            <li>• Get personalized guidance</li>
            <li>• Accelerate your career growth</li>
            <li>• Build valuable connections</li>
          </ul>
          <Button
            onClick={() => onRoleSelect("mentee")}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "I want to find a Mentor"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelection;