import type { Session, User } from "next-auth";

export function clientSession(session: Session, user: User) {
  if (session.user) session.user.id=user.id;
  return session;
}
