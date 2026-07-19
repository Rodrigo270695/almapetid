import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import DocumentIdentityFields from '@/components/auth/document-identity-fields';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { authFieldClassName, authSubmitClassName } from '@/lib/auth-field-styles';
import { sanitizePhoneDigits } from '@/lib/phone';
import { dashboard as clinicDashboard } from '@/routes/clinic';
import { store } from '@/routes/clinic/registrations';
import type { DocumentType } from '@/types';

type Props = {
    organization: {
        id: number;
        name: string;
        ruc: string;
    };
};

type OwnerState = {
    document_type: DocumentType;
    document_number: string;
    name: string;
    lastname: string;
};

export default function CreateChipRegistration({ organization }: Props) {
    const [owner, setOwner] = useState<OwnerState>({
        document_type: 'dni',
        document_number: '',
        name: '',
        lastname: '',
    });
    const [species, setSpecies] = useState('dog');
    const [ownerPhone, setOwnerPhone] = useState('');

    setLayoutProps({
        breadcrumbs: [
            { title: 'Panel clínica', href: clinicDashboard() },
            {
                title: 'Nuevo registro',
                href: '/clinic/registrations/create',
            },
        ],
    });

    return (
        <>
            <Head title="Registrar chip" />
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        Registrar microchip
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {organization.name} · RUC {organization.ruc}
                    </p>
                </div>

                <Form
                    action={store.url()}
                    method="post"
                    className="flex flex-col gap-6"
                    disableWhileProcessing
                >
                    {({ processing, errors }) => (
                        <>
                            <section className="grid gap-4">
                                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
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
                                    lookupUrl="/document/lookup-dni"
                                    errors={{
                                        document_type:
                                            errors['owner.document_type'],
                                        document_number:
                                            errors['owner.document_number'],
                                        name: errors['owner.name'],
                                        lastname: errors['owner.lastname'],
                                    }}
                                />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="owner_email">
                                            Correo (opcional)
                                        </Label>
                                        <Input
                                            id="owner_email"
                                            type="email"
                                            name="owner[email]"
                                            className={authFieldClassName}
                                        />
                                        <InputError
                                            message={errors['owner.email']}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="owner_phone">
                                            Celular *
                                        </Label>
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
                                            className={authFieldClassName}
                                        />
                                        <InputError
                                            message={errors['owner.phone']}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="grid gap-4">
                                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    Mascota
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="animal_name">
                                            Nombre
                                        </Label>
                                        <Input
                                            id="animal_name"
                                            name="animal[name]"
                                            required
                                            className={authFieldClassName}
                                        />
                                        <InputError
                                            message={errors['animal.name']}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Especie</Label>
                                        <Select
                                            value={species}
                                            onValueChange={setSpecies}
                                        >
                                            <SelectTrigger
                                                className={authFieldClassName}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dog">
                                                    Perro
                                                </SelectItem>
                                                <SelectItem value="cat">
                                                    Gato
                                                </SelectItem>
                                                <SelectItem value="other">
                                                    Otro
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <input
                                            type="hidden"
                                            name="animal[species]"
                                            value={species}
                                        />
                                        <InputError
                                            message={errors['animal.species']}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="animal_breed">
                                            Raza
                                        </Label>
                                        <Input
                                            id="animal_breed"
                                            name="animal[breed]"
                                            className={authFieldClassName}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="animal_sex">Sexo</Label>
                                        <Input
                                            id="animal_sex"
                                            name="animal[sex]"
                                            placeholder="macho / hembra"
                                            className={authFieldClassName}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="animal_color">Color</Label>
                                    <Input
                                        id="animal_color"
                                        name="animal[color]"
                                        className={authFieldClassName}
                                    />
                                </div>
                            </section>

                            <section className="grid gap-4">
                                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    Microchip
                                </h2>
                                <div className="grid gap-2">
                                    <Label htmlFor="microchip">
                                        Número (15 dígitos)
                                    </Label>
                                    <Input
                                        id="microchip"
                                        name="chip[microchip]"
                                        inputMode="numeric"
                                        required
                                        maxLength={15}
                                        placeholder="15 dígitos ISO"
                                        className={authFieldClassName}
                                    />
                                    <InputError
                                        message={errors['chip.microchip']}
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="implant_date">
                                            Fecha de implante
                                        </Label>
                                        <Input
                                            id="implant_date"
                                            type="date"
                                            name="chip[implant_date]"
                                            className={authFieldClassName}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="implant_site">
                                            Sitio de implante
                                        </Label>
                                        <Input
                                            id="implant_site"
                                            name="chip[implant_site]"
                                            placeholder="Ej. cuello izquierdo"
                                            className={authFieldClassName}
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button
                                    type="submit"
                                    className={authSubmitClassName}
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
