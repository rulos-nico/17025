/**
 * Card component for content containers
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.selected - Whether card is selected
 * @param {Object} props.style - Additional inline styles
 */
export function Card({ children, onClick, selected, style = {} }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: onClick ? 'pointer' : 'default',
        border: selected ? '2px solid #3B82F6' : '2px solid transparent',
        transition: 'all 0.2s',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Card;
