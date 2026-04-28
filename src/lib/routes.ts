export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  clients: "/clients",
  newClient: "/clients/new",
};

export function clientRoute(clientId: string): string {
  return `/clients/${clientId}`;
}

export function clientAccountsRoute(clientId: string): string {
  return `/clients/${clientId}/accounts`;
}

export function clientPostsRoute(clientId: string): string {
  return `/clients/${clientId}/posts`;
}

export function postRoute(clientId: string, postId: string): string {
  return `/clients/${clientId}/posts/${postId}`;
}

export function commentsRoute(clientId: string, postId: string): string {
  return `/clients/${clientId}/posts/${postId}/comments`;
}


