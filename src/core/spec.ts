export type SpecType = "openapi" | "asyncapi";

export interface Spec {
  id: string;
  name: string;
  type: SpecType;
  description?: string;
  owner?: string;
  sourceRepo?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}