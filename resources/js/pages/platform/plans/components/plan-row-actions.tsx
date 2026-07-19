import { Link } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { edit as plansEdit } from '@/routes/platform/plans';
import type { Plan } from '../types';

export type PlanRowActionsProps = {
    plan: Plan;
    onDelete: (plan: Plan) => void;
    canUpdate?: boolean;
    canDelete?: boolean;
};

export function PlanRowActions({
    plan,
    onDelete,
    canUpdate = true,
    canDelete = true,
}: PlanRowActionsProps) {
    const { t } = useTranslation(['plans', 'common']);
    const hasPayments = (plan.payments_count ?? 0) > 0;
    const showDelete = canDelete && !hasPayments;

    if (!canUpdate && !showDelete) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('plans:row.actions_for', { name: plan.name })}
                    className="size-8 cursor-pointer"
                >
                    <MoreHorizontal className="size-4" strokeWidth={2.5} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {canUpdate ? (
                    <DropdownMenuItem asChild className="cursor-pointer gap-2">
                        <Link href={plansEdit(plan.id)} prefetch>
                            <Pencil className="size-4" strokeWidth={2.25} />
                            {t('common:actions.edit')}
                        </Link>
                    </DropdownMenuItem>
                ) : null}
                {showDelete ? (
                    <DropdownMenuItem
                        onSelect={() => onDelete(plan)}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    >
                        <Trash2 className="size-4" strokeWidth={2.25} />
                        {t('common:actions.delete')}
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
