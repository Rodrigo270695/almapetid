import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, PawPrint } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import DocumentIdentityFields from '@/components/auth/document-identity-fields';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { sanitizePhoneDigits } from '@/lib/phone';
import { cn } from '@/lib/utils';
import type { DocumentType } from '@/types';

type BreedOption = { id: number; name: string };
type SpeciesOption = {
    id: number;
    name: string;
    breeds: BreedOption[];
};

type SuccessPayload = {
    public_code: string;
    animal_name: string | null;
    activate_url: string;
    whatsapp_url: string | null;
    whatsapp_sent: boolean;
};

type Props = {
    token: string;
    organization: {
        name: string;
        logo_url: string | null;
        city: string | null;
    };
    species_catalog: SpeciesOption[];
    pricing: {
        digital_amount: number;
        physical_amount: number;
    };
    support_phone: string;
    success?: SuccessPayload | null;
};

type OwnerState = {
    document_type: DocumentType;
    document_number: string;
    name: string;
    lastname: string;
};

function RequiredMark() {
    return <span className="ml-0.5 font-semibold text-red-500">*</span>;
}

function FieldLabel({
    htmlFor,
    children,
    required,
}: {
    htmlFor?: string;
    children: ReactNode;
    required?: boolean;
}) {
    return (
        <Label htmlFor={htmlFor} className="text-sm font-medium">
            {children}
            {required ? <RequiredMark /> : null}
        </Label>
    );
}

