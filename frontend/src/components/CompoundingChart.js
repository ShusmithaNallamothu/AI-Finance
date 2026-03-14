import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const formatDollar = (val) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-sm border border-stone-100 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-bold text-stone-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-stone-600">
          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold">${entry.value?.toLocaleString()}</span>
        </p>
      ))}
      {payload.length === 2 && (
        <p className="text-emerald-600 font-semibold mt-1 pt-1 border-t border-stone-100">
          Growth: ${(payload[0].value - payload[1].value).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export const CompoundingChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div data-testid="compounding-chart" className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF8BA7" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#FF8BA7" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="contributedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12, fill: "#9CA3AF" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatDollar}
            tick={{ fontSize: 12, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="balance"
            name="Total Balance"
            stroke="#FF8BA7"
            strokeWidth={3}
            fill="url(#balanceGrad)"
            dot={false}
            activeDot={{ r: 5, fill: "#FF8BA7", stroke: "#fff", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="contributed"
            name="Your Contributions"
            stroke="#A78BFA"
            strokeWidth={2}
            fill="url(#contributedGrad)"
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 4, fill: "#A78BFA", stroke: "#fff", strokeWidth: 2 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
            iconType="circle"
            iconSize={8}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
