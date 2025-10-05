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
  const { message } = await userServiceRequest({
    url: "/auth/signup",
    method: "post",
    data,
  });
  return message;
};

export const login = async (data: {
  username?: string;
  email?: string;
  password: string;
}) => {
  const { token, user } = await userServiceRequest({
    url: "/auth/login",
    method: "post",
    data,
  });
  const { id, username, email, isAdmin, stats } = user;
  localStorage.setItem("jwtToken", token);
  localStorage.setItem("userId", id);
  localStorage.setItem("username", username);
  localStorage.setItem("email", email);
  localStorage.setItem("isAdmin", isAdmin);
  localStorage.setItem("statistics", JSON.stringify(stats));
};
