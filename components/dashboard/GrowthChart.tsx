import React from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface GrowthChartProps {
  data: DataPoint[];
  type?: "bar" | "line";
  color?: "indigo" | "blue" | "emerald" | "purple" | "rose" | "amber";
  chartHeight?: number;
}

export default function GrowthChart({
  data,
  type = "bar",
  color = "indigo",
  chartHeight = 160,
}: GrowthChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 5);
  const chartWidth = 500;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = innerWidth / (data.length || 1);

  const colors = {
    indigo: {
      gradStart: "#4f46e5",
      gradStop: "#818cf8",
      hover: "group-hover:fill-indigo-700",
      text: "text-indigo-650 dark:text-indigo-400",
      stroke: "#4f46e5",
    },
    blue: {
      gradStart: "#2563eb",
      gradStop: "#60a5fa",
      hover: "group-hover:fill-blue-700",
      text: "text-blue-600 dark:text-blue-400",
      stroke: "#2563eb",
    },
    emerald: {
      gradStart: "#059669",
      gradStop: "#34d399",
      hover: "group-hover:fill-emerald-700",
      text: "text-emerald-600 dark:text-emerald-400",
      stroke: "#059669",
    },
    purple: {
      gradStart: "#7c3aed",
      gradStop: "#a78bfa",
      hover: "group-hover:fill-purple-700",
      text: "text-purple-650 dark:text-purple-400",
      stroke: "#7c3aed",
    },
    rose: {
      gradStart: "#e11d48",
      gradStop: "#fb7185",
      hover: "group-hover:fill-rose-700",
      text: "text-rose-650 dark:text-rose-400",
      stroke: "#e11d48",
    },
    amber: {
      gradStart: "#d97706",
      gradStop: "#fbbf24",
      hover: "group-hover:fill-amber-700",
      text: "text-amber-600 dark:text-amber-400",
      stroke: "#d97706",
    },
  };

  const activeColor = colors[color];
  const barWidth = Math.min(28, stepX * 0.5);

  // Generate SVG path for line chart
  const points = data.map((d, idx) => {
    const x = paddingLeft + idx * stepX + stepX / 2;
    const ratio = d.value / maxVal;
    const y = chartHeight - paddingBottom - ratio * innerHeight;
    return { x, y };
  });

  const linePath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
    : "";

  return (
    <div className="w-full h-[180px] pt-4 flex flex-col justify-end">
      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 text-xs italic">
          No data available.
        </div>
      ) : (
        <div className="relative w-full h-full">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeColor.gradStart} />
                <stop offset="100%" stopColor={activeColor.gradStop} />
              </linearGradient>
              <linearGradient id={`areaGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeColor.gradStart} stopOpacity="0.3" />
                <stop offset="100%" stopColor={activeColor.gradStop} stopOpacity="0.0" />
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
                    x={paddingLeft - 8}
                    y={y + 3}
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

            {/* Base Axis Line */}
            <line
              x1={paddingLeft}
              y1={chartHeight - paddingBottom}
              x2={chartWidth - paddingRight}
              y2={chartHeight - paddingBottom}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />

            {/* Render BAR Chart */}
            {type === "bar" &&
              data.map((item, idx) => {
                const x = paddingLeft + idx * stepX + (stepX - barWidth) / 2;
                const valueRatio = item.value / maxVal;
                const barHeight = Math.max(valueRatio * innerHeight, 4);
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
                      className="group-hover:fill-slate-50/10 dark:group-hover:fill-slate-800/10 transition-colors"
                    />

                    {/* Visual Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={`url(#grad-${color})`}
                      rx="3"
                      className={`transition-all duration-350 ${activeColor.hover}`}
                    />

                    {/* Value Label on Top */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      fill={activeColor.gradStart}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      {item.value}
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
                      {item.label}
                    </text>
                  </g>
                );
              })}

            {/* Render LINE Chart */}
            {type === "line" && (
              <>
                {/* Area under the line */}
                {areaPath && (
                  <path d={areaPath} fill={`url(#areaGrad-${color})`} />
                )}
                {/* Visual Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={activeColor.stroke}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {/* Interactive dots */}
                {points.map((p, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill={activeColor.stroke}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-200 group-hover:r-6"
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="12"
                      fill="transparent"
                      className="group-hover:fill-slate-50/10 dark:group-hover:fill-slate-800/10 transition-colors"
                    />
                    {/* Value Label */}
                    <text
                      x={p.x}
                      y={p.y - 10}
                      fill={activeColor.gradStart}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      {data[idx].value}
                    </text>
                    {/* X Axis Label */}
                    <text
                      x={p.x}
                      y={chartHeight - paddingBottom + 16}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {data[idx].label}
                    </text>
                  </g>
                ))}
              </>
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
