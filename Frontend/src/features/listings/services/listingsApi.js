import { apiRequest } from "../../../shared/services/api";

export const listingsApi = {
  createListing: (payload) =>
    apiRequest("/listings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  findMyListings: () => apiRequest("/listings/my"),
  findListing: (id) => apiRequest(`/listings/${id}`),
  updateListing: (id, payload) =>
    apiRequest(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  publishListing: (id) =>
    apiRequest(`/listings/${id}/submit`, {
      method: "PATCH",
    }),
  deleteListing: (id) =>
    apiRequest(`/listings/${id}`, {
      method: "DELETE",
    }),
  setAmenities: (id, amenities) =>
    apiRequest(`/listings/${id}/amenities`, {
      method: "POST",
      body: JSON.stringify({ amenities }),
    }),
  uploadPhotos: (id, photos) => {
    const formData = new FormData();
    photos.forEach((photo) => formData.append("photos", photo));

    return apiRequest(`/listings/${id}/photos`, {
      method: "POST",
      body: formData,
    });
  },
  deletePhoto: (listingId, photoId) =>
    apiRequest(`/listings/${listingId}/photos/${photoId}`, {
      method: "DELETE",
    }),
  getRooms: (id) => apiRequest(`/listings/${id}/rooms`),
  createRoom: (id, payload) =>
    apiRequest(`/listings/${id}/rooms`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateRoom: (listingId, roomId, payload) =>
    apiRequest(`/listings/${listingId}/rooms/${roomId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteRoom: (listingId, roomId) =>
    apiRequest(`/listings/${listingId}/rooms/${roomId}`, {
      method: "DELETE",
    }),
  uploadRoomImages: (listingId, roomId, images) => {
    const formData = new FormData();
    images.forEach((image) => formData.append("images", image));

    return apiRequest(`/listings/${listingId}/rooms/${roomId}/images`, {
      method: "POST",
      body: formData,
    });
  },
};
