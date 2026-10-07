import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  async function handleLogout() { await logout(); navigate("/login"); }
  return <div className="app-shell"><aside className="sidebar"><Link className="brand" to="/dashboard">RoleScout</Link><p className="sidebar-label">Workspace</p><nav><NavLink to="/dashboard">Dashboard</NavLink><NavLink to="/jobs">Jobs</NavLink><NavLink to="/recommendations">Recommendations</NavLink><NavLink to="/applications">Applications</NavLink><NavLink to="/analytics">Analytics</NavLink><NavLink to="/searches">Searches</NavLink></nav><p className="sidebar-label">Profile</p><nav><NavLink to="/resume">Resume</NavLink><NavLink to="/profile">Profile</NavLink></nav><div className="sidebar-footer"><span>{user?.name}</span><button className="button-link" onClick={handleLogout}>Log out</button></div></aside><header className="mobile-topbar"><Link className="brand" to="/dashboard">RoleScout</Link><nav className="mobile-nav"><NavLink to="/jobs">Jobs</NavLink><NavLink to="/recommendations">Rec.</NavLink><NavLink to="/applications">Apps</NavLink><NavLink to="/profile">Profile</NavLink></nav><button className="button-link" onClick={handleLogout}>Log out</button></header><Outlet /></div>;
}
