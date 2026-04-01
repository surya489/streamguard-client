import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { getVideos } from "../services/api";
import { connectVideoSocket } from "../services/socket";
import type { VideoItem, VideoProgressEvent } from "../types";

export function DashboardHomePage() {
  const { user, token } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);

  useEffect(() => {
    async function loadVideos() {
      if (!token) return;
      const response = await getVideos(token);
      setVideos(response.videos);
    }

    void loadVideos();
  }, [token]);

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

  return (
    <section>
      <div className="page-head">
        <h2>Dashboard Overview</h2>
        <p>Track your moderation workflow and upload pipeline in one place.</p>
      </div>

      <div className="grid-cards">
        <article className="stat-card">
          <h3>Signed In User</h3>
          <p className="stat-value">{user?.email ?? "Unknown"}</p>
        </article>
        <article className="stat-card">
          <h3>Role</h3>
          <p className="stat-value">{user?.role ?? "Unassigned"}</p>
        </article>
        <article className="stat-card">
          <h3>Total Videos</h3>
          <p className="stat-value">{stats.total}</p>
        </article>
        <article className="stat-card">
          <h3>In Processing</h3>
          <p className="stat-value">{stats.processing}</p>
        </article>
        <article className="stat-card">
          <h3>Safe</h3>
          <p className="stat-value">{stats.safe}</p>
        </article>
        <article className="stat-card">
          <h3>Flagged</h3>
          <p className="stat-value">{stats.flagged}</p>
        </article>
      </div>
    </section>
  );
}
