import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { Building2, Check, Code2, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sanitizePhoneDigits } from '@/lib/phone';
import { edit as clinicSettings } from '@/routes/clinic/settings';
import { update } from '@/routes/clinic/settings';

type Props = {
    organization: {
        id: number;
        type: string;
        ruc: string;
        name: string;
        address: string | null;
        city: string | null;
        country_code: string;
        contact_email: string | null;
        contact_phone: string | null;
        logo_url: string | null;
        show_on_network: boolean;
        active: boolean;
    };
    embed: {
        url: string;
        snippet: string;
    };
};

export default function ClinicSettings({ organization, embed }: Props) {
    const [phone, setPhone] = useState(
        sanitizePhoneDigits(organization.contact_phone ?? ''),
    );
    const [copied, setCopied] = useState(false);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Clínica', href: '/clinic' },
            { title: 'Configuración', href: clinicSettings() },
        ],
    });

    const copySnippet = async () => {
        try {
            await navigator.clipboard.writeText(embed.snippet);
            setCopied(true);
            toast.success('Código iframe copiado');
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('No se pudo copiar. Selecciona el código manualmente.');
        }
    };

    return (
        <>
            <Head title="Configuración de la veterinaria" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <div className="mb-2 inline-flex size-10 items-center justify-center rounded-2xl bg-brand-sky/12 text-brand-sky">
                        <Building2 className="size-5" />
                    </div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        Configuración de la veterinaria
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Datos públicos de contacto de {organization.name}. El
                        RUC no se puede cambiar.
                    </p>
                </div>

                <section className="max-w-2xl space-y-4 rounded-2xl border border-border/70 bg-card/40 p-5">
                    <div className="flex items-start gap-3">
                        <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-sky/12 text-brand-sky">
                            <Code2 className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-heading text-lg font-semibold tracking-tight">
                                Buscador para tu web
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Copia este iframe y pégalo en tu landing o
                                página web. Tus visitantes buscan el microchip y
                                ven el perfil público sin salir de tu sitio.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border/60 bg-[#0A1A24]/95">
                        <pre className="max-h-56 overflow-auto p-4 text-xs leading-relaxed break-all whitespace-pre-wrap text-white/85">
                            {embed.snippet}
                        </pre>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            onClick={() => void copySnippet()}
                            className="cursor-pointer gap-2 bg-brand-sky text-white hover:bg-brand-sky/90"
                        >
                            {copied ? (
                                <Check className="size-4" />
                            ) : (
                                <Copy className="size-4" />
                            )}
                            {copied ? 'Copiado' : 'Copiar iframe'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <a
                                href={embed.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Vista previa
                            </a>
                        </Button>
                    </div>
                </section>

                <Form
                    {...update.form()}
                    options={{ preserveScroll: true }}
                    encType="multipart/form-data"
                    className="max-w-2xl space-y-5 rounded-2xl border border-border/70 bg-card/40 p-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="ruc">RUC</Label>
                                <Input
                                    id="ruc"
                                    value={organization.ruc}
                                    disabled
                                    className="font-mono"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="logo">
                                    Logo (aparece en la red pública)
                                </Label>
                                {organization.logo_url ? (
                                    <div className="mb-2 flex h-16 w-40 items-center justify-center rounded-xl border border-border/60 bg-muted/30 p-2">
                                        <img
                                            src={organization.logo_url}
                                            alt={organization.name}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                ) : null}
                                <Input
                                    id="logo"
                                    name="logo"
                                    type="file"
                                    accept="image/*"
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground">
                                    PNG/JPG/SVG hasta 2 MB. Sin logo no sale en
                                    el carrusel del home.
                                </p>
                                <InputError message={errors.logo} />
                            </div>

                            <label className="flex cursor-pointer items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    name="show_on_network"
                                    value="1"
                                    defaultChecked={
                                        organization.show_on_network
                                    }
                                    className="size-4 rounded border-border"
                                />
                                Mostrar esta veterinaria en el directorio
                                público
                            </label>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre comercial</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    defaultValue={organization.name}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="city">Ciudad</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        defaultValue={organization.city ?? ''}
                                    />
                                    <InputError message={errors.city} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="country_code">País</Label>
                                    <Input
                                        id="country_code"
                                        name="country_code"
                                        required
                                        maxLength={2}
                                        defaultValue={
                                            organization.country_code || 'PE'
                                        }
                                        className="uppercase"
                                    />
                                    <InputError message={errors.country_code} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    defaultValue={organization.address ?? ''}
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="contact_email">
                                        Correo de contacto
                                    </Label>
                                    <Input
                                        id="contact_email"
                                        type="email"
                                        name="contact_email"
                                        defaultValue={
                                            organization.contact_email ?? ''
                                        }
                                    />
                                    <InputError message={errors.contact_email} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact_phone">
                                        Teléfono de contacto
                                    </Label>
                                    <Input
                                        id="contact_phone"
                                        type="tel"
                                        name="contact_phone"
                                        inputMode="numeric"
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(
                                                sanitizePhoneDigits(
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        placeholder="999888777"
                                    />
                                    <InputError message={errors.contact_phone} />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer bg-brand-sky text-white hover:bg-brand-sky/90"
                            >
                                Guardar cambios
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
