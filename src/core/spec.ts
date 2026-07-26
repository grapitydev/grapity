export type SpecType = "openapi" | "asyncapi";

export type SpecVisibility = "private" | "public";

export interface Spec {
  id: string;
  name: string;
  type: SpecType;
  description?: string;
  owner?: string;
  sourceRepo?: string;
  tags: string[];
  visibility: SpecVisibility;
  createdAt: Date;
  updatedAt: Date;
}