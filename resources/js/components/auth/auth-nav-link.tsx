import { Link } from '@inertiajs/react';
import type { ComponentProps, MouseEvent } from 'react';
import {
    authViewTransition,
    prepareAuthNav,
    type AuthNavDirection,
} from '@/lib/auth-nav';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Link> & {
    direction: AuthNavDirection;
};

/**
 * Link de auth con View Transition + dirección (morph liquid-glass).
 */
export default function AuthNavLink({
    className = '',
    children,
    direction,
    onClick,
    ...props
}: Props) {
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        prepareAuthNav(direction);
        onClick?.(event);
    };

    return (
        <Link
            className={cn(
                'text-primary underline decoration-primary/30 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-primary!',
                className,
            )}
            {...props}
            viewTransition={authViewTransition()}
            onClick={handleClick}
        >
            {children}
        </Link>
    );
}
