import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { usePrivacy } from "../context/PrivacyContext";
import { seoDefaults, useSeo } from "../hooks/useSeo";

export default function PrivacyPage() {
  const { uiText } = useLanguage();
  const { preferences, setAllowRemotePoll, clearLocalData } = usePrivacy();
  const [clearStatus, setClearStatus] = useState("");

  useSeo({
    title: uiText.privacy.pageTitle,
    description: uiText.privacy.pageDescription,
    path: "/privacidade",
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: uiText.privacy.heading,
      description: uiText.privacy.pageDescription,
      url: `${seoDefaults.siteUrl}/privacidade`,
    },
  });

  const handleClearLocalData = async () => {
    await clearLocalData();
    setClearStatus(uiText.privacy.clearSuccess);
  };

  return (
    <section className="privacy-page">
      <article className="page-card">
        <span className="privacy-kicker">{uiText.privacy.kicker}</span>
        <h1 className="privacy-title">{uiText.privacy.heading}</h1>
        <p className="privacy-lead">{uiText.privacy.intro}</p>
        <p className="privacy-note">{uiText.privacy.lastUpdated}</p>
      </article>

      <div className="privacy-grid">
        <article className="page-card privacy-card">
          <h2>{uiText.privacy.localTitle}</h2>
          <p>{uiText.privacy.localBody}</p>
        </article>

        <article className="page-card privacy-card">
          <h2>{uiText.privacy.remoteTitle}</h2>
          <p>{uiText.privacy.remoteBody}</p>
        </article>

        <article className="page-card privacy-card">
          <h2>{uiText.privacy.rightsTitle}</h2>
          <p>{uiText.privacy.rightsBody}</p>
        </article>

        <article className="page-card privacy-card">
          <h2>{uiText.privacy.servicesTitle}</h2>
          <p>{uiText.privacy.servicesBody}</p>
        </article>

        <article className="page-card privacy-card">
          <h2>{uiText.privacy.contactTitle}</h2>
          <p>{uiText.privacy.contactBody}</p>
          <a
            href="mailto:linckv@hotmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            linckv@hotmail.com
          </a>
        </article>
      </div>

      <article className="page-card privacy-controls-card">
        <h2>{uiText.privacy.controlsTitle}</h2>
        <p>{uiText.privacy.controlsBody}</p>

        <label className="privacy-toggle">
          <span>
            <strong>{uiText.privacy.remoteToggleTitle}</strong>
            <small>{uiText.privacy.remoteToggleHint}</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.allowRemotePoll}
            onChange={(event) => setAllowRemotePoll(event.target.checked)}
          />
        </label>

        <div className="privacy-controls-actions">
          <button type="button" className="privacy-danger-button" onClick={handleClearLocalData}>
            {uiText.privacy.clearButton}
          </button>
          {clearStatus ? <p className="privacy-success">{clearStatus}</p> : null}
        </div>
      </article>
    </section>
  );
}
