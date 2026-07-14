import React from "react";

interface ActivityDay {
  day: string;
  dateStr: string;
  count: number;
}

interface ActivityTimelineProps {
  data: ActivityDay[];
  loading?: boolean;
}

export default function ActivityTimeline({ data, loading = false }: ActivityTimelineProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 5);
  const chartHeight = 120;
  const chartWidth = 500;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = innerWidth / (data.length || 1);
  const barWidth = Math.min(24, stepX * 0.4);

  if (loading) {
    return (
      <div className="w-full h-[150px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-xs text-slate-400 dark:text-slate-500">Loading timeline...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full h-[130px]">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = paddingTop + innerHeight * (1 - ratio);
            const labelVal = Math.round(maxCount * ratio);
            return (
              <g key={idx} className="opacity-30">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  fill="#475569"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* X Axis line */}
          <line
            x1={paddingLeft}
            y1={chartHeight - paddingBottom}
            x2={chartWidth - paddingRight}
            y2={chartHeight - paddingBottom}
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Bars */}
          {data.map((day, idx) => {
            const x = paddingLeft + idx * stepX + (stepX - barWidth) / 2;
            const ratio = day.count / maxCount;
            const barHeight = Math.max(ratio * innerHeight, 2);
            const y = chartHeight - paddingBottom - barHeight;

            return (
              <g key={idx} className="group cursor-pointer">
                {/* Visual Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#timelineGrad)"
                  rx="3"
                  className="transition-all duration-300 group-hover:fill-indigo-700"
                />

                {/* Hover value tooltip */}
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  fill="#4f46e5"
                  fontSize="8"
                  fontWeight="extrabold"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {day.count}
                </text>

                {/* Day labels */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - paddingBottom + 13}
                  fill="#475569"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {day.day}
                </text>

                {/* Date labels */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - paddingBottom + 22}
                  fill="#94a3b8"
                  fontSize="7.5"
                  fontWeight="medium"
                  textAnchor="middle"
                >
                  {day.dateStr}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
