import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChartNoAxesColumn, Clock3, PlayCircle, ShieldCheck, UploadCloud } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getVideos } from "../services/api";
import { connectVideoSocket } from "../services/socket";
import type { VideoItem, VideoProgressEvent } from "../types";
import { getErrorMessage } from "../utils/error";

export function DashboardHomePage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideos() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await getVideos(token);
        setVideos(response.videos);
      } catch (err) {
        showToast(getErrorMessage(err, "Could not load dashboard data."), "error");
      } finally {
        setLoading(false);
      }
    }

    void loadVideos();
  }, [token, showToast]);

  useEffect(() => {
    if (!token) return;
    const socket = connectVideoSocket(token);

    socket.on("video:progress", (event: VideoProgressEvent) => {
      setVideos((current) =>
        current.map((video) =>
          video._id === event.videoId
            ? { ...video, status: event.status, sensitivity: event.sensitivity ?? undefined }
            : video
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const stats = useMemo(() => {
    const total = videos.length;
    const processing = videos.filter((video) => video.status !== "COMPLETED").length;
    const safe = videos.filter((video) => video.sensitivity === "SAFE").length;
    const flagged = videos.filter((video) => video.sensitivity === "FLAGGED").length;
    return { total, processing, safe, flagged };
  }, [videos]);

  const recentVideos = useMemo(() => {
    return [...videos]
      .sort((a, b) => {
        const aDate = Date.parse(a.createdAt ?? "");
        const bDate = Date.parse(b.createdAt ?? "");
        return (Number.isNaN(bDate) ? 0 : bDate) - (Number.isNaN(aDate) ? 0 : aDate);
      })
      .slice(0, 5);
  }, [videos]);

  const greetingName = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const completionRate = stats.total > 0 ? Math.round(((stats.total - stats.processing) / stats.total) * 100) : 0;
  const statCards = [
    { title: "Total Videos", value: stats.total, Icon: ChartNoAxesColumn },
    { title: "In Processing", value: stats.processing, Icon: Clock3 },
    { title: "Safe", value: stats.safe, Icon: ShieldCheck },
    { title: "Flagged", value: stats.flagged, Icon: AlertTriangle },
  ];

  const weeklyChart = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        count: 0,
      };
    });

    const byDay = new Map(days.map((d) => [d.key, d]));

    for (const video of videos) {
      if (!video.createdAt) continue;
      const date = new Date(video.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = date.toISOString().slice(0, 10);
      const target = byDay.get(key);
      if (target) {
        target.count += 1;
      }
    }

    const max = Math.max(1, ...days.map((d) => d.count));
    return days.map((d) => ({
      ...d,
      height: `${Math.max(10, Math.round((d.count / max) * 100))}%`,
    }));
  }, [videos]);
  const chartLoadingHeights = ["78%", "52%", "68%", "44%", "72%", "58%", "36%"];

  return (
    <section>
      <div className="dashboard-hero panel">
        {loading ? (
          <>
            <div className="dashboard-hero-skeleton">
              <span className="skeleton skeleton-pill" />
              <span className="skeleton skeleton-line hero-title" />
              <span className="skeleton skeleton-line hero-subtitle" />
            </div>
          </>
        ) : (
          <div>
            <p className="dashboard-kicker">Overview</p>
            <h2>Welcome back, {greetingName}</h2>
            <p>Track moderation progress, upload activity, and safety outcomes in one place.</p>
          </div>
        )}
      </div>

      <div className="dashboard-stats">
        {statCards.map(({ title, value, Icon }) => (
          <article key={title} className="stat-card dashboard-stat-card">
            {loading ? (
              <div className="dashboard-stat-skeleton">
                <span className="skeleton skeleton-line stat-title" />
                <span className="skeleton skeleton-number" />
                <span className="skeleton skeleton-line stat-subline" />
              </div>
            ) : (
              <>
                <div className="dashboard-stat-head">
                  <Icon size={17} />
                  <h3>{title}</h3>
                </div>
                <p className="stat-value">{value}</p>
              </>
            )}
          </article>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <article className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Recent Uploads</h3>
            <Link to="/dashboard/videos" className="table-link">
              <PlayCircle size={14} /> View all
            </Link>
          </div>

          {loading ? (
            <div className="dashboard-recent-list">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="dashboard-recent-item">
                  <div className="dashboard-recent-copy">
                    <span className="skeleton skeleton-line" />
                    <span className="skeleton skeleton-line small" />
                  </div>
                  <span className="skeleton skeleton-chip" />
                </div>
              ))}
            </div>
          ) : recentVideos.length === 0 ? (
            <p className="alert alert-info">No videos yet. Upload your first video to start tracking progress.</p>
          ) : (
            <div className="dashboard-recent-list">
              {recentVideos.map((video) => (
                <div key={video._id} className="dashboard-recent-item">
                  <div>
                    <p className="dashboard-recent-title">{video.title || "Untitled"}</p>
                    <p className="muted">{video.status}</p>
                  </div>
                  <span className={`chip sensitivity-${(video.sensitivity ?? "PENDING").toLowerCase()}`}>
                    {video.sensitivity ?? "PENDING"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Weekly Upload Activity</h3>
          </div>
          <div className={`dashboard-chart ${loading ? "is-loading" : ""}`}>
            {(loading ? chartLoadingHeights : weeklyChart.map((day) => day.height)).map((height, index) => (
              <div key={loading ? `skeleton-${index}` : weeklyChart[index].key} className="dashboard-chart-col">
                <span className="dashboard-chart-value">{loading ? "" : weeklyChart[index].count}</span>
                <div className="dashboard-chart-track">
                  <span className={`dashboard-chart-bar ${loading ? "is-skeleton-bar" : ""}`} style={{ height }} />
                </div>
                <p className="dashboard-chart-label">{loading ? "" : weeklyChart[index].label}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel dashboard-panel">
          <h3>Quick Actions</h3>
          {loading ? (
            <div className="dashboard-actions">
              <span className="skeleton skeleton-link" />
              <span className="skeleton skeleton-link" />
              <span className="skeleton skeleton-link" />
            </div>
          ) : (
            <div className="dashboard-actions">
              <Link to="/dashboard/upload" className="dashboard-quick-link">
                <UploadCloud size={16} />
                Upload new video
              </Link>
              <Link to="/dashboard/videos" className="dashboard-quick-link">
                <PlayCircle size={16} />
                Open video library
              </Link>
              {user?.role === "ADMIN" ? (
                <Link to="/dashboard/users" className="dashboard-quick-link">
                  <ShieldCheck size={16} />
                  Manage users
                </Link>
              ) : null}
            </div>
          )}
          {!loading ? <p className="muted">{completionRate}% overall completion</p> : null}
        </article>
      </div>
    </section>
  );
}
