import { request } from "@/api";

export const exitSession = async (
  userId: string,
  sessionId: string,
  solution: string
) => {
  return await request({
    url: "/collaboration/exit",
    port: 3004,
    method: "post",
    data: { userId, sessionId, solution },
    includeToken: true,
  });
};
