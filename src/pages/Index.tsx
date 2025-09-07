import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { Users, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

const Index = () => {
  const metricsData = [
    {
      title: "Total Users",
      value: "2,847",
      change: "12.5%",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Revenue",
      value: "$45,231",
      change: "8.2%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Orders",
      value: "1,423",
      change: "3.1%",
      changeType: "negative" as const,
      icon: ShoppingCart,
    },
    {
      title: "Growth Rate",
      value: "23.5%",
      change: "2.4%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
  ];

  const barChartData = [
    { name: "Jan", value: 4000 },
    { name: "Feb", value: 3000 },
    { name: "Mar", value: 5000 },
    { name: "Apr", value: 4500 },
    { name: "May", value: 6000 },
    { name: "Jun", value: 5500 },
  ];

  const lineChartData = [
    { name: "Week 1", value: 1200 },
    { name: "Week 2", value: 1900 },
    { name: "Week 3", value: 1700 },
    { name: "Week 4", value: 2200 },
    { name: "Week 5", value: 2800 },
    { name: "Week 6", value: 3200 },
  ];

  const pieChartData = [
    { name: "Desktop", value: 45 },
    { name: "Mobile", value: 35 },
    { name: "Tablet", value: 20 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your business.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsData.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Revenue"
          type="bar"
          data={barChartData}
        />
        <ChartCard
          title="User Growth"
          type="line"
          data={lineChartData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Traffic Sources"
          type="pie"
          data={pieChartData}
          className="lg:col-span-1"
        />
        <div className="lg:col-span-2 bg-gradient-card rounded-lg border border-border/50 p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: "New user registered", time: "2 minutes ago", type: "user" },
              { action: "Payment received", time: "5 minutes ago", type: "payment" },
              { action: "Order completed", time: "12 minutes ago", type: "order" },
              { action: "New feature deployed", time: "1 hour ago", type: "system" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                <span className="text-sm text-foreground">{activity.action}</span>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
