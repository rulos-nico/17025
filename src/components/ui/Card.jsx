/**
 * Card component for content containers
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.selected - Whether card is selected
 * @param {string} props.className - Additional CSS class
 */
import styles from './Card.module.css';

export function Card({ children, onClick, selected, className = '' }) {
  const classes = [
    styles.card,
    onClick ? styles.clickable : '',
    selected ? styles.selected : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div onClick={onClick} className={classes}>
      {children}
    </div>
  );
}

export default Card;
