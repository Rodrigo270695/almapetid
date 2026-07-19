export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentProvider = 'manual' | 'culqi' | 'niubiz' | 'stripe';

export type PaymentPlanRef = {
    id: number;
    code: string;
    name: string;
};

export type PaymentUserRef = {
    id: number;
    name: string;
    lastname: string;
    email: string;
};

export type PaymentOrgRef = {
    id: number;
    name: string;
    ruc: string;
};

export type RegistrationPayment = {
    id: number;
    plan_id: number | null;
    chip_registration_id: number | null;
    user_id: number | null;
    organization_id: number | null;
    amount: string;
    currency: 'PEN' | 'USD';
    status: PaymentStatus;
    provider: PaymentProvider;
    provider_reference: string | null;
    paid_at: string | null;
    notes: string | null;
    created_by_user_id: number | null;
    created_at: string;
    updated_at: string;
    plan: PaymentPlanRef | null;
    user: PaymentUserRef | null;
    organization: PaymentOrgRef | null;
    created_by: PaymentUserRef | null;
};

export type PlanCatalogItem = {
    id: number;
    code: string;
    name: string;
    amount: string;
    currency: 'PEN' | 'USD';
    billing_period: string;
};

export type UserCatalogItem = {
    id: number;
    name: string;
    lastname: string;
    email: string;
};

export type PaymentFilters = {
    search: string;
    per_page: number;
    sort: string | null;
    direction: 'asc' | 'desc' | null;
    status: 'todos' | PaymentStatus;
    provider: 'todos' | PaymentProvider;
};

export type PaymentStats = {
    total: number;
    pending: number;
    paid: number;
    coincidencias: number;
};
