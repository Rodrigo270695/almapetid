import { cn } from '@/lib/utils';

type BrandWordmarkProps = {
    className?: string;
    /** white = paneles oscuros; sky = fondos claros */
    variant?: 'white' | 'sky';
    alt?: string;
};

export default function BrandWordmark({
    className,
    variant = 'white',
    alt = 'AlmaPet ID',
}: BrandWordmarkProps) {
    const src =
        variant === 'sky'
            ? '/brand/almapet-id-wordmark-sky.png'
            : '/brand/almapet-id-wordmark.png';

    return (
        <img
            src={src}
            alt={alt}
            className={cn('h-7 w-auto object-contain object-left', className)}
            draggable={false}
        />
    );
}
