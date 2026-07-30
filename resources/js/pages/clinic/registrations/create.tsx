import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { Cpu, PawPrint, UserRound } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import DocumentIdentityFields from '@/components/auth/document-identity-fields';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { authFieldClassName, authSubmitClassName } from '@/lib/auth-field-styles';
import { sanitizePhoneDigits } from '@/lib/phone';
import { cn } from '@/lib/utils';
import { dashboard as clinicDashboard } from '@/routes/clinic';
import { store } from '@/routes/clinic/registrations';
import type { DocumentType } from '@/types';

type BreedOption = { id: number; name: string };
type SpeciesOption = {
    id: number;
    name: string;
    breeds: BreedOption[];
};

type Props = {
    organization: {
        id: number;
        name: string;
        ruc: string;
    };
    species_catalog: SpeciesOption[];
};

type OwnerState = {
    document_type: DocumentType;
    document_number: string;
    name: string;
    lastname: string;
};

const fieldClass = cn(authFieldClassName, 'h-11');
const comboClass = cn(
    fieldClass,
    'px-3 hover:bg-background/50 data-[state=open]:border-brand-sky data-[state=open]:ring-2 data-[state=open]:ring-brand-sky/35',
);

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

function SectionCard({
    icon,
    title,
    hint,
    children,
}: {
    icon: ReactNode;
    title: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-3 border-b border-border/60 bg-brand-sky/[0.04] px-5 py-4">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-sky/12 text-brand-sky">
                    {icon}
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                        {title}
                    </h2>
                    {hint ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {hint}
                        </p>
                    ) : null}
                </div>
            </div>
            <div className="grid gap-4 p-5 sm:gap-5">{children}</div>
        </section>
    );
}

