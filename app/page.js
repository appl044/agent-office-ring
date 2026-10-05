import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verify } from "../lib/session";

export default function Home() {
  const token = cookies().get("ring_session")?.value;
  if (token && verify(token)) redirect("/dashboard");
  redirect("/login");
}
