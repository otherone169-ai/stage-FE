const authSnapshots = [
  {
    title: "Équipe alignée",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80",
    alt: "Équipe en réunion autour d'un projet"
  },
  {
    title: "Pilotage visuel",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    alt: "Analyse d'un tableau de bord"
  },
  {
    title: "Suivi quotidien",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    alt: "Travail collaboratif devant plusieurs écrans"
  }
];

const AuthIllustration = () => {
  return (
    <div className="illustration-container">
      <div className="auth-visual-stack">
        <div className="auth-visual-banner">
          <p className="auth-visual-kicker">Accès superviseur</p>
          <h2>Un espace clair pour se connecter et lancer le suivi.</h2>
          <p>
            Les comptes superviseurs disposent d’un parcours dédié, d’un retour vers l’accueil et d’un visuel plus concret.
          </p>
        </div>

        <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" className="illustration">
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.08 }} />
              <stop offset="100%" style={{ stopColor: 'var(--accent-alt)', stopOpacity: 0.08 }} />
            </linearGradient>
            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'var(--accent-alt)', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          <rect width="400" height="500" fill="url(#bgGradient)" rx="30" />
          <text x="200" y="40" fontSize="24" fontWeight="bold" textAnchor="middle" fill="var(--text-primary)">
            Flux de Travail
          </text>

          <g transform="translate(50, 80)">
            <circle cx="30" cy="30" r="35" fill="var(--accent)" opacity="0.15" />
            <circle cx="30" cy="30" r="25" fill="var(--accent)" opacity="0.3" />
            <g>
              <circle cx="30" cy="25" r="12" fill="none" stroke="var(--accent)" strokeWidth="2" />
              <line x1="40" y1="35" x2="45" y2="40" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
          <text x="50" y="160" fontSize="13" fontWeight="600" fill="var(--text-primary)" textAnchor="middle">
            Recherche
          </text>
          <text x="50" y="175" fontSize="11" fill="var(--text-muted)" textAnchor="middle">
            Découvrir les stages
          </text>

          <g transform="translate(110, 110)">
            <line x1="0" y1="0" x2="45" y2="0" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5,5" />
            <polygon points="45,0 40,-4 40,4" fill="var(--accent)" />
          </g>

          <g transform="translate(200, 80)">
            <circle cx="30" cy="30" r="35" fill="var(--accent-alt)" opacity="0.15" />
            <circle cx="30" cy="30" r="25" fill="var(--accent-alt)" opacity="0.3" />
            <g>
              <rect x="22" y="18" width="16" height="24" fill="none" stroke="var(--accent-alt)" strokeWidth="2" rx="2" />
              <line x1="26" y1="24" x2="34" y2="24" stroke="var(--accent-alt)" strokeWidth="1.5" />
              <line x1="26" y1="30" x2="34" y2="30" stroke="var(--accent-alt)" strokeWidth="1.5" />
              <line x1="26" y1="36" x2="30" y2="36" stroke="var(--accent-alt)" strokeWidth="1.5" />
            </g>
          </g>
          <text x="200" y="160" fontSize="13" fontWeight="600" fill="var(--text-primary)" textAnchor="middle">
            Candidature
          </text>
          <text x="200" y="175" fontSize="11" fill="var(--text-muted)" textAnchor="middle">
            Soumettre CV
          </text>

          <g transform="translate(250, 110)">
            <line x1="0" y1="0" x2="45" y2="0" stroke="var(--accent-alt)" strokeWidth="2" strokeDasharray="5,5" />
            <polygon points="45,0 40,-4 40,4" fill="var(--accent-alt)" />
          </g>

          <g transform="translate(350, 80)">
            <circle cx="30" cy="30" r="35" fill="var(--accent)" opacity="0.15" />
            <circle cx="30" cy="30" r="25" fill="var(--accent)" opacity="0.3" />
            <g>
              <rect x="22" y="32" width="4" height="12" fill="var(--accent)" />
              <rect x="28" y="26" width="4" height="18" fill="var(--accent)" />
              <rect x="34" y="29" width="4" height="15" fill="var(--accent)" />
            </g>
          </g>
          <text x="350" y="160" fontSize="13" fontWeight="600" fill="var(--text-primary)" textAnchor="middle">
            Suivi
          </text>
          <text x="350" y="175" fontSize="11" fill="var(--text-muted)" textAnchor="middle">
            Progrès en temps réel
          </text>

          <line x1="200" y1="190" x2="200" y2="230" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5,5" opacity="0.4" />
          <text x="200" y="265" fontSize="16" fontWeight="bold" textAnchor="middle" fill="var(--text-primary)">
            Vos Avantages
          </text>

          <g transform="translate(60, 290)">
            <circle cx="0" cy="0" r="18" fill="url(#iconGradient)" opacity="0.2" />
            <g>
              <circle cx="-6" cy="-2" r="4" fill="var(--accent)" />
              <path d="M -10 4 Q -10 2 -6 2 Q -2 2 -2 4" fill="var(--accent)" opacity="0.3" />
              <circle cx="6" cy="-2" r="4" fill="var(--accent-alt)" />
              <path d="M 2 4 Q 2 2 6 2 Q 10 2 10 4" fill="var(--accent-alt)" opacity="0.3" />
            </g>
          </g>
          <text x="60" y="330" fontSize="12" fontWeight="600" fill="var(--text-primary)" textAnchor="middle">
            Collaboration
          </text>

          <g transform="translate(200, 290)">
            <circle cx="0" cy="0" r="18" fill="url(#iconGradient)" opacity="0.2" />
            <g>
              <path d="M -8 2 L -8 -4 Q -8 -8 -4 -8 L 4 -8 Q 8 -8 8 -4 L 8 2" fill="none" stroke="var(--accent)" strokeWidth="2" />
              <rect x="-8" y="2" width="16" height="8" fill="none" stroke="var(--accent)" strokeWidth="2" rx="1" />
              <circle cx="0" cy="6" r="1.5" fill="var(--accent)" />
            </g>
          </g>
          <text x="200" y="330" fontSize="12" fontWeight="600" fill="var(--text-primary)" textAnchor="middle">
            Sécurité
          </text>

          <g transform="translate(340, 290)">
            <circle cx="0" cy="0" r="18" fill="url(#iconGradient)" opacity="0.2" />
            <g>
              <polygon points="0,-8 4,-2 2,-2 6,6 0,2 2,2" fill="var(--accent-alt)" />
            </g>
          </g>
          <text x="340" y="330" fontSize="12" fontWeight="600" fill="var(--text-primary)" textAnchor="middle">
            Rapide
          </text>

          <text x="200" y="460" fontSize="13" fill="var(--text-muted)" textAnchor="middle" fontStyle="italic">
            Gérez vos stages efficacement
          </text>
        </svg>

        <div className="auth-photo-grid">
          {authSnapshots.map((snapshot) => (
            <article className="auth-photo-card" key={snapshot.title}>
              <img src={snapshot.image} alt={snapshot.alt} loading="lazy" decoding="async" />
              <span>{snapshot.title}</span>
            </article>
          ))}
        </div>

        <div className="auth-visual-note">
          <strong>Retour accueil inclus</strong>
          <p>Le bouton en haut vous ramène à la page d’accueil à tout moment.</p>
        </div>
      </div>

      <style>{`
        .illustration-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 0;
        }

        .illustration {
          width: 100%;
          max-width: 100%;
          height: auto;
          filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.1));
        }

              `}</style>
    </div>
  );
};

export default AuthIllustration;
