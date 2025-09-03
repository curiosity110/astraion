import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const globalStyles = `
.astraion { color-scheme: light dark; min-height: 100vh; background: hsl(var(--background)); color: hsl(var(--foreground)); }
.astraion .navlink { color: hsl(var(--muted-foreground)); }

.astraion.light {
  --primary: 224 76% 15%;
  --primary-glow: 224 76% 25%;
  --accent: 43 96% 56%;
  --background: 210 40% 98%;
  --foreground: 224 71% 4%;
  --card: 0 0% 100%;
  --muted-foreground: 224 10% 40%;
  --danger: 0 72% 50%;

  --gradient-cosmic: linear-gradient(135deg, hsl(224 76% 15%), hsl(224 76% 25%));
  --gradient-stellar: linear-gradient(135deg, hsl(43 96% 56%), hsl(43 96% 70%));
  --shadow-cosmic: 0 10px 40px -10px hsl(224 76% 15% / 0.25);
}
.astraion.dark {
  --primary: 224 76% 70%;
  --accent: 43 96% 56%;
  --background: 224 71% 4%;
  --card: 224 76% 6%;
  --foreground: 210 40% 98%;
  --muted-foreground: 224 10% 70%;
  --danger: 0 72% 62%;

  --gradient-cosmic: linear-gradient(135deg, hsl(224 76% 20%), hsl(224 76% 35%));
  --gradient-stellar: linear-gradient(135deg, hsl(43 96% 56%), hsl(43 96% 70%));
  --shadow-cosmic: 0 10px 40px -10px hsl(224 76% 10% / 0.45);
}
`;

function AstraionCRM() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = globalStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <div className={`astraion ${theme} p-4`}>
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Astraion CRM</h1>
        <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </header>
      <p className="navlink">Manage your customers efficiently.</p>
    </div>
  );
}

export default AstraionCRM;
