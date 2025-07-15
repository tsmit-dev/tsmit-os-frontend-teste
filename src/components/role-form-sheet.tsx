
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Role, Permissions } from '@/lib/types';
import { rolesApi } from '@/lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from './ui/scroll-area';

const AVAILABLE_PERMISSIONS = {
    dashboard: ['read'],
    os: ['create', 'read', 'update', 'delete'],
    clients: ['create', 'read', 'update', 'delete'],
    adminUsers: ['create', 'read', 'update', 'delete'],
    adminRoles: ['create', 'read', 'update', 'delete'],
    adminServices: ['create', 'read', 'update', 'delete'],
    adminStatus: ['create', 'read', 'update', 'delete'],
    adminSettings: ['read', 'update'],
} as const;

type Resource = keyof typeof AVAILABLE_PERMISSIONS;

const roleSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  permissions: z.record(z.array(z.string())).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormSheetProps {
  children: React.ReactNode;
  role?: Role;
  onRoleChange: () => void;
}

export function RoleFormSheet({ children, role, onRoleChange }: RoleFormSheetProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      permissions: {},
    },
  });

  useEffect(() => {
    if(isOpen) {
      form.reset({
        name: role?.name || '',
        permissions: role?.permissions || {},
      });
    }
  }, [isOpen, role, form]);

  const onSubmit = async (values: RoleFormData) => {
    try {
      const payload = {
        name: values.name,
        permissions: values.permissions || {},
      };

      if (role) {
        await rolesApi.update(role.id, payload);
        toast({ title: 'Sucesso', description: 'Cargo atualizado com sucesso.' });
      } else {
        await rolesApi.create(payload);
        toast({ title: 'Sucesso', description: 'Cargo adicionado com sucesso.' });
      }
      onRoleChange();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save role', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o cargo.', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{role ? 'Editar Cargo' : 'Adicionar Cargo'}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow">
                <ScrollArea className="flex-grow pr-6 -mr-6">
                    <div className="space-y-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Cargo</FormLabel>
                                <FormControl><Input placeholder="Ex: Técnico Nível 1" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="permissions" render={({ field }) => (
                            <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">Permissões</FormLabel>
                                    <FormDescription>Selecione as ações que este cargo pode realizar.</FormDescription>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(AVAILABLE_PERMISSIONS).map(([resource, actions]) => (
                                        <div key={resource} className="rounded-md border p-4">
                                            <h4 className="font-semibold capitalize mb-2">{resource.replace('admin', 'Admin ')}</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {actions.map((action) => (
                                                    <Controller
                                                        key={action}
                                                        name={`permissions.${resource}`}
                                                        control={form.control}
                                                        render={({ field: controllerField }) => {
                                                            const currentPermissions = controllerField.value || [];
                                                            return (
                                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={currentPermissions.includes(action)}
                                                                            onCheckedChange={(checked) => {
                                                                                const newValue = checked
                                                                                    ? [...currentPermissions, action]
                                                                                    : currentPermissions.filter(a => a !== action);
                                                                                controllerField.onChange(newValue);
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal capitalize">{action}</FormLabel>
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </ScrollArea>
                <SheetFooter className="mt-auto pt-6">
                    <SheetClose asChild><Button type="button" variant="ghost" disabled={form.formState.isSubmitting}>Cancelar</Button></SheetClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </SheetFooter>
            </form>
          </Form>
      </SheetContent>
    </Sheet>
  );
}
