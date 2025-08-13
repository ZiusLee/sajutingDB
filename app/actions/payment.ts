"use server"

export async function getTossClientKey() {
  // This is safe because it's the public client key, not the secret key
  return process.env.TOSS_CLIENT_KEY || "test_ck_LkKEypNArW1GG1PLgWQL3lmeaxYG"
}
