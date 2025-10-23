import { request } from "./index";

const MATCHING_PORT = 3003;
const BASE_ROUTE = "/api/matching";

export const submitMatchRequest = async (params: {
  topic: string;
  difficulty: string;
  proficiency: string;
  language?: string;
}) => {
  return await request({
    service: "matching",
    endpoint: `${BASE_ROUTE}/request`,
    method: "post",
    data: params,
    includeToken: true,
  });
};

export const cancelMatchRequest = async () =>
  await request({
    service: "matching",
    endpoint: `${BASE_ROUTE}/cancel`,
    method: "delete",
    includeToken: true,
  });

export const acceptMatchProposal = async (proposalId: string) =>
  await request({
    service: "matching",
    endpoint: `${BASE_ROUTE}/proposal/${proposalId}/accept`,
    method: "post",
    includeToken: true,
  });

export const declineMatchProposal = async (proposalId: string) =>
  await request({
    service: "matching",
    endpoint: `${BASE_ROUTE}/proposal/${proposalId}/decline`,
    method: "post",
    includeToken: true,
  });

export const getMatchStatus = async () =>
  await request({
    service: "matching",
    endpoint: `${BASE_ROUTE}/status`,
    method: "get",
    includeToken: true,
  });

export const getQueueStats = async () =>
  await request({
    service: "matching",
    endpoint: `${BASE_ROUTE}/stats`,
    method: "get",
  });
