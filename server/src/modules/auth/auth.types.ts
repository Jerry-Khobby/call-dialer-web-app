/** What the access token carries. */
export type JwtPayload = { sub: string };

/** The signed-in user, as attached to the request by the JWT strategy. */
export type AuthUser = { userId: string };
