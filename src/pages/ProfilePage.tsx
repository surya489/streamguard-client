import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, Mail, Save, UserRound } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getProfile, updatePassword, updateProfile } from "../services/api";
import { getErrorMessage } from "../utils/error";
import { getUserInitials } from "../utils/user";

export function ProfilePage() {
  const { token, user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initialName, setInitialName] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const hasProfileChanges = useMemo(() => {
    return name.trim() !== initialName.trim() || email.trim().toLowerCase() !== initialEmail.trim().toLowerCase();
  }, [email, initialEmail, initialName, name]);

  const isPasswordFormReady = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return false;
    if (newPassword.length < 6) return false;
    if (newPassword !== confirmPassword) return false;
    if (newPassword === currentPassword) return false;
    return true;
  }, [confirmPassword, currentPassword, newPassword]);
  const initials = getUserInitials(name, email);

  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getProfile(token);
        setName(response.user.name ?? "");
        setEmail(response.user.email ?? "");
        setInitialName(response.user.name ?? "");
        setInitialEmail(response.user.email ?? "");
      } catch (err) {
        const text = getErrorMessage(err, "Could not load profile.");
        showToast(text, "error");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [showToast, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedName || !normalizedEmail) {
      showToast("Name and email are required.", "error");
      return;
    }

    if (normalizedName.length < 2) {
      showToast("Name must be at least 2 characters.", "error");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      showToast("Enter a valid email address.", "error");
      return;
    }

    setProfileSaving(true);

    try {
      const response = await updateProfile(token, { name: normalizedName, email: normalizedEmail });
      setName(response.user.name ?? "");
      setEmail(response.user.email ?? "");
      setInitialName(response.user.name ?? "");
      setInitialEmail(response.user.email ?? "");
      updateUser({ email: response.user.email, name: response.user.name });
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      const text = getErrorMessage(err, "Could not update profile.");
      showToast(text, "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New password and confirm password must match.", "error");
      return;
    }

    if (newPassword === currentPassword) {
      showToast("New password must be different from current password.", "error");
      return;
    }

    setPasswordSaving(true);

    if (!isPasswordFormReady) {
      setPasswordSaving(false);
      showToast("Please fill all password fields correctly.", "error");
      return;
    }

    setPasswordSaving(false);
    setShowPasswordConfirm(true);
  };

  const confirmPasswordUpdate = async () => {
    if (!token) return;
    setPasswordSaving(true);

    try {
      const response = await updatePassword(token, { currentPassword, newPassword });
      showToast(response.message || "Password updated successfully.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordConfirm(false);
      setIsPasswordModalOpen(false);
    } catch (err) {
      const text = getErrorMessage(err, "Could not update password.");
      showToast(text, "error");
      setShowPasswordConfirm(false);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <section className="profile-page">
      <div className="profile-top">
        <div className="page-head admin-head">
          <h2>
            <UserRound className="title-lucide" size={18} /> My Profile
          </h2>
        </div>
        <p className="muted">Manage your account details and security.</p>
      </div>

      <div className="profile-layout-modern">
        <article className="panel profile-summary-panel">
          {loading ? (
            <>
              <span className="skeleton skeleton-avatar" />
              <span className="skeleton skeleton-line profile-skeleton-line" />
              <span className="skeleton skeleton-line profile-skeleton-role" />
              <span className="skeleton skeleton-line profile-skeleton-line small" />
            </>
          ) : (
            <>
              <div className="sidebar-avatar profile-avatar">{initials}</div>
              <p className="profile-summary-email">{email || "email@example.com"}</p>
              <p className="profile-summary-role">{(user?.role ?? "VIEWER").toLowerCase()}</p>
              <p className="profile-summary-name">{name || "User"}</p>
            </>
          )}
        </article>

        <div className="profile-forms-stack">
          <form className="panel profile-panel" onSubmit={handleSubmit}>
            <h3>Account Details</h3>
            <label htmlFor="profile-name">
              <UserRound size={14} /> Name <span className="required-mark">*</span>
            </label>
            <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} />

            <label htmlFor="profile-email">
              <Mail size={14} /> Email <span className="required-mark">*</span>
            </label>
            <input id="profile-email" type="text" value={email} onChange={(event) => setEmail(event.target.value)} />

            <button type="submit" disabled={profileSaving || loading || !hasProfileChanges}>
              <Save size={15} />
              {profileSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <article className="panel profile-panel">
            <h3>Security</h3>
            <p className="muted">Change your password anytime.</p>
            <button
              type="button"
              onClick={() => {
                setShowPasswordConfirm(false);
                setIsPasswordModalOpen(true);
              }}
            >
              <KeyRound size={15} />
              Update Password
            </button>
          </article>
        </div>
      </div>

      {isPasswordModalOpen ? (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsPasswordModalOpen(false);
            setShowPasswordConfirm(false);
          }}
        >
          <div className="modal-card profile-password-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Update Password</h3>
            <form className="profile-password-form" onSubmit={handlePasswordSubmit}>
              <label htmlFor="profile-current-password">
                <KeyRound size={14} /> Current Password <span className="required-mark">*</span>
              </label>
              <div className="password-wrap">
                <input
                  id="profile-current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="ghost-btn password-toggle"
                  onClick={() => setShowCurrentPassword((current) => !current)}
                  aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <label htmlFor="profile-new-password">
                New Password <span className="required-mark">*</span>
              </label>
              <div className="password-wrap">
                <input
                  id="profile-new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="ghost-btn password-toggle"
                  onClick={() => setShowNewPassword((current) => !current)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <label htmlFor="profile-confirm-password">
                Confirm Password <span className="required-mark">*</span>
              </label>
              <div className="password-wrap">
                <input
                  id="profile-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="ghost-btn password-toggle"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setIsPasswordModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={passwordSaving || !isPasswordFormReady}>
                  Continue
                </button>
              </div>
            </form>

            {showPasswordConfirm ? (
              <div className="profile-confirm-panel">
                <p>Confirm password update?</p>
                <div className="modal-actions">
                  <button type="button" className="ghost-btn" onClick={() => setShowPasswordConfirm(false)}>
                    Back
                  </button>
                  <button type="button" onClick={() => void confirmPasswordUpdate()} disabled={passwordSaving}>
                    {passwordSaving ? "Updating..." : "Confirm"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
