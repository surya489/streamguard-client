import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <section className="auth-wrap">
      <div className="auth-layout not-found-layout">
        <article className="auth-card not-found-card">
          <p className="dashboard-kicker">Error 404</p>
          <h1>
            <AlertCircle className="title-lucide" size={22} /> Page not found
          </h1>
          <p>The page you are trying to open does not exist or may have been moved.</p>

          <div className="not-found-actions">
            <Link to="/" className="table-link">
              <Home size={15} /> Go Home
            </Link>
            <button type="button" className="ghost-btn" onClick={() => window.history.back()}>
              <ArrowLeft size={15} /> Go Back
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

