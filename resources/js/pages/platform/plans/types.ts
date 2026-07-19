export type PlanBillingPeriod = 'registration' | 'annual';

export type Plan = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    billing_period: PlanBillingPeriod;
    duration_months: number | null;
    amount: string;
    vetsaas_amount: string | null;
    vetsaas_clinic_commission: string | null;
    partner_amount: string | null;
    partner_clinic_commission: string | null;
    currency: 'PEN' | 'USD';
    active: boolean;
    is_default: boolean;
    sort_order: number;
    payments_count?: number;
    created_at: string;
    updated_at: string;
};

export type PlanFilters = {
    search: string;
    per_page: number;
    sort: string | null;
    direction: 'asc' | 'desc' | null;
    status: 'todos' | 'active' | 'inactive';
    period: 'todos' | PlanBillingPeriod;
};

export type PlanStats = {
    total: number;
    active: number;
    annual: number;
    coincidencias: number;
};
