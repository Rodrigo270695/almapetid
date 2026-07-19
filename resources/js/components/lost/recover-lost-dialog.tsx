import { router } from '@inertiajs/react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
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
import { recover as animalsRecover } from '@/routes/animals';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    animalId: number;
    animalName: string;
};

export function RecoverLostDialog({
    open,
    onOpenChange,
    animalId,
    animalName,
}: Props) {
    const { t } = useTranslation(['lost', 'common']);
    const [processing, setProcessing] = useState(false);

    const onConfirm = () => {
        setProcessing(true);
        router.post(animalsRecover(animalId).url, {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-5" aria-hidden />
                    </div>
                    <DialogTitle className="pt-2 text-base">
                        {t('lost:actions.recover')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('lost:actions.recover_confirm', {
                            name: animalName,
                        })}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        disabled={processing}
                        onClick={() => onOpenChange(false)}
                    >
                        {t('lost:declare.cancel')}
                    </Button>
                    <Button
                        type="button"
                        className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-600/90"
                        disabled={processing}
                        onClick={onConfirm}
                    >
                        {processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        {t('common:actions.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
