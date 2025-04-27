import { supabase } from "./supabase-client"

/**
 * Utility function to check if a table exists in the database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_table_exists", { table_name: tableName })

    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Error in tableExists for ${tableName}:`, error)
    return false
  }
}

/**
 * Utility function to check if a column exists in a table
 */
export async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_column_exists", {
      table_name: tableName,
      column_name: columnName,
    })

    if (error) {
      console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Error in columnExists for ${tableName}.${columnName}:`, error)
    return false
  }
}

/**
 * Utility function to run a migration safely
 */
export async function runMigration(migrationName: string, migrationFn: () => Promise<boolean>): Promise<boolean> {
  try {
    console.log(`Running migration: ${migrationName}`)

    // Check if migration has already been run
    const { data: existingMigration, error: checkError } = await supabase
      .from("migrations")
      .select("*")
      .eq("name", migrationName)
      .single()

    if (!checkError && existingMigration) {
      console.log(`Migration ${migrationName} has already been run`)
      return true
    }

    // Run the migration
    const success = await migrationFn()

    if (success) {
      // Record the migration
      const { error: insertError } = await supabase
        .from("migrations")
        .insert({ name: migrationName, run_at: new Date().toISOString() })

      if (insertError) {
        console.error(`Error recording migration ${migrationName}:`, insertError)
        return false
      }

      console.log(`Migration ${migrationName} completed successfully`)
      return true
    } else {
      console.error(`Migration ${migrationName} failed`)
      return false
    }
  } catch (error) {
    console.error(`Error in runMigration for ${migrationName}:`, error)
    return false
  }
}

export async function migrateUserData(userId: string): Promise<boolean> {
  try {
    console.log(`Starting data migration for user: ${userId}`)
    return true
  } catch (error) {
    console.error("Error migrating user data:", error)
    return false
  }
}
