export const httpClient = {
  async request({ method, url, data, headers = {} }) {
    const config = {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    };

    try {
      console.log(url);
      const response = await fetch('https://flexicohe-back.onrender.com'+url, config);
      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage =
          responseData.message ||
          responseData.error ||
          `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Error procesando la respuesta del servidor");
      }
      throw error; // Relanzar otros errores
    }
  },
};
