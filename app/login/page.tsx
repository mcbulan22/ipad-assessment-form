import LoginForm from "@/components/auth/login-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CCA SEAForm",
  description: "CCA Skills Evaluation and Assessment Form",
  icons: {
    icon: "https://raw.githubusercontent.com/marlonbulan/cca-assets/main/favicon.ico",
  },
}

export default function LoginPage() {
  return <LoginForm />
}
