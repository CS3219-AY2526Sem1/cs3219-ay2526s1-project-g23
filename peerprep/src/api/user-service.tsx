import { request } from "@/api";

const userServiceRequest = async (
  props: Pick<RequestOptions, "url" | "method" | "data">
) => {
  return await request({ ...props, port: 3001 });
};

export const signUp = async (data: {
  username: string;
  email: string;
  password: string;
}) => {
  return await userServiceRequest({
    url: "/auth/signup",
    method: "post",
    data,
  });
};

export const resetPassword = async (data: { email: string }) => {
  return await userServiceRequest({
    url: "/auth/reset-password",
    method: "post",
    data,
  });
};
