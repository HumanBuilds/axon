# P6 — Statistics & Analytics

**Priority**: Medium-Low
**Dependencies**: P1 (enough review data to visualize), P0 (user profiles)
**Can run in parallel with**: P3, P4, P5

---

## Overview

Statistics dashboard for tracking study progress:
1. Review count over time chart
2. Retention rate visualization
3. Card maturity distribution
4. Upcoming review forecast
5. Study streak / heatmap

### Internal Dependencies

```
Data aggregation queries ──→ All charts
Chart library setup ───────→ All visualizations
Individual charts are independent of each other
```

**Recommended build order**: Chart library setup + data queries → Review count chart → Card maturity → Retention rate → Review forecast → Streak heatmap

---

## Feature 0: Chart Library + Data Layer

### Step 1: Choose chart library
**Recommendation**: `recharts` — lightweight, React-native, good for dashboards

Install: `npm install recharts`

Alternative: `@nivo/line @nivo/bar @nivo/calendar` (better heatmap support but heavier)

### Step 2: Create statistics data fetching
**File**: `src/lib/actions/statistics.ts`

Server actions for each data type:
```typescript
export async function getReviewCountsByDay(days: number): Promise<{ date: string; count: number }[]>
export async function getRetentionRate(days: number): Promise<{ date: string; retention: number }[]>
export async function getCardMaturityDistribution(): Promise<{ state: string; count: number }[]>
export async function getReviewForecast(days: number): Promise<{ date: string; count: number }[]>
export async function getStudyStreak(): Promise<{ date: string; count: number }[]>
```

### Step 3: Supabase RPC functions (optional, for performance)
Complex aggregations are better done in SQL:

```sql
-- Review counts by day
create or replace function get_review_counts(p_days int default 30)
returns table (review_date date, review_count bigint)
language sql stable security definer
as $$
  select date(reviewed_at) as review_date, count(*) as review_count
  from review_logs
  where user_id = auth.uid()
    and reviewed_at >= now() - (p_days || ' days')::interval
  group by date(reviewed_at)
  order by review_date;
$$;
```

---

## Feature 1: Statistics Page

### Implementation Steps

#### Step 1: Create stats page
**File**: `src/app/(dashboard)/stats/page.tsx`

- Server component that fetches all stats data
- Renders `<StatsDashboard />` with data props

#### Step 2: Stats dashboard layout
**File**: `src/components/stats/StatsDashboard.tsx`

Layout:
- **Summary cards** (top row): Total reviews today, Current streak, Cards mature, Retention rate
- **Review activity chart** (full width): Line/bar chart of reviews per day (last 30 days)
- **Two-column row**:
  - Card maturity distribution (pie/donut chart)
  - Retention rate over time (line chart)
- **Full width**:
  - Upcoming review forecast (bar chart)
  - Study heatmap (GitHub-style calendar)

#### Step 3: Add navigation link
- Add "Stats" link to header/sidebar with BarChart2 icon from react-feather

---

## Feature 2: Review Count Over Time

### Implementation Steps

**File**: `src/components/stats/ReviewActivityChart.tsx`

- Bar chart showing daily review counts for last 30/60/90 days
- Toggle between 30/60/90 day views
- Stacked bars by rating (again=red, hard=orange, good=green, easy=blue)
- Hover tooltip showing exact counts

### Data Query
```sql
select date(reviewed_at) as day, rating, count(*) as cnt
from review_logs
where user_id = auth.uid()
  and reviewed_at >= now() - interval '30 days'
group by day, rating
order by day;
```

---

## Feature 3: Retention Rate

### Implementation Steps

**File**: `src/components/stats/RetentionChart.tsx`

- Line chart showing retention rate over time
- Retention = (reviews rated good or easy) / total reviews per day
- 7-day rolling average for smoother line
- Target retention line (from user's `desired_retention` setting)

### Data Query
```sql
select date(reviewed_at) as day,
  count(*) filter (where rating in ('good', 'easy'))::float / count(*) as retention
from review_logs
where user_id = auth.uid()
  and reviewed_at >= now() - interval '30 days'
group by day
order by day;
```

---

## Feature 4: Card Maturity Distribution

### Implementation Steps

**File**: `src/components/stats/MaturityChart.tsx`

- Donut/pie chart showing card distribution by state
- States: New (blue), Learning (yellow), Review/Mature (green), Relearning (red)
- Center text: total card count
- Click segment to see those cards in browser (link to P5)

### Data Query
```sql
select cs.state, count(*) as cnt
from card_states cs
join cards c on c.id = cs.card_id
where cs.user_id = auth.uid()
  and c.archived_at is null
group by cs.state;
```

---

## Feature 5: Review Forecast

### Implementation Steps

**File**: `src/components/stats/ForecastChart.tsx`

- Bar chart showing expected reviews per day for next 14/30 days
- Based on `card_states.due` dates
- Stacked: already due (backlog) vs newly due per day

### Data Query
```sql
select date(due) as day, count(*) as cnt
from card_states cs
join cards c on c.id = cs.card_id
where cs.user_id = auth.uid()
  and c.archived_at is null
  and cs.due <= now() + interval '30 days'
group by day
order by day;
```

---

## Feature 6: Study Streak / Heatmap

### Implementation Steps

**File**: `src/components/stats/StudyHeatmap.tsx`

- GitHub-style contribution calendar
- Color intensity based on review count per day
- Last 365 days
- Hover shows date + count
- Current streak count displayed prominently

### Heatmap Implementation Options

**Option A**: CSS Grid (lightweight, no library)
```tsx
// 53 columns (weeks) x 7 rows (days)
// Each cell colored by intensity
<div className="grid grid-cols-53 gap-1">
  {days.map(day => (
    <div
      key={day.date}
      className={`w-3 h-3 rounded-sm ${getIntensityClass(day.count)}`}
      title={`${day.date}: ${day.count} reviews`}
    />
  ))}
</div>
```

**Option B**: Use `@nivo/calendar` for a polished calendar heatmap

### Streak Calculation
```typescript
function calculateStreak(days: { date: string; count: number }[]): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const date = formatDate(subDays(today, i));
    const dayData = days.find(d => d.date === date);
    if (dayData && dayData.count > 0) {
      streak++;
    } else if (i > 0) {
      break; // streak broken (allow today to be 0 if not yet studied)
    }
  }
  return streak;
}
```

---

## Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test:run` — all tests pass
- [ ] Manual: Stats page loads with all charts
- [ ] Manual: Review count chart shows correct daily counts
- [ ] Manual: Retention rate matches actual performance
- [ ] Manual: Card maturity shows correct distribution
- [ ] Manual: Forecast shows upcoming due cards
- [ ] Manual: Heatmap shows study activity
- [ ] Manual: Streak count is accurate
