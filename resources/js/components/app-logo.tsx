import AppLogoIcon from '@/components/app-logo-icon';
import BrandWordmark from '@/components/brand-wordmark';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md">
                <AppLogoIcon className="size-8 object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <BrandWordmark className="h-5" variant="sky" />
            </div>
        </>
    );
}
