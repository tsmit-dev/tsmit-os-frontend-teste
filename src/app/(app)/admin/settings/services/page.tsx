
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { ProvidedService } from '@/lib/types';
import { servicesApi } from '@/lib/api';
import { PageLayout } from '@/components/page-layout';
import { Input } from '@/components/ui/input';
import { ServicesTable } from '@/components/services-table';
import { ServiceFormSheet } from '@/components/service-form-sheet';
import { Wrench, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ManageServicesPage() {
    const { toast } = useToast();
    const { hasPermission, loadingPermissions } = usePermissions();
    const router = useRouter();
    const [services, setServices] = useState<ProvidedService[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const canRead = hasPermission('adminServices', 'read');
    const canCreate = hasPermission('adminServices', 'create');

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const servicesData = await servicesApi.getAll();
            setServices(servicesData);
        } catch (error) {
            toast({ title: 'Erro ao buscar dados', description: 'Não foi possível carregar os serviços.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!loadingPermissions) {
            if (!canRead) {
                toast({ title: 'Acesso Negado', description: 'Você não tem permissão para gerenciar serviços.', variant: 'destructive' });
                router.replace('/dashboard');
                return;
            }
            fetchServices();
        }
    }, [loadingPermissions, canRead, router, toast, fetchServices]);
    
    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const searchBar = (
        <Input
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80"
        />
    );

    const actionButton = canCreate ? (
        <ServiceFormSheet onServiceChange={fetchServices}>
             <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Serviço
            </Button>
        </ServiceFormSheet>
    ) : null;

    return (
        <PageLayout
            title="Gerenciamento de Serviços"
            description="Gerencie os serviços oferecidos aos clientes."
            icon={<Wrench className="w-8 h-8 text-primary" />}
            isLoading={loading || loadingPermissions}
            canAccess={canRead}
            searchBar={searchBar}
            actionButton={actionButton}
        >
            <ServicesTable services={filteredServices} onServiceChange={fetchServices} />
        </PageLayout>
    );
}
