import React from "react";
import "./Card.css";

/**
 * Modern Card Component with glassmorphism
 * @param {boolean} glass - Use glassmorphism effect
 * @param {boolean} hover - Enable hover lift effect
 * @param {string} gradient - Optional gradient overlay: 'purple-blue' | 'radial'
 * @param {ReactNode} children - Card content
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
  gradient?: string | null;
}

const Card = ({
  glass = false,
  hover = false,
  gradient = null,
  className = "",
  children,
  ...props
}: CardProps) => {
  const cardClass = [
    "card",
    glass && "card-glass",
    hover && "card-hover",
    gradient && `card-gradient-${gradient}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass} {...props}>
      {children}
    </div>
  );
};

export default Card;
