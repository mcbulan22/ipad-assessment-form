import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import AssessmentForm from "@/components/assessment-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Settings } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CCA SEAForm",
  description: "CCA Skills Evaluation and Assessment Form",
  icons: {
    icon: "https://raw.githubusercontent.com/marlonbulan/cca-assets/main/favicon.ico",
  },
}

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Assessment System</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login_instructor">
                <Button variant="outline" size="sm">
                  Instructor Login
                </Button>
              </Link>
              {user ? (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Admin Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <AssessmentForm />
    </div>
  )
}
