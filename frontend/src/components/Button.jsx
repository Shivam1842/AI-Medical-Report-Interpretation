import { Link } from 'react-router-dom';

export default function Button({
  children,
  variant = 'primary',
  to,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const classes = ['btn', `btn--${variant}`, className].filter(Boolean).join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
