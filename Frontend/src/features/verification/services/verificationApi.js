import { apiRequest } from "../../../shared/services/api";

export const verificationApi = {
  getMine: () => apiRequest("/verification/me"),

  submitDocuments: ({ idFront, idBack, selfie }) => {
    const formData = new FormData();
    formData.append("idFront", idFront);
    formData.append("idBack", idBack);
    formData.append("selfie", selfie);

    return apiRequest("/verification", {
      method: "POST",
      body: formData,
    });
  },
};
