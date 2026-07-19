import { router } from '@inertiajs/react';
import {
    Banknote,
    MoreHorizontal,
    Pencil,
    RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import payments from '@/routes/platform/payments';
import type { RegistrationPayment } from '../types';

export type PaymentRowActionsProps = {
    payment: RegistrationPayment;
    onEdit: (payment: RegistrationPayment) => void;
    canUpdate?: boolean;
};

export function PaymentRowActions({
    payment,
    onEdit,
    canUpdate = true,
}: PaymentRowActionsProps) {
    const { t } = useTranslation(['payments', 'common']);

    if (!canUpdate) return null;

    const canMarkPaid = payment.status === 'pending' || payment.status === 'failed';
    const canRefund = payment.status === 'paid';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('payments:row.actions_for', {
                        id: payment.id,
                    })}
                    className="size-8 cursor-pointer"
                >
                    <MoreHorizontal className="size-4" strokeWidth={2.5} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                    onSelect={() => onEdit(payment)}
                    className="cursor-pointer gap-2"
                >
                    <Pencil className="size-4" strokeWidth={2.25} />
                    {t('common:actions.edit')}
                </DropdownMenuItem>

                {(canMarkPaid || canRefund) && <DropdownMenuSeparator />}

                {canMarkPaid ? (
                    <DropdownMenuItem
                        onSelect={() =>
                            router.post(payments.markPaid(payment.id).url, {}, {
                                preserveScroll: true,
                            })
                        }
                        className="cursor-pointer gap-2"
                    >
                        <Banknote className="size-4" strokeWidth={2.25} />
                        {t('payments:row.mark_paid')}
                    </DropdownMenuItem>
                ) : null}

                {canRefund ? (
                    <DropdownMenuItem
                        onSelect={() =>
                            router.post(
                                payments.markRefunded(payment.id).url,
                                {},
                                { preserveScroll: true },
                            )
                        }
                        className="cursor-pointer gap-2"
                    >
                        <RotateCcw className="size-4" strokeWidth={2.25} />
                        {t('payments:row.mark_refunded')}
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
