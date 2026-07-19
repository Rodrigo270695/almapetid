import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

/**
 * Toggle compacto claro / oscuro / sistema para pantallas auth.
 */
export function AppearanceToggle({ className }: { className?: string }) {
    const { appearance, updateAppearance } = useAppearance();

    const cycle = () => {
        const order = ['light', 'dark', 'system'] as const;
        const idx = order.indexOf(appearance);
        updateAppearance(order[(idx + 1) % order.length]);
    };

    const Icon =
        appearance === 'dark' ? Moon : appearance === 'light' ? Sun : Monitor;

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={cycle}
            className={cn('cursor-pointer', className)}
            aria-label={`Apariencia: ${appearance}`}
        >
            <Icon className="size-4" strokeWidth={2.25} />
        </Button>
    );
}
