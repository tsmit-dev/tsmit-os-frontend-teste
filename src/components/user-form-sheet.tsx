
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Role } from "@/lib/types";
import { usersApi, authApi } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/context/PermissionsContext";

const createUserSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório."),
    email: z.string().email("E-mail inválido."),
    roleId: z.string().min(1, "O cargo é obrigatório."),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

const updateUserSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório."),
    email: z.string().email("E-mail inválido."),
    roleId: z.string().min(1, "O cargo é obrigatório."),
    password: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

interface UserFormSheetProps {
  children: React.ReactNode;
  user?: User;
  roles: Role[];
  onUserChange: () => void;
}

export function UserFormSheet({
  children,
  user,
  roles,
  onUserChange,
}: UserFormSheetProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);

  const isEditing = !!user;
  const canCreate = hasPermission("adminUsers", "create");
  const canUpdate = hasPermission("adminUsers", "update");

  const form = useForm({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      roleId: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: user?.name || "",
        email: user?.email || "",
        roleId: user?.roleId || "",
        password: "",
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = async (values: CreateUserFormData | UpdateUserFormData) => {
    try {
      if (isEditing) {
        if (!canUpdate) throw new Error("Acesso negado para atualizar usuários.");
        const updatePayload: Partial<User> = {
            name: values.name,
            email: values.email,
            roleId: values.roleId,
        };
        await usersApi.update(user.id, updatePayload);
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso.",
        });
      } else {
        if (!canCreate) throw new Error("Acesso negado para criar usuários.");
        const createValues = values as CreateUserFormData;
        await authApi.register(createValues.name, createValues.email, createValues.password, createValues.roleId);
        toast({
          title: "Sucesso",
          description: "Usuário adicionado com sucesso.",
        });
      }
      onUserChange();
      setIsOpen(false);
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || "Não foi possível salvar o usuário.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  const hasFormPermission = isEditing ? canUpdate : canCreate;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Usuário" : "Adicionar Usuário"}</SheetTitle>
        </SheetHeader>
        {hasFormPermission ? (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow">
                    <div className="space-y-4 flex-grow">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl><Input placeholder="Nome do usuário" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>E-mail</FormLabel>
                                <FormControl><Input type="email" placeholder="E-mail do usuário" {...field} disabled={isEditing} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        {!isEditing && (
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Senha</FormLabel>
                                    <FormControl><Input type="password" placeholder="Mínimo de 6 caracteres" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                        <FormField control={form.control} name="roleId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cargo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione um cargo" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {roles.map((role) => (<SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <SheetFooter className="mt-auto pt-6">
                        <SheetClose asChild><Button type="button" variant="outline" disabled={form.formState.isSubmitting}>Cancelar</Button></SheetClose>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </SheetFooter>
                </form>
            </Form>
        ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Você não tem permissão para realizar esta ação.</p>
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
