import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    const { className, alt = 'AlmaPet ID', ...rest } = props;

    return (
        <img
            src="/logo.png"
            alt={alt}
            className={className}
            {...rest}
        />
    );
}
