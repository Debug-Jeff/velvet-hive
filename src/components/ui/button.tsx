import * as React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth, ...props }, ref) => (
    <button
      ref={ref}
      className={`btn btn-${variant} btn-${size}${fullWidth ? ' btn-full' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button }
