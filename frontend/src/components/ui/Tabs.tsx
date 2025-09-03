import { ReactNode, useState } from 'react';

export function Tabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div className="flex border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${active === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.map((t) => (
          <div key={t.id} className={active === t.id ? 'block' : 'hidden'}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
