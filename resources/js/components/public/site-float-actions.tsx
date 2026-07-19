import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScrollY } from '@/hooks/use-scroll-y';
import { cn } from '@/lib/utils';

/** Botón flotante: volver arriba (global). */
export function SiteFloatActions() {
    const { t } = useTranslation('welcome');
    const scrollY = useScrollY();
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        setShowTop(scrollY > 420);
    }, [scrollY]);

    return (
        <div className="pointer-events-none fixed right-4 bottom-5 z-[60] flex flex-col items-end gap-3 md:right-6 md:bottom-7">
            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label={t('float.back_top')}
                className={cn(
                    'pointer-events-auto inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-background',
                    showTop
                        ? 'translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-3 opacity-0',
                )}
            >
                <ArrowUp className="size-5" strokeWidth={2.25} />
            </button>
        </div>
    );
}
