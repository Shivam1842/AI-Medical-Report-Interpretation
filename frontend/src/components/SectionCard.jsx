export default function SectionCard({ title, subtitle, children, className = '' }) {
  const classes = ['section-card', className].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      {(title || subtitle) && (
        <div className="section-card__header">
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
