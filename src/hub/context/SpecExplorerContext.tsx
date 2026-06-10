import { createContext, useContext, useState, type ReactNode } from "react";

export interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  in: string;
  description?: string;
  deprecated?: boolean;
  xSunset?: string;
}

export interface SchemaProperty {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  format?: string;
  properties?: SchemaProperty[];
  deprecated?: boolean;
  xSunset?: string;
}

export interface RequestBody {
  required: boolean;
  properties: SchemaProperty[];
}

export interface ResponseInfo {
  status: string;
  description: string;
  properties?: SchemaProperty[];
  exampleBody?: string;
}

export interface Endpoint {
  method: string;
  path: string;
  summary: string;
  description?: string;
  parameters: EndpointParam[];
  requestBody?: RequestBody;
  responses: ResponseInfo[];
  serverUrl: string;
  exampleRequest?: string;
  group: string;
  id: string;
  deprecated?: boolean;
  xSunset?: string;
}

export interface EndpointGroup {
  name: string;
  endpoints: Endpoint[];
}

interface SpecExplorerContextValue {
  endpoints: EndpointGroup[] | null;
  setEndpoints: (endpoints: EndpointGroup[] | null) => void;
  activeEndpointId: string | null;
  setActiveEndpointId: (id: string | null) => void;
  scrollSuppressed: boolean;
  setScrollSuppressed: (v: boolean) => void;
}

const SpecExplorerContext = createContext<SpecExplorerContextValue | null>(null);

export function SpecExplorerProvider({ children }: { children: ReactNode }) {
  const [endpoints, setEndpoints] = useState<EndpointGroup[] | null>(null);
  const [activeEndpointId, setActiveEndpointId] = useState<string | null>(null);
  const [scrollSuppressed, setScrollSuppressed] = useState(false);

  return (
    <SpecExplorerContext.Provider value={{ endpoints, setEndpoints, activeEndpointId, setActiveEndpointId, scrollSuppressed, setScrollSuppressed }}>
      {children}
    </SpecExplorerContext.Provider>
  );
}

export function useSpecExplorer() {
  const ctx = useContext(SpecExplorerContext);
  if (!ctx) {
    throw new Error("useSpecExplorer must be used within SpecExplorerProvider");
  }
  return ctx;
}
