import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page-card not-found-card">
      <p className="not-found-code">404</p>
      <h1>Rota não encontrada</h1>
      <p>
        A página que você tentou acessar não existe. Verifique o endereço e tente
        novamente.
      </p>
      <Link to="/" className="home-button">
        Voltar para a Home
      </Link>
    </section>
  );
}
