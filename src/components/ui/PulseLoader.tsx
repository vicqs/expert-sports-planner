import { useEffect, useRef, useState } from "react";
import "./PulseLoader.css";

/**
 * Full-screen / inline loading indicator. The "Activity" heartbeat/pulse
 * waveform (same silhouette used in the brand logo) IS the progress bar:
 * the EKG line draws itself in from 0% to 100% via stroke-dashoffset, and
 * its color shifts from brand purple/blue up to success green as it fills.
 * Loops since there's no real progress source for lazy-loaded routes /
 * mock-data waits.
 *
 * @param {string} label - Text shown under the waveform (default "Cargando...")
 * @param {boolean} fullScreen - Center within the full viewport height
 */
const PROGRESS_COLOR_STOPS: [number, [number, number, number]][] = [
  [0, [124, 58, 237]], // --color-primary-purple
  [50, [59, 130, 246]], // --color-primary-blue
  [100, [16, 185, 129]], // --color-success
];

function colorForProgress(progress: number): string {
  let lower = PROGRESS_COLOR_STOPS[0];
  let upper = PROGRESS_COLOR_STOPS[PROGRESS_COLOR_STOPS.length - 1];
  for (let i = 0; i < PROGRESS_COLOR_STOPS.length - 1; i++) {
    if (
      progress >= PROGRESS_COLOR_STOPS[i][0] &&
      progress <= PROGRESS_COLOR_STOPS[i + 1][0]
    ) {
      lower = PROGRESS_COLOR_STOPS[i];
      upper = PROGRESS_COLOR_STOPS[i + 1];
      break;
    }
  }
  const [lowStop, lowRgb] = lower;
  const [highStop, highRgb] = upper;
  const range = highStop - lowStop || 1;
  const t = Math.min(1, Math.max(0, (progress - lowStop) / range));
  const r = Math.round(lowRgb[0] + (highRgb[0] - lowRgb[0]) * t);
  const g = Math.round(lowRgb[1] + (highRgb[1] - lowRgb[1]) * t);
  const b = Math.round(lowRgb[2] + (highRgb[2] - lowRgb[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Same silhouette as lucide-react's "Activity" icon (viewBox 0 0 24 24),
// but with the path direction reversed so it draws left-to-right instead
// of right-to-left as progress increases.
const ACTIVITY_PATH = "M2 12h4l3-9l6 18l3-9h4";

const PulseLoader = ({
  label = "Cargando...",
  fullScreen = true,
  className = "",
}: {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}) => {
  const [progress, setProgress] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  useEffect(() => {
    let value = 0;
    const interval = setInterval(() => {
      // Eases toward 100 then loops back, so it never feels "stuck" on
      // long-running loads (there's no real progress source to bind to).
      value = value >= 100 ? 0 : value + Math.max(1, (100 - value) / 12);
      setProgress(Math.min(100, Math.round(value)));
    }, 90);
    return () => clearInterval(interval);
  }, []);

  const barColor = colorForProgress(progress);

  return (
    <div
      className={`pulse-loader ${fullScreen ? "pulse-loader-fullscreen" : ""} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        className="pulse-loader-waveform"
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Faint track showing the full waveform shape */}
        <path
          d={ACTIVITY_PATH}
          className="pulse-loader-track"
          strokeWidth="2"
        />
        {/* Colored fill that draws itself in as `progress` increases */}
        <path
          ref={pathRef}
          d={ACTIVITY_PATH}
          className="pulse-loader-fill"
          strokeWidth="2.5"
          style={{
            stroke: barColor,
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength - (progress / 100) * pathLength,
            filter: `drop-shadow(0 0 4px ${barColor})`,
          }}
        />
      </svg>

      <span className="pulse-loader-percent" style={{ color: barColor }}>
        {progress}%
      </span>
      <span className="pulse-loader-label">{label}</span>
    </div>
  );
};

export default PulseLoader;
