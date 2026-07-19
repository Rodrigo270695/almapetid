import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    GeoCascadeFields,
    type GeoCascadeValue,
    type GeoOption,
} from '@/components/geo/geo-cascade-fields';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { lost as animalsLost } from '@/routes/animals';
import {
    datetimeLocalPeruToIso,
    nowDatetimeLocalPeru,
} from '@/lib/datetime-peru';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    animalId: number;
    departamentos: GeoOption[];
    /** Prefill desde la ubicación del dueño, si existe. */
    initialGeo?: GeoCascadeValue | null;
};

function toLocalDatetimeValue(): string {
    return nowDatetimeLocalPeru();
}

const emptyGeo = (): GeoCascadeValue => ({
    departamento_id: null,
    provincia_id: null,
    distrito_id: null,
});

export function DeclareLostDialog({
    open,
    onOpenChange,
    animalId,
    departamentos,
    initialGeo = null,
}: Props) {
    const { t } = useTranslation('lost');
    const [geo, setGeo] = useState<GeoCascadeValue>(
        initialGeo ?? emptyGeo(),
    );
    const { data, setData, post, processing, errors, reset, clearErrors, transform } =
        useForm({
            lost_at: toLocalDatetimeValue(),
            departamento_id: initialGeo?.departamento_id ?? (null as number | null),
            provincia_id: initialGeo?.provincia_id ?? (null as number | null),
            distrito_id: initialGeo?.distrito_id ?? (null as number | null),
            public_notes: '',
            photo: null as File | null,
        });

    useEffect(() => {
        if (!open) {
            return;
        }
        const next = initialGeo ?? emptyGeo();
        setGeo(next);
        setData({
            lost_at: toLocalDatetimeValue(),
            departamento_id: next.departamento_id,
            provincia_id: next.provincia_id,
            distrito_id: next.distrito_id,
            public_notes: '',
            photo: null,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir
    }, [open]);

    const onGeoChange = (next: GeoCascadeValue) => {
        setGeo(next);
        setData('departamento_id', next.departamento_id);
        setData('provincia_id', next.provincia_id);
        setData('distrito_id', next.distrito_id);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (geo.distrito_id === null) {
            return;
        }
        transform((form) => ({
            ...form,
            lost_at: datetimeLocalPeruToIso(form.lost_at),
        }));
        post(animalsLost(animalId).url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setGeo(emptyGeo());
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    clearErrors();
                }
                onOpenChange(next);
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t('declare.title')}</DialogTitle>
                    <DialogDescription>
                        {t('declare.description')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="lost_at">{t('declare.lost_at')}</Label>
                        <Input
                            id="lost_at"
                            type="datetime-local"
                            value={data.lost_at}
                            onChange={(e) => setData('lost_at', e.target.value)}
                            required
                        />
                        {errors.lost_at ? (
                            <p className="text-xs text-destructive">
                                {errors.lost_at}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-1.5">
                        <Label>
                            {t('declare.location', 'Última ubicación')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            {t(
                                'declare.location_hint',
                                'Selecciona departamento, provincia y distrito donde se perdió.',
                            )}
                        </p>
                        <GeoCascadeFields
                            departamentos={departamentos}
                            value={geo}
                            onChange={onGeoChange}
                            errors={{
                                departamento_id: errors.departamento_id,
                                provincia_id: errors.provincia_id,
                                distrito_id: errors.distrito_id,
                            }}
                            disabled={processing}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="public_notes">
                            {t('declare.public_notes')}
                        </Label>
                        <Textarea
                            id="public_notes"
                            value={data.public_notes}
                            onChange={(e) =>
                                setData('public_notes', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="lost_photo">{t('declare.photo')}</Label>
                        <Input
                            id="lost_photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData('photo', e.target.files?.[0] ?? null)
                            }
                        />
                        {errors.photo ? (
                            <p className="text-xs text-destructive">
                                {errors.photo}
                            </p>
                        ) : null}
                    </div>

                    {errors.status ? (
                        <p className="text-sm text-destructive">
                            {errors.status}
                        </p>
                    ) : null}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            disabled={processing}
                            onClick={() => onOpenChange(false)}
                        >
                            {t('declare.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            className="cursor-pointer bg-red-600 text-white hover:bg-red-600/90"
                            disabled={processing || geo.distrito_id === null}
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            {t('declare.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
