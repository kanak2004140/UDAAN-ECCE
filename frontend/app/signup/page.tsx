import type { Metadata } from "next";
import AuthScreen from "@/app/components/auth/AuthScreen";

export const metadata: Metadata = { title: "Sign up · UDAAN" };

export default function SignupPage() {
  return <AuthScreen mode="signup" />;
}
