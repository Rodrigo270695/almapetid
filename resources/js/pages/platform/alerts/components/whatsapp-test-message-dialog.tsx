import { router, usePage } from '@inertiajs/react';
import { Loader2, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultPhone?: string | null;
    testUrl: string;
};

export function WhatsAppTestMessageDialog({
    open,
    onOpenChange,
    defaultPhone,
    testUrl,
}: Props) {
    const { t } = useTranslation(['alerts', 'common']);
    const errors = usePage().props.errors as Record<string, string> | undefined;
    const [destinatario, setDestinatario] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (open) {
            setDestinatario(defaultPhone ?? '');
            setMensaje(t('alerts:whatsapp.test_default_message'));
        }
    }, [open, defaultPhone, t]);

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);
        router.post(
            testUrl,
            { destinatario, mensaje },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {t('alerts:whatsapp.test_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('alerts:whatsapp.test_description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp-test-phone">
                                {t('alerts:whatsapp.test_phone')}
                            </Label>
                            <Input
                                id="whatsapp-test-phone"
                                type="tel"
                                value={destinatario}
                                onChange={(e) =>
                                    setDestinatario(e.target.value)
                                }
                                placeholder="987654321"
                                autoComplete="tel"
                                required
                            />
                            {errors?.destinatario ? (
                                <p className="text-sm text-destructive">
                                    {errors.destinatario}
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    {t('alerts:whatsapp.test_phone_hint')}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="whatsapp-test-message">
                                {t('alerts:whatsapp.test_message')}
                            </Label>
                            <Textarea
                                id="whatsapp-test-message"
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                                rows={4}
                                maxLength={1000}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                            className="cursor-pointer"
                        >
                            {t('common:actions.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="cursor-pointer gap-2"
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Send className="size-4" />
                            )}
                            {t('alerts:whatsapp.test_send')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
