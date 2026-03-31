import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { usePrivacy } from "../context/PrivacyContext";

export default function PrivacyBanner() {
  const { uiText } = useLanguage();
  const { preferences, acknowledgePrivacy } = usePrivacy();

  if (preferences.acknowledged) {
    return null;
  }

  return (
    <section className="privacy-banner page-card" aria-label={uiText.privacy.bannerAria}>
      <div className="privacy-banner-copy">
        <span className="privacy-banner-kicker">{uiText.privacy.bannerKicker}</span>
        <h2>{uiText.privacy.bannerTitle}</h2>
        <p>{uiText.privacy.bannerBody}</p>
      </div>

      <div className="privacy-banner-actions">
        <Link to="/privacidade" className="privacy-banner-link">
          {uiText.privacy.manageLink}
        </Link>
        <button type="button" className="privacy-banner-button" onClick={acknowledgePrivacy}>
          {uiText.privacy.bannerButton}
        </button>
      </div>
    </section>
  );
}
