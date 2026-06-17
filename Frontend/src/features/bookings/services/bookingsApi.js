import { apiRequest } from "../../../shared/services/api";

export const bookingsApi = {
  createBooking: (payload) =>
    apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
