# 사주핑 (SajuPing) Database Schema Documentation

## Overview
This document provides a comprehensive overview of the database schema for the 사주핑 application, including table relationships, purposes, and key data flows.

## Core Entity Relationships

\`\`\`
auth.users (Supabase Auth)
    ↓ (auth_user_id)
saju_sessions (User Sessions)
    ↓ (user_id = session_id)
    ├── birth_info (Birth Information)
    ├── saju_info (Four Pillars Data)
    │   ↓ (saju_id)
    │   └── elements (Five Elements Analysis)
    ├── chat_rooms (Chat Sessions)
    │   ↓ (chat_room_id)
    │   └── messages (Chat Messages)
    ├── user_coins (User Credits)
    ├── payment_orders (Payment History)
    └── smart_contexts (AI Memory)
\`\`\`

## Table Descriptions

### 🔐 Authentication & User Management

#### `auth.users` (Supabase Auth)
- **Purpose**: Core user authentication managed by Supabase
- **Key Fields**: id, email, created_at
- **Relationships**: Connected to saju_sessions via auth_user_id

#### `saju_sessions`
- **Purpose**: Main user profile and session management
- **Key Fields**: 
  - `id` (uuid) - Primary session identifier
  - `auth_user_id` (uuid) - Links to auth.users
  - `name`, `email`, `phone` - User profile info
  - `gender`, `relationship_status` - Personal details
  - `saju` (jsonb) - Cached four pillars data
  - `daeun` (jsonb) - Cached fortune period data
  - `is_default` (boolean) - Default session flag
- **Relationships**: Central hub connecting to most other tables

### 📅 Birth & Saju Information

#### `birth_info`
- **Purpose**: Stores detailed birth date and time information
- **Key Fields**:
  - `user_id` (uuid) - Links to saju_sessions.id
  - `solar_year/month/day/hour/minute` - Solar calendar birth time
  - `lunar_year/month/day` - Lunar calendar birth time
  - `is_leap_month` (boolean) - Lunar leap month indicator
  - `time_unknown` (boolean) - Unknown birth time flag
  - `birth_city_id` (text) - Birth location identifier
- **Relationships**: One-to-one with saju_sessions

#### `saju_info`
- **Purpose**: Stores calculated Four Pillars (사주) information
- **Key Fields**:
  - `user_id` (uuid) - Links to saju_sessions.id
  - `year/month/day/hour_stem` - Heavenly stems (천간)
  - `year/month/day/hour_branch` - Earthly branches (지지)
  - `*_hanja` - Chinese character representations
  - `*_sibseong` - Ten gods (십성) relationships
  - `day_master` - Day master element
  - `daeun_data` (jsonb) - Fortune period calculations
- **Relationships**: One-to-one with saju_sessions, connects to elements

#### `elements`
- **Purpose**: Five elements (오행) analysis results
- **Key Fields**:
  - `saju_id` (uuid) - Links to saju_info.id
  - `wood/fire/earth/metal/water` (integer) - Element strength scores
- **Relationships**: One-to-one with saju_info

### 💬 Chat & Communication

#### `chat_rooms`
- **Purpose**: Individual chat session containers
- **Key Fields**:
  - `id` (uuid) - Room identifier
  - `session_id` (uuid) - Links to saju_sessions.id
  - `title` (text) - Chat room title
  - `room_type` (text) - Type of consultation
- **Relationships**: One-to-many with saju_sessions, contains messages

#### `messages`
- **Purpose**: Individual chat messages and AI responses
- **Key Fields**:
  - `id` (uuid) - Message identifier
  - `session_id` (uuid) - Links to saju_sessions.id
  - `chat_room_id` (uuid) - Links to chat_rooms.id
  - `role` (text) - 'user' or 'assistant'
  - `content` (text) - Message content
  - `message_order` (integer) - Message sequence
  - `model_used` (text) - AI model used for response
  - `response_time_ms` (integer) - Response generation time
  - `importance_score` (numeric) - Memory importance
  - `should_remember` (boolean) - Memory flag
  - `extracted_info` (jsonb) - Extracted structured data
- **Relationships**: Belongs to chat_rooms and saju_sessions

### 🧠 AI Memory & Context

#### `smart_contexts`
- **Purpose**: AI memory system for personalized responses
- **Key Fields**:
  - `user_id` (uuid) - Links to saju_sessions.id
  - `content` (text) - Memory content
  - `type` (text) - Memory type classification
  - `importance_score` (double precision) - Memory importance
  - `relevance_embedding` - Vector embedding for similarity search
  - `keywords` (array) - Extracted keywords
  - `usage_count` (integer) - How often referenced
  - `is_pinned` (boolean) - Permanent memory flag
- **Relationships**: Belongs to saju_sessions

#### `conversation_summaries`
- **Purpose**: Summarized conversation history
- **Key Fields**:
  - `user_id` (uuid) - Links to saju_sessions.id
  - `chat_room_id` (text) - Associated chat room
  - `summary` (text) - Conversation summary
  - `key_points` (array) - Important discussion points
  - `topics` (array) - Conversation topics
  - `message_count` (integer) - Number of messages summarized
- **Relationships**: Associated with chat_rooms and saju_sessions

### 💰 Payment & Subscription

#### `user_coins`
- **Purpose**: User credit/coin balance management
- **Key Fields**:
  - `user_id` (uuid) - Links to saju_sessions.id
  - `coins` (integer) - Current coin balance
  - `bonus_coins` (integer) - Bonus coins earned
  - `subscription_coins` (integer) - Subscription-based coins
  - `subscription_plan` (text) - Current subscription tier
  - `subscription_start/end_date` - Subscription period
  - `last_daily_charge` (date) - Last daily coin grant
- **Relationships**: One-to-one with saju_sessions

#### `payment_orders`
- **Purpose**: Payment transaction history
- **Key Fields**:
  - `user_id` (uuid) - Links to saju_sessions.id
  - `order_id` (varchar) - Unique order identifier
  - `amount` (integer) - Payment amount
  - `status` (varchar) - Payment status
  - `subscription_type` (text) - Subscription plan type
  - `billing_key` (text) - Recurring payment key
  - `payment_data` (jsonb) - Payment gateway data
- **Relationships**: Belongs to saju_sessions

### 📊 Analysis & Interpretation

#### `interpretations`
- **Purpose**: AI-generated saju interpretations
- **Key Fields**:
  - `user_id` (uuid) - Links to saju_sessions.id
  - `basic_interpretation` (text) - Generated interpretation
  - `model_used` (varchar) - AI model used
  - `response_time` (varchar) - Generation time
- **Relationships**: Belongs to saju_sessions

#### `compatibility_analysis`
- **Purpose**: Relationship compatibility analysis
- **Key Fields**:
  - `user_id` (uuid) - Links to saju_sessions.id
  - `partner_name` (varchar) - Partner's name
  - `partner_birth_*` - Partner's birth information
  - `compatibility_score` (integer) - Compatibility rating
  - `analysis_text` (text) - Detailed analysis
- **Relationships**: Belongs to saju_sessions

### 📝 Feedback & Quality

#### `feedback`
- **Purpose**: User feedback on interpretations
- **Key Fields**:
  - `user_id` (uuid) - Links to saju_sessions.id
  - `interpretation_id` (uuid) - Links to interpretations.id
  - `feedback_type` (varchar) - Type of feedback
  - `feedback_text` (text) - Feedback content
- **Relationships**: Links interpretations to users

#### `message_feedback`
- **Purpose**: Feedback on specific chat messages
- **Key Fields**:
  - `message_id` (uuid) - Links to messages.id
  - `session_id` (text) - Session identifier
  - `feedback_type` (text) - Feedback category
  - `selected_text` (text) - Highlighted text portion
  - `selection_start/end` (integer) - Text selection range
- **Relationships**: Belongs to messages

### 🔧 System & Administration

#### `beta_applications`
- **Purpose**: Beta testing application management
- **Key Fields**:
  - `user_id` (uuid) - Links to saju_sessions.id
  - `status` (varchar) - Application status
  - `selected_services` (array) - Requested services
  - `privacy_consent` (boolean) - Privacy agreement
- **Relationships**: Belongs to saju_sessions

#### `migration_status`
- **Purpose**: Database migration tracking
- **Key Fields**:
  - `total_chat_rooms` (bigint) - Total rooms processed
  - `linked_messages` (bigint) - Successfully linked messages
  - `orphaned_messages` (bigint) - Unlinked messages
  - `migration_percentage` (numeric) - Completion percentage

## Data Flow Patterns

### 1. User Registration & Setup
\`\`\`
auth.users → saju_sessions → birth_info → saju_info → elements
\`\`\`

### 2. Chat Consultation
\`\`\`
saju_sessions → chat_rooms → messages → smart_contexts
\`\`\`

### 3. Payment & Subscription
\`\`\`
saju_sessions → payment_orders → user_coins
\`\`\`

### 4. AI Memory System
\`\`\`
messages → smart_contexts → conversation_summaries
\`\`\`

## Key Indexes & Performance

- Primary keys on all `id` fields (uuid)
- Foreign key indexes on relationship fields
- Composite indexes on frequently queried combinations
- Vector index on `smart_contexts.relevance_embedding` for similarity search

## Security & Access Control

- Row Level Security (RLS) enabled on all public tables
- User data isolated by `user_id` or `session_id`
- Sensitive payment data encrypted
- Auth integration with Supabase Auth

## Storage Integration

- `storage.objects` - File storage for user uploads, images, documents
- Integrated with Supabase Storage for secure file handling
- Access controlled through RLS policies

---

*Last updated: $(date)*
*Schema version: Current production*
