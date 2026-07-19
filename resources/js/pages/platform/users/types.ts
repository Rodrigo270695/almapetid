import type { DocumentType } from '@/types';

export type UserRoleRef = {
    id: number;
    name: string;
};

export type PlatformUser = {
    id: number;
    name: string;
    lastname: string;
    email: string;
    phone: string | null;
    document_type: DocumentType | null;
    document_number: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles: readonly UserRoleRef[];
};

export type UserStats = {
    total: number;
    platform_admins: number;
    coincidencias: number;
};

export type UserFilters = {
    search: string;
    per_page: number;
    sort: string | null;
    direction: 'asc' | 'desc' | null;
    rol: string | null;
};

export type UserRoleOption = {
    id: number;
    name: string;
    description: string | null;
    is_system: boolean;
};
