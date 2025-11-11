import axios, { type AxiosRequestConfig } from "axios";

const SERVICE_URLS: Record<string, string> = {
  question: import.meta.env.VITE_QUESTION_SERVICE_URL,
  user: import.meta.env.VITE_USER_SERVICE_URL,
  matching: import.meta.env.VITE_MATCHING_SERVICE_URL,
  collaboration: import.meta.env.VITE_COLLABORATION_SERVICE_URL,
};

export const request = async ({
  service, // 'question' | 'user' | 'matching'
  endpoint, // e.g., '/users/123/update-stats'
  method,
  data = {},
  includeToken = false,
}: {
  service: keyof typeof SERVICE_URLS;
  endpoint: string;
  method: "get" | "post" | "put" | "delete" | "patch";
  data?: any;
  includeToken?: boolean;
}) => {
  try {
    const requestOptions: AxiosRequestConfig = {
      url: endpoint,
      method,
      baseURL: SERVICE_URLS[service],
      headers: {}, // ensure headers is always defined
    };

    if (includeToken) {
      const jwtToken = localStorage.getItem("jwtToken");
      if (jwtToken) {
        requestOptions.headers = {
          ...requestOptions.headers,
          Authorization: `Bearer ${jwtToken}`,
        };
      }
    }

    if (method === "get") {
      requestOptions.params = data;
    } else {
      requestOptions.data = data;
    }

    const response = await axios(requestOptions);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};
