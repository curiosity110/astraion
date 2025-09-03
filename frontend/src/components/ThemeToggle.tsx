import Button from './Button';

export default function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return (
    <Button className="ml-auto" onClick={onToggle}>
      {theme === 'light' ? 'Dark' : 'Light'} Mode
    </Button>
  );
}
