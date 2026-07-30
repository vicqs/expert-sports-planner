/**
 * Data Services Layer
 *
 * This layer abstracts data operations and prepares for API migration.
 * All components should use these services instead of directly accessing MockDatabase.
 *
 * Benefits:
 * - Single point of change when migrating to API
 * - Consistent error handling
 * - Request/Response transformation
 * - Role-based data filtering
 */

import { getCurrentSession, USER_ROLES } from "../utils/auth";

/**
 * Base configuration for future API integration
 */
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  TIMEOUT: 30000,
  USE_MOCK: true, // Switch to false when API is ready
};

/**
 * Base API client for future HTTP calls
 */
class ApiClient {
  baseUrl: any;
  timeout: any;
  useMock: any;

  constructor(config: any) {
    this.baseUrl = config.BASE_URL;
    this.timeout = config.TIMEOUT;
    this.useMock = config.USE_MOCK;
  }

  /**
   * Generic request handler
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise} Response data
   */
  async request(endpoint: string, options: any = {}) {
    if (this.useMock) {
      // In mock mode, this would be handled by MockDatabase
      throw new Error("Mock mode - use MockDatabase context");
    }

    const url = `${this.baseUrl}${endpoint}`;
    const config: any = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Get authentication headers from current session
   * @returns {Object} Auth headers
   */
  getAuthHeaders() {
    const session: any = getCurrentSession();
    if (session && session.token) {
      return {
        Authorization: `Bearer ${session.token}`,
      };
    }
    return {};
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: "GET" });
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

const apiClient = new ApiClient(API_CONFIG);

/**
 * Client/Plan Service
 * Handles all client and plan related operations
 */
export class ClientService {
  mockDb: any;
  useMock: any;

  constructor(mockDb: any = null) {
    this.mockDb = mockDb;
    this.useMock = API_CONFIG.USE_MOCK;
  }

  /**
   * Get clients visible to current user
   * Coaches see all, athletes see only their own
   */
  async getClients() {
    if (this.useMock) {
      const session: any = getCurrentSession();
      const allClients = this.mockDb.clients;

      if (!session) return [];

      // Coaches see all clients
      if (session.role === USER_ROLES.COACH) {
        return allClients;
      }

      // Athletes see only their own data
      if (session.role === USER_ROLES.ATHLETE) {
        return allClients.filter((c) => c.athleteId === session.userId);
      }

      return [];
    }

    // Future API call
    return await apiClient.get("/clients");
  }

  /**
   * Get pending clients (coach only)
   */
  async getPendingClients() {
    if (this.useMock) {
      const session: any = getCurrentSession();
      if (session?.role !== USER_ROLES.COACH) {
        return [];
      }
      return this.mockDb.getPendingClients();
    }

    return await apiClient.get("/clients?status=pending");
  }

  /**
   * Get completed clients (coach only)
   */
  async getCompletedClients() {
    if (this.useMock) {
      const session: any = getCurrentSession();
      if (session?.role !== USER_ROLES.COACH) {
        return [];
      }
      return this.mockDb.getCompletedClients();
    }

    return await apiClient.get("/clients?status=completed");
  }

  /**
   * Get active plans for current athlete
   */
  async getActivePlans() {
    if (this.useMock) {
      const session: any = getCurrentSession();
      if (session?.role !== USER_ROLES.ATHLETE) {
        return [];
      }

      // Filter plans for current athlete
      return this.mockDb
        .getActivePlans()
        .filter((plan) => plan.athleteId === session.userId);
    }

    return await apiClient.get("/plans/active");
  }

  /**
   * Add client request (athlete only)
   */
  async addClientRequest(clientData) {
    const session: any = getCurrentSession();

    if (this.useMock) {
      // Add athlete ID to the request
      const enrichedData = {
        ...clientData,
        athleteId: session?.userId,
      };
      return this.mockDb.addClientRequest(enrichedData);
    }

    return await apiClient.post("/clients", {
      ...clientData,
      athleteId: session?.userId,
    });
  }

  /**
   * Update client plan (coach only)
   */
  async updateClientPlan(clientId, planText, planObject) {
    const session: any = getCurrentSession();

    if (session?.role !== USER_ROLES.COACH) {
      throw new Error("Unauthorized: Only coaches can update plans");
    }

    if (this.useMock) {
      return this.mockDb.updateClientPlan(clientId, planText, planObject);
    }

    return await apiClient.put(`/clients/${clientId}/plan`, {
      planText,
      planObject,
    });
  }

  /**
   * Toggle session completion (athlete only)
   */
  async toggleSessionCompletion(clientId, weekIndex, dayIndex) {
    const session: any = getCurrentSession();

    if (session?.role !== USER_ROLES.ATHLETE) {
      throw new Error("Unauthorized: Only athletes can mark sessions");
    }

    if (this.useMock) {
      return this.mockDb.toggleSessionCompletion(clientId, weekIndex, dayIndex);
    }

    return await apiClient.post(`/clients/${clientId}/sessions/toggle`, {
      weekIndex,
      dayIndex,
    });
  }

  /**
   * Update session note (athlete only)
   */
  async updateSessionNote(clientId, weekIndex, dayIndex, note) {
    const session: any = getCurrentSession();

    if (session?.role !== USER_ROLES.ATHLETE) {
      throw new Error("Unauthorized: Only athletes can update notes");
    }

    if (this.useMock) {
      return this.mockDb.updateSessionNote(clientId, weekIndex, dayIndex, note);
    }

    return await apiClient.put(`/clients/${clientId}/sessions/note`, {
      weekIndex,
      dayIndex,
      note,
    });
  }
}

/**
 * Gym Service
 * Handles gym bookings and availability
 */
export class GymService {
  mockDb: any;
  useMock: any;

