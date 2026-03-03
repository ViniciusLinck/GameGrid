import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { fetchPlayerById } from "../services/worldCupApi";

function formatLabelDate(rawDate) {
  if (!rawDate || rawDate === "Não informado") {
    return "Não informado";
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export default function PlayerPage() {
  const { playerId: routePlayerId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [player, setPlayer] = useState(location.state?.player ?? null);
  const [loading, setLoading] = useState(!location.state?.player);
  const pageRef = useRef(null);

  const playerId = decodeURIComponent(routePlayerId ?? "");
  const teamName = searchParams.get("team") ?? "Time";

  useEffect(() => {
    if (location.state?.player) {
      return;
    }

    let mounted = true;
    setLoading(true);
    fetchPlayerById(playerId, teamName).then((payload) => {
      if (!mounted) {
        return;
      }
      setPlayer(payload);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [location.state, playerId, teamName]);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from(".player-detail-card", {
        opacity: 0,
        y: 22,
        duration: 0.55,
        ease: "power2.out",
      });
    }, pageRef);
    return () => context.revert();
  }, [player]);

  if (loading) {
    return <section className="page-card">Carregando dados do jogador...</section>;
  }

  if (!player) {
    return (
      <section className="page-card">
        <h2>Jogador não encontrado.</h2>
        <Link to="/" className="text-link">
          Voltar para a home
        </Link>
      </section>
    );
  }

  return (
    <section ref={pageRef}>
      <article className="page-card">
        <Link to={`/time/${encodeURIComponent(teamName)}`} className="text-link">
          ← Voltar ao time
        </Link>

        <div className="player-detail-card">
          <div className="player-detail-top">
            <div className="player-avatar large">
              {player.image ? (
                <img src={player.image} alt={player.name} />
              ) : (
                <span>{player.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1>{player.name}</h1>
              <p>{player.team}</p>
              <p>{player.position}</p>
            </div>
          </div>

          <div className="player-detail-grid">
            <div>
              <span>Nacionalidade</span>
              <strong>{player.nationality}</strong>
            </div>
            <div>
              <span>Nascimento</span>
              <strong>{formatLabelDate(player.birth)}</strong>
            </div>
            <div>
              <span>Altura</span>
              <strong>{player.height}</strong>
            </div>
            <div>
              <span>Peso</span>
              <strong>{player.weight}</strong>
            </div>
          </div>

          <p className="player-description">{player.description}</p>
        </div>
      </article>
    </section>
  );
}
