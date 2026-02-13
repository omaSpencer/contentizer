import { Link, useLocation } from 'react-router-dom';

const nav = [
  { path: '/', label: 'Optimize' },
  { path: '/history', label: 'History' },
];

export function TopBar() {
  const location = useLocation();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <nav className="flex gap-1 px-4 py-2">
        {nav.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location.pathname === path
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
