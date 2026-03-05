import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { fetchPlayerById } from "../services/worldCupApi";

function formatLabelDate(rawDate) {
  if (!rawDate || rawDate === "Nao informado") {
    return "Nao informado";
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function shorten(text) {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "Sem resumo disponivel para este jogador.";
  }
  return cleaned.length > 260 ? `${cleaned.slice(0, 260)}...` : cleaned;
}

function translatePosition(position) {
  const value = (position ?? "").trim().toLowerCase();
  const map = {
    goalkeeper: "Goleiro",
    defender: "Defensor",
    "centre-back": "Zagueiro",
    "center-back": "Zagueiro",
    "right-back": "Lateral direito",
    "left-back": "Lateral esquerdo",
    midfielder: "Meio-campista",
    "defensive midfield": "Volante",
    "central midfield": "Meio-campista central",
    forward: "Atacante",
    "centre-forward": "Centroavante",
    "right winger": "Ponta direita",
    "left winger": "Ponta esquerda",
    striker: "Centroavante",
    manager: "Tecnico",
  };

  return map[value] ?? position ?? "Posicao nao informada";
}

function uniqueImages(values) {
  const seen = new Set();
  const images = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    images.push(value);
  }

  return images;
}

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

export default function PlayerPage() {
  const { playerId: routePlayerId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const playerId = decodeURIComponent(routePlayerId ?? "");
  const teamName = searchParams.get("team") ?? "Time";

  const [player, setPlayer] = useState(location.state?.player ?? null);
  const [loading, setLoading] = useState(!location.state?.player);
  const pageRef = useRef(null);

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
      gsap.from(".player-detail-card, .player-gallery-card", {
        opacity: 0,
        y: 22,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
      });
    }, pageRef);
    return () => context.revert();
  }, [player]);

  const photoCards = useMemo(() => {
    if (!player) {
      return [];
    }

    const images = uniqueImages(player.gallery?.length > 0 ? player.gallery : [player.image]);
    const source = images.length > 0 ? images : [""];

    return Array.from({ length: 9 }, (_, index) => ({
      id: `player-${player.id ?? "selected"}-${index}`,
      name: player.name,
      team: player.team,
      role: translatePosition(player.position),
      image: source[index % source.length],
    }));
  }, [player]);

  if (loading) {
    return <section className="page-card">Carregando detalhes do jogador...</section>;
  }

  if (!player) {
    return (
      <section className="page-card">
        <h2>Jogador nao encontrado.</h2>
        <Link to="/" className="text-link">
          Voltar para a pagina inicial
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
                <span>{getInitials(player.name)}</span>
              )}
            </div>
            <div>
              <h1>{player.name}</h1>
              <p>{player.team}</p>
              <p>{translatePosition(player.position)}</p>
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

          <p className="player-description">{shorten(player.description)}</p>
        </div>

        <section aria-label="Galeria com 9 fotos do jogador selecionado">
          <header className="squad-header">
            <h3 className="squad-title">Galeria do jogador</h3>
            <p className="players-hint squad-subtitle">
              Exibindo 9 cards com fotos da pessoa selecionada.
            </p>
          </header>

          <div className="player-grid player-gallery-grid">
            {photoCards.map((card, index) => (
              <article className="player-preview-card player-gallery-card" key={card.id}>
                <div className="player-card-media">
                  {card.image ? (
                    <img
                      src={card.image}
                      alt={`${card.name} - foto ${index + 1} de 9`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="player-card-fallback">{getInitials(card.name)}</div>
                  )}
                </div>

                <section className="player-card-content">
                  <h3>{card.name}</h3>
                  <p>{card.team}</p>
                  <div className="player-card-meta">
                    <span className="player-card-tag">Jogador</span>
                    <span className="player-card-action">{card.role}</span>
                  </div>
                </section>
              </article>
            ))}
          </div>
        </section>
      </article>
    </section>
  );
}
