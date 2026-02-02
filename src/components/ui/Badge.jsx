/**
 * Badge component for status indicators
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.color - Background color (hex)
 */
export function Badge({ children, color = '#6B7280' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: color,
        color: 'white',
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
