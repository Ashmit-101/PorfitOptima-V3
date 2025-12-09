import React from 'react';
import { Package, TrendingUp, TrendingDown, DollarSign, AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

function MetricCard({ title, value, change, trend, sparklineData, sparklineColor }) {
  const container = 'bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100';
  const label = 'text-gray-600 text-sm font-medium';
  const valueCls = 'text-3xl font-bold text-gray-900';
  const badgeBase = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border';
  const badgeClasses = trend === 'up'
    ? 'bg-green-50 text-green-700 border-green-200'
    : trend === 'down'
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-gray-50 text-gray-700 border-gray-200';
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;

  // Icon selection per metric title
  const MetricIcon = (() => {
    if (title === 'Total Products') return Package;
    if (title === 'Avg Profit Margin') return TrendingUp;
    if (title === 'Monthly Profit') return DollarSign;
    if (title === 'Low Margin Alerts') return AlertTriangle;
    return Package;
  })();

  const iconTheme = (() => {
    if (title === 'Total Products') return { bg: 'bg-blue-100', text: 'text-blue-600' };
    if (title === 'Avg Profit Margin') return { bg: 'bg-green-100', text: 'text-green-600' };
    if (title === 'Monthly Profit') return { bg: 'bg-purple-100', text: 'text-purple-600' };
    if (title === 'Low Margin Alerts') return { bg: 'bg-red-100', text: 'text-red-600' };
    return { bg: 'bg-gray-100', text: 'text-gray-600' };
  })();

  return (
    <div className={container}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between mb-3">
          <p className={label}>{title}</p>
          <div className={`p-2.5 rounded-lg shadow-sm ${iconTheme.bg}`}>
            <MetricIcon className={`w-5 h-5 ${iconTheme.text}`} />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <h3 className={valueCls}>{value}</h3>
          <span className={`${badgeBase} ${badgeClasses}`}>
            <TrendIcon className="w-3 h-3" />
            {change}
          </span>
        </div>
        {sparklineData && (
          <div className="h-12 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`metricSpark_${title.replace(/\s+/g,'_')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={sparklineColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={sparklineColor} strokeWidth={2} fill={`url(#metricSpark_${title.replace(/\s+/g,'_')})`} animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
