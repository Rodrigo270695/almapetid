import { router } from '@inertiajs/react';
import { Loader2, Lock, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Roles } from '@/lib/roles';
import users from '@/routes/platform/users';
import type { PlatformUser } from '../types';

export type UserDeleteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: PlatformUser | null;
    currentUserId: number | null;
};

export function UserDeleteDialog({
    open,
    onOpenChange,
    user,
    currentUserId,
}: UserDeleteDialogProps) {
    const { t } = useTranslation(['usuarios', 'common']);
    const [processing, setProcessing] = useState(false);

    const isSelf = user !== null && currentUserId === user.id;
    const isPlatformAdmin =
        user !== null &&
        user.roles.some((r) => r.name === Roles.PLATFORM_ADMIN);
    const blocked = isSelf || isPlatformAdmin;
    const fullName = user
        ? `${user.name} ${user.lastname}`.trim()
        : '';

    const onConfirm = () => {
        if (!user || blocked) return;
        setProcessing(true);
        router.delete(users.destroy(user.id).url, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div
                        className={
                            blocked
                                ? 'flex size-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive'
                        }
                    >
                        {blocked ? (
                            <Lock className="size-5" strokeWidth={2.5} aria-hidden />
                        ) : (
                            <TriangleAlert
                                className="size-5"
                                strokeWidth={2.5}
                                aria-hidden
                            />
                        )}
                    </div>
                    <DialogTitle className="pt-2 text-base">
                        {t('usuarios:delete.title')}
                    </DialogTitle>
                    <DialogDescription className="text-sm" asChild>
                        {blocked ? (
                            <p>
                                {isSelf
                                    ? t('usuarios:delete.self_blocked')
                                    : t('usuarios:delete.platform_admin_blocked')}
                            </p>
                        ) : (
                            <p>
                                <Trans
                                    ns="usuarios"
                                    i18nKey="delete.description"
                                    values={{ name: fullName }}
                                    components={{
                                        strong: (
                                            <strong className="text-foreground" />
                                        ),
                                    }}
                                />
                            </p>
                        )}
                    </DialogDescription>
                </DialogHeader>

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
                    {!blocked && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={processing}
                            className="cursor-pointer gap-2"
                        >
                            {processing && (
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden
                                />
                            )}
                            {processing
                                ? t('usuarios:delete.loading')
                                : t('usuarios:delete.confirm')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
