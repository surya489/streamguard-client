import { useRef, useState, type FormEvent } from "react";
import { FileVideo, UploadCloud } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { uploadVideo } from "../services/api";

export function UploadPage() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Please login again.");
      return;
    }

    if (!file) {
      setError("Please select a video file.");
      return;
    }

    setLoading(true);

    try {
      await uploadVideo(token, { title, file });
      setMessage("Upload successful. Processing status will update from backend.");
      setTitle("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h2>Upload Video</h2>
        <p>Allowed for ADMIN and EDITOR roles based on backend policy.</p>
      </div>

      <form className="panel" onSubmit={handleUpload}>
        <label htmlFor="title">Video Title</label>
        <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required />

        <label htmlFor="video">Video File</label>
        <input
          ref={fileInputRef}
          id="video"
          type="file"
          accept="video/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
          className="hidden-file-input"
        />
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
          >
            <UploadCloud size={16} />
            Choose File
          </button>
        </div>

        {error ? <p className="alert alert-error">{error}</p> : null}
        {message ? <p className="alert alert-success">{message}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </section>
  );
}
