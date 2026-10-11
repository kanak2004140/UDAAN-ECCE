import type { Metadata } from "next";
import AuthScreen from "@/app/components/auth/AuthScreen";

export const metadata: Metadata = { title: "Log in · UDAAN" };

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
