import { signOutAction } from "@/app/auth/actions";

export async function GET() {
  await signOutAction();
}
