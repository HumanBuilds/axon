# P0 — Fix What's Broken

**Priority**: Critical — prerequisite for P1+
**Dependencies**: None (can start immediately)
**Can run in parallel with**: Nothing — complete this first

---

## Overview

Two foundational issues must be fixed before building new features:
1. Auth error handling shows raw JSON parse failures instead of user-friendly messages
2. No `user_profiles` table exists for user settings (needed by P1 Settings page)

---

## Feature 1: Harden Auth Error Handling

### Problem

The auth actions in `src/lib/actions/auth.ts` return `{ error: error.message }` from Supabase, which can contain cryptic messages like `"JSON object requested, multiple (or no) rows returned"` or raw Supabase error codes. The login/signup pages need to display human-readable errors.

### Current State

- `src/lib/actions/auth.ts`: `login()` and `signup()` return `{ error: error.message }` on failure
- `src/app/(auth)/login/page.tsx` and `signup/page.tsx`: consume the error but display it raw

### Implementation Steps

#### Step 1: Create auth error mapper
**File**: `src/lib/actions/auth-errors.ts`

- Map common Supabase auth error codes/messages to user-friendly strings:
  - `"Invalid login credentials"` → `"Incorrect email or password"`
  - `"User already registered"` → `"An account with this email already exists"`
  - `"Email not confirmed"` → `"Please check your email to confirm your account"`
  - `"Password should be at least 6 characters"` → pass through (already clear)
  - `"rate_limit"` → `"Too many attempts. Please try again in a few minutes."`
  - Network/unknown errors → `"Something went wrong. Please try again."`

#### Step 2: Update auth actions
**File**: `src/lib/actions/auth.ts`

- Import the error mapper
- Wrap `error.message` through the mapper before returning
- Ensure both `login()` and `signup()` use it

#### Step 3: Improve error display in auth pages
**Files**: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`

- Display error in a styled alert box (red background, red text)
- Clear error when user starts typing again
- Add `aria-live="polite"` for screen reader announcement

#### Step 4: Tests
**File**: `src/lib/actions/auth-errors.test.ts`

- Test each error code maps to the expected friendly message
- Test unknown errors fall back to generic message

### Edge Cases
- Network timeout during auth → show generic "connection" error
- Supabase service outage → graceful fallback message
- Double-submit prevention (disable button during submission)

---

## Feature 2: Add User Profiles Table

### Problem

The app needs per-user settings (`desired_retention`, `display_name`, `max_new_cards_per_day`, etc.) but no `user_profiles` table exists. The `UserProfile` type in `src/lib/types.ts` already defines the interface but has no backing table.

### Current State

- `src/lib/types.ts`: `UserProfile` interface defined (id, email, display_name, desired_retention, created_at)
- `supabase/migrations/20260309000000_initial_schema.sql`: No profiles table
- No server actions for profile CRUD

### Implementation Steps

#### Step 1: Write migration
**File**: `supabase/migrations/20260310000000_user_profiles.sql`

```sql
create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  desired_retention float not null default 0.9
    check (desired_retention >= 0.7 and desired_retention <= 0.99),
  max_new_cards_per_day int not null default 20
    check (max_new_cards_per_day >= 0),
  max_reviews_per_day int not null default 200
    check (max_reviews_per_day >= 0),
  interleaving_enabled boolean not null default false,
  agent_enabled boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.user_profiles enable row level security;

create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);
```

#### Step 2: Auto-create profile on signup
**Option A (recommended)**: Supabase database trigger — create a profile row automatically when a new auth user is created.

Add to migration:
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Option B (fallback)**: Upsert in `getProfile()` action — if no profile exists, create one with defaults.

#### Step 3: Update types
**File**: `src/lib/types.ts`

- Add `max_new_cards_per_day`, `max_reviews_per_day`, `interleaving_enabled`, `agent_enabled` to `UserProfile`

#### Step 4: Create profile server actions
**File**: `src/lib/actions/profile.ts`

- `getProfile()`: Fetch current user's profile (create with defaults if missing)
- `updateProfile(updates)`: Update profile fields, revalidate

#### Step 5: Tests
**File**: `src/lib/actions/profile.test.ts`

- Test `getProfile()` returns defaults for new user
- Test `updateProfile()` validates retention range (0.7–0.99)

### Edge Cases
- Existing users without profiles (handle with upsert/fallback in `getProfile`)
- Retention value validation (clamp to 0.7–0.99)
- Concurrent profile creation race condition (upsert handles this)

---

## Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test:run` — all tests pass
- [ ] Manual test: Login with wrong password shows friendly error
- [ ] Manual test: Signup with existing email shows friendly error
- [ ] Manual test: Profile created automatically on signup
