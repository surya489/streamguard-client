import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, ListFilter, Search, ShieldAlert } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getStreamUrl, getVideos } from "../services/api";
import { connectVideoSocket } from "../services/socket";
import type { VideoFilters, VideoItem, VideoProgressEvent } from "../types";
import { getErrorMessage } from "../utils/error";

type VideoMenuKey = "status" | "sensitivity" | "sort" | "";

export function VideosPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [liveProgress, setLiveProgress] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<VideoFilters>({
    status: "",
    sensitivity: "",
    search: "",
    sort: "desc",
  });
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<VideoMenuKey>("");
  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!filterRef.current) return;
      if (!filterRef.current.contains(event.target as Node)) {
        setActiveMenu("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
        const message = getErrorMessage(err, "Could not fetch videos.");
        showToast(message, "error");
      } finally {
        setLoading(false);
      }
    }

    void loadVideos();
  }, [token, filters, showToast]);

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
        <p>Track upload status, review outcome, and playback.</p>
      </div>

      <div className="panel filter-panel" ref={filterRef}>
        <h3>Video Filters</h3>
        <div className="filters-grid">
          <div className="input-shell">
            <Search size={16} />
            <input
              placeholder="Search by title"
              value={filters.search ?? ""}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </div>

          <div className="dropdown-wrap">
            <button
              type="button"
              className="filter-trigger"
              onClick={() => setActiveMenu((current) => (current === "status" ? "" : "status"))}
            >
              <ListFilter size={14} />
              {filters.status ? filters.status : "All statuses"}
              <span className="select-caret" />
            </button>
            {activeMenu === "status" ? (
              <div className="filter-menu">
                <button type="button" className="filter-item" onClick={() => {
                  setFilters((current) => ({ ...current, status: "" }));
                  setActiveMenu("");
                }}>
                  All statuses
                </button>
                <button type="button" className="filter-item" onClick={() => {
                  setFilters((current) => ({ ...current, status: "UPLOADING" }));
                  setActiveMenu("");
                }}>
                  Uploading
                </button>
                <button type="button" className="filter-item" onClick={() => {
                  setFilters((current) => ({ ...current, status: "PROCESSING" }));
                  setActiveMenu("");
                }}>
                  Processing
                </button>
                <button type="button" className="filter-item" onClick={() => {
                  setFilters((current) => ({ ...current, status: "COMPLETED" }));
                  setActiveMenu("");
                }}>
                  Completed
                </button>
              </div>
            ) : null}
          </div>

          <div className="dropdown-wrap">
            <button
              type="button"
              className="filter-trigger"
              onClick={() => setActiveMenu((current) => (current === "sensitivity" ? "" : "sensitivity"))}
            >
              <ShieldAlert size={14} />
              {filters.sensitivity ? filters.sensitivity : "All sensitivity"}
              <span className="select-caret" />
            </button>
            {activeMenu === "sensitivity" ? (
              <div className="filter-menu">
                <button type="button" className="filter-item" onClick={() => {
                  setFilters((current) => ({ ...current, sensitivity: "" }));
                  setActiveMenu("");
                }}>
                  All sensitivity
                </button>
                <button type="button" className="filter-item" onClick={() => {
                  setFilters((current) => ({ ...current, sensitivity: "SAFE" }));
                  setActiveMenu("");
                }}>
                  Safe
                </button>
                <button type="button" className="filter-item" onClick={() => {
                  setFilters((current) => ({ ...current, sensitivity: "FLAGGED" }));
                  setActiveMenu("");
                }}>
                  Flagged
                </button>
              </div>
            ) : null}
          </div>

          <div className="dropdown-wrap">
            <button
              type="button"
              className="filter-trigger"
              onClick={() => setActiveMenu((current) => (current === "sort" ? "" : "sort"))}
            >
              <ArrowUpDown size={14} />
              {filters.sort === "asc" ? "Oldest first" : "Newest first"}
              <span className="select-caret" />
            </button>
            {activeMenu === "sort" ? (
              <div className="filter-menu">
                <button type="button" className="filter-item" onClick={() => {
                  setFilters((current) => ({ ...current, sort: "desc" }));
                  setActiveMenu("");
                }}>
                  Newest first
                </button>
                <button type="button" className="filter-item" onClick={() => {
                  setFilters((current) => ({ ...current, sort: "asc" }));
                  setActiveMenu("");
                }}>
                  Oldest first
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <p className="muted">Processing now: {processingCount}</p>
      </div>

      {loading ? (
        <div className="video-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <article className="panel video-card video-skeleton-card" key={index}>
              <span className="skeleton skeleton-line" />
              <div className="chip-row">
                <span className="skeleton skeleton-chip" />
                <span className="skeleton skeleton-chip" />
              </div>
              <span className="skeleton skeleton-line small" />
              <div className="skeleton skeleton-media" />
            </article>
          ))}
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <article className="panel video-card" key={video._id}>
              <h3>{video.title || "Untitled"}</h3>
              <div className="chip-row">
                <span className={`chip status-${video.status.toLowerCase()}`}>Status: {video.status}</span>
                <span className={`chip sensitivity-${(video.sensitivity ?? "PENDING").toLowerCase()}`}>
                  Review: {video.sensitivity || "PENDING"}
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
      )}

      {!loading && videos.length === 0 ? <p className="alert alert-info">No videos uploaded yet.</p> : null}
    </section>
  );
}
