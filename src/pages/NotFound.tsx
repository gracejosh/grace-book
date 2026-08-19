import { Link } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
        <p className="text-2xl font-bold mb-2">Page Not Found</p>
        <p className="text-slate-500 dark:text-slate-400 mb-8">The page you are looking for doesn't exist or has moved.</p>
        <Link to="/" className="btn-primary">
          <HomeIcon className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
