import { request } from "@/api";

export const exitSession = async (
  userId: string,
  sessionId: string,
  solution: string
) => {
  console.log("Collaboration service URL:", import.meta.env.VITE_COLLABORATION_SERVICE_URL);
  return await request({
    service: "collaboration",
    endpoint: "/collaboration/exit",
    method: "post",
    data: { userId, sessionId, solution },
    includeToken: true,
  });
};
