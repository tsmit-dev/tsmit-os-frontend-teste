
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@/lib/types';
import { rolesApi } from '@/lib/api';
import { Lock } from 'lucide-react';
import { RolesTable } from '@/components/roles-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/page-layout';
import { RoleFormSheet } from '@/components/role-form-sheet';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ManageRolesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');

    const canRead = hasPermission('adminRoles', 'read');
    const canCreate = hasPermission('adminRoles', 'create');

    const fetchRoles = useCallback(async () => {
        setLoadingRoles(true);
        try {
            const data = await rolesApi.getAll();
            setRoles(data);
        } catch (error) {
            console.error("Failed to fetch roles", error);
            toast({ title: "Erro", description: "Não foi possível carregar os cargos.", variant: "destructive" });
        } finally {
            setLoadingRoles(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!loadingPermissions) {
            if (!canRead) {
                toast({
                    title: "Acesso Negado",
                    description: "Você não tem permissão para acessar esta página.",
                    variant: "destructive",
                });
                router.replace('/dashboard');
            } else {
                fetchRoles();
            }
        }
    }, [loadingPermissions, canRead, router, toast, fetchRoles]);

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const searchBar = (
        <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80"
        />
    );

    const actionButton = canCreate ? (
        <RoleFormSheet onRoleChange={fetchRoles}>
             <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Cargo
            </Button>
        </RoleFormSheet>
    ) : null;

    return (
        <PageLayout
            title="Gerenciamento de Cargos"
            description='Nesta página, você pode gerenciar os cargos e suas permissões.'
            icon={<Lock className="w-8 h-8 text-primary" />}
            isLoading={loadingPermissions || loadingRoles}
            canAccess={canRead}
            searchBar={searchBar}
            actionButton={actionButton}
        >
            <RolesTable roles={filteredRoles} onRoleChange={fetchRoles} />
        </PageLayout>
    );
}
