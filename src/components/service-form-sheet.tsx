
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ProvidedService } from '@/lib/types';
import { servicesApi } from '@/lib/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const serviceSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  description: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormSheetProps {
  children: React.ReactNode;
  service?: ProvidedService;
  onServiceChange: () => void;
}

export function ServiceFormSheet({ children, service, onServiceChange }: ServiceFormSheetProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const isEditing = !!service;

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            name: service?.name || '',
            description: service?.description || '',
        })
    }
  }, [isOpen, service, form]);

  const onSubmit = async (values: ServiceFormData) => {
    try {
      if (isEditing) {
        await servicesApi.update(service.id, values);
        toast({ title: 'Sucesso', description: 'Serviço atualizado com sucesso.' });
      } else {
        await servicesApi.create(values);
        toast({ title: 'Sucesso', description: 'Serviço adicionado com sucesso.' });
      }
      onServiceChange();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save service', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o serviço.', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Serviço' : 'Adicionar Serviço'}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4 flex flex-col h-[calc(100%-2rem)]">
                <div className="space-y-4 flex-grow">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl><Input placeholder="Nome do serviço" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl><Textarea placeholder="Descrição do serviço" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <SheetFooter className="mt-auto">
                    <SheetClose asChild>
                        <Button type="button" variant="outline" disabled={form.formState.isSubmitting}>Cancelar</Button>
                    </SheetClose>
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
