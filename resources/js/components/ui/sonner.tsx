import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Toaster global AlmaPet ID.
 *
 * - Arriba a la derecha.
 * - Colores de marca (sky / coral), no el verde de VetSaaS.
 * - Flash sessions Laravel → toast via useFlashToast.
 */
function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-right"
            richColors
            closeButton
            expand
            duration={4200}
            gap={10}
            offset={16}
            toastOptions={{
                classNames: {
                    toast:
                        'group toast pointer-events-auto rounded-2xl border border-border/70 bg-card/95 text-foreground shadow-xl shadow-brand-sky/10 ring-1 ring-brand-sky/15 backdrop-blur-md',
                    title: 'text-sm font-semibold tracking-tight',
                    description: 'text-xs text-muted-foreground',
                    actionButton:
                        'rounded-lg bg-brand-sky px-2.5 py-1 text-xs font-semibold text-white cursor-pointer hover:bg-brand-sky/90',
                    cancelButton:
                        'rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/80',
                    closeButton:
                        'cursor-pointer rounded-lg border border-border/60 bg-card text-muted-foreground hover:bg-brand-sky-soft hover:text-brand-sky',
                    success: 'border-brand-sky/25',
                    error: 'border-destructive/30',
                    info: 'border-brand-sky/20',
                    warning: 'border-brand-coral/30',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--card)',
                    '--normal-text': 'var(--foreground)',
                    '--normal-border': 'var(--border)',
                    /* Success = sky AlmaPet */
                    '--success-bg': 'var(--brand-sky-soft)',
                    '--success-text': 'var(--brand-sky)',
                    '--success-border': 'color-mix(in oklch, var(--brand-sky) 28%, transparent)',
                    /* Error */
                    '--error-bg': 'oklch(0.97 0.03 25)',
                    '--error-text': 'var(--destructive)',
                    '--error-border': 'oklch(0.85 0.1 25)',
                    /* Info = sky suave */
                    '--info-bg': 'var(--brand-sky-soft)',
                    '--info-text': 'var(--brand-sky)',
                    '--info-border': 'color-mix(in oklch, var(--brand-sky) 22%, transparent)',
                    /* Warning = coral */
                    '--warning-bg': 'var(--brand-coral-soft)',
                    '--warning-text': 'var(--brand-coral)',
                    '--warning-border': 'color-mix(in oklch, var(--brand-coral) 30%, transparent)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
