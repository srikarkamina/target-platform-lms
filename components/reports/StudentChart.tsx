import React from "react";
import { Users } from "lucide-react";
import AnalyticsCard from "./AnalyticsCard";

interface GrowthData {
  month: string;
  count: number;
}

interface StudentChartProps {
  data: GrowthData[];
}

export default function StudentChart({ data }: StudentChartProps) {
  const maxVal = Math.max(...data.map((d) => d.count), 5);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const barWidth = Math.min(32, (innerWidth / data.length) * 0.6);
  const stepX = innerWidth / data.length;

  return (
    <AnalyticsCard
      title="Student Growth"
      description="Monthly registration trends for student accounts in the last 6 months"
      icon={Users}
    >
      <div className="w-full h-full min-h-[220px] flex flex-col justify-end">
        {data.length === 0 || data.every((d) => d.count === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 text-xs italic">
            No registration data available.
          </div>
        ) : (
          <div className="relative w-full h-[180px] pt-4">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="studentBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingTop + innerHeight * (1 - ratio);
                const labelVal = Math.round(maxVal * ratio);
                return (
                  <g key={idx} className="opacity-40">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {labelVal}
                    </text>
                  </g>
                );
              })}

              {/* Axis Line */}
              <line
                x1={paddingLeft}
                y1={chartHeight - paddingBottom}
                x2={chartWidth - paddingRight}
                y2={chartHeight - paddingBottom}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {/* Bars and Labels */}
              {data.map((item, idx) => {
                const x = paddingLeft + idx * stepX + (stepX - barWidth) / 2;
                const valueRatio = item.count / maxVal;
                const barHeight = Math.max(valueRatio * innerHeight, 4); // minimum 4px for visibility
                const y = chartHeight - paddingBottom - barHeight;

                return (
                  <g key={idx} className="group cursor-pointer">
                    {/* Hover tooltip placeholder */}
                    <rect
                      x={x - stepX * 0.2}
                      y={paddingTop}
                      width={barWidth + stepX * 0.4}
                      height={innerHeight + 5}
                      fill="transparent"
                      className="group-hover:fill-slate-50/50 transition-colors"
                    />
                    
                    {/* Visual Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="url(#studentBarGrad)"
                      rx="4"
                      className="transition-all duration-300 group-hover:fill-indigo-700"
                    />

                    {/* Value Label on Top of Bar */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      fill="#4f46e5"
                      fontSize="10"
                      fontWeight="extrabold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      {item.count}
                    </text>

                    {/* X Axis Month Label */}
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - paddingBottom + 16}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {item.month.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </AnalyticsCard>
  );
}
