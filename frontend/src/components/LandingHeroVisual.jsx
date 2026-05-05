const LandingHeroVisual = () => {
  const heroSnapshots = [
    {
      title: "Réunion d’équipe",
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
      alt: "Équipe travaillant ensemble autour d'une table"
    },
    {
      title: "Tableau de bord",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
      alt: "Écran avec un tableau de bord analytique"
    },
    {
      title: "Travail concentré",
      image:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      alt: "Personne travaillant devant plusieurs écrans"
    }
  ];

  return (
    <div className="landing-hero-visual" aria-hidden="true">
      <div className="landing-hero-visual-glow" />

      <div className="landing-hero-card landing-hero-card-main">
        <div className="hero-card-topline">
          <span className="hero-pill is-live">Pipeline actif</span>
          <span className="hero-chip">IA + suivi</span>
        </div>

        <div className="hero-dashboard-grid">
          <article>
            <span>Projets créés</span>
            <strong>18</strong>
          </article>
          <article>
            <span>CV analysés</span>
            <strong>92%</strong>
          </article>
          <article>
            <span>Stagiaires suivis</span>
            <strong>64</strong>
          </article>
          <article>
            <span>Tâches en cours</span>
            <strong>128</strong>
          </article>
        </div>

        <div className="hero-timeline">
          <div className="hero-timeline-step is-complete">
            <span />
            <p>Création de projet</p>
          </div>
          <div className="hero-timeline-step is-complete">
            <span />
            <p>Add Intern</p>
          </div>
          <div className="hero-timeline-step is-active">
            <span />
            <p>Analyse IA</p>
          </div>
          <div className="hero-timeline-step">
            <span />
            <p>Assignation</p>
          </div>
        </div>

        <div className="hero-snapshot-grid">
          {heroSnapshots.map((snapshot) => (
            <article className="hero-snapshot-card" key={snapshot.title}>
              <img src={snapshot.image} alt={snapshot.alt} loading="lazy" decoding="async" />
              <span>{snapshot.title}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="landing-hero-floating-card landing-hero-floating-card-left">
        <strong>Matching CV</strong>
        <p>n8n détecte les compétences clés et les compare au projet.</p>
      </div>

      <div className="landing-hero-floating-card landing-hero-floating-card-right">
        <strong>Suivi temps réel</strong>
        <p>Les tâches, validations et progrès restent visibles au même endroit.</p>
      </div>
    </div>
  );
};

export default LandingHeroVisual;