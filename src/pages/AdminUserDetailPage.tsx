import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ListFilter, SlidersHorizontal, UserRound } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getStreamUrl, getUsers, getVideos } from "../services/api";
import { connectVideoSocket } from "../services/socket";
import type { AdminVideoUploadedEvent, UserListItem, VideoItem, VideoProgressEvent } from "../types";
import { getErrorMessage } from "../utils/error";

const PER_PAGE_OPTIONS = [8, 12, 16];

type SortOption = "newest" | "oldest" | "title_asc" | "title_desc";

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function safeDateValue(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getOwnerId(video: VideoItem): string {
  if (!video.user) return "";
  if (typeof video.user === "string") return video.user;
  return video.user._id;
}

function formatRoleLabel(role: string) {
  if (!role) return "";
  return `${role.charAt(0)}${role.slice(1).toLowerCase()}`;
}

export function AdminUserDetailPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { userId = "" } = useParams();

  const [targetUser, setTargetUser] = useState<UserListItem | null>(null);
  const [allUserVideos, setAllUserVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    async function loadData() {
      if (!token || !userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [usersResponse, videosResponse] = await Promise.all([
          getUsers(token),
          getVideos(token, { all: true, sort: "desc" }),
        ]);

        const foundUser = usersResponse.users.find((item) => item._id === userId) ?? null;
        setTargetUser(foundUser);

        const videos = videosResponse.videos.filter((video) => getOwnerId(video) === userId);
        setAllUserVideos(videos);
      } catch (err) {
        const message = getErrorMessage(err, "Could not fetch user details.");
        showToast(message, "error");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [showToast, token, userId]);

  useEffect(() => {
    if (!token || !userId) return;
    const socket = connectVideoSocket(token);

    socket.on("admin:video-uploaded", (event: AdminVideoUploadedEvent) => {
      if (event.userId !== userId) return;
      void (async () => {
        const videosResponse = await getVideos(token, { all: true, sort: "desc" });
        const videos = videosResponse.videos.filter((video) => getOwnerId(video) === userId);
        setAllUserVideos(videos);
      })();
    });

    socket.on("video:progress", (event: VideoProgressEvent) => {
      setAllUserVideos((current) =>
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
  }, [token, userId]);

  const safeCount = useMemo(() => allUserVideos.filter((video) => video.sensitivity === "SAFE").length, [allUserVideos]);
  const flaggedCount = useMemo(
    () => allUserVideos.filter((video) => video.sensitivity === "FLAGGED").length,
    [allUserVideos]
  );

  const sortedVideos = useMemo(() => {
    const list = [...allUserVideos];

    list.sort((a, b) => {
      if (sort === "oldest") return safeDateValue(a.createdAt) - safeDateValue(b.createdAt);
      if (sort === "title_asc") return (a.title || "").localeCompare(b.title || "");
      if (sort === "title_desc") return (b.title || "").localeCompare(a.title || "");
      return safeDateValue(b.createdAt) - safeDateValue(a.createdAt);
    });

    return list;
  }, [allUserVideos, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedVideos.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const videos = sortedVideos.slice(start, start + perPage);

  return (
    <section>
      <div className="page-head admin-head">
        <h2>
          <UserRound className="title-lucide" size={18} /> User Profile
        </h2>
        <span className="admin-badge">Admin Only</span>
      </div>

      <div className="single-user-actions">
        <Link to="/dashboard/users" className="table-link">
          <ArrowLeft size={14} /> Back to User List
        </Link>
      </div>

      {loading ? (
        <article className="panel single-user-card">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="single-user-row" key={index}>
              <span className="skeleton skeleton-line small" />
              <span className="skeleton skeleton-line" />
            </div>
          ))}
        </article>
      ) : null}

      {!loading && targetUser ? (
        <article className="panel single-user-card single-user-summary-card">
          <div className="single-user-row">
            <p className="label">Name</p>
            <p className="value">{targetUser.name}</p>
          </div>
          <div className="single-user-row">
            <p className="label">Email</p>
            <p className="value">{targetUser.email}</p>
          </div>
          <div className="single-user-row">
            <p className="label">Role</p>
            <p className="value">
              <span className={`chip role-${targetUser.role.toLowerCase()}`}>{formatRoleLabel(targetUser.role)}</span>
            </p>
          </div>
          <div className="single-user-row">
            <p className="label">Joined</p>
            <p className="value">{formatDate(targetUser.createdAt)}</p>
          </div>
          <div className="single-user-row">
            <p className="label">Videos</p>
            <p className="value">{allUserVideos.length}</p>
          </div>
          <div className="single-user-row">
            <p className="label">Sensitivity</p>
            <p className="value">
              <span className="chip sensitivity-safe">Safe: {safeCount}</span>
              <span className="chip sensitivity-flagged">Flagged: {flaggedCount}</span>
            </p>
          </div>
        </article>
      ) : null}

      <div className="panel filter-panel top-gap single-user-video-controls">
        <h3>User Videos</h3>
        <div className="filters-grid">
          <div className="select-shell">
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortOption);
                setPage(1);
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title_asc">Title A to Z</option>
              <option value="title_desc">Title Z to A</option>
            </select>
            <ListFilter className="select-icon" size={14} />
            <span className="select-caret" />
          </div>
          <div className="select-shell">
            <select
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value));
                setPage(1);
              }}
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} per page
                </option>
              ))}
            </select>
            <SlidersHorizontal className="select-icon" size={14} />
            <span className="select-caret" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="video-grid">
          {Array.from({ length: 4 }).map((_, index) => (
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
                  {video.sensitivity || "PENDING"}
                </span>
              </div>
              <p className="muted">Uploaded: {formatDate(video.createdAt)}</p>
              <video controls preload="metadata" src={token ? getStreamUrl(video._id, token) : ""} />
            </article>
          ))}
        </div>
      )}

      {!loading && videos.length === 0 ? <p className="alert alert-info">No videos found for this user.</p> : null}

      {sortedVideos.length > perPage ? (
        <div className="pagination-row top-gap">
          <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <p>
            Page {currentPage} of {totalPages}
          </p>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
