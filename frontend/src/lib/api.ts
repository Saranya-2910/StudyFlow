import {
  User,
  UserPreferences,
  Technique,
  Subject,
  Topic,
  Task,
  StudySession,
  DashboardSummary,
  FeynmanNote,
  BrainDumpSession,
  MindMap,
  Flashcard,
  FlashcardDueSummary,
  Revision,
  Goal,
  Achievement,
  AnalyticsOverview,
  StudyRecommendation,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("studyflow_token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    let errorData = null;
    try {
      errorData = await response.json();
      if (typeof errorData?.detail === "string") {
        errorDetail = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        errorDetail = errorData.detail.map((e: any) => e.msg).join(", ");
      }
    } catch {
      errorDetail = response.statusText || errorDetail;
    }

    if (response.status === 401 && typeof window !== "undefined") {
      // Clear expired token
      localStorage.removeItem("studyflow_token");
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login?session_expired=1";
      }
    }

    throw new ApiError(response.status, errorDetail, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ------------------ API SERVICES ------------------ //

export const authApi = {
  register: (data: { name: string; email: string; password: string; timezone?: string }) =>
    request<{ access_token: string; token_type: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>("/auth/me"),
};

export const usersApi = {
  getProfile: () => request<User>("/users/me"),
  updateProfile: (data: Partial<{ name: string; timezone: string }>) =>
    request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  updatePreferences: (data: Partial<UserPreferences>) =>
    request<UserPreferences>("/users/me/preferences", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const techniquesApi = {
  list: (category?: string) =>
    request<Technique[]>(`/techniques${category ? `?category=${encodeURIComponent(category)}` : ""}`),
  get: (idOrSlug: string) => request<Technique>(`/techniques/${idOrSlug}`),
  getCategories: () => request<string[]>("/techniques/categories"),
  favourite: (id: string) =>
    request<{ message: string }>(`/techniques/${id}/favourite`, { method: "POST" }),
  unfavourite: (id: string) =>
    request<{ message: string }>(`/techniques/${id}/favourite`, { method: "DELETE" }),
};

export const subjectsApi = {
  list: () => request<Subject[]>("/subjects"),
  create: (data: { name: string; description?: string; colour?: string }) =>
    request<Subject>("/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (id: string) => request<Subject>(`/subjects/${id}`),
  update: (id: string, data: Partial<{ name: string; description?: string; colour: string }>) =>
    request<Subject>(`/subjects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<void>(`/subjects/${id}`, { method: "DELETE" }),

  listTopics: (subjectId: string) => request<Topic[]>(`/subjects/${subjectId}/topics`),
  createTopic: (subjectId: string, data: { title: string; description?: string; difficulty?: string }) =>
    request<Topic>(`/subjects/${subjectId}/topics`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const tasksApi = {
  list: (params?: { status?: string; subject_id?: string; priority?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append("status_filter", params.status);
    if (params?.subject_id) q.append("subject_id", params.subject_id);
    if (params?.priority) q.append("priority", params.priority);
    return request<Task[]>(`/tasks${q.toString() ? `?${q.toString()}` : ""}`);
  },
  create: (data: {
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
    estimated_duration?: number;
    subject_id?: string;
    topic_id?: string;
  }) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};

export const sessionsApi = {
  start: (data: {
    technique_id: string;
    planned_duration: number; // seconds
    task_id?: string;
    subject_id?: string;
    notes?: string;
  }) =>
    request<StudySession>("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getActive: () => request<StudySession | null>("/sessions/active"),

  pause: (id: string) =>
    request<StudySession>(`/sessions/${id}/pause`, { method: "POST" }),

  resume: (id: string) =>
    request<StudySession>(`/sessions/${id}/resume`, { method: "POST" }),

  complete: (id: string, data?: { concentration_rating?: number; notes?: string }) =>
    request<StudySession>(`/sessions/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  cancel: (id: string) =>
    request<StudySession>(`/sessions/${id}/cancel`, { method: "POST" }),

  getHistory: (limit = 50, offset = 0) =>
    request<StudySession[]>(`/sessions/history?limit=${limit}&offset=${offset}`),
};

export const dashboardApi = {
  getSummary: () => request<DashboardSummary>("/dashboard/summary"),
};

export const learningApi = {
  // Feynman
  listFeynman: (topicId?: string) =>
    request<FeynmanNote[]>(`/learning/feynman${topicId ? `?topic_id=${topicId}` : ""}`),
  createFeynman: (data: Partial<FeynmanNote>) =>
    request<FeynmanNote>("/learning/feynman", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateFeynman: (id: string, data: Partial<FeynmanNote>) =>
    request<FeynmanNote>(`/learning/feynman/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteFeynman: (id: string) =>
    request<void>(`/learning/feynman/${id}`, { method: "DELETE" }),

  // Brain Dump
  listBrainDumps: () => request<BrainDumpSession[]>("/learning/brain-dump"),
  createBrainDump: (data: Partial<BrainDumpSession>) =>
    request<BrainDumpSession>("/learning/brain-dump", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteBrainDump: (id: string) =>
    request<void>(`/learning/brain-dump/${id}`, { method: "DELETE" }),

  // Mind Maps
  listMindMaps: () => request<MindMap[]>("/learning/mind-maps"),
  getMindMap: (id: string) => request<MindMap>(`/learning/mind-maps/${id}`),
  createMindMap: (data: Partial<MindMap>) =>
    request<MindMap>("/learning/mind-maps", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMindMap: (id: string, data: Partial<MindMap>) =>
    request<MindMap>(`/learning/mind-maps/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteMindMap: (id: string) =>
    request<void>(`/learning/mind-maps/${id}`, { method: "DELETE" }),
};

export const flashcardsApi = {
  list: (params?: { subject_id?: string; topic_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.subject_id) q.append("subject_id", params.subject_id);
    if (params?.topic_id) q.append("topic_id", params.topic_id);
    return request<Flashcard[]>(`/flashcards${q.toString() ? `?${q.toString()}` : ""}`);
  },
  getDue: (subjectId?: string) =>
    request<Flashcard[]>(`/flashcards/due${subjectId ? `?subject_id=${subjectId}` : ""}`),
  getSummary: () => request<FlashcardDueSummary>("/flashcards/summary"),
  create: (data: { subject_id: string; question: string; answer: string; topic_id?: string }) =>
    request<Flashcard>("/flashcards", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Flashcard>) =>
    request<Flashcard>(`/flashcards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<void>(`/flashcards/${id}`, { method: "DELETE" }),
  review: (id: string, qualityRating: number) =>
    request<Flashcard>(`/flashcards/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ quality_rating: qualityRating }),
    }),
};

export const revisionsApi = {
  list: (status?: string) =>
    request<Revision[]>(`/revisions${status ? `?status_filter=${status}` : ""}`),
  getUpcoming: (limit = 10) =>
    request<Revision[]>(`/revisions/upcoming?limit=${limit}`),
  create: (data: { topic_id: string; scheduled_at: string; notes?: string }) =>
    request<Revision>("/revisions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  complete: (id: string, data: { recall_rating: number; notes?: string }) =>
    request<Revision>(`/revisions/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/revisions/${id}`, { method: "DELETE" }),
};

export const goalsApi = {
  list: () => request<Goal[]>("/goals"),
  create: (data: { goal_type: string; target_value: number; period: string }) =>
    request<Goal>("/goals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Goal>) =>
    request<Goal>(`/goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/goals/${id}`, { method: "DELETE" }),
  getAchievements: () => request<Achievement[]>("/achievements"),
};

export const analyticsApi = {
  getOverview: (days = 14) =>
    request<AnalyticsOverview>(`/analytics/overview?days=${days}`),
  getRecommendations: () =>
    request<StudyRecommendation[]>("/analytics/recommendations"),
  downloadCsv: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("studyflow_token") : null;
    const res = await fetch(`${API_BASE_URL}/analytics/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to export study history CSV");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studyflow-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
