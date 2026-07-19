import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LegalDocument } from '@/components/public/legal/legal-document';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PublicLayout from '@/layouts/public-layout';

/**
 * Libro de reclamaciones (Perú) — formulario de contacto inicial.
 * El envío backend (ticket/email) se cableará en un siguiente paso.
 */
export default function LegalComplaints() {
    const { t } = useTranslation('legal');
    const [sent, setSent] = useState(false);

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <PublicLayout title={t('complaints.title')}>
            <LegalDocument doc="complaints">
                <section className="rounded-3xl border border-border/60 bg-muted/20 p-5 md:p-6">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                        {t('complaints.form.title')}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {t('complaints.form.hint')}
                    </p>

                    {sent ? (
                        <p className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                            {t('complaints.form.success')}
                        </p>
                    ) : (
                        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="claim_name">
                                        {t('complaints.form.name')}
                                    </Label>
                                    <Input id="claim_name" name="name" required />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="claim_doc">
                                        {t('complaints.form.document')}
                                    </Label>
                                    <Input id="claim_doc" name="document" required />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="claim_email">
                                        {t('complaints.form.email')}
                                    </Label>
                                    <Input
                                        id="claim_email"
                                        name="email"
                                        type="email"
                                        required
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="claim_phone">
                                        {t('complaints.form.phone')}
                                    </Label>
                                    <Input id="claim_phone" name="phone" />
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="claim_type">
                                    {t('complaints.form.type')}
                                </Label>
                                <select
                                    id="claim_type"
                                    name="type"
                                    required
                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    defaultValue=""
                                >
                                    <option value="" disabled>
                                        {t('complaints.form.type_placeholder')}
                                    </option>
                                    <option value="reclamacion">
                                        {t('complaints.form.types.claim')}
                                    </option>
                                    <option value="queja">
                                        {t('complaints.form.types.complaint')}
                                    </option>
                                </select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="claim_detail">
                                    {t('complaints.form.detail')}
                                </Label>
                                <Textarea
                                    id="claim_detail"
                                    name="detail"
                                    rows={5}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="cursor-pointer bg-brand-sky text-white hover:bg-brand-sky/90 sm:w-fit"
                            >
                                {t('complaints.form.submit')}
                            </Button>
                        </form>
                    )}
                </section>
            </LegalDocument>
        </PublicLayout>
    );
}
