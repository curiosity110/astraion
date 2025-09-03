import { ButtonHTMLAttributes } from 'react';

export default function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl px-4 py-2 font-medium text-white shadow-[var(--shadow-cosmic)] bg-[var(--gradient-cosmic)] hover:opacity-90 transition ${className}`}
    />
  );
}
