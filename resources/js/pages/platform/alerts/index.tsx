import { Head, useForm, usePage, setLayoutProps } from '@inertiajs/react';
import { BellRing, Radio } from 'lucide-react';
import { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/data-page';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePermission } from '@/hooks/use-permission';
import {
    WhatsAppConnectCard,
    type WhatsAppProps,
} from './components/whatsapp-connect-card';

type Sponsor = {
    code: string;
    name: string;
    tagline: string | null;
    url: string | null;
    logo_url: string | null;
    featured: boolean;
};

type Props = {
    whatsapp: WhatsAppProps;
    pushConfigured: boolean;
    sponsors: Sponsor[];
};

type FormData = {
    channels: string[];
    audience: string;
    title: string;
    body: string;
    url: string;
    test_phone: string;
};

const WHATSAPP_ROUTES = {
    sync: '/platform/alerts/whatsapp/sync',
    qr: '/platform/alerts/whatsapp/qr',
    logout: '/platform/alerts/whatsapp/logout',
    test: '/platform/alerts/whatsapp/test',
};

export default function PlatformAlertsIndex({
    whatsapp,
    pushConfigured,
    sponsors,
}: Props) {
    setLayoutProps({
        breadcrumbs: [{ title: 'Alertas', href: '/platform/alerts' }],
    });

    const { t } = useTranslation('alerts');
    const { can } = usePermission();
    const flash = usePage().props.flash as
        | { success?: string; warning?: string; info?: string; error?: string }
        | undefined;

    const { data, setData, post, processing, errors } = useForm<FormData>({
        channels: ['push'],
        audience: 'owners',
        title: '',
        body: '',
        url: '/',
        test_phone: '',
    });

    const toggleChannel = (channel: string, checked: boolean) => {
        const next = checked
            ? Array.from(new Set([...data.channels, channel]))
            : data.channels.filter((c) => c !== channel);
        setData('channels', next);
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/platform/alerts');
    };

    return (
        <>
            <Head title={t('title')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('title')}
                    description={t('subtitle')}
                />

                {flash?.success ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
                        {flash.success}
                    </div>
                ) : null}
                {flash?.info ? (
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-950 dark:text-sky-100">
                        {flash.info}
                    </div>
                ) : null}
                {flash?.warning ? (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
                        {flash.warning}
                    </div>
                ) : null}
                {flash?.error ? (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {flash.error}
                    </div>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-2">
                    <WhatsAppConnectCard
                        whatsapp={whatsapp}
                        canManage={can('alerts.send')}
                        apiRoutes={WHATSAPP_ROUTES}
                    />

                    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
                        <div className="flex items-center gap-2">
                            <BellRing className="size-5 text-brand-sky" />
                            <h2 className="font-semibold">{t('push.title')}</h2>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            {pushConfigured
                                ? t('push.ready')
                                : t('push.missing')}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t('push.hint')}
                        </p>
                    </section>
                </div>

                <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
                    <h2 className="font-semibold">{t('sponsors.title')}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('sponsors.subtitle')}
                    </p>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                        {sponsors.map((s) => (
                            <li
                                key={s.code}
                                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
                            >
                                {s.logo_url ? (
                                    <img
                                        src={s.logo_url}
                                        alt={s.name}
                                        className="h-10 w-24 rounded-lg object-cover"
                                    />
                                ) : null}
                                <div className="min-w-0">
                                    <p className="font-medium">{s.name}</p>
                                    {s.tagline ? (
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {s.tagline}
                                        </p>
                                    ) : null}
                                    {s.url ? (
                                        <a
                                            href={s.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-block text-sm text-brand-sky hover:underline"
                                        >
                                            {t('sponsors.visit')}
                                        </a>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <form
                    onSubmit={onSubmit}
                    className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm md:p-6"
                >
                    <div className="flex items-center gap-2">
                        <Radio className="size-5 text-brand-sky" />
                        <h2 className="font-semibold">{t('form.title')}</h2>
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <div className="space-y-3">
                            <Label>{t('form.channels')}</Label>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={data.channels.includes('push')}
                                        onCheckedChange={(v) =>
                                            toggleChannel('push', Boolean(v))
                                        }
                                    />
                                    {t('form.channel_push')}
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={data.channels.includes(
                                            'whatsapp',
                                        )}
                                        onCheckedChange={(v) =>
                                            toggleChannel(
                                                'whatsapp',
                                                Boolean(v),
                                            )
                                        }
                                    />
                                    {t('form.channel_whatsapp')}
                                </label>
                            </div>
                            {errors.channels ? (
                                <p className="text-xs text-destructive">
                                    {errors.channels}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="audience">{t('form.audience')}</Label>
                            <Select
                                value={data.audience}
                                onValueChange={(v) => setData('audience', v)}
                            >
                                <SelectTrigger
                                    id="audience"
                                    className="h-11 w-full cursor-pointer rounded-xl"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="owners">
                                        {t('form.audience_owners')}
                                    </SelectItem>
                                    <SelectItem value="clinic_staff">
                                        {t('form.audience_clinics')}
                                    </SelectItem>
                                    <SelectItem value="platform_admins">
                                        {t('form.audience_admins')}
                                    </SelectItem>
                                    <SelectItem value="test">
                                        {t('form.audience_test')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {data.audience === 'test' ? (
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="test_phone">
                                    {t('form.test_phone')}
                                </Label>
                                <Input
                                    id="test_phone"
                                    value={data.test_phone}
                                    onChange={(e) =>
                                        setData('test_phone', e.target.value)
                                    }
                                    placeholder="51999999999"
                                    className="h-11 rounded-xl"
                                />
                                {errors.test_phone ? (
                                    <p className="text-xs text-destructive">
                                        {errors.test_phone}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="title">{t('form.title_label')}</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                                className="h-11 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="body">{t('form.body')}</Label>
                            <Textarea
                                id="body"
                                value={data.body}
                                onChange={(e) =>
                                    setData('body', e.target.value)
                                }
                                rows={5}
                                className="rounded-xl"
                                required
                            />
                            {errors.body ? (
                                <p className="text-xs text-destructive">
                                    {errors.body}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="url">{t('form.url')}</Label>
                            <Input
                                id="url"
                                value={data.url}
                                onChange={(e) => setData('url', e.target.value)}
                                placeholder="/perdidos"
                                className="h-11 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                data.channels.length === 0 ||
                                !can('alerts.send')
                            }
                            className="cursor-pointer rounded-xl"
                        >
                            {processing ? t('form.sending') : t('form.submit')}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
