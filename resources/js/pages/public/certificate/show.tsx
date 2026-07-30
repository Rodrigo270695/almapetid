import { Head } from '@inertiajs/react';
import { Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';

type Props = {
    code: string;
    public_code: string;
    animal_name: string | null;
    pdf_url: string;
    download_url: string;
    profile_url: string;
};

export default function CertificateShow({
    code,
    animal_name,
    pdf_url,
    download_url,
    profile_url,
}: Props) {
    return (
        <PublicLayout title={`Certificado ${code}`}>
            <Head title={`Certificado ${code} · AlmaPet ID`} />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 md:py-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.2em] text-cyan-700 uppercase dark:text-cyan-300">
                            Carnet digital
                        </p>
                        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                            {animal_name ? `Certificado de ${animal_name}` : 'Certificado AlmaPet ID'}
                        </h1>
                        <p className="mt-1 font-mono text-sm text-muted-foreground">{code}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="gap-2">
                            <a href={profile_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-4" />
                                Perfil público
                            </a>
                        </Button>
                        <Button asChild className="gap-2">
                            <a href={download_url}>
                                <Download className="size-4" />
                                Descargar PDF
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/70 bg-slate-200/60 p-3 shadow-sm sm:p-5 dark:bg-slate-900/40">
                    <div className="mx-auto w-full max-w-[720px] overflow-hidden rounded-lg bg-white shadow-md">
                        {/*
                          Un solo visor: anverso + reverso.
                          El PDF sigue en tamaño tarjeta; el iframe es más alto/ancho
                          para que el carnet se lea grande (zoom FitH).
                        */}
                        <iframe
                            title={`Carnet ${code}`}
                            src={`${pdf_url}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`}
                            className="block w-full bg-slate-100"
                            style={{ height: 'min(78vh, 820px)', minHeight: 560 }}
                        />
                    </div>
                    <p className="mt-3 text-center text-[11px] text-muted-foreground">
                        Deslizá para ver anverso y reverso · el archivo PDF conserva el tamaño de tarjeta
                    </p>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Si el visor no carga, usa «Descargar PDF» o{' '}
                    <a
                        href={pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                    >
                        abrir el PDF en otra pestaña
                    </a>
                    .
                </p>
            </div>
        </PublicLayout>
    );
}
