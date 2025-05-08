import { httpClient } from "../utils/http.utils.js";
import { API_BASE } from '../utils/config.js';

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
