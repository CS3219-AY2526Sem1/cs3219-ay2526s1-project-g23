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
    url: `${BASE_ROUTE}/request`,
    port: MATCHING_PORT,
    method: "post",
    data: params,
    includeToken: true,
  });
};

export const cancelMatchRequest = async () =>
  await request({
    url: `${BASE_ROUTE}/cancel`,
    port: MATCHING_PORT,
    method: "delete",
    includeToken: true,
  });

export const acceptMatchProposal = async (proposalId: string) =>
  await request({
    url: `${BASE_ROUTE}/proposal/${proposalId}/accept`,
    port: MATCHING_PORT,
    method: "post",
    includeToken: true,
  });

export const declineMatchProposal = async (proposalId: string) =>
  await request({
    url: `${BASE_ROUTE}/proposal/${proposalId}/decline`,
    port: MATCHING_PORT,
    method: "post",
    includeToken: true,
  });

export const getMatchStatus = async () =>
  await request({
    url: `${BASE_ROUTE}/status`,
    port: MATCHING_PORT,
    method: "get",
    includeToken: true,
  });

export const getQueueStats = async () =>
  await request({
    url: `${BASE_ROUTE}/stats`,
    port: MATCHING_PORT,
    method: "get",
  });
