import { useState } from 'react'
import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useWebSocket } from './WebSocketProvider'
import Button from './ui/Button'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/trips', label: 'Trips' },
  { href: '/clients', label: 'Clients' },
];

export default function Navbar() {
  const { connected } = useWebSocket()
  const [dark, setDark] = useState(
    document.documentElement.classList.contains('dark'),
  )

  const toggleTheme = () => {
    const root = document.documentElement
    if (root.classList.contains('dark')) {
      root.classList.remove('dark')
      setDark(false)
    } else {
      root.classList.add('dark')
      setDark(true)
    }
  }

  return (
    <Disclosure as="nav" className="bg-primary text-primary-foreground">
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
              <div className="flex items-center space-x-4">
                <Button onClick={toggleTheme} variant="stellar">
                  {dark ? 'Light' : 'Dark'}
                </Button>
                <span
                  className={`h-3 w-3 rounded-full ${connected ? 'bg-success' : 'bg-foreground/30'}`}
                ></span>
              </div>
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
  )
}
