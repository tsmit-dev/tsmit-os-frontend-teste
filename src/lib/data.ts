
"use client"
import { ServiceOrder, User, Client, Role, UpdateServiceOrderResult, ProvidedService, Status, EmailSettings } from "./types";
import { 
    authApi, 
    serviceOrderApi, 
    clientApi, 
    roleApi, 
    userApi, 
    serviceApi, 
    statusApi,
    settingsApi 
} from './api';

// --- Auth ---
export const login = authApi.login;
export const register = authApi.register;
export const getMe = authApi.getMe;
export const logout = authApi.logout;

// --- Service Orders ---
export const getServiceOrders = serviceOrderApi.getAll;
export const getServiceOrderById = serviceOrderApi.getById;
export const addServiceOrder = serviceOrderApi.create;
export const updateServiceOrderDetails = serviceOrderApi.update;
export const updateServiceOrderStatus = serviceOrderApi.updateStatus;

// --- Clients ---
export const getClients = clientApi.getAll;
export const getClientById = clientApi.getById;
export const addClient = clientApi.create;
export const updateClient = clientApi.update;
export const deleteClient = clientApi.delete;

// --- Roles ---
export const getRoles = roleApi.getAll;
export const getRoleById = roleApi.getById;
export const addRole = roleApi.create;
export const updateRole = roleApi.update;
export const deleteRole = roleApi.delete;

// --- Users ---
export const getUsers = userApi.getAll;
export const getUserById = userApi.getById;
export const addUser = userApi.create;
export const updateUser = userApi.update;
export const deleteUser = userApi.delete;

// --- Provided Services ---
export const getProvidedServices = serviceApi.getAll;
export const addProvidedService = serviceApi.create;
export const updateProvidedService = serviceApi.update; // Assuming update is needed
export const deleteProvidedService = serviceApi.delete;

// --- Statuses ---
export const getStatuses = statusApi.getAll;
export const addStatus = statusApi.create;
export const updateStatus = statusApi.update;
export const deleteStatus = statusApi.delete;

// --- Settings ---
export const getEmailSettings = settingsApi.getEmailSettings;
export const updateEmailSettings = settingsApi.updateEmailSettings;

// --- Legacy Function Wrappers (to be deprecated) ---
// These functions can be updated to include specific business logic 
// that shouldn't live in the UI, like sending emails after updates.

export const updateServiceOrder = async (
    id: string,
    newStatusId: string,
    responsible: string,
    technicalSolution?: string,
    observation?: string,
    attachments?: string[],
    confirmedServiceIds?: string[]
): Promise<UpdateServiceOrderResult> => {
    try {
        let updatedOrder: ServiceOrder | null = null;
        
        // Update status if it has changed
        if (newStatusId) {
            updatedOrder = await updateServiceOrderStatus(id, newStatusId, observation);
        }

        // Update other details
        const detailsToUpdate: Partial<ServiceOrder> = {};
        if (technicalSolution) detailsToUpdate.technicalSolution = technicalSolution;
        if (attachments) detailsToUpdate.attachments = attachments;
        if (confirmedServiceIds) detailsToUpdate.confirmedServiceIds = confirmedServiceIds;
        if (responsible) (detailsToUpdate as any).analyst = responsible;


        if (Object.keys(detailsToUpdate).length > 0) {
            updatedOrder = await updateServiceOrderDetails(id, detailsToUpdate);
        }

        // This is a simplified version. The real implementation might need to
        // fetch the order again to get the final state.
        // Also, the email sending logic is now assumed to be handled by the backend.
        
        return { updatedOrder, emailSent: true }; // Assuming backend handles email sending

    } catch (error: any) {
        console.error("Error updating service order:", error);
        return { updatedOrder: null, emailSent: false, emailErrorMessage: error.message };
    }
};
