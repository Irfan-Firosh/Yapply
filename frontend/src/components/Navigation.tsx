import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCandidateAuth } from "@/contexts/CandidateAuthContext";

interface NavigationProps {
  variant?: "landing" | "company" | "candidate";
}

const Navigation = ({ variant = "landing" }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { logout, isAuthenticated } = useAuth();
  const { logout: candidateLogout } = useCandidateAuth();

  const handleLogout = () => {
    logout();
  };

  const handleCandidateLogout = () => {
    candidateLogout();
    navigate("/");
  };

  if (variant === "landing") {
    return (
      <nav className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 py-6">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          Yapply
        </Link>
        
        <div className="flex items-center gap-6">
          <Link 
            to="/company/login" 
            className="nav-link"
          >
            Company Portal
          </Link>
        </div>
      </nav>
    );
  }

  if (variant === "company") {
    return (
      <nav className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/company/dashboard" className="text-xl font-semibold tracking-tight">
              Yapply
            </Link>
            
            <div className="flex items-center gap-6">
              <Link 
                to="/company/dashboard" 
                className={cn(
                  "nav-link",
                  currentPath === "/company/dashboard" && "nav-link-active"
                )}
              >
                Dashboard
              </Link>
              <Link 
                to="/company/schedule" 
                className={cn(
                  "nav-link",
                  currentPath === "/company/schedule" && "nav-link-active"
                )}
              >
                Schedule Interview
              </Link>

              <button 
                onClick={handleLogout}
                className="nav-link hover:text-primary transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (variant === "candidate") {
    return (
      <nav className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/candidate/dashboard" className="text-xl font-semibold tracking-tight">
              Yapply
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return null;
};

export default Navigation;