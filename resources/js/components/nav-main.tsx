import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavGroup, NavItem } from '@/types';

type Props = {
    label?: string;
    items?: NavItem[];
    groups?: NavGroup[];
};

export function NavMain({
    label = 'Platform',
    items = [],
    groups = [],
}: Props) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const { isMobile, setOpenMobile } = useSidebar();

    const closeMobile = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    const initialOpen = useMemo(() => {
        const map: Record<string, boolean> = {};

        for (const group of groups) {
            map[group.title] = group.items.some((item) =>
                isCurrentOrParentUrl(item.href),
            );
        }

        return map;
    }, [groups, isCurrentOrParentUrl]);

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
        initialOpen,
    );

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="mb-1 px-2 text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground/70 uppercase">
                {label}
            </SidebarGroupLabel>

            <SidebarMenu className="gap-1">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    'h-10 rounded-xl font-medium transition-all duration-200',
                                    'hover:bg-foreground/[0.04]',
                                    active &&
                                        'bg-brand-sky/12 text-brand-sky shadow-[inset_0_0_0_1px] shadow-brand-sky/15 data-[active=true]:bg-brand-sky/12 data-[active=true]:text-brand-sky',
                                )}
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    onClick={closeMobile}
                                >
                                    {item.icon ? (
                                        <item.icon
                                            className={cn(
                                                'transition-colors',
                                                active && 'text-brand-sky',
                                            )}
                                        />
                                    ) : null}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}

                {groups.map((group) => {
                    const childActive = group.items.some((item) =>
                        isCurrentOrParentUrl(item.href),
                    );
                    const open = openGroups[group.title] ?? childActive;

                    return (
                        <Collapsible
                            key={group.title}
                            open={open}
                            onOpenChange={(next) =>
                                setOpenGroups((prev) => ({
                                    ...prev,
                                    [group.title]: next,
                                }))
                            }
                            className="group/collapsible"
                        >
                            <SidebarMenuItem className="flex flex-col gap-1">
                                <CollapsibleTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            'flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl px-2 text-sm font-medium outline-none transition-all duration-300',
                                            'text-sidebar-foreground hover:bg-foreground/[0.04]',
                                            'focus-visible:ring-2 focus-visible:ring-brand-sky/30',
                                            open &&
                                                'bg-transparent text-foreground',
                                            childActive &&
                                                !open &&
                                                'text-brand-sky',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300',
                                                open
                                                    ? 'bg-brand-sky/12 text-brand-sky'
                                                    : 'bg-muted/60 text-muted-foreground group-hover/collapsible:bg-muted',
                                            )}
                                        >
                                            {group.icon ? (
                                                <group.icon className="size-3.5" />
                                            ) : null}
                                        </span>

                                        <span className="min-w-0 flex-1 truncate text-left">
                                            {group.title}
                                        </span>

                                        <span
                                            className={cn(
                                                'flex size-6 shrink-0 items-center justify-center rounded-md transition-all duration-300',
                                                open
                                                    ? 'bg-brand-sky/10 text-brand-sky'
                                                    : 'text-muted-foreground/70',
                                            )}
                                        >
                                            <ChevronDown
                                                className={cn(
                                                    'size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                                    open && 'rotate-180',
                                                )}
                                            />
                                        </span>
                                    </button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="nav-collapsible-content overflow-hidden">
                                    <div className="nav-flyout relative ml-3.5 pl-3">
                                        <span
                                            aria-hidden
                                            className="nav-flyout-rail absolute top-1 bottom-1 left-0 w-px bg-gradient-to-b from-brand-sky/45 via-brand-sky/20 to-transparent"
                                        />

                                        <ul className="flex flex-col gap-0.5 py-1">
                                            {group.items.map((item, index) => {
                                                const active =
                                                    isCurrentOrParentUrl(
                                                        item.href,
                                                    );

                                                return (
                                                    <li
                                                        key={item.title}
                                                        style={{
                                                            animationDelay: `${index * 45}ms`,
                                                        }}
                                                        className="nav-sub-enter"
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            prefetch
                                                            onClick={
                                                                closeMobile
                                                            }
                                                            data-active={active}
                                                            className={cn(
                                                                'group/sub relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm outline-none transition-all duration-200',
                                                                'focus-visible:ring-2 focus-visible:ring-brand-sky/30',
                                                                active
                                                                    ? 'bg-brand-sky/12 font-medium text-brand-sky shadow-[inset_0_0_0_1px] shadow-brand-sky/12'
                                                                    : 'text-muted-foreground hover:translate-x-0.5 hover:bg-foreground/[0.04] hover:text-foreground',
                                                            )}
                                                        >
                                                            <span
                                                                aria-hidden
                                                                className={cn(
                                                                    'absolute top-2 bottom-2 -left-[13px] w-[2px] rounded-full bg-brand-sky transition-all duration-300',
                                                                    active
                                                                        ? 'scale-y-100 opacity-100'
                                                                        : 'scale-y-50 opacity-0',
                                                                )}
                                                            />

                                                            {item.icon ? (
                                                                <item.icon
                                                                    className={cn(
                                                                        'size-3.5 shrink-0 transition-colors duration-200',
                                                                        active
                                                                            ? 'text-brand-sky'
                                                                            : 'text-muted-foreground/80 group-hover/sub:text-brand-sky',
                                                                    )}
                                                                />
                                                            ) : null}

                                                            <span className="truncate">
                                                                {item.title}
                                                            </span>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
