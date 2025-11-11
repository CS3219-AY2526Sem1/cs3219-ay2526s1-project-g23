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
 * Create a question
 */
export const createQuestion = async (data: any) => {
  return await request({
    service: "question",
    endpoint: "/questions/create",
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
    service: "question",
    endpoint: `/questions/${id}/activate`,
    method: "patch",
    includeToken: true,
  });
};

/**
 * Deactivate a specific question by ID
 */
export const deactivateQuestionById = async (id: string) => {
  return await request({
    service: "question",
    endpoint: `/questions/${id}/deactivate`,
    method: "patch",
    includeToken: true,
  });
};

/**
 * Edit a specific question by ID
 */
export const editQuestionById = async (id: string, data: any) => {
  return await request({
    service: "question",
    endpoint: `/questions/${id}/update`,
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
    service: "question",
    endpoint: `/questions/${id}/delete`,
    method: "delete",
    includeToken: true,
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
