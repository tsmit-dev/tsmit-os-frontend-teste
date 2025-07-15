
"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Status } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pencil, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { statusesApi } from '@/lib/api';
import { renderIcon } from './icon-picker';
import { StatusFormDialog } from './status-form-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/context/PermissionsContext';

interface StatusTableProps {
  statuses: Status[];
  onStatusChange: () => void;
}

export const StatusTable: React.FC<StatusTableProps> = ({ statuses, onStatusChange }) => {
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const { hasPermission } = usePermissions();

    const [statusToDelete, setStatusToDelete] = useState<Status | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

    const canUpdate = hasPermission('adminStatus', 'update');
    const canDelete = hasPermission('adminStatus', 'delete');

    const openEditDialog = (status: Status) => {
        setSelectedStatus(status);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!statusToDelete) return;
        try {
            await statusesApi.remove(statusToDelete.id);
            toast({ title: "Sucesso!", description: "Status excluído com sucesso." });
            onStatusChange();
        } catch (error) {
            const errorMessage = (error as any)?.response?.data?.message || "Ocorreu um erro ao excluir o status.";
            toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        } finally {
            setStatusToDelete(null);
        }
    };
    
    const BooleanIndicator = ({ value }: { value: boolean | undefined }) => (
        value ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-muted-foreground" />
    );

    const ActionButtons = ({ status }: { status: Status }) => (
        <div className="flex justify-end space-x-2">
            {canUpdate && (
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(status)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            )}
            {canDelete && (
                <AlertDialog onOpenChange={(open) => !open && setStatusToDelete(null)}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" onClick={() => setStatusToDelete(status)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o status "{status.name}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );

    const DesktopView = () => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Ordem</TableHead>
                    <TableHead>Nome do Status</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Ícone</TableHead>
                    <TableHead>Retirada?</TableHead>
                    <TableHead>Final?</TableHead>
                    <TableHead>Inicial?</TableHead>
                    <TableHead>Email?</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {statuses.map((status) => (
                    <TableRow key={status.id} onDoubleClick={() => canUpdate && openEditDialog(status)} className={canUpdate ? 'cursor-pointer' : ''}>
                        <TableCell>{status.order}</TableCell>
                        <TableCell className="font-medium">{status.name}</TableCell>
                        <TableCell><div className="h-4 w-4 rounded-full border" style={{ backgroundColor: status.color }} /></TableCell>
                        <TableCell>{renderIcon(status.icon)}</TableCell>
                        <TableCell><BooleanIndicator value={status.isPickupStatus} /></TableCell>
                        <TableCell><BooleanIndicator value={status.isFinal} /></TableCell>
                        <TableCell><BooleanIndicator value={status.isInitial} /></TableCell>
                        <TableCell><BooleanIndicator value={status.triggersEmail} /></TableCell>
                        <TableCell className="text-right">
                           <ActionButtons status={status} />
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
    );

    const MobileView = () => (
        <div className="grid gap-4">
            {statuses.map(status => (
                <Card key={status.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: status.color }} />
                                <span>{status.name}</span>
                                {renderIcon(status.icon)}
                            </div>
                            <Badge variant="outline">Ordem: {status.order}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2"><BooleanIndicator value={status.isPickupStatus} /><span>Pronto p/ Retirada</span></div>
                        <div className="flex items-center gap-2"><BooleanIndicator value={status.isFinal} /><span>Status Final</span></div>
                        <div className="flex items-center gap-2"><BooleanIndicator value={status.isInitial} /><span>Status Inicial</span></div>
                        <div className="flex items-center gap-2"><BooleanIndicator value={status.triggersEmail} /><span>Dispara Email</span></div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                       <ActionButtons status={status} />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
    
    return (
        <>
            {isMobile ? <MobileView /> : <DesktopView />}
            {canUpdate && (
                <StatusFormDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onSuccess={onStatusChange}
                    status={selectedStatus}
                    allStatuses={statuses}
                />
            )}
        </>
    );
};
