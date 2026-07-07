import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => (
    <input className={`input${className ? ` ${className}` : ''}`} ref={ref} {...props} />
  )
)
Input.displayName = 'Input'

export { Input }
