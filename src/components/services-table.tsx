
"use client";

import { useState } from 'react';
import { ProvidedService } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { servicesApi } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit } from 'lucide-react';
import { ServiceFormSheet } from './service-form-sheet';
import { usePermissions } from '@/context/PermissionsContext';

export function ServicesTable({ services, onServiceChange }: { services: ProvidedService[], onServiceChange: () => void }) {
    const { toast } = useToast();
    const { hasPermission } = usePermissions();
    const [serviceToDelete, setServiceToDelete] = useState<ProvidedService | null>(null);
    
    const canUpdate = hasPermission('adminServices', 'update');
    const canDelete = hasPermission('adminServices', 'delete');

    const handleDelete = async () => {
        if (!serviceToDelete) return;

        try {
            await servicesApi.remove(serviceToDelete.id);
            toast({ title: 'Sucesso', description: 'Serviço removido.' });
            onServiceChange();
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível remover o serviço.', variant: 'destructive' });
        } finally {
            setServiceToDelete(null);
        }
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.map((service) => (
                        <TableRow key={service.id}>
                            <TableCell className="font-medium">{service.name}</TableCell>
                            <TableCell>{service.description || 'N/A'}</TableCell>
                            <TableCell className="text-right space-x-2">
                               {canUpdate && (
                                 <ServiceFormSheet service={service} onServiceChange={onServiceChange}>
                                    <Button variant="outline" size="icon">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                 </ServiceFormSheet>
                               )}

                               {canDelete && (
                                <AlertDialog open={!!serviceToDelete && serviceToDelete.id === service.id} onOpenChange={(isOpen) => !isOpen && setServiceToDelete(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" onClick={() => setServiceToDelete(service)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação removerá o serviço "{service.name}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete}>
                                                Deletar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                               )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
