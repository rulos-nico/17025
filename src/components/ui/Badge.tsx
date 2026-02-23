/**
 * Badge component for status indicators
 */
import { ReactNode, CSSProperties } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  children: ReactNode;
  color?: string;
  small?: boolean;
  style?: CSSProperties;
}

export function Badge({ children, color = '#6B7280', small, style }: BadgeProps) {
  const className = small ? `${styles.badge} ${styles.small}` : styles.badge;
  return (
    <span className={className} style={{ backgroundColor: color, ...style }}>
      {children}
    </span>
  );
}

export default Badge;
