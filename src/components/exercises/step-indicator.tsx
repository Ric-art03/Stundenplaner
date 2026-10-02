'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Basis', description: 'Name & Beschreibung' },
  { label: 'Einordnung', description: 'Sportart & Alter' },
  { label: 'Logistik', description: 'Dauer & Material' },
  { label: 'Extras', description: 'Varianten & Links' },
]

interface StepIndicatorProps {
  currentStep: number
  maxVisited?: number
  onStepClick?: (step: number) => void
}

export function StepIndicator({ currentStep, maxVisited = currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Wizard-Fortschritt" className="mb-8">
      <ol className="flex items-center justify-center px-4">
        {STEPS.map((step, index) => {
          const isComplete = index < currentStep
          const isCurrent = index === currentStep
          const isVisited = index <= maxVisited && !isCurrent
          const isClickable = isVisited && onStepClick

          function handleClick() {
            if (isClickable) onStepClick(index)
          }

          return (
            <li key={step.label} className="flex items-center">
              {index > 0 && (
                <div
                  className={cn(
                    'h-0.5 w-12 sm:w-20 mx-2',
                    index <= currentStep ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
              {/* Circle + label */}
              <div
                className={cn(
                  'flex flex-col items-center gap-1',
                  isClickable && 'cursor-pointer group'
                )}
                onClick={handleClick}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } } : undefined}
              >
                <div
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-full text-sm transition-transform',
                    isComplete && 'h-8 w-8 bg-primary text-primary-foreground font-medium',
                    isClickable && 'group-hover:scale-110',
                    isCurrent && 'h-9 w-9 border-[3px] border-primary text-primary font-bold shadow-sm shadow-primary/25',
                    !isComplete && !isCurrent && isVisited && 'h-8 w-8 border-2 border-primary/40 text-primary/60 font-medium',
                    !isComplete && !isCurrent && !isVisited && 'h-8 w-8 border-2 border-border text-muted-foreground font-medium'
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={cn(
                  'text-center hidden sm:block transition-colors whitespace-nowrap',
                  isCurrent && 'text-sm text-primary font-semibold',
                  isVisited && 'text-xs text-primary/70 underline underline-offset-2',
                  isClickable && 'group-hover:text-primary',
                  !isCurrent && !isVisited && 'text-xs text-muted-foreground'
                )}>
                  {step.label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
