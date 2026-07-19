import { Head } from '@inertiajs/react';
import { CheckCircle2, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';

type Props = {
    certificate_code: string;
    certificate_url: string;
    search_url: string;
};

export default function HandoffSuccess({
    certificate_code,
    certificate_url,
    search_url,
}: Props) {
    return (
        <PublicLayout title="Registro activado">
            <Head title="Registro activado · AlmaPet ID" />
            <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 className="size-7" />
                </div>
                <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
                    Registro activado
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    El pago se confirmó y el certificado AlmaPet ID ya está
                    listo. Código{' '}
                    <span className="font-mono font-medium text-foreground">
                        {certificate_code}
                    </span>
                    .
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    {/* <a> nativo: evita que Inertia intente renderizar el PDF */}
                    <Button asChild className="gap-2">
                        <a href={certificate_url}>
                            <Download className="size-4" />
                            Descargar certificado PDF
                        </a>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <a href={search_url}>
                            <Search className="size-4" />
                            Buscar microchip
                        </a>
                    </Button>
                </div>
            </div>
        </PublicLayout>
    );
}
