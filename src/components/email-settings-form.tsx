"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { usePermissions } from "@/context/PermissionsContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEmailSettings, updateEmailSettings } from "@/lib/data";

const formSchema = z.object({
  smtpServer: z.string().min(1, "Servidor SMTP é obrigatório."),
  smtpPort: z.preprocess(
    (val) => Number(val),
    z.number().int().positive("Porta SMTP deve ser um número positivo.").optional()
  ),
  smtpSecurity: z.enum(["none", "ssl", "tls", "ssltls", "starttls"]).optional(),
  senderEmail: z.string().email("E-mail do remetente inválido.").optional(),
  smtpPassword: z.string().min(1, "Senha SMTP é obrigatória."),
});

type EmailSettings = z.infer<typeof formSchema>;

export function EmailSettingsForm() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { hasPermission, loadingPermissions } = usePermissions();

  const form = useForm<EmailSettings>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      smtpServer: "",
      smtpPort: undefined,
      smtpSecurity: "none",
      senderEmail: "",
      smtpPassword: "",
    },
  });

  const canEditSettings = hasPermission("adminSettings");

  useEffect(() => {
    const loadSettings = async () => {
      if (!loadingPermissions && canEditSettings) {
        setIsLoadingSettings(true);
        try {
          const fetchedSettings = await getEmailSettings();
          if (fetchedSettings) {
            form.reset(fetchedSettings);
          }
        } catch (error) {
          console.error("Failed to fetch email settings:", error);
          toast({
            title: "Erro ao carregar",
            description: "Não foi possível carregar as configurações de e-mail.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingSettings(false);
        }
      }
    };
    loadSettings();
  }, [loadingPermissions, canEditSettings, form, toast]);

  async function onSubmit(values: EmailSettings) {
    if (!canEditSettings) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para modificar as configurações de e-mail.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateEmailSettings(values);
      toast({
        title: "Sucesso",
        description: "Configurações de e-mail salvas com sucesso.",
      });
    } catch (error) {
        console.error("Failed to save email settings:", error);
        toast({
            title: "Erro",
            description: "Não foi possível salvar as configurações de e-mail.",
            variant: "destructive",
        });
    }
    finally {
      setIsSaving(false);
    }
  }

  if (loadingPermissions || isLoadingSettings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (!canEditSettings) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border rounded-md p-4 text-center text-muted-foreground">
        <p className="text-lg font-semibold">Acesso Negado</p>
        <p>Você não tem permissão para visualizar ou modificar as configurações de e-mail.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="smtpServer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Servidor SMTP</FormLabel>
              <FormControl>
                <Input {...field} placeholder="smtp.example.com" disabled={isSaving || !canEditSettings} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="smtpPort"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Porta SMTP</FormLabel>
              <FormControl>
                <Input type="number" {...field} placeholder="587" disabled={isSaving || !canEditSettings} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="smtpSecurity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Segurança</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving || !canEditSettings}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo de segurança" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="ssltls">SSL/TLS</SelectItem>
                  <SelectItem value="starttls">STARTTLS</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="senderEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail do Remetente</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="contato@suaempresa.com.br" disabled={isSaving || !canEditSettings} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="smtpPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha SMTP</FormLabel>
              <FormControl>
                <Input type="password" {...field} placeholder="Sua senha SMTP" disabled={isSaving || !canEditSettings} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSaving || !canEditSettings}>
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </form>
    </Form>
  );
}