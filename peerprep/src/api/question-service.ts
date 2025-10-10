import { request } from "./index";

const QUESTION_SERVICE_PORT = 3002;

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
    url: "/questions",
    port: QUESTION_SERVICE_PORT,
    method: "get",
    data: params,
  });
};

/**
 * Get a specific question by ID
 */
export const getQuestionById = async (id: string) => {
  return await request({
    url: `/questions/${id}`,
    port: QUESTION_SERVICE_PORT,
    method: "get",
  });
};

/**
 * Get popular questions
 */
export const getPopularQuestions = async (limit = 10) => {
  return await request({
    url: "/questions/popular",
    port: QUESTION_SERVICE_PORT,
    method: "get",
    data: { limit },
  });
};
