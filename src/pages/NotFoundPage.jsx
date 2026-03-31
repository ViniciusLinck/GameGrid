import { Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";
import { useLanguage } from "../context/LanguageContext";

export default function NotFoundPage() {
  const { uiText } = useLanguage();

  useSeo({
    title: uiText.notFound.title,
    description: uiText.notFound.description,
    path: "/404",
    robots: "noindex,nofollow",
  });

  return (
    <section className="page-card not-found-card">
      <p className="not-found-code">404</p>
      <h1>{uiText.notFound.heading}</h1>
      <p>{uiText.notFound.body}</p>
      <Link to="/" className="home-button">
        {uiText.notFound.backHome}
      </Link>
    </section>
  );
}
