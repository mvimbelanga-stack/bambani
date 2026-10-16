import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { CATEGORY_STATS, WEEKLY_STATS } from "@/lib/wcu/data";
import { useWcu } from "@/lib/wcu/store";

export const Route = createFileRoute("/tools/stats")({
  head: () => ({
    meta: [
      { title: "Crime Stats — World Crime Unicorn" },
      {
        name: "description",
        content: "Crime trends, resolution rates and category breakdowns for your area, week by week.",
      },
      { property: "og:title", content: "Crime Stats — World Crime Unicorn" },
      {
        property: "og:description",
        content: "See what crime looks like in your area: trends, categories and resolution rates.",
      },
    ],
  }),
  component: CrimeStats,
});

const BAR_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function CrimeStats() {
  const { city } = useWcu();

  return (
    <AppShell>
      <ScreenHeader title="Crime Stats" subtitle={city} back="/home" />

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-3">
          <p className="text-xs text-muted-foreground">Reports this week</p>
          <p className="font-display text-2xl font-bold">154</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-alert">
            <TrendingUp className="h-3.5 w-3.5" /> 12% vs last week
          </p>
        </div>
        <div className="glass rounded-2xl p-3">
          <p className="text-xs text-muted-foreground">Resolved</p>
          <p className="font-display text-2xl font-bold">93</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-safe">
            <TrendingDown className="h-3.5 w-3.5" /> Response time down 8%
          </p>
        </div>
      </div>

      <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">
        REPORTS VS RESOLVED
      </h2>
      <div className="glass h-56 rounded-2xl p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={WEEKLY_STATS} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
            />
            <Line type="monotone" dataKey="reports" stroke="var(--chart-4)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="resolved" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">
        BY CATEGORY
      </h2>
      <div className="glass h-60 rounded-2xl p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CATEGORY_STATS} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 20 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip
              cursor={{ fill: "color-mix(in oklab, var(--electric) 12%, transparent)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {CATEGORY_STATS.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AppShell>
  );
}
