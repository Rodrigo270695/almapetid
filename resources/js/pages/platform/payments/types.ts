export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentProvider = 'manual' | 'culqi' | 'niubiz' | 'stripe';
export type PaymentChannel = 'direct' | 'vetsaas' | 'partner';

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

export type PaymentOwnerRef = {
    id: number;
    name: string;
    lastname: string;
    email: string | null;
    document_number: string | null;
};

export type PaymentAnimalRef = {
    id: number;
    name: string;
    owner: PaymentOwnerRef | null;
};

export type PaymentChipRef = {
    id: number;
    microchip: string;
    public_code: string;
    status: string;
    certificate_code: string | null;
    animal: PaymentAnimalRef | null;
};

export type RegistrationPayment = {
    id: number;
    plan_id: number | null;
    chip_registration_id: number | null;
    user_id: number | null;
    organization_id: number | null;
    amount: string;
    currency: 'PEN' | 'USD';
    channel: PaymentChannel | string | null;
    platform_amount: string | number | null;
    clinic_commission: string | number | null;
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
    /** Laravel puede serializar la relación como snake o camel. */
    chip_registration?: PaymentChipRef | null;
    chipRegistration?: PaymentChipRef | null;
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
    channel: 'todos' | PaymentChannel;
    desde: string;
    hasta: string;
};

export type PaymentStats = {
    total: number;
    pending: number;
    paid: number;
    registrations: number;
    registrations_active: number;
    earned_total: number;
    earned_platform: number;
    currency: string;
    coincidencias: number;
};
