
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/context/PermissionsContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ListTodo,
  Settings,
  Shield,
  Wrench,
  FileBadge
} from "lucide-react";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { href: "/os", label: "Ordens de Serviço", icon: ListTodo, permission: "os" },
  { href: "/clients", label: "Clientes", icon: Briefcase, permission: "clients" },
];

const settingsNavItems = [
    { href: "/admin/users", label: "Usuários", icon: Users, permission: "adminUsers" },
    { href: "/admin/settings/roles", label: "Cargos", icon: Shield, permission: "adminRoles" },
    { href: "/admin/settings/services", label: "Serviços", icon: Wrench, permission: "adminServices" },
    { href: "/admin/settings/status", label: "Status", icon: FileBadge, permission: "adminStatus" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();

  const renderNavItem = (item: any) => {
    if (!hasPermission(item.permission, 'read')) {
      return null;
    }

    const isActive = pathname === item.href;

    return (
      <Link href={item.href} key={item.href}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.label}
        </Button>
      </Link>
    );
  };

  return (
    <aside className="w-64 min-h-screen bg-background border-r p-4 flex flex-col">
      <h1 className="text-2xl font-bold text-primary mb-6">TSMIT OS</h1>
      <nav className="flex flex-col gap-1">
        {mainNavItems.map(renderNavItem)}
      </nav>
      <div className="mt-auto">
        <h2 className="text-lg font-semibold my-2 flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Admin
        </h2>
        <nav className="flex flex-col gap-1">
            {settingsNavItems.map(renderNavItem)}
        </nav>
      </div>
    </aside>
  );
}
