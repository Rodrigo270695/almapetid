import { Link, usePage } from '@inertiajs/react';
import {
    Banknote,
    BellRing,
    Building2,
    Cat,
    ClipboardList,
    CreditCard,
    Handshake,
    LayoutGrid,
    PawPrint,
    Plus,
    Shield,
    Syringe,
    Users,
    UsersRound,
    Wallet,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePermission } from '@/hooks/use-permission';
import { dashboard } from '@/routes';
import { index as animalsIndex } from '@/routes/animals';
import { dashboard as clinicDashboard } from '@/routes/clinic';
import {
    create as createRegistration,
    index as registrationsIndex,
} from '@/routes/clinic/registrations';
import { edit as clinicSettings } from '@/routes/clinic/settings';
import { index as platformCatalog } from '@/routes/platform/catalog';
import { index as platformPayments } from '@/routes/platform/payments';
import { index as platformPlans } from '@/routes/platform/plans';
import { index as platformRoles } from '@/routes/platform/roles';
import { index as platformUsers } from '@/routes/platform/users';
import type { NavGroup, NavItem } from '@/types';

export function AppSidebar() {
    const { t } = useTranslation('nav');
    const { can, isPlatformAdmin } = usePermission();
    const { auth } = usePage().props;
    const isClinic = (auth.roles ?? []).some((role) =>
        ['org_admin', 'clinic_staff'].includes(role),
    );
    const homeHref = isClinic ? clinicDashboard() : dashboard();

    const mainNavItems: NavItem[] = useMemo(
        () =>
            (
                isClinic
                    ? [
                          {
                              title: t('items.clinic_dashboard'),
                              href: clinicDashboard(),
                              icon: Syringe,
                          },
                          can('registrations.view')
                              ? {
                                    title: t('items.registrations'),
                                    href: registrationsIndex(),
                                    icon: ClipboardList,
                                }
                              : null,
                          can('registrations.create')
                              ? {
                                    title: t('items.register_chip'),
                                    href: createRegistration(),
                                    icon: Plus,
                                }
                              : null,
                          can('organizations.update')
                              ? {
                                    title: t('items.clinic_settings'),
                                    href: clinicSettings(),
                                    icon: Building2,
                                }
                              : null,
                      ]
                    : [
                          can('dashboard.view')
                              ? {
                                    title: t('items.dashboard'),
                                    href: dashboard(),
                                    icon: LayoutGrid,
                                }
                              : null,
                          can('animals.view')
                              ? {
                                    title: t('items.animals'),
                                    href: animalsIndex(),
                                    icon: PawPrint,
                                }
                              : null,
                      ]
            ).filter(Boolean) as NavItem[],
        [t, can, isClinic],
    );

    const adminGroups: NavGroup[] = useMemo(() => {
        if (!isPlatformAdmin) {
            return [];
        }

        return [
            {
                title: t('items.usuario'),
                icon: UsersRound,
                items: [
                    {
                        title: t('items.roles'),
                        href: platformRoles(),
                        icon: Shield,
                    },
                    {
                        title: t('items.usuarios'),
                        href: platformUsers(),
                        icon: Users,
                    },
                ],
            },
            {
                title: t('items.facturacion'),
                icon: Wallet,
                items: [
                    {
                        title: t('items.planes'),
                        href: platformPlans(),
                        icon: CreditCard,
                    },
                    {
                        title: t('items.pagos'),
                        href: platformPayments(),
                        icon: Banknote,
                    },
                    {
                        title: t('items.clientes'),
                        href: '/platform/clients',
                        icon: Users,
                    },
                ],
            },
            {
                title: t('items.catalogo'),
                icon: Cat,
                items: [
                    {
                        title: t('items.especies_razas'),
                        href: platformCatalog(),
                        icon: PawPrint,
                    },
                ],
            },
            {
                title: t('items.comunicaciones'),
                icon: BellRing,
                items: [
                    {
                        title: t('items.alertas'),
                        href: '/platform/alerts',
                        icon: BellRing,
                    },
                    {
                        title: t('items.auspiciadores'),
                        href: '/platform/sponsors',
                        icon: Handshake,
                    },
                ],
            },
        ];
    }, [isPlatformAdmin, t]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-4">
                <NavMain
                    label={t('groups.main')}
                    items={mainNavItems}
                    groups={[]}
                />
                {adminGroups.length > 0 ? (
                    <NavMain
                        label={t('groups.admin')}
                        items={[]}
                        groups={adminGroups}
                    />
                ) : null}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
