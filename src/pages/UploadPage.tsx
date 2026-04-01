import { useRef, useState, type FormEvent } from "react";
import { FileVideo, UploadCloud } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { uploadVideo } from "../services/api";
import { getErrorMessage } from "../utils/error";

export function UploadPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const minimumLoaderMs = 2200;

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    const maxFileSize = 200 * 1024 * 1024;

    if (!token) {
      showToast("Please login again.", "error");
      return;
    }

    if (normalizedTitle.length < 2) {
      showToast("Video title must be at least 2 characters.", "error");
      return;
    }

    if (normalizedTitle.length > 120) {
      showToast("Video title must be 120 characters or fewer.", "error");
      return;
    }

    if (!file) {
      showToast("Please select a video file.", "error");
      return;
    }

    if (!file.type.startsWith("video/")) {
      showToast("Please upload a valid video file.", "error");
      return;
    }

    if (file.size > maxFileSize) {
      showToast("File is too large. Maximum allowed size is 200 MB.", "error");
      return;
    }

    setLoading(true);
    setUploadPercent(0);
    const startedAt = Date.now();

    try {
      await uploadVideo(token, { title: normalizedTitle, file }, (percent) => {
        setUploadPercent(percent);
      });
      setUploadPercent(100);

      const elapsed = Date.now() - startedAt;
      if (elapsed < minimumLoaderMs) {
        await new Promise((resolve) => setTimeout(resolve, minimumLoaderMs - elapsed));
      }

      showToast("Video uploaded successfully.", "success");
      setTitle("");
      setFile(null);
    } catch (err) {
      const message = getErrorMessage(err, "Upload failed. Please try again.");
      showToast(message, "error");
    } finally {
      setLoading(false);
      setTimeout(() => setUploadPercent(0), 500);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h2>Upload Video</h2>
        <p>Upload a video to start moderation and processing.</p>
      </div>

      <form className="panel" onSubmit={handleUpload}>
        <label htmlFor="title">
          Video Title <span className="required-mark">*</span>
        </label>
        <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />

        <label htmlFor="video">
          Video File <span className="required-mark">*</span>
        </label>
        <input
          ref={fileInputRef}
          id="video"
          type="file"
          accept="video/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="hidden-file-input"
        />
        <div className={`file-picker-wrap ${loading ? "is-loading" : ""}`}>
          <div className="file-picker">
            <div className="file-meta">
              <FileVideo size={18} />
              <div>
                <p>{file ? file.name : "No file selected"}</p>
                <span>{file ? `${Math.max(1, Math.round(file.size / 1024 / 1024))} MB` : "Allowed: mp4, mov, mkv, webm"}</span>
              </div>
            </div>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <UploadCloud size={16} />
              Choose File
            </button>
          </div>
          {loading ? (
            <div className="upload-overlay" role="status" aria-live="polite">
              <span className="upload-spinner" />
              <p>Processing upload... {uploadPercent}%</p>
            </div>
          ) : null}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </section>
  );
}
