import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Handshake, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/data-page';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermission } from '@/hooks/use-permission';

type SponsorRow = {
    id: number;
    code: string;
    name: string;
    tagline: string | null;
    url: string | null;
    logo_url: string | null;
    active: boolean;
    featured: boolean;
    sort_order: number;
};

type Props = {
    sponsors: SponsorRow[];
};

type FormState = {
    code: string;
    name: string;
    tagline: string;
    url: string;
    sort_order: string;
    active: boolean;
    featured: boolean;
    logo: File | null;
};

const emptyForm = (): FormState => ({
    code: '',
    name: '',
    tagline: '',
    url: '',
    sort_order: '0',
    active: true,
    featured: true,
    logo: null,
});

export default function PlatformSponsorsIndex({ sponsors }: Props) {
    setLayoutProps({
        breadcrumbs: [{ title: 'Auspiciadores', href: '/platform/sponsors' }],
    });

    const { t } = useTranslation(['sponsors', 'common']);
    const { can } = usePermission();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<SponsorRow | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<FormState>(emptyForm());

    const openCreate = () => {
        setEditing(null);
        reset();
        setData(emptyForm());
        clearErrors();
        setOpen(true);
    };

    const openEdit = (row: SponsorRow) => {
        setEditing(row);
        clearErrors();
        setData({
            code: row.code,
            name: row.name,
            tagline: row.tagline ?? '',
            url: row.url ?? '',
            sort_order: String(row.sort_order),
            active: row.active,
            featured: row.featured,
            logo: null,
        });
        setOpen(true);
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editing) {
            router.post(
                `/platform/sponsors/${editing.id}`,
                {
                    ...data,
                    _method: 'put',
                    logo: data.logo,
                },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => setOpen(false),
                },
            );
            return;
        }

        post('/platform/sponsors', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    const onDelete = (row: SponsorRow) => {
        if (!confirm(t('sponsors:confirm_delete', { name: row.name }))) {
            return;
        }
        router.delete(`/platform/sponsors/${row.id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('sponsors:title')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('sponsors:title')}
                    description={t('sponsors:subtitle')}
                    action={
                        can('sponsors.create') ? (
                            <Button
                                type="button"
                                onClick={openCreate}
                                className="cursor-pointer gap-2 rounded-xl"
                            >
                                <Plus className="size-4" />
                                {t('sponsors:add')}
                            </Button>
                        ) : null
                    }
                />

                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sponsors.map((s) => (
                        <li
                            key={s.id}
                            className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-border/60">
                                    {s.logo_url ? (
                                        <img
                                            src={s.logo_url}
                                            alt={s.name}
                                            className="max-h-14 max-w-14 object-contain"
                                        />
                                    ) : (
                                        <Handshake className="size-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold">{s.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {s.code}
                                    </p>
                                    {s.tagline ? (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {s.tagline}
                                        </p>
                                    ) : null}
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <span
                                            className={
                                                s.active
                                                    ? 'text-emerald-600'
                                                    : 'text-amber-600'
                                            }
                                        >
                                            {s.active
                                                ? t('sponsors:active')
                                                : t('sponsors:inactive')}
                                        </span>
                                        {s.featured ? (
                                            <span className="text-brand-sky">
                                                {t('sponsors:featured')}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {can('sponsors.update') ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="cursor-pointer gap-1.5 rounded-xl"
                                        onClick={() => openEdit(s)}
                                    >
                                        <Pencil className="size-3.5" />
                                        {t('common:actions.edit')}
                                    </Button>
                                ) : null}
                                {can('sponsors.delete') ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="cursor-pointer gap-1.5 rounded-xl text-destructive"
                                        onClick={() => onDelete(s)}
                                    >
                                        <Trash2 className="size-3.5" />
                                        {t('common:actions.delete')}
                                    </Button>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ul>

                {sponsors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t('sponsors:empty')}
                    </p>
                ) : null}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={onSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editing
                                    ? t('sponsors:edit')
                                    : t('sponsors:add')}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="sp-name">
                                    {t('sponsors:fields.name')}
                                </Label>
                                <Input
                                    id="sp-name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    required
                                />
                                {errors.name ? (
                                    <p className="text-xs text-destructive">
                                        {errors.name}
                                    </p>
                                ) : null}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="sp-code">
                                    {t('sponsors:fields.code')}
                                </Label>
                                <Input
                                    id="sp-code"
                                    value={data.code}
                                    onChange={(e) =>
                                        setData('code', e.target.value)
                                    }
                                    placeholder="orvae"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="sp-tagline">
                                    {t('sponsors:fields.tagline')}
                                </Label>
                                <Input
                                    id="sp-tagline"
                                    value={data.tagline}
                                    onChange={(e) =>
                                        setData('tagline', e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="sp-url">
                                    {t('sponsors:fields.url')}
                                </Label>
                                <Input
                                    id="sp-url"
                                    type="url"
                                    value={data.url}
                                    onChange={(e) =>
                                        setData('url', e.target.value)
                                    }
                                    placeholder="https://"
                                />
                                {errors.url ? (
                                    <p className="text-xs text-destructive">
                                        {errors.url}
                                    </p>
                                ) : null}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="sp-logo">
                                    {t('sponsors:fields.logo')}
                                </Label>
                                <Input
                                    id="sp-logo"
                                    type="file"
                                    accept="image/*"
                                    className="cursor-pointer"
                                    onChange={(e) =>
                                        setData(
                                            'logo',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="sp-order">
                                    {t('sponsors:fields.sort_order')}
                                </Label>
                                <Input
                                    id="sp-order"
                                    type="number"
                                    min={0}
                                    value={data.sort_order}
                                    onChange={(e) =>
                                        setData('sort_order', e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={data.active}
                                        onCheckedChange={(v) =>
                                            setData('active', Boolean(v))
                                        }
                                    />
                                    {t('sponsors:active')}
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={data.featured}
                                        onCheckedChange={(v) =>
                                            setData('featured', Boolean(v))
                                        }
                                    />
                                    {t('sponsors:featured')}
                                </label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => setOpen(false)}
                            >
                                {t('common:actions.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer"
                            >
                                {t('common:actions.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
