import { isAdmin } from "@/lib/admin-utils"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import MigrationClientPage from "./MigrationClientPage"

export default async function MigrationPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const isAdminUser = await isAdmin(session.user.id)

  if (!isAdminUser) {
    redirect("/")
  }

  return <MigrationClientPage userId={session.user.id} />
}
