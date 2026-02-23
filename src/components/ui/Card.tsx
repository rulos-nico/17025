/**
 * Card component for content containers
 */
import { ReactNode, MouseEvent } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  selected?: boolean;
  className?: string;
}

export function Card({ children, onClick, selected, className = '' }: CardProps) {
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
