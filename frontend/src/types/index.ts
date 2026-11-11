export interface UserPreferences {
  id: string;
  user_id: string;
  theme: "system" | "light" | "dark";
  daily_goal_minutes: number;
  default_focus_duration: number;
  default_break_duration: number;
  sound_enabled: boolean;
  notifications_enabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  profile_picture?: string | null;
  created_at: string;
  updated_at: string;
  preferences?: UserPreferences;
}

export interface Technique {
  id: string;
  name: string;
  slug: string;
  category: "Time Management" | "Learning" | "Revision" | "Productivity";
  description: string;
  instructions: string;
  default_configuration: {
    focus_minutes?: number;
    short_break_minutes?: number;
    long_break_minutes?: number;
    cycles_before_long_break?: number;
    is_timer_based?: boolean;
    workflow_type?: string;
    [key: string]: any;
  };
  is_active: boolean;
  is_favourite?: boolean;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  colour: string;
  created_at: string;
  tasks_count?: number;
  completed_tasks_count?: number;
  total_study_minutes?: number;
}

export interface Topic {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  description?: string | null;
  difficulty: "easy" | "medium" | "hard";
  estimated_duration?: number | null;
  completion_status: "pending" | "in_progress" | "completed";
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id?: string | null;
  topic_id?: string | null;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  due_date?: string | null;
  estimated_duration?: number | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  completed_at?: string | null;
  subject_name?: string | null;
  subject_colour?: string | null;
  topic_title?: string | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  technique_id: string;
  task_id?: string | null;
  subject_id?: string | null;
  planned_duration: number; // in seconds
  actual_duration: number;  // in seconds
  started_at: string;
  ended_at?: string | null;
  paused_at?: string | null;
  paused_duration: number;  // in seconds
  status: "running" | "paused" | "completed" | "cancelled";
  notes?: string | null;
  concentration_rating?: number | null;
  technique_name?: string | null;
  technique_slug?: string | null;
  task_title?: string | null;
  subject_name?: string | null;
  subject_colour?: string | null;
}

export interface WeeklyFocusDay {
  date: string;
  day_name: string;
  focus_minutes: number;
}

export interface SubjectDistributionItem {
  subject_id?: string | null;
  subject_name: string;
  colour: string;
  minutes: number;
}

export interface DashboardSummary {
  today_focus_minutes: number;
  daily_goal_minutes: number;
  daily_goal_progress_pct: number;
  remaining_goal_minutes: number;
  completed_sessions_count_today: number;
  active_tasks_count: number;
  completed_tasks_count_today: number;
  current_streak_days: number;
  total_lifetime_focus_minutes: number;
  total_lifetime_sessions_count: number;
  weekly_focus_summary: WeeklyFocusDay[];
  subject_distribution: SubjectDistributionItem[];
  recent_sessions: StudySession[];
  active_session?: StudySession | null;
}

export interface FeynmanNote {
  id: string;
  user_id: string;
  topic_id?: string | null;
  concept_title: string;
  target_audience: string;
  explanation: string;
  identified_gaps?: string | null;
  simplified_analogy?: string | null;
  created_at: string;
  updated_at: string;
  topic_title?: string | null;
}

export interface BrainDumpSession {
  id: string;
  user_id: string;
  topic_id?: string | null;
  title: string;
  content: string;
  duration_seconds: number;
  knowledge_gaps?: string | null;
  created_at: string;
  topic_title?: string | null;
}

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  isRoot?: boolean;
}

export interface MindMapConnection {
  from: string;
  to: string;
}

export interface MindMapGraphData {
  nodes: MindMapNode[];
  connections: MindMapConnection[];
}

export interface MindMap {
  id: string;
  user_id: string;
  topic_id?: string | null;
  title: string;
  graph_data: MindMapGraphData;
  created_at: string;
  updated_at: string;
  topic_title?: string | null;
}

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id: string;
  topic_id?: string | null;
  question: string;
  answer: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  created_at: string;
  subject_name?: string | null;
  subject_colour?: string | null;
  topic_title?: string | null;
}

export interface FlashcardDueSummary {
  due_count: number;
  total_count: number;
  subject_due_breakdown: Record<string, number>;
}

export interface Revision {
  id: string;
  user_id: string;
  topic_id: string;
  scheduled_at: string;
  completed_at?: string | null;
  status: "scheduled" | "completed" | "missed";
  recall_rating?: number | null;
  notes?: string | null;
  created_at: string;
  topic_title?: string | null;
  subject_id?: string | null;
  subject_name?: string | null;
  subject_colour?: string | null;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_type: "daily_time" | "weekly_time" | "tasks_completed";
  target_value: number;
  period: "daily" | "weekly" | "monthly";
  start_date?: string | null;
  end_date?: string | null;
  status: "active" | "completed" | "archived";
  created_at: string;
  current_value: number;
  progress_percentage: number;
}

export interface Achievement {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  criteria: Record<string, any>;
  is_unlocked: boolean;
  unlocked_at?: string | null;
}

export interface FocusTrendPoint {
  date: string;
  day_name: string;
  minutes: number;
}

export interface SubjectAnalyticsItem {
  subject_id?: string | null;
  subject_name: string;
  colour: string;
  minutes: number;
  percentage: number;
}

export interface TechniqueUsageItem {
  technique_name: string;
  category: string;
  session_count: number;
  total_minutes: number;
}

export interface RecallPerformanceStats {
  total_reviews_count: number;
  average_rating: number;
  accuracy_percentage: number;
  retention_rating_distribution: Record<number, number>;
}

export interface ConsistencyDay {
  date: string;
  minutes: number;
  session_count: number;
}

export interface AnalyticsOverview {
  total_focus_minutes: number;
  total_sessions_count: number;
  total_tasks_completed: number;
  average_concentration_rating: number;
  today_focus_minutes: number;
  this_week_focus_minutes: number;
  this_month_focus_minutes: number;
  daily_focus_trend: FocusTrendPoint[];
  subject_distribution: SubjectAnalyticsItem[];
  technique_usage: TechniqueUsageItem[];
  recall_performance: RecallPerformanceStats;
  consistency_calendar: ConsistencyDay[];
}

export interface StudyRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  technique_slug?: string | null;
  technique_name?: string | null;
  action_type: "session" | "flashcards" | "revision" | "mindmap" | "feynman" | "break";
  target_minutes: number;
  task_id?: string | null;
  subject_id?: string | null;
}

