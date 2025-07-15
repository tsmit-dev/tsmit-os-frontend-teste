
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Status } from '@/lib/types';
import { statusesApi } from '@/lib/api';
import { FileBadge, PlusCircle } from 'lucide-react';
import { StatusTable } from '@/components/status-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { StatusFormDialog } from '@/components/status-form-dialog';

export default function ManageStatusPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [loadingStatuses, setLoadingStatuses] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddStatusDialogOpen, setAddStatusDialogOpen] = useState(false);

    const canRead = hasPermission('adminStatus', 'read');
    const canCreate = hasPermission('adminStatus', 'create');

    const fetchStatuses = useCallback(async () => {
        setLoadingStatuses(true);
        try {
            const data = await statusesApi.getAll();
            const sortedData = data.sort((a, b) => a.order - b.order);
            setStatuses(sortedData);
        } catch (error) {
            console.error("Failed to fetch statuses:", error);
            toast({ title: "Erro", description: "Não foi possível carregar os status.", variant: "destructive" });
        } finally {
            setLoadingStatuses(false);
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
                fetchStatuses();
            }
        }
    }, [loadingPermissions, canRead, router, toast, fetchStatuses]);

    const filteredStatuses = statuses.filter(status =>
        status.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Button onClick={() => setAddStatusDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Status
        </Button>
    ) : null;

    return (
        <PageLayout
            title="Gerenciamento de Status"
            description='Nesta página, você pode gerenciar os status das ordens de serviço e o fluxo de trabalho.'
            icon={<FileBadge className="w-8 h-8 text-primary" />}
            isLoading={loadingPermissions || loadingStatuses}
            canAccess={canRead}
            searchBar={searchBar}
            actionButton={actionButton}
        >
            <StatusTable statuses={filteredStatuses} onStatusChange={fetchStatuses} />
            {canCreate && (
                 <StatusFormDialog
                    open={isAddStatusDialogOpen}
                    onOpenChange={setAddStatusDialogOpen}
                    onSuccess={fetchStatuses} // Use onSuccess instead of onSave
                    status={null}
                    allStatuses={statuses}
                />
            )}
        </PageLayout>
    );
}
