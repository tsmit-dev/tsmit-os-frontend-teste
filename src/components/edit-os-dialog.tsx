
"use client";

import { useState, useEffect } from "react";
import { ServiceOrder, Client } from "@/lib/types";
import { osApi, clientsApi } from "@/lib/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2 } from "lucide-react";

interface EditOsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceOrder: ServiceOrder | null;
  onSaveSuccess: () => void;
}

const formSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório."),
  collaboratorName: z.string().min(2, "Nome do contato é obrigatório."),
  collaboratorEmail: z.string().email("Email inválido.").optional().or(z.literal("")),
  collaboratorPhone: z.string().optional(),
  equipmentType: z.string().min(2, "Tipo do equipamento é obrigatório."),
  equipmentBrand: z.string().min(2, "Marca do equipamento é obrigatória."),
  equipmentModel: z.string().min(2, "Modelo do equipamento é obrigatório."),
  equipmentSerialNumber: z.string().min(2, "Número de série é obrigatório."),
  reportedProblem: z.string().min(10, "Problema relatado é obrigatório."),
});

type FormData = z.infer<typeof formSchema>;

// Helper to transform flat form data into the nested structure for the API
const transformDataForApi = (data: FormData): Partial<ServiceOrder> => {
    return {
        clientId: data.clientId,
        collaborator: {
            name: data.collaboratorName,
            email: data.collaboratorEmail,
            phone: data.collaboratorPhone,
        },
        equipment: {
            type: data.equipmentType,
            brand: data.equipmentBrand,
            model: data.equipmentModel,
            serialNumber: data.equipmentSerialNumber,
        },
        reportedProblem: data.reportedProblem
    };
}

export function EditOsDialog({ isOpen, onClose, serviceOrder, onSaveSuccess }: EditOsDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleSuccess = () => {
    onSaveSuccess();
    onClose();
  };

  const Component = isDesktop ? EditOsDialogDesktop : EditOsDrawer;

  return <Component isOpen={isOpen} onClose={onClose} serviceOrder={serviceOrder} onSaveSuccess={handleSuccess} />;
}

function EditOsForm({ serviceOrder, onFormSubmit, formId, isSubmitting }: { serviceOrder: ServiceOrder, onFormSubmit: (values: FormData) => Promise<void>, formId: string, isSubmitting: boolean }) {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });
  
  useEffect(() => {
    async function fetchClientsData() {
      try {
        const data = await clientsApi.getAll();
        setClients(data);
      } catch (error) {
        toast({ title: "Erro", description: "Não foi possível carregar os clientes.", variant: "destructive" });
      } finally {
        setLoadingClients(false);
      }
    }
    fetchClientsData();
  }, [toast]);

  useEffect(() => {
    if (serviceOrder) {
        form.reset({
            clientId: serviceOrder.clientId,
            collaboratorName: serviceOrder.collaborator.name,
            collaboratorEmail: serviceOrder.collaborator.email || "",
            collaboratorPhone: serviceOrder.collaborator.phone || "",
            equipmentType: serviceOrder.equipment.type,
            equipmentBrand: serviceOrder.equipment.brand,
            equipmentModel: serviceOrder.equipment.model,
            equipmentSerialNumber: serviceOrder.equipment.serialNumber,
            reportedProblem: serviceOrder.reportedProblem,
        });
    }
  }, [serviceOrder, form]);

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        <FormField control={form.control} name="clientId" render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={loadingClients || isSubmitting}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger></FormControl>
                <SelectContent>{clients.map((client) => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
        )} />
        
        <h4 className="font-semibold text-sm pt-2">Dados do Contato</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="collaboratorName" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="collaboratorPhone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="collaboratorEmail" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        
        <h4 className="font-semibold text-sm pt-2">Dados do Equipamento</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="equipmentType" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="equipmentBrand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="equipmentModel" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="equipmentSerialNumber" render={({ field }) => (<FormItem><FormLabel>Número de Série</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <FormField control={form.control} name="reportedProblem" render={({ field }) => (<FormItem><FormLabel>Problema Relatado</FormLabel><FormControl><Textarea rows={4} {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
      </form>
    </Form>
  );
}

const createSubmitHandler = (
    serviceOrder: ServiceOrder | null, 
    user: any, 
    toast: any, 
    onSaveSuccess: () => void,
    setIsSubmitting: (isSubmitting: boolean) => void
) => async (values: FormData) => {
    if (!serviceOrder || !user?.name) {
      toast({ title: "Erro", description: "Usuário ou OS não encontrados.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
        const payload = transformDataForApi(values);
        await osApi.update(serviceOrder.id, payload);
        toast({ title: "Sucesso", description: "OS atualizada com sucesso." });
        onSaveSuccess();
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível atualizar a OS.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
};

function EditOsDialogDesktop({ isOpen, onClose, serviceOrder, onSaveSuccess }: EditOsDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!serviceOrder) return null;

  const handleFormSubmit = createSubmitHandler(serviceOrder, user, toast, onSaveSuccess, setIsSubmitting);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Editar Ordem de Serviço #{serviceOrder.orderNumber}</DialogTitle><DialogDescription>Altere as informações básicas da OS.</DialogDescription></DialogHeader>
        <ScrollArea className="max-h-[60vh] p-4 pr-6 -mr-4">
            <EditOsForm serviceOrder={serviceOrder} onFormSubmit={handleFormSubmit} formId="edit-os-form-desktop" isSubmitting={isSubmitting} />
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost" disabled={isSubmitting}>Cancelar</Button></DialogClose>
          <Button type="submit" form="edit-os-form-desktop" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditOsDrawer({ isOpen, onClose, serviceOrder, onSaveSuccess }: EditOsDialogProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    if (!serviceOrder) return null;

    const handleFormSubmit = createSubmitHandler(serviceOrder, user, toast, onSaveSuccess, setIsSubmitting);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left"><DrawerTitle>Editar OS #{serviceOrder.orderNumber}</DrawerTitle><DrawerDescription>Altere as informações básicas da OS.</DrawerDescription></DrawerHeader>
        <div className="p-4">
            <ScrollArea className="h-[60vh]">
                <div className="px-1">
                    <EditOsForm serviceOrder={serviceOrder} onFormSubmit={handleFormSubmit} formId="edit-os-form-mobile" isSubmitting={isSubmitting} />
                </div>
            </ScrollArea>
        </div>
        <DrawerFooter className="pt-2">
          <Button type="submit" form="edit-os-form-mobile" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
          <DrawerClose asChild><Button variant="outline" disabled={isSubmitting}>Cancelar</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
