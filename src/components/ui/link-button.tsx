'use client'

import Link from 'next/link'
import { Button, type ButtonProps } from './button'

interface LinkButtonProps extends ButtonProps {
  href: string
  children: React.ReactNode
}

export function LinkButton({ 
  href, 
  children, 
  variant = 'default', 
  size = 'default',
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Button asChild variant={variant} size={size} className={className} {...props}>
      <Link href={href}>{children}</Link>
    </Button>
  )
}
