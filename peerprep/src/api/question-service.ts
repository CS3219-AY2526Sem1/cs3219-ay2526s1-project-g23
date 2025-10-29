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
 * Create a question
 */
export const createQuestion = async (data: any) => {
  return await request({
    url: "/questions/create",
    port: QUESTION_SERVICE_PORT,
    method: "post",
    data,
    includeToken: true,
  });
};

/**
 * Activate a specific question by ID
 */
export const activateQuestionById = async (id: string) => {
  return await request({
    url: `/questions/${id}/activate`,
    port: QUESTION_SERVICE_PORT,
    method: "patch",
    includeToken: true,
  });
};

/**
 * Deactivate a specific question by ID
 */
export const deactivateQuestionById = async (id: string) => {
  return await request({
    url: `/questions/${id}/deactivate`,
    port: QUESTION_SERVICE_PORT,
    method: "patch",
    includeToken: true,
  });
};

/**
 * Edit a specific question by ID
 */
export const editQuestionById = async (id: string, data: any) => {
  return await request({
    url: `/questions/${id}/update`,
    port: QUESTION_SERVICE_PORT,
    method: "put",
    includeToken: true,
    data,
  });
};

/**
 * Delete a specific question by ID
 */
export const deleteQuestionById = async (id: string) => {
  return await request({
    url: `/questions/${id}/delete`,
    port: QUESTION_SERVICE_PORT,
    method: "delete",
    includeToken: true,
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

/**
 * Get attempts by user
 */
export const getUserAttempts = async () => {
  const userId = localStorage.getItem("userId");
  return await request({
    url: `/attempts`,
    port: QUESTION_SERVICE_PORT,
    method: "get",
    data: { userId },
  });
};