  constructor(mockDb: any = null) {
    this.mockDb = mockDb;
    this.useMock = API_CONFIG.USE_MOCK;
  }

  /**
   * Get gym schedule for a specific date
   */
  async getGymSchedule(date) {
    if (this.useMock) {
      return this.mockDb.getGymSchedule(date);
    }

    return await apiClient.get(`/gym/schedule?date=${date}`);
  }

  /**
   * Update gym schedule (coach only)
   */
  async updateGymSchedule(date, slots) {
    const session: any = getCurrentSession();

    if (session?.role !== USER_ROLES.COACH) {
      throw new Error("Unauthorized: Only coaches can update gym schedule");
    }

    if (this.useMock) {
      return this.mockDb.updateGymSchedule(date, slots);
    }

    return await apiClient.put("/gym/schedule", { date, slots });
  }

  /**
   * Book gym slot (athlete only)
   */
  async bookGymSlot(date, slotId) {
    const session: any = getCurrentSession();

    if (!session || session.role !== USER_ROLES.ATHLETE) {
      throw new Error("Unauthorized: Only athletes can book slots");
    }

    if (this.useMock) {
      return this.mockDb.bookGymSlot(session.userId, date, slotId);
    }

    return await apiClient.post("/gym/bookings", {
      athleteId: session.userId,
      date,
      slotId,
    });
  }

  /**
   * Cancel gym booking (athlete only)
   */
  async cancelGymBooking(bookingId) {
    const session: any = getCurrentSession();

    if (!session || session.role !== USER_ROLES.ATHLETE) {
      throw new Error("Unauthorized: Only athletes can cancel bookings");
    }

    if (this.useMock) {
      return this.mockDb.cancelGymBooking(bookingId);
    }

    return await apiClient.delete(`/gym/bookings/${bookingId}`);
  }

  /**
   * Get athlete's gym bookings
   */
  async getAthleteGymBookings() {
    const session: any = getCurrentSession();

    if (!session || session.role !== USER_ROLES.ATHLETE) {
      return [];
    }

    if (this.useMock) {
      return this.mockDb.getAthleteGymBookings(session.userId);
    }

    return await apiClient.get(`/gym/bookings?athleteId=${session.userId}`);
  }

  /**
   * Get all gym bookings (coach only)
   */
  async getAllGymBookings() {
    const session: any = getCurrentSession();

    if (session?.role !== USER_ROLES.COACH) {
      return [];
    }

    if (this.useMock) {
      return this.mockDb.gymBookings;
    }

    return await apiClient.get("/gym/bookings");
  }
}

/**
 * Appointment Service
 * Handles appointment scheduling
 */
export class AppointmentService {
  mockDb: any;
  useMock: any;

  constructor(mockDb: any = null) {
    this.mockDb = mockDb;
    this.useMock = API_CONFIG.USE_MOCK;
  }

  /**
   * Add appointment (athlete only)
   */
  async addAppointment(appointmentData) {
    const session: any = getCurrentSession();

    if (!session || session.role !== USER_ROLES.ATHLETE) {
      throw new Error("Unauthorized: Only athletes can create appointments");
    }

    if (this.useMock) {
      return this.mockDb.addAppointment({
        ...appointmentData,
        athleteId: session.userId,
      });
    }

    return await apiClient.post("/appointments", {
      ...appointmentData,
      athleteId: session.userId,
    });
  }

  /**
   * Get athlete's appointments
   */
  async getAthleteAppointments() {
    const session: any = getCurrentSession();

    if (!session || session.role !== USER_ROLES.ATHLETE) {
      return [];
    }

    if (this.useMock) {
      return this.mockDb.getAthleteAppointments(session.userId);
    }

    return await apiClient.get(`/appointments?athleteId=${session.userId}`);
  }

  /**
   * Get trainer's appointments for a date (coach only)
   */
  async getTrainerAppointments(date) {
    const session: any = getCurrentSession();

    if (session?.role !== USER_ROLES.COACH) {
      return [];
    }

    if (this.useMock) {
      return this.mockDb.getTrainerAppointments(date);
    }

    return await apiClient.get(`/appointments?date=${date}`);
  }

  /**
   * Update appointment status (coach only)
   */
  async updateAppointmentStatus(id, status) {
    const session: any = getCurrentSession();

    if (session?.role !== USER_ROLES.COACH) {
      throw new Error(
        "Unauthorized: Only coaches can update appointment status",
      );
    }

    if (this.useMock) {
      return this.mockDb.updateAppointmentStatus(id, status);
    }

    return await apiClient.put(`/appointments/${id}`, { status });
  }

  /**
   * Get appointment availability
   */
  async getAppointmentAvailability(date) {
    if (this.useMock) {
      return this.mockDb.getAppointmentAvailability(date);
    }

    return await apiClient.get(`/appointments/availability?date=${date}`);
  }

  /**
   * Update appointment availability (coach only)
   */
  async updateAppointmentAvailability(date, slots) {
    const session: any = getCurrentSession();

    if (session?.role !== USER_ROLES.COACH) {
      throw new Error(
        "Unauthorized: Only coaches can update appointment availability",
      );
    }

    if (this.useMock) {
      return this.mockDb.updateAppointmentAvailability(date, slots);
    }

    return await apiClient.put("/appointments/availability", { date, slots });
  }
}

/**
 * Export service instances
 * These will be initialized with MockDatabase context in components
 */
export const createServices = (mockDb) => ({
  clientService: new ClientService(mockDb),
  gymService: new GymService(mockDb),
  appointmentService: new AppointmentService(mockDb),
});
