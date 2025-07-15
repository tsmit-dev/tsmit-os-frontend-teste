
"use client";

import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Role } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShieldCheck, UserCog } from "lucide-react";
import { rolesApi } from "@/lib/api";
import { RoleFormSheet } from './role-form-sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/context/PermissionsContext';

interface RolesTableProps {
  roles: Role[];
  onRoleChange: () => void;
}

export function RolesTable({ roles, onRoleChange }: RolesTableProps) {
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const { hasPermission } = usePermissions();
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    
    const canUpdate = hasPermission('adminRoles', 'update');
    const canDelete = hasPermission('adminRoles', 'delete');

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;
        try {
            await rolesApi.remove(roleToDelete.id);
            toast({ title: "Sucesso", description: "Cargo deletado com sucesso." });
            onRoleChange();
        } catch (error: any) {
            toast({
                title: "Erro",
                description: `Erro ao deletar cargo: ${error.message}`,
                variant: "destructive",
            });
        } finally {
            setRoleToDelete(null);
        }
    };
    
    const ActionButtons = ({ role }: { role: Role }) => (
        <div className="flex justify-end items-center space-x-2">
            {canUpdate && <RoleFormSheet role={role} onRoleChange={onRoleChange}>
                <Button variant="ghost" size="icon"><UserCog className="h-4 w-4" /></Button>
            </RoleFormSheet>}
            {canDelete && (
                 <AlertDialog open={!!roleToDelete && roleToDelete.id === role.id} onOpenChange={(isOpen) => !isOpen && setRoleToDelete(null)}>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setRoleToDelete(role)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso irá deletar permanentemente o cargo <span className="font-bold">{roleToDelete?.name}</span> e remover o acesso dos usuários associados.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteRole}>Deletar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );

    const PermissionBadges = ({ role }: { role: Role }) => (
         <div className="flex flex-wrap gap-2">
            {Object.entries(role.permissions).map(([resource, actions]) => (
                <div key={resource} className="flex items-center gap-1 border rounded-md px-2 py-1 bg-secondary/50">
                    <span className="text-sm font-semibold capitalize">{resource}:</span>
                    <div className="flex flex-wrap gap-1">
                        {actions.map(action => (
                            <Badge key={action} variant="secondary" className="capitalize">{action}</Badge>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const DesktopView = () => (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Permissões</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roles.map((role) => (
                        <TableRow key={role.id}>
                            <TableCell className="font-medium">{role.name}</TableCell>
                            <TableCell>
                                <PermissionBadges role={role} />
                            </TableCell>
                            <TableCell className="text-right">
                                <ActionButtons role={role} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    const MobileView = () => (
        <div className="grid gap-4">
            {roles.map((role) => (
                <Card key={role.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                           <span className="flex items-center gap-2">
                             <ShieldCheck className="h-5 w-5" />
                             {role.name}
                           </span>
                           <ActionButtons role={role} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PermissionBadges role={role} />
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return isMobile ? <MobileView /> : <DesktopView />;
}
