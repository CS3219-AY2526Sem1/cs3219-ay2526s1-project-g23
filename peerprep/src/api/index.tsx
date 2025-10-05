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
    };
    if (method == "get") {
      requestOptions.params = data;
    } else {
      requestOptions.data = data;
    }

    const response = await axios(requestOptions);
    return response.data;
  } catch (error) {
    if (error?.response?.data) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};
