import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";

export function DashboardPage() {
  const { user } = useAuth();
  return <main className="dashboard"><h1>Dashboard</h1><p className="lead">Find, evaluate, and track your next opportunity.</p><section className="dashboard-actions"><Link className="action-tile" to="/jobs"><strong>Find jobs</strong><span>Search fresh opportunities</span></Link><Link className="action-tile" to="/recommendations"><strong>Recommendations</strong><span>See jobs matched to your profile</span></Link><Link className="action-tile" to="/applications"><strong>Application tracker</strong><span>Review your pipeline</span></Link></section><div className="dashboard-note"><h2>Welcome, {user?.name}</h2><p>Complete your profile and resume to improve personalized matching.</p><Link to="/profile">Review profile →</Link></div></main>;
}
