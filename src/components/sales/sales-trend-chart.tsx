"use client";

import { useId, useState } from "react";
import { formatNaira } from "@/lib/currency";

type DayTotal = { label: string; date: string; total: number };

const WIDTH = 700;
const HEIGHT = 220;
const PADDING_LEFT = 56;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;
const BAR_MAX_THICKNESS = 24;

function niceMax(value: number) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function SalesTrendChart({ data }: { data: DayTotal[] }) {
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);

  const max = niceMax(Math.max(...data.map((d) => d.total), 1));
  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const slotWidth = plotWidth / data.length;
  const barWidth = Math.min(BAR_MAX_THICKNESS, slotWidth * 0.5);

  const yFor = (value: number) => PADDING_TOP + plotHeight * (1 - value / max);
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Total sales for each of the last 7 days"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a6200" />
            <stop offset="100%" stopColor="#3a6200" />
          </linearGradient>
        </defs>

        {gridSteps.map((step) => {
          const y = PADDING_TOP + plotHeight * (1 - step);
          return (
            <g key={step}>
              <line
                x1={PADDING_LEFT}
                x2={WIDTH - PADDING_RIGHT}
                y1={y}
                y2={y}
                stroke="#e2e2d8"
                strokeWidth={1}
              />
              <text
                x={PADDING_LEFT - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fill="#898781"
              >
                {step === 0 ? "0" : formatNaira(max * step).replace(".00", "")}
              </text>
            </g>
          );
        })}

        {data.map((day, index) => {
          const slotX = PADDING_LEFT + index * slotWidth;
          const barX = slotX + (slotWidth - barWidth) / 2;
          const barTop = yFor(day.total);
          const barHeight = Math.max(0, PADDING_TOP + plotHeight - barTop);
          const isHovered = hovered === index;

          return (
            <g key={day.date}>
              <rect
                x={barX}
                y={barTop}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={`url(#${gradientId})`}
                opacity={isHovered ? 0.8 : 1}
              />
              {/* Larger invisible hit target for hover/focus */}
              <rect
                x={slotX}
                y={PADDING_TOP}
                width={slotWidth}
                height={plotHeight}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${day.label}: ${formatNaira(day.total)}`}
                onPointerEnter={() => setHovered(index)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
              />
              <text
                x={slotX + slotWidth / 2}
                y={HEIGHT - PADDING_BOTTOM + 16}
                textAnchor="middle"
                fontSize={9}
                fill="#898781"
              >
                {day.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-brand-green/20 bg-white px-3 py-2 text-xs shadow-md"
          style={{
            left: `${((PADDING_LEFT + (hovered + 0.5) * slotWidth) / WIDTH) * 100}%`,
            top: `${(yFor(data[hovered].total) / HEIGHT) * 100}%`,
          }}
        >
          <p className="font-medium text-brand-green">
            {formatNaira(data[hovered].total)}
          </p>
          <p className="text-muted-foreground">{data[hovered].label}</p>
        </div>
      )}
    </div>
  );
}
