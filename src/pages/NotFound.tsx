
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:sunrise-gradient">
      <div className="text-center p-8 rounded-lg bg-white/80 dark:bg-card/40 backdrop-blur-sm shadow-lg">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-foreground">404</h1>
        <p className="text-xl text-gray-600 dark:text-muted-foreground mb-4">Oops! Page not found</p>
        <a href="/" className="text-primary hover:text-accent dark:text-primary dark:hover:text-accent underline transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
