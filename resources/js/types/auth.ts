export type DocumentType =
    | 'dni'
    | 'passport'
    | 'national_id'
    | 'foreign_id'
    | 'other';

export const DOCUMENT_TYPES: DocumentType[] = [
    'dni',
    'passport',
    'national_id',
    'foreign_id',
    'other',
];

export type User = {
    id: number;
    name: string;
    lastname: string;
    full_name?: string;
    document_type?: DocumentType | null;
    document_number?: string | null;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    google_id?: string | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
    permissions: string[];
    roles: string[];
    organization?: {
        id: number;
        name: string;
        ruc: string;
    } | null;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
