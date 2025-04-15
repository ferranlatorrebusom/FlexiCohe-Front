import { httpClient } from "../utils/http.utils.js";

const API_BASE = "https://flexicohe-back.onrender.com";

export const userAPI = {
  async login(credenciales) {
    return httpClient.request({
      method: "POST",
      url: `${API_BASE}/token`,
      data: credenciales,
    });
  },

  async registrar(usuarioData) {
    return httpClient.request({
      method: "POST",
      url: `${API_BASE}/register`,
      data: usuarioData,
    });
  },
};
