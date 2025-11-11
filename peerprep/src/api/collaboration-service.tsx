import { request } from "@/api";

export const exitSession = async (
  userId: string,
  sessionId: string,
  solution: string
) => {
  return await request({
    service: "collaboration",
    endpoint: "/collaboration/exit",
    method: "post",
    data: { userId, sessionId, solution },
    includeToken: true,
  });
};
