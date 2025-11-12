interface RequestOptions {
  url: string;
  port: number;
  method: "get" | "post" | "put" | "delete" | "patch";
  data?: object;
  includeToken?: boolean;
}

type Question = {
  _id: string;
  title: string;
  content: string;
  difficulty: string;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};
