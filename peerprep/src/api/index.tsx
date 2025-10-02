import axios, { type AxiosRequestConfig } from "axios";

export const request = async ({
  url,
  port,
  method,
  data = {},
}: RequestOptions) => {
  try {
    const requestOptions: AxiosRequestConfig = {
      url,
      method,
      baseURL: `http://localhost:${port}`,
      withCredentials: true,
    };
    if (method == "get") {
      requestOptions.params = data;
    } else {
      requestOptions.data = data;
    }

    const response = await axios(requestOptions);
    if (response.status < 200 && response.status >= 300) {
      throw new Error(response.data?.message);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};
