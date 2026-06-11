import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "Admin" | "Instructor" | "Student";
    } & DefaultSession["user"];
  }

  interface User {
    role: "Admin" | "Instructor" | "Student";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "Admin" | "Instructor" | "Student";
  }
}
