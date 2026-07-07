import * as React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

function Badge({ className = '', ...props }: BadgeProps) {
  return <span className={`badge${className ? ` ${className}` : ''}`} {...props} />
}

export { Badge }
