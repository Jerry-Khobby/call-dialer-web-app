// Mirrors the server's auth responses (server/src/modules/auth).
export type User = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string; // The number other users dial to reach this account
};

export type AuthResponse = { accessToken: string; user: User };

export type RegisterInput = Pick<User, 'fullName' | 'email' | 'phoneNumber'> & {
  password: string;
};

/** "Ama Kofi Owusu" -> "AO", for the avatar. */
export function nameInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? '';
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}
