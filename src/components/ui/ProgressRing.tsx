import React from "react";
import "./ProgressRing.css";

/**
 * Animated Progress Ring with gradient
 * @param {number} progress - Progress value (0-100)
 * @param {number} size - Ring size in pixels
 * @param {number} stroke - Stroke width
 * @param {string} label - Optional text inside ring
 * @param {boolean} showPercent - Show percentage text
 */
const ProgressRing = ({
  progress = 0,
  size = 120,
  stroke = 8,
  label = "",
  showPercent = true,
  className = "",
}) => {
  const normalizedRadius = (size - stroke) / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`progress-ring ${className}`}
      style={{ width: size, height: size }}
    >
      <svg height={size} width={size}>
        <defs>
          <linearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--color-primary-purple)" />
            <stop offset="100%" stopColor="var(--color-primary-blue)" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          className="progress-ring-bg"
          stroke="var(--color-surface-hover)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="progress-ring-circle"
          stroke="url(#progressGradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="progress-ring-content">
        {showPercent && (
          <div className="progress-ring-percent">{Math.round(progress)}%</div>
        )}
        {label && <div className="progress-ring-label">{label}</div>}
      </div>
    </div>
  );
};

export default ProgressRing;
