import { Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";

export default function NotFoundPage() {
  useSeo({
    title: "Página não encontrada | GameGrid",
    description: "A página solicitada não existe no GameGrid.",
    path: "/404",
    robots: "noindex,nofollow",
  });

  return (
    <section className="page-card not-found-card">
      <p className="not-found-code">404</p>
      <h1>Página não encontrada</h1>
      <p>
        A página que você tentou acessar não existe. Verifique o endereço e tente
        novamente.
      </p>
      <Link to="/" className="home-button">
        Voltar para o início
      </Link>
    </section>
  );
}
