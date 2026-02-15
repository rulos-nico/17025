/**
 * Badge component for status indicators
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.color - Background color (hex)
 */
import styles from './Badge.module.css';

export function Badge({ children, color = '#6B7280' }) {
  return (
    <span className={styles.badge} style={{ backgroundColor: color }}>
      {children}
    </span>
  );
}

export default Badge;
