import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { getStreamUrl, getVideos } from "../services/api";
import { connectVideoSocket } from "../services/socket";
import type { VideoFilters, VideoItem, VideoProgressEvent } from "../types";

export function VideosPage() {
  const { token } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [liveProgress, setLiveProgress] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<VideoFilters>({
    status: "",
    sensitivity: "",
    search: "",
    sort: "desc",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideos() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getVideos(token, filters);
        setVideos(response.videos);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not fetch videos");
      } finally {
        setLoading(false);
      }
    }

    void loadVideos();
  }, [token, filters]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = connectVideoSocket(token);

    socket.on("video:progress", (event: VideoProgressEvent) => {
      setLiveProgress((current) => ({
        ...current,
        [event.videoId]: event.progress,
      }));

      setVideos((current) =>
        current.map((video) =>
          video._id === event.videoId
            ? {
                ...video,
                status: event.status,
                sensitivity: event.sensitivity ?? undefined,
              }
            : video
        )
      );
    });

    socket.on("video:completed", (event: VideoProgressEvent) => {
      setLiveProgress((current) => ({
        ...current,
        [event.videoId]: 100,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const processingCount = useMemo(
    () => videos.filter((video) => video.status === "UPLOADING" || video.status === "PROCESSING").length,
    [videos]
  );

  return (
    <section>
      <div className="page-head">
        <h2>My Videos</h2>
        <p>Latest uploads and moderation status from backend records.</p>
      </div>

      <div className="panel filter-panel">
        <h3>Filter Library</h3>
        <div className="filters-grid">
          <input
            placeholder="Search by title"
            value={filters.search ?? ""}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <div className="select-shell">
            <select
              value={filters.status ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as VideoFilters["status"],
                }))
              }
            >
              <option value="">All statuses</option>
              <option value="UPLOADING">Uploading</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <span className="select-caret" />
          </div>
          <div className="select-shell">
            <select
              value={filters.sensitivity ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sensitivity: event.target.value as VideoFilters["sensitivity"],
                }))
              }
            >
              <option value="">All sensitivity</option>
              <option value="SAFE">Safe</option>
              <option value="FLAGGED">Flagged</option>
            </select>
            <span className="select-caret" />
          </div>
          <div className="select-shell">
            <select
              value={filters.sort ?? "desc"}
              onChange={(event) =>
                setFilters((current) => ({ ...current, sort: event.target.value as "asc" | "desc" }))
              }
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <span className="select-caret" />
          </div>
        </div>
        <p className="muted">Processing now: {processingCount}</p>
      </div>

      {loading ? <p className="alert alert-info">Loading videos...</p> : null}
      {error ? <p className="alert alert-error">{error}</p> : null}

      <div className="video-grid">
        {videos.map((video) => (
          <article className="panel video-card" key={video._id}>
            <h3>{video.title || "Untitled"}</h3>
            <div className="chip-row">
              <span className={`chip status-${video.status.toLowerCase()}`}>Status: {video.status}</span>
              <span className={`chip sensitivity-${(video.sensitivity ?? "PENDING").toLowerCase()}`}>
                Sensitivity: {video.sensitivity || "PENDING"}
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${liveProgress[video._id] ?? (video.status === "COMPLETED" ? 100 : 0)}%` }}
              />
            </div>
            <p className="muted">Progress: {liveProgress[video._id] ?? (video.status === "COMPLETED" ? 100 : 0)}%</p>
            <video controls preload="metadata" src={token ? getStreamUrl(video._id, token) : ""} />
          </article>
        ))}
      </div>

      {!loading && videos.length === 0 ? <p className="alert alert-info">No videos uploaded yet.</p> : null}
    </section>
  );
}
