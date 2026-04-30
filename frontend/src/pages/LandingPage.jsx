import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-brand">
          <span className="landing-brand-mark" />
          <div>
            <strong>StageFlow</strong>
            <p>Plateforme de gestion de stages</p>
          </div>
        </div>

        <nav className="landing-actions">
          <Link className="ghost-btn" to="/login">
            Se connecter
          </Link>
          <Link className="primary-btn" to={isAuthenticated ? "/app/dashboard" : "/register"}>
            {isAuthenticated ? "Ouvrir la plateforme" : "Demarrer"}
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="hero-tag">Recherche de stage + pilotage entreprise</p>
            <h1>
              Relier les etudiants aux bonnes opportunites et aider les entreprises a gerer leurs stages
              efficacement
            </h1>
            <p>
              StageFlow centralise la publication d offres, les candidatures, les taches et les rapports de stage.
            </p>
            <div className="hero-cta">
              <Link className="primary-btn" to={isAuthenticated ? "/app/internships" : "/register"}>
                Explorer les opportunites
              </Link>
              <Link className="ghost-btn" to="#features">
                Voir les fonctionnalites
              </Link>
            </div>
          </div>

          <div className="hero-panel" aria-hidden="true">
            <article>
              <span>Opportunites actives</span>
              <strong>+120</strong>
            </article>
            <article>
              <span>Candidatures suivies</span>
              <strong>98%</strong>
            </article>
            <article>
              <span>Suivi stagiaire</span>
              <strong>Simple</strong>
            </article>
          </div>
        </section>

        <section id="features" className="landing-section">
          <div className="section-head">
            <p>Fonctionnalites principales</p>
            <h2>Un flux complet de la candidature au suivi de stage</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>Recherche de stages</h3>
              <p>Trouver une offre avec quelques filtres simples.</p>
            </article>
            <article className="feature-card">
              <h3>Pipeline candidature</h3>
              <p>Postuler et suivre chaque candidature avec un statut clair.</p>
            </article>
            <article className="feature-card">
              <h3>Suivi des missions</h3>
              <p>
                Gestion des taches, mises a jour de progression, feedbacks superviseur et avancement du stage.
              </p>
            </article>
            <article className="feature-card">
              <h3>Rapports valides</h3>
              <p>Soumettre un rapport, recevoir un retour, puis corriger si besoin.</p>
            </article>
          </div>
        </section>

        <section id="roles" className="landing-section">
          <div className="section-head">
            <p>Pour chaque acteur</p>
            <h2>Des experiences adaptees a chaque role</h2>
          </div>

          <div className="role-grid">
            <article className="role-card student">
              <h3>Etudiant</h3>
              <ul>
                <li>Rechercher des offres de stage</li>
                <li>Postuler et suivre ses candidatures</li>
                <li>Mettre a jour son avancement de mission</li>
              </ul>
            </article>

            <article className="role-card company">
              <h3>Entreprise</h3>
              <ul>
                <li>Publier et administrer les offres</li>
                <li>Evaluer les candidatures et assigner un superviseur</li>
                <li>Suivre les stagiaires et leur progression</li>
              </ul>
            </article>

            <article className="role-card supervisor">
              <h3>Superviseur</h3>
              <ul>
                <li>Accompagner les stagiaires sur les taches</li>
                <li>Donner des feedbacks reguliers</li>
                <li>Valider les livrables et la progression</li>
              </ul>
            </article>

            <article className="role-card admin">
              <h3>Administrateur</h3>
              <ul>
                <li>Superviser utilisateurs et moderation</li>
                <li>Activer, suspendre ou supprimer des comptes</li>
                <li>Garantir la qualite et la conformite des operations</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="landing-cta">
          <h2>Prets a fluidifier votre gestion des stages ?</h2>
          <p>
            Lancez votre espace en quelques minutes pour connecter les talents aux bonnes equipes.
          </p>
          <div className="hero-cta">
            <Link className="primary-btn" to={isAuthenticated ? "/app/dashboard" : "/register"}>
              Creer un compte
            </Link>
            <Link className="ghost-btn" to="/login">
              J ai deja un compte
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
