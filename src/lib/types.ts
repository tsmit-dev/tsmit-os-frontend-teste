
// The new permissions object structure from the backend
// e.g., { "os": ["create", "read", "update"], "clients": ["read"] }
export type Permissions = Record<string, string[]>;

export interface ProvidedService {
  id: string;
  name: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permissions;
}

export type User = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role?: Role; // This can be populated client-side after fetching
};

export type Client = {
  id: string;
  name: string;
  email?: string;
  cnpj?: string;
  address?: string;
  contractedServiceIds?: string[];
  webProtection?: boolean;
  backup?: boolean;
  edr?: boolean;
};

export interface Status {
  id: string;
  name: string;
  order: number;
  color: string;
  icon?: string;
  isInitial?: boolean;
  triggersEmail?: boolean;
  emailBody?: string;
  allowedNextStatuses?: string[];
  isPickupStatus?: boolean;
  isFinal?: boolean;
}


export type LogEntry = {
  timestamp: Date;
  responsible: string; // User ID or name
  fromStatusId: string;
  toStatusId: string;
  observation?: string;
};

export type EditLogChange = {
  field: string;
  oldValue: any;
  newValue: any;
};

export type EditLogEntry = {
  timestamp: Date;
  responsible: string; // User ID or name
  changes: EditLogChange[];
  observation?: string;
};

export type ServiceOrder = {
  id: string;
  orderNumber: string;
  clientId: string;
  // This will be populated from the backend's client_snapshot
  clientSnapshot: {
    name: string;
    email?: string;
    cnpj?: string;
    address?: string;
  };
  collaborator: {
    name: string;
    email?: string;
    phone?: string;
  };
  equipment: {
    type: string;
    brand: string;
    model: string;
    serialNumber: string;
  };
  reportedProblem: string;
  analyst: string; // User ID or name
  statusId: string;
  status?: Status; // Populated client-side or by the backend
  technicalSolution?: string;
  createdAt: Date;
  updatedAt: Date;
  logs?: LogEntry[];
  attachments?: string[];
  contractedServices?: ProvidedService[];
  confirmedServiceIds?: string[];
  editLogs?: EditLogEntry[];
};

export interface EmailSettings {
  smtpServer: string;
  smtpPort?: number;
  smtpSecurity?: 'none' | 'ssl' | 'tls' | 'ssltls' | 'starttls';
  senderEmail?: string;
  smtpPassword?: string;
}
