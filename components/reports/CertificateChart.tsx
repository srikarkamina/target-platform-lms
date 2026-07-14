import React from "react";
import { Medal } from "lucide-react";
import AnalyticsCard from "./AnalyticsCard";

interface GrowthData {
  month: string;
  count: number;
}

interface CertificateChartProps {
  data: GrowthData[];
}

export default function CertificateChart({ data }: CertificateChartProps) {
  const maxVal = Math.max(...data.map((d) => d.count), 5);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = innerWidth / (data.length - 1 || 1);

  // Build the SVG path points
  const points = data.map((item, idx) => {
    const x = paddingLeft + idx * stepX;
    const valueRatio = item.count / maxVal;
    const y = chartHeight - paddingBottom - valueRatio * innerHeight;
    return { x, y, count: item.count, label: item.month.split(" ")[0] };
  });

  // SVG path string for line
  const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // SVG path string for filled area
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
    : "";

  return (
    <AnalyticsCard
      title="Certificates Issued"
      description="Monthly certificate issuance performance and trends in the last 6 months"
      icon={Medal}
    >
      <div className="w-full h-full min-h-[220px] flex flex-col justify-end">
        {data.length === 0 || data.every((d) => d.count === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 text-xs italic">
            No certificate issuance records found.
          </div>
        ) : (
          <div className="relative w-full h-[180px] pt-4">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="certAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
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

              {/* Shaded Area */}
              {areaPath && (
                <path d={areaPath} fill="url(#certAreaGrad)" className="transition-all duration-300" />
              )}

              {/* Main Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Interactive Node Points and Tooltips */}
              {points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  {/* Invisible hover area */}
                  <circle cx={p.x} cy={p.y} r="12" fill="transparent" />

                  {/* Outer circle marker */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    className="transition-all duration-300 group-hover:r-7 group-hover:stroke-emerald-600"
                  />

                  {/* Inner dot */}
                  <circle cx={p.x} cy={p.y} r="2" fill="#10b981" />

                  {/* Tooltip Label on Hover */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <rect
                      x={p.x - 18}
                      y={p.y - 26}
                      width="36"
                      height="18"
                      fill="#0f172a"
                      rx="4"
                    />
                    <text
                      x={p.x}
                      y={p.y - 14}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {p.count}
                    </text>
                  </g>

                  {/* X Axis label */}
                  <text
                    x={p.x}
                    y={chartHeight - paddingBottom + 16}
                    fill="#64748b"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>
    </AnalyticsCard>
  );
}
