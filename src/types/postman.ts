export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
  };
  item: PostmanItem[];
}

export interface PostmanItem {
  name: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
  response?: PostmanResponse[];
}

export interface PostmanRequest {
  method: string;
  header: PostmanHeader[];
  url: PostmanUrl;
  body?: PostmanBody;
  description?: string;
}

export interface PostmanHeader {
  key: string;
  value: string;
  type: string;
}

export interface PostmanUrl {
  raw: string;
  protocol?: string;
  host: string[];
  path: string[];
  query?: PostmanQuery[];
}

export interface PostmanQuery {
  key: string;
  value: string;
}

export interface PostmanBody {
  mode: string;
  raw?: string;
  options?: {
    raw: {
      language: string;
    };
  };
}

export interface PostmanResponse {
  name: string;
  originalRequest: PostmanRequest;
  status: string;
  code: number;
  header: PostmanHeader[];
  body?: string;
}
