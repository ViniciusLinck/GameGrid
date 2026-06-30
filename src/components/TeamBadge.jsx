import { getFlagByTeamName } from "../utils/flags";

function getInitials(name) {
  if (!name) {
    return "?";
  }

  const parts = name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function TeamBadge({ name, flagSrc: explicitFlagSrc = "", tooltip = null, tooltipId = "" }) {
  const flagSrc = explicitFlagSrc || getFlagByTeamName(name);
  const hasTooltip = Boolean(tooltip);

  return (
    <div
      className={`team-badge ${hasTooltip ? "team-badge-has-tooltip" : ""}`}
      tabIndex={hasTooltip ? 0 : undefined}
      aria-describedby={hasTooltip ? tooltipId : undefined}
    >
      <div className="team-icon" aria-hidden="true">
        {flagSrc ? (
          <img src={flagSrc} alt="" loading="lazy" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      <strong>{name}</strong>
      {hasTooltip ? (
        <span id={tooltipId} className="team-badge-tooltip" role="tooltip">
          {tooltip}
        </span>
      ) : null}
    </div>
  );
}
