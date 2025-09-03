import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'default' | 'stellar' | 'cosmic'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export default function Button({ variant = 'default', className = '', ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    default: 'btn',
    stellar: 'btn btn-stellar',
    cosmic: 'btn btn-cosmic',
  }
  return <button className={`${variants[variant]} ${className}`} {...props} />
}
