
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceOrder, Status } from "@/lib/types";
import { osApi, statusesApi } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { usePermissions } from "@/context/PermissionsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import {
    HardDrive,
    FileText,
    Wrench,
    History,
    ArrowRight,
    Briefcase,
    Printer,
    Edit,
    ListTree,
    RotateCcw,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EditOsDialog } from "@/components/edit-os-dialog";
import { StatusBadge } from "@/components/status-badge";

// Helper to translate field names for the edit history
const getTranslatedFieldName = (field: string): string => {
    const translations: { [key: string]: string } = {
        clientId: 'Cliente',
        collaboratorName: 'Nome do Contato',
        collaboratorEmail: 'Email do Contato',
        collaboratorPhone: 'Telefone do Contato',
        equipmentType: 'Tipo do Equipamento',
        equipmentBrand: 'Marca',
        equipmentModel: 'Modelo',
        equipmentSerialNumber: 'Número de Série',
        reportedProblem: 'Problema Relatado',
    };
    return translations[field] || field;
};

// Helper to format values for display
const formatValueForDisplay = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return String(value);
};


export default function OsDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const { hasPermission, loadingPermissions } = usePermissions();
    const { toast } = useToast();
    const router = useRouter();

    const [statuses, setStatuses] = useState<Status[]>([]);
    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [selectedStatusId, setSelectedStatusId] = useState<string>('');
    const [note, setNote] = useState('');
    const [confirmedServiceIds, setConfirmedServiceIds] = useState<string[]>([]);
    const [isEditOsDialogOpen, setIsEditOsDialogOpen] = useState(false);

    const statusMap = useMemo(() => new Map(statuses.map(s => [s.id, s])), [statuses]);
    const currentStatus = useMemo(() => statusMap.get(order?.statusId ?? ''), [order, statusMap]);
    const selectedStatus = useMemo(() => statusMap.get(selectedStatusId), [selectedStatusId, statusMap]);

    const isDelivered = useMemo(() => currentStatus?.isFinal, [currentStatus]);
    const isPickupStatusSelected = useMemo(() => selectedStatus?.isPickupStatus ?? false, [selectedStatus]);
    const noteLabel = useMemo(() => isPickupStatusSelected ? "Solução Técnica" : "Nota", [isPickupStatusSelected]);
    const notePlaceholder = useMemo(() => isPickupStatusSelected ? "Descreva a solução técnica detalhadamente." : "Adicione uma nota (opcional).", [isPickupStatusSelected]);

    const canUpdate = hasPermission('os', 'update');

    const availableStatuses = useMemo(() => {
        if (!currentStatus) return [];
        const combinedAllowed = new Set<Status>();

        if (hasPermission('adminSettings', 'update')) {
            statuses.forEach(s => {
                if (s.id !== currentStatus.id) combinedAllowed.add(s);
            });
        } else {
            const allowedNext = currentStatus.allowedNextStatuses || [];
            allowedNext.forEach(statusId => {
                const status = statusMap.get(statusId);
                if (status) combinedAllowed.add(status);
            });
        }
        return Array.from(combinedAllowed).sort((a, b) => a.order - b.order);
    }, [currentStatus, statuses, hasPermission, statusMap]);

    const fetchInitialData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [orderData, statusesData] = await Promise.all([
                osApi.getById(id),
                statusesApi.getAll()
            ]);
            if (orderData) {
                setOrder(orderData);
                setSelectedStatusId(orderData.statusId);
                setNote(orderData.technicalSolution || '');
                setConfirmedServiceIds(orderData.confirmedServiceIds || []);
                setStatuses(statusesData);
            } else {
                toast({ title: "Erro", description: "Ordem de Serviço não encontrada.", variant: "destructive" });
                router.push('/os');
            }
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível carregar a OS.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [id, toast, router]);

    const refreshOrder = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await osApi.getById(id);
            if (data) {
                setOrder(data);
                setSelectedStatusId(data.statusId);
            }
        } catch (error) {
             toast({ title: "Erro", description: "Não foi possível recarregar os dados da OS.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        if (!loadingPermissions) {
            if (hasPermission('os', 'read')) {
                fetchInitialData();
            } else {
                toast({ title: "Acesso Negado", variant: "destructive" });
                router.replace('/dashboard');
            }
        }
    }, [loadingPermissions, hasPermission, router, fetchInitialData]);

    const handleUpdate = async () => {
        if (!order || !selectedStatusId || !user || !canUpdate) {
            toast({ title: "Acesso Negado", description: "Você não tem permissão para atualizar esta OS.", variant: "destructive" });
            return;
        }

        const isStatusChanging = selectedStatusId !== order.statusId;
        const noteTrimmed = note.trim();
        
        setIsUpdating(true);
        try {
            if (isStatusChanging) {
                const result = await osApi.updateStatus(order.id, selectedStatusId, noteTrimmed);
                setOrder(result);
                setSelectedStatusId(result.statusId);
                setNote(result.technicalSolution || '');
                toast({ title: "Sucesso", description: "Status da OS atualizado." });
            } else {
                const payload = {
                    technicalSolution: noteTrimmed,
                    confirmedServiceIds: confirmedServiceIds
                };
                const result = await osApi.update(order.id, payload);
                setOrder(result);
                toast({ title: "Sucesso", description: "Detalhes da OS atualizados." });
            }
            refreshOrder();
        } catch (error) {
            const errorMessage = (error as any)?.response?.data?.message || "Ocorreu um erro na atualização.";
            toast({ title: "Erro na Atualização", description: errorMessage, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };
    
    if (loadingPermissions || loading) return <OsDetailSkeleton />;
    if (!order || !hasPermission('os', 'read')) return <p>Acesso negado ou OS não encontrada.</p>;
    
    const showServiceConfirmation = selectedStatus?.triggersEmail;
    const hasIncompleteServices = order.contractedServices?.some(service => !confirmedServiceIds.includes(service.id));
    const showAlertBanner = showServiceConfirmation && hasIncompleteServices;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold font-headline">OS: {order.orderNumber}</h1>
                    <p className="text-sm text-muted-foreground">
                        Aberta em {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm")} por {order.analyst}
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {canUpdate && (
                        <Button variant="outline" onClick={() => setIsEditOsDialogOpen(true)} disabled={isDelivered} className="flex-1 sm:flex-none">
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                    )}
                    <Link href={`/os/${order.id}/label`} passHref className="flex-1 sm:flex-none">
                        <Button variant="outline" className="w-full">
                            <Printer className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                    </Link>
                </div>
            </div>

             {showAlertBanner && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atenção: Serviços Pendentes!</AlertTitle>
                    <AlertDescription>Confirme todos os serviços antes de avançar.</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive /> Equipamento</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div><p className="font-semibold text-muted-foreground">Tipo</p><p>{order.equipment.type}</p></div>
                            <div><p className="font-semibold text-muted-foreground">Marca</p><p>{order.equipment.brand}</p></div>
                            <div><p className="font-semibold text-muted-foreground">Modelo</p><p>{order.equipment.model}</p></div>
                            <div><p className="font-semibold text-muted-foreground">N/S</p><p>{order.equipment.serialNumber}</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase /> Cliente e Contato</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div><p className="font-semibold text-muted-foreground">Empresa</p><p>{order.clientSnapshot.name}</p></div>
                            <div><p className="font-semibold text-muted-foreground">Contato</p><p>{order.collaborator.name}</p></div>
                            <div><p className="font-semibold text-muted-foreground">Email</p><p>{order.collaborator.email || 'N/A'}</p></div>
                            <div><p className="font-semibold text-muted-foreground">Telefone</p><p>{order.collaborator.phone || 'N/A'}</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Problema Relatado</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">{order.reportedProblem}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle /> Serviços Contratados</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {order.contractedServices?.length ? order.contractedServices.map(s => (
                                    <Badge key={s.id} variant="default">{s.name}</Badge>
                                )) : <p className="text-muted-foreground">Nenhum serviço contratado.</p>}
                            </div>
                        </CardContent>
                    </Card>
                     {canUpdate && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Wrench /> Atualização da OS</CardTitle>
                                <CardDescription>Altere o status ou adicione uma nota/solução técnica.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Alterar Status para:</Label>
                                    <Select value={selectedStatusId} onValueChange={setSelectedStatusId} disabled={isUpdating || isDelivered}>
                                        <SelectTrigger><SelectValue placeholder="Selecione o próximo status" /></SelectTrigger>
                                        <SelectContent>
                                            {currentStatus && <SelectItem value={currentStatus.id} disabled>-- {currentStatus.name} (Atual) --</SelectItem>}
                                            {availableStatuses.map(status => (
                                                <SelectItem key={status.id} value={status.id}>
                                                    <div className="flex items-center gap-2">
                                                        {(status as any).isBackButton && <RotateCcw className="h-4 w-4 text-muted-foreground" />}
                                                        <span>{status.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {showServiceConfirmation && (
                                    <div className="space-y-3 rounded-md border bg-yellow-50/50 p-4 dark:bg-yellow-950/30">
                                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Confirmação de Serviços</h3>
                                        <div className="space-y-2">
                                            {order.contractedServices?.map(service => (
                                                <div key={service.id} className="flex items-center space-x-2">
                                                    <Checkbox id={`c-${service.id}`} checked={confirmedServiceIds.includes(service.id)} onCheckedChange={(c) => setConfirmedServiceIds(p => c ? [...p, service.id] : p.filter(id => id !== service.id))} disabled={isUpdating || isDelivered} />
                                                    <Label htmlFor={`c-${service.id}`}>{service.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <Label htmlFor="note">
                                        {noteLabel} {isPickupStatusSelected && <span className="text-red-500">*</span>}
                                    </Label>
                                    <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={5} placeholder={notePlaceholder} disabled={isUpdating || isDelivered} />
                                </div>
                                <Button onClick={handleUpdate} disabled={isUpdating || isDelivered || (showAlertBanner ?? false)}>
                                    {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><History /> Histórico de Status</CardTitle></CardHeader>
                        <CardContent>
                           {order.logs && order.logs.length > 0 ? (
                            <ul className="space-y-4">
                                {order.logs.slice().reverse().map((log, index) => {
                                    const fromStatus = statusMap.get(log.fromStatusId);
                                    const toStatus = statusMap.get(log.toStatusId);
                                    return (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="text-xs text-muted-foreground text-right w-20 shrink-0">
                                            <p>{format(new Date(log.timestamp), "dd/MM/yy")}</p>
                                            <p>{format(new Date(log.timestamp), "HH:mm")}</p>
                                        </div>
                                        <div className="relative w-full">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {fromStatus && <StatusBadge status={fromStatus} />}
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                {toStatus && <StatusBadge status={toStatus} />}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">por: {log.responsible}</p>
                                            {log.observation && <p className="text-sm mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md whitespace-pre-wrap">{log.observation}</p>}
                                        </div>
                                    </li>
                                )})}
                            </ul>
                           ) : <p className="text-muted-foreground text-sm">Nenhum histórico de status.</p>}
                        </CardContent>
                    </Card>
                    {order.editLogs && order.editLogs.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><ListTree /> Histórico de Edição</CardTitle></CardHeader>
                            <CardContent>
                               <ul className="space-y-4">
                                    {order.editLogs.slice().reverse().map((log, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <div className="text-xs text-muted-foreground text-right w-20 shrink-0">
                                                <p>{format(new Date(log.timestamp), "dd/MM/yy")}</p>
                                                <p>{format(new Date(log.timestamp), "HH:mm")}</p>
                                            </div>
                                            <div className="relative w-full">
                                                <p className="text-sm font-medium">Editado por: {log.responsible}</p>
                                                {log.observation && <p className="text-xs text-muted-foreground mt-1">Obs: {log.observation}</p>}
                                                <div className="mt-2 space-y-1">
                                                    {log.changes.map((change, i) => (
                                                        <div key={i} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                                                            <p className="font-semibold">{getTranslatedFieldName(change.field)}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-red-500 line-through">{formatValueForDisplay(change.oldValue)}</span>
                                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-green-500">{formatValueForDisplay(change.newValue)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            {order && (<EditOsDialog isOpen={isEditOsDialogOpen} onClose={() => setIsEditOsDialogOpen(false)} serviceOrder={order} onSaveSuccess={refreshOrder} />)}
        </div>
    );
}

function OsDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-1/2" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        </div>
    );
}