export default function CreateChipRegistration({
    organization,
    species_catalog,
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

    setLayoutProps({
        breadcrumbs: [
            { title: 'Panel clínica', href: clinicDashboard() },
            {
                title: 'Nuevo registro',
                href: '/clinic/registrations/create',
            },
        ],
    });

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
        { value: '1', label: 'Sí, esterilizada/castrada' },
        { value: '0', label: 'No' },
        { value: 'unknown', label: 'No sé / no indica' },
    ];

    return (
        <>
            <Head title="Registrar chip" />
            <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklch,var(--brand-sky)_16%,transparent),_transparent_70%)]"
                />

                <div>
                    <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-brand-sky text-white shadow-lg shadow-brand-sky/25">
                        <PawPrint className="size-5" />
                    </div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
                        Registrar microchip
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {organization.name} · RUC {organization.ruc}
                    </p>
                </div>

                <Form
                    action={store.url()}
                    method="post"
                    className="flex flex-col gap-5"
                    disableWhileProcessing
                    noValidate
                >
                    {({ processing, errors }) => (
                        <>
                            <SectionCard
                                icon={<UserRound className="size-4" />}
                                title="Propietario"
                                hint="Datos del tutor. El celular es clave para contactarlo."
                            >
                                <DocumentIdentityFields
                                    namePrefix="owner"
                                    values={owner}
                                    onChange={(next) =>
                                        setOwner((prev) => ({
                                            ...prev,
                                            ...next,
                                        }))
                                    }
                                    lookupUrl="/document/lookup-dni"
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

                                <div className="grid items-start gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="owner_email">
                                            Correo
                                        </FieldLabel>
                                        <Input
                                            id="owner_email"
                                            type="email"
                                            name="owner[email]"
                                            placeholder="opcional"
                                            className={fieldClass}
                                        />
                                        <InputError
                                            message={errors['owner.email']}
                                        />
                                    </div>
                                    <div className="grid gap-2">
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
                                            autoComplete="tel"
                                            value={ownerPhone}
                                            onChange={(e) =>
                                                setOwnerPhone(
                                                    sanitizePhoneDigits(
                                                        e.target.value,
                                                    ),
                                                )
                                            }
                                            placeholder="Ej. 999888777"
                                            className={fieldClass}
                                        />
                                        <InputError
                                            message={errors['owner.phone']}
                                        />
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard
                                icon={<PawPrint className="size-4" />}
                                title="Mascota"
                                hint="Especie y raza desde el catálogo AlmaPet."
                            >
                                <div className="grid items-start gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
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
                                            placeholder="Nombre de la mascota"
                                            className={fieldClass}
                                        />
                                        <InputError
                                            message={errors['animal.name']}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <FieldLabel
                                            htmlFor="animal_species"
                                            required
                                        >
                                            Especie
                                        </FieldLabel>
                                        <Combobox
                                            id="animal_species"
                                            name="animal[species_id]"
                                            options={speciesOptions}
                                            value={speciesId}
                                            onChange={(value) => {
                                                setSpeciesId(value);
                                                setBreedId(null);
                                            }}
                                            placeholder="Selecciona especie"
                                            searchPlaceholder="Buscar especie..."
                                            emptyMessage="Sin especies en el catálogo."
                                            clearable={false}
                                            className={comboClass}
                                            aria-invalid={Boolean(
                                                errors['animal.species_id'],
                                            )}
                                        />
                                        <InputError
                                            message={
                                                errors['animal.species_id']
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="animal_breed">
                                            Raza
                                        </FieldLabel>
                                        <Combobox
                                            id="animal_breed"
                                            name="animal[breed_id]"
                                            options={breedOptions}
                                            value={breedId}
                                            onChange={setBreedId}
                                            placeholder={
                                                speciesId
                                                    ? 'Selecciona raza'
                                                    : 'Primero elige especie'
                                            }
                                            searchPlaceholder="Buscar raza..."
                                            emptyMessage="Sin razas para esta especie."
                                            disabled={!speciesId}
                                            className={comboClass}
                                            aria-invalid={Boolean(
                                                errors['animal.breed_id'],
                                            )}
                                        />
                                        <InputError
                                            message={errors['animal.breed_id']}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="animal_sex">
                                            Sexo
                                        </FieldLabel>
                                        <Combobox
                                            id="animal_sex"
                                            name="animal[sex]"
                                            options={sexOptions}
                                            value={sex}
                                            onChange={setSex}
                                            placeholder="Selecciona"
                                            searchPlaceholder="Buscar..."
                                            emptyMessage="Sin opciones."
                                            className={comboClass}
                                        />
                                        <InputError
                                            message={errors['animal.sex']}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="animal_sterilized">
                                            ¿Esterilizada / castrada?
                                        </FieldLabel>
                                        <Combobox
                                            id="animal_sterilized"
                                            options={sterilizedOptions}
                                            value={sterilized}
                                            onChange={setSterilized}
                                            placeholder="Selecciona"
                                            searchPlaceholder="Buscar..."
                                            emptyMessage="Sin opciones."
                                            className={comboClass}
                                        />
                                        <input
                                            type="hidden"
                                            name="animal[is_sterilized]"
                                            value={
                                                sterilized === 'unknown' ||
                                                sterilized === null
                                                    ? ''
                                                    : sterilized
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors['animal.is_sterilized']
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="animal_birth_date">
                                            Fecha de nacimiento
                                        </FieldLabel>
                                        <Input
                                            id="animal_birth_date"
                                            type="date"
                                            name="animal[birth_date]"
                                            className={fieldClass}
                                        />
                                        <InputError
                                            message={
                                                errors['animal.birth_date']
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="animal_color">
                                            Color
                                        </FieldLabel>
                                        <Input
                                            id="animal_color"
                                            name="animal[color]"
                                            placeholder="Ej. marrón, atigrado"
                                            className={fieldClass}
                                        />
                                        <InputError
                                            message={errors['animal.color']}
                                        />
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard
                                icon={<Cpu className="size-4" />}
                                title="Microchip"
                                hint="Número ISO de 15 dígitos."
                            >
                                <div className="grid items-start gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <FieldLabel
                                            htmlFor="microchip"
                                            required
                                        >
                                            Número de microchip
                                        </FieldLabel>
                                        <Input
                                            id="microchip"
                                            name="chip[microchip]"
                                            inputMode="numeric"
                                            required
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
                                            placeholder="15 dígitos ISO"
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

                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="implant_date">
                                            Fecha de implante
                                        </FieldLabel>
                                        <Input
                                            id="implant_date"
                                            type="date"
                                            name="chip[implant_date]"
                                            className={fieldClass}
                                        />
                                        <InputError
                                            message={
                                                errors['chip.implant_date']
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <FieldLabel htmlFor="implant_site">
                                            Sitio de implante
                                        </FieldLabel>
                                        <Input
                                            id="implant_site"
                                            name="chip[implant_site]"
                                            placeholder="Ej. cuello izquierdo"
                                            className={fieldClass}
                                        />
                                        <InputError
                                            message={
                                                errors['chip.implant_site']
                                            }
                                        />
                                    </div>
                                </div>
                            </SectionCard>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Button
                                    type="submit"
                                    className={cn(
                                        authSubmitClassName,
                                        'mt-0 bg-brand-sky text-white hover:bg-brand-sky/90 sm:w-auto sm:min-w-52',
                                    )}
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    Guardar registro
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-11 rounded-2xl"
                                    asChild
                                >
                                    <Link href={clinicDashboard()}>
                                        Cancelar
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
