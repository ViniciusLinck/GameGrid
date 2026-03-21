import ProfileAuraCanvas from "./ProfileAuraCanvas";

function getInitials(name) {
  const initials = (name ?? "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return initials || "??";
}

export default function ProfileShowcaseCard({
  variant = "panel",
  title,
  subtitle = "",
  eyebrow = "",
  badge = "",
  description = "",
  metricValue = "",
  metricLabel = "",
  image = "",
  imageAlt = "",
  fallbackText = "",
  mediaClassName = "",
  className = "",
  showAura = false,
  children,
}) {
  return (
    <article className={`profile-showcase-card profile-showcase-card-${variant} ${className}`.trim()}>
      {showAura ? <ProfileAuraCanvas className="profile-showcase-aura" /> : null}

      <div className="profile-showcase-shell">
        <div className={`profile-showcase-media ${mediaClassName}`.trim()}>
          {image ? (
            <img src={image} alt={imageAlt || title} loading="lazy" />
          ) : (
            <div className="profile-showcase-fallback">{fallbackText || getInitials(title)}</div>
          )}
        </div>

        <div className="profile-showcase-copy">
          {eyebrow ? <p className="profile-showcase-eyebrow">{eyebrow}</p> : null}

          <div className="profile-showcase-heading">
            <h3>{title}</h3>
            {badge ? <span className="profile-showcase-pill">{badge}</span> : null}
          </div>

          {subtitle ? <p className="profile-showcase-subtitle">{subtitle}</p> : null}
          {description ? <p className="profile-showcase-description">{description}</p> : null}

          {metricValue || metricLabel ? (
            <div className="profile-showcase-metric">
              {metricValue ? <strong>{metricValue}</strong> : null}
              {metricLabel ? <span>{metricLabel}</span> : null}
            </div>
          ) : null}

          {children ? <div className="profile-showcase-extra">{children}</div> : null}
        </div>
      </div>
    </article>
  );
}
