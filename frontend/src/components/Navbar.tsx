import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useWebSocket } from './WebSocketProvider';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/trips', label: 'Trips' },
  { href: '/clients', label: 'Clients' },
];

export default function Navbar() {
  const { connected } = useWebSocket();
  return (
    <Disclosure as="nav" className="bg-primary text-white">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Disclosure.Button className="sm:hidden inline-flex items-center justify-center rounded-md p-2">
                  {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                </Disclosure.Button>
                <div className="hidden sm:flex sm:space-x-4">
                  {links.map((l) => (
                    <a key={l.href} href={l.href} className="px-3 py-2 font-semibold">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
              <span className={`h-3 w-3 rounded-full ${connected ? 'bg-success' : 'bg-gray-300'}`}></span>
            </div>
          </div>
          <Disclosure.Panel className="sm:hidden px-2 pb-3 space-y-1">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="block px-3 py-2 font-semibold">
                {l.label}
              </a>
            ))}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
