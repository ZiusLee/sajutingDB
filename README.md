# 사주팅 (Saju-ting)

## Database Schema

The application uses the following main tables:

### saju_sessions
Stores user sessions and profiles for saju calculations.

- `id`: UUID, primary key
- `name`: User's name
- `email`: User's email
- `gender`: User's gender
- `auth_user_id`: Foreign key to Supabase Auth user ID
- `is_default`: Boolean indicating if this is the user's default profile
- `created_at`: Timestamp
- `updated_at`: Timestamp

### birth_info
Stores birth date information for saju calculations.

- `id`: UUID, primary key
- `user_id`: Foreign key to saju_sessions.id
- `solar_year`: Solar calendar year
- `solar_month`: Solar calendar month
- `solar_day`: Solar calendar day
- `solar_hour`: Solar calendar hour
- `solar_minute`: Solar calendar minute
- `lunar_year`: Lunar calendar year
- `lunar_month`: Lunar calendar month
- `lunar_day`: Lunar calendar day
- `is_leap_month`: Boolean indicating if it's a leap month
- `time_unknown`: Boolean indicating if birth time is unknown

### saju_info
Stores calculated saju information.

- `id`: UUID, primary key
- `user_id`: Foreign key to saju_sessions.id
- `year_stem`: Year stem (천간)
- `year_branch`: Year branch (지지)
- `month_stem`: Month stem
- `month_branch`: Month branch
- `day_stem`: Day stem
- `day_branch`: Day branch
- `hour_stem`: Hour stem
- `hour_branch`: Hour branch
- ... (additional fields)

### chat_rooms
Stores chat room information.

- `id`: UUID, primary key
- `user_id`: Foreign key to saju_sessions.id
- `room_type`: Type of chat room
- `title`: Chat room title
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Recent Changes

- Renamed `users` table to `saju_sessions` to better reflect its purpose
- Updated foreign key constraints to reference the new table name
- Updated chat_rooms.user_id to use UUID type to match saju_sessions.id
- Refactored code to use the new table name throughout the application
\`\`\`

This completes the renaming of the file and updating all references to it. The new `saju-session-service.ts` file better reflects its purpose with the new schema, and all imports have been updated accordingly.
\`\`\`



\`\`\`ts file="lib/migration-utils.ts"
[v0-no-op-code-block-prefix]import { supabase } from "./supabase-client"

/**
 * Utility function to check if a table exists in the database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_table_exists', { table_name: tableName })
    
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
    const { data, error } = await supabase.rpc('check_column_exists', { 
      table_name: tableName,
      column_name: columnName
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
export async function runMigration(
  migrationName: string, 
  migrationFn: () => Promise<boolean>
): Promise<boolean> {
  try {
    console.log(`Running migration: ${migrationName}`)
    
    // Check if migration has already been run
    const { data: existingMigration, error: checkError } = await supabase
      .from('migrations')
      .select('*')
      .eq('name', migrationName)
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
        .from('migrations')
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
    console.log(`Starting data migration for user: ${userId}`);
    return true;
  } catch (error) {
    console.error("Error migrating user data:", error);
    return false;
  }
}
