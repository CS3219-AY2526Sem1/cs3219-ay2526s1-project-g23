import { request } from "./index";

/**
 * Get all questions (with optional filters)
 */
export const getQuestions = async (params?: {
  type?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return await request({
    service: "question",
    endpoint: "/questions",
    method: "get",
    data: params,
  });
};

/**
 * Get a specific question by ID
 */
export const getQuestionById = async (id: string) => {
  return await request({
    service: "question",
    endpoint: `/questions/${id}`,
    method: "get",
  });
};

/**
 * Get popular questions
 */
export const getPopularQuestions = async (limit = 10) => {
  return await request({
    service: "question",
    endpoint: "/questions/popular",
    method: "get",
    data: { limit },
  });
};

/**
 * Get attempts by user
 */
export const getUserAttempts = async () => {
  const userId = localStorage.getItem("userId");
  return await request({
    service: "question",
    endpoint: `/attempts`,
    method: "get",
    data: { userId },
  });
};