export default function EmbedRegister({
    token,
    organization,
    species_catalog,
    pricing,
    support_phone,
    success = null,
}: Props) {
    const [owner, setOwner] = useState<OwnerState>({
        document_type: 'dni',
        document_number: '',
        name: '',
        lastname: '',
    });
    const [ownerPhone, setOwnerPhone] = useState('');
    const [speciesId, setSpeciesId] = useState<string | null>(null);
    const [breedId, setBreedId] = useState<string | null>(null);
    const [sex, setSex] = useState<string | null>(null);
    const [sterilized, setSterilized] = useState<string | null>(null);
    const [microchip, setMicrochip] = useState('');

    const speciesOptions = useMemo<ComboboxOption[]>(
        () =>
            species_catalog.map((s) => ({
                value: String(s.id),
                label: s.name,
            })),
        [species_catalog],
    );

    const breedOptions = useMemo<ComboboxOption[]>(() => {
        const species = species_catalog.find((s) => String(s.id) === speciesId);
        return (species?.breeds ?? []).map((b) => ({
            value: String(b.id),
            label: b.name,
        }));
    }, [species_catalog, speciesId]);

    const sexOptions: ComboboxOption[] = [
        { value: 'macho', label: 'Macho' },
        { value: 'hembra', label: 'Hembra' },
    ];

    const sterilizedOptions: ComboboxOption[] = [
        { value: '1', label: 'Sí' },
        { value: '0', label: 'No' },
    ];

    const fieldClass =
        'h-10 rounded-xl border-border/70 bg-white dark:bg-background';

    if (success) {
        return (
            <>
                <Head title={`Registro · ${organization.name}`} />
                <div className="min-h-screen bg-[#F7F9FB] px-3 py-4 text-foreground dark:bg-[#0a0a0a]">
                    <div className="mx-auto w-full max-w-lg space-y-4">
                        <Header organization={organization} />
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
                                <div className="min-w-0 space-y-2">
                                    <h2 className="font-heading text-lg font-semibold">
                                        Registro listo
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {success.animal_name
                                            ? `«${success.animal_name}»`
                                            : 'La mascota'}{' '}
                                        quedó inscrita a nombre de{' '}
                                        <strong>{organization.name}</strong>.
                                        Estado: pendiente de pago (S/{' '}
                                        {pricing.digital_amount}).
                                    </p>
                                    <p className="font-mono text-xs text-muted-foreground">
                                        Código {success.public_code}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <Button
                                            asChild
                                            className="cursor-pointer bg-brand-sky text-white hover:bg-brand-sky/90"
                                        >
                                            <a
                                                href={success.activate_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Activar / pagar
                                            </a>
                                        </Button>
                                        {success.whatsapp_url ? (
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="cursor-pointer border-emerald-500/40 text-emerald-700"
                                            >
                                                <a
                                                    href={success.whatsapp_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    WhatsApp al dueño
                                                </a>
                                            </Button>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Soporte AlmaPet: {support_phone}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-[11px] text-muted-foreground">
                            Powered by AlmaPet ID
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Registrar chip · ${organization.name}`} />
            <div className="min-h-screen bg-[#F7F9FB] px-3 py-4 text-foreground dark:bg-[#0a0a0a]">
                <div className="mx-auto w-full max-w-lg space-y-4">
                    <Header organization={organization} />

                    <p className="text-sm text-muted-foreground">
                        El registro queda a nombre de{' '}
                        <strong className="text-foreground">
                            {organization.name}
                        </strong>
                        . El propietario activa el carnet digital (S/{' '}
                        {pricing.digital_amount}
                        {pricing.physical_amount
                            ? `; físico opcional +S/ ${pricing.physical_amount}`
                            : ''}
                        ).
                    </p>

                    <Form
                        action={`/embed/registrar/${token}`}
                        method="post"
                        className="space-y-4"
                        disableWhileProcessing
                        noValidate
                    >
                        {({ processing, errors }) => (
                            <>
                                <section className="space-y-3 rounded-2xl border border-border/70 bg-white/90 p-4 dark:bg-card/80">
                                    <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Propietario
                                    </h2>
                                    <DocumentIdentityFields
                                        namePrefix="owner"
                                        values={owner}
                                        onChange={(next) =>
                                            setOwner((prev) => ({
                                                ...prev,
                                                ...next,
                                            }))
                                        }
                                        lookupUrl="/register/lookup-dni"
                                        showRequiredMarks
                                        errors={{
                                            document_type:
                                                errors['owner.document_type'],
                                            document_number:
                                                errors['owner.document_number'],
                                            name: errors['owner.name'],
                                            lastname: errors['owner.lastname'],
                                        }}
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="grid gap-1.5">
                                            <FieldLabel htmlFor="owner_email">
                                                Correo
                                            </FieldLabel>
                                            <Input
                                                id="owner_email"
                                                type="email"
                                                name="owner[email]"
                                                className={fieldClass}
                                            />
                                            <InputError
                                                message={errors['owner.email']}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <FieldLabel
                                                htmlFor="owner_phone"
                                                required
                                            >
                                                Celular
                                            </FieldLabel>
                                            <Input
                                                id="owner_phone"
                                                type="tel"
                                                name="owner[phone]"
                                                required
                                                inputMode="numeric"
                                                value={ownerPhone}
                                                onChange={(e) =>
                                                    setOwnerPhone(
                                                        sanitizePhoneDigits(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className={fieldClass}
                                            />
                                            <InputError
                                                message={errors['owner.phone']}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3 rounded-2xl border border-border/70 bg-white/90 p-4 dark:bg-card/80">
                                    <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Mascota
                                    </h2>
                                    <div className="grid gap-1.5">
                                        <FieldLabel
                                            htmlFor="animal_name"
                                            required
                                        >
                                            Nombre
                                        </FieldLabel>
                                        <Input
                                            id="animal_name"
                                            name="animal[name]"
                                            required
                                            className={fieldClass}
                                        />
                                        <InputError
                                            message={errors['animal.name']}
                                        />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="grid gap-1.5">
                                            <FieldLabel required>
                                                Especie
                                            </FieldLabel>
                                            <Combobox
                                                name="animal[species_id]"
                                                options={speciesOptions}
                                                value={speciesId}
                                                onChange={(v) => {
                                                    setSpeciesId(v);
                                                    setBreedId(null);
                                                }}
                                                placeholder="Seleccionar"
                                                className={fieldClass}
                                            />
                                            <InputError
                                                message={
                                                    errors['animal.species_id']
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <FieldLabel>Raza</FieldLabel>
                                            <Combobox
                                                name="animal[breed_id]"
                                                options={breedOptions}
                                                value={breedId}
                                                onChange={setBreedId}
                                                placeholder="Opcional"
                                                disabled={!speciesId}
                                                className={fieldClass}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="grid gap-1.5">
                                            <FieldLabel>Sexo</FieldLabel>
                                            <Combobox
                                                name="animal[sex]"
                                                options={sexOptions}
                                                value={sex}
                                                onChange={setSex}
                                                placeholder="—"
                                                className={fieldClass}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <FieldLabel>
                                                Esterilizada
                                            </FieldLabel>
                                            <Combobox
                                                name="animal[is_sterilized]"
                                                options={sterilizedOptions}
                                                value={sterilized}
                                                onChange={setSterilized}
                                                placeholder="—"
                                                className={fieldClass}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <FieldLabel htmlFor="birth_date">
                                                Nacimiento
                                            </FieldLabel>
                                            <Input
                                                id="birth_date"
                                                type="date"
                                                name="animal[birth_date]"
                                                className={fieldClass}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3 rounded-2xl border border-border/70 bg-white/90 p-4 dark:bg-card/80">
                                    <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Microchip
                                    </h2>
                                    <div className="grid gap-1.5">
                                        <FieldLabel
                                            htmlFor="microchip"
                                            required
                                        >
                                            Número (15 dígitos)
                                        </FieldLabel>
                                        <Input
                                            id="microchip"
                                            name="chip[microchip]"
                                            required
                                            inputMode="numeric"
                                            maxLength={15}
                                            value={microchip}
                                            onChange={(e) =>
                                                setMicrochip(
                                                    e.target.value.replace(
                                                        /\D+/g,
                                                        '',
                                                    ),
                                                )
                                            }
                                            className={cn(
                                                fieldClass,
                                                'font-mono tracking-wide',
                                            )}
                                        />
                                        <p className="text-xs text-muted-foreground tabular-nums">
                                            {microchip.length}/15
                                        </p>
                                        <InputError
                                            message={errors['chip.microchip']}
                                        />
                                    </div>
                                </section>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-11 w-full cursor-pointer rounded-2xl bg-brand-sky text-white hover:bg-brand-sky/90"
                                >
                                    {processing ? <Spinner /> : null}
                                    Registrar chip
                                </Button>
                            </>
                        )}
                    </Form>

                    <p className="text-center text-[11px] text-muted-foreground">
                        Powered by AlmaPet ID · Soporte {support_phone}
                    </p>
                </div>
            </div>
        </>
    );
}

function Header({
    organization,
}: {
    organization: Props['organization'];
}) {
    return (
        <div className="flex items-center gap-3">
            {organization.logo_url ? (
                <img
                    src={organization.logo_url}
                    alt={organization.name}
                    className="size-11 rounded-xl border border-border/60 bg-white object-contain p-1"
                />
            ) : (
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-sky text-white">
                    <PawPrint className="size-5" />
                </span>
            )}
            <div className="min-w-0">
                <p className="truncate font-heading text-base font-semibold tracking-tight">
                    {organization.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                    Registro AlmaPet ID
                    {organization.city ? ` · ${organization.city}` : ''}
                </p>
            </div>
        </div>
    );
}
