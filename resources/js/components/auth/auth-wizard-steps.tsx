import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WizardStep = {
    id: number;
    label: string;
};

type Props = {
    steps: WizardStep[];
    current: number;
};

export default function AuthWizardSteps({ steps, current }: Props) {
    return (
        <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Progreso">
            {steps.map((step) => {
                const done = step.id < current;
                const active = step.id === current;

                return (
                    <li key={step.id} className="min-w-0">
                        <div className="flex flex-col items-center gap-1.5 text-center">
                            <span
                                className={cn(
                                    'flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                                    done &&
                                        'bg-brand-sky text-white shadow-sm shadow-brand-sky/30',
                                    active &&
                                        'bg-foreground text-background ring-4 ring-foreground/10',
                                    !done &&
                                        !active &&
                                        'bg-muted text-muted-foreground',
                                )}
                            >
                                {done ? (
                                    <Check className="size-3.5" strokeWidth={2.5} />
                                ) : (
                                    step.id
                                )}
                            </span>
                            <span
                                className={cn(
                                    'truncate text-[11px] font-medium tracking-wide',
                                    active
                                        ? 'text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                        <div
                            className={cn(
                                'mt-2 h-1 rounded-full transition-colors duration-300',
                                done || active ? 'bg-brand-sky' : 'bg-muted',
                            )}
                            aria-hidden
                        />
                    </li>
                );
            })}
        </ol>
    );
}
