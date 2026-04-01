import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, RefreshCcw, Settings2, UserRound } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getUsers, getVideos, updateUserRole } from "../services/api";
import { connectVideoSocket } from "../services/socket";
import type { AdminUserCreatedEvent, AdminVideoUploadedEvent, Role, UserListItem, VideoItem } from "../types";
import { getErrorMessage } from "../utils/error";

type SortOption = "name_asc" | "name_desc" | "created_desc" | "created_asc" | "videos_desc" | "videos_asc";

type RoleChangeDraft = {
  user: UserListItem;
  nextRole: Role;
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];
type FilterMenuKey = "role" | "sort" | "perPage" | "";

function safeDateValue(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getVideoOwnerId(video: VideoItem): string {
  if (!video.user) return "";
  if (typeof video.user === "string") return video.user;
  return video.user._id;
}

function roleOptions(currentRole: Role): Role[] {
  if (currentRole === "ADMIN") return ["EDITOR", "VIEWER"];
  if (currentRole === "EDITOR") return ["ADMIN", "VIEWER"];
  return ["ADMIN", "EDITOR"];
}

function formatRoleLabel(role: Role) {
  return `${role.charAt(0)}${role.slice(1).toLowerCase()}`;
}

export function AdminUsersPage() {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === "ADMIN";
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [videoCountByUserId, setVideoCountByUserId] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState("");

  const [roleFilter, setRoleFilter] = useState((searchParams.get("role") as Role | "") ?? "");
  const [sort, setSort] = useState((searchParams.get("sort") as SortOption) ?? "created_desc");
  const [perPage, setPerPage] = useState(Number(searchParams.get("perPage") ?? "10") || 10);
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1") || 1);

  const [activeRoleMenuUserId, setActiveRoleMenuUserId] = useState("");
  const [roleDraft, setRoleDraft] = useState<RoleChangeDraft | null>(null);
  const [activeFilterMenu, setActiveFilterMenu] = useState<FilterMenuKey>("");

  const loadData = useCallback(async () => {
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [usersResponse, videosResponse] = await Promise.all([
        getUsers(token),
        getVideos(token, { all: true, sort: "desc" }),
      ]);

      const counts = videosResponse.videos.reduce<Record<string, number>>((acc, video) => {
        const ownerId = getVideoOwnerId(video);
        if (!ownerId) return acc;
        acc[ownerId] = (acc[ownerId] ?? 0) + 1;
        return acc;
      }, {});

      setUsers(usersResponse.users);
      setVideoCountByUserId(counts);
    } catch (err) {
      const message = getErrorMessage(err, "Could not fetch user data.");
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showToast, token]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (roleFilter) params.set("role", roleFilter);
    if (sort) params.set("sort", sort);
    params.set("perPage", String(perPage));
    params.set("page", String(page));

    setSearchParams(params, { replace: true });
  }, [page, perPage, roleFilter, setSearchParams, sort]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    const socket = connectVideoSocket(token);

    socket.on("admin:user-created", (event: AdminUserCreatedEvent) => {
      setUsers((current) => {
        if (current.some((item) => item._id === event.user._id)) return current;
        return [event.user, ...current];
      });
      setVideoCountByUserId((current) => ({ ...current, [event.user._id]: current[event.user._id] ?? 0 }));
    });

    socket.on("admin:video-uploaded", (event: AdminVideoUploadedEvent) => {
      setVideoCountByUserId((current) => ({
        ...current,
        [event.userId]: (current[event.userId] ?? 0) + 1,
      }));
    });

    socket.on("admin:user-role-updated", (event: { userId: string; role: Role }) => {
      setUsers((current) => current.map((item) => (item._id === event.userId ? { ...item, role: event.role } : item)));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, isAdmin]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (!target.closest(".role-menu-wrap")) {
        setActiveRoleMenuUserId("");
      }

      if (!target.closest(".dropdown-wrap")) {
        setActiveFilterMenu("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const adminCount = useMemo(() => users.filter((item) => item.role === "ADMIN").length, [users]);

  const rows = useMemo(() => {
    let next = [...users];

    if (roleFilter) {
      next = next.filter((item) => item.role === roleFilter);
    }

    next.sort((a, b) => {
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      if (sort === "created_asc") return safeDateValue(a.createdAt) - safeDateValue(b.createdAt);
      if (sort === "videos_desc") return (videoCountByUserId[b._id] ?? 0) - (videoCountByUserId[a._id] ?? 0);
      if (sort === "videos_asc") return (videoCountByUserId[a._id] ?? 0) - (videoCountByUserId[b._id] ?? 0);
      return safeDateValue(b.createdAt) - safeDateValue(a.createdAt);
    });

    return next;
  }, [roleFilter, sort, users, videoCountByUserId]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginated = rows.slice(start, start + perPage);

  const confirmRoleChange = async () => {
    if (!token || !roleDraft) return;

    if (roleDraft.user.role === "ADMIN" && roleDraft.nextRole !== "ADMIN" && adminCount <= 1) {
      const message = "Cannot remove role from the last ADMIN user.";
      showToast(message, "error");
      setRoleDraft(null);
      return;
    }

    setUpdatingUserId(roleDraft.user._id);

    try {
      await updateUserRole(token, { userId: roleDraft.user._id, role: roleDraft.nextRole });
      setUsers((current) =>
        current.map((item) => (item._id === roleDraft.user._id ? { ...item, role: roleDraft.nextRole } : item))
      );
      showToast(`Role updated for ${roleDraft.user.name}.`, "success");
    } catch (err) {
      const message = getErrorMessage(err, "Role update failed.");
      showToast(message, "error");
    } finally {
      setUpdatingUserId("");
      setRoleDraft(null);
    }
  };

  const handleReset = () => {
    setRoleFilter("");
    setSort("created_desc");
    setPerPage(10);
    setPage(1);
  };

  const hasActiveFilters = roleFilter !== "" || sort !== "created_desc" || perPage !== 10;

  const sortLabel: Record<SortOption, string> = {
    created_desc: "Recently Added",
    created_asc: "Oldest Added",
    name_asc: "Name A to Z",
    name_desc: "Name Z to A",
    videos_desc: "Most Videos",
    videos_asc: "Least Videos",
  };

  if (!isAdmin) {
    return (
      <section>
        <div className="page-head">
          <h2>Users</h2>
          <p>This section is available only for admin accounts.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-head admin-head">
        <h2>
          <UserRound className="title-lucide" size={18} /> Users
        </h2>
        <span className="admin-badge">Admin Only</span>
      </div>
      <p className="muted">Manage user roles and review upload activity in real time.</p>

      <div className="panel filter-panel">
        <h3>User Controls</h3>
        <div className="filters-grid admin-filters">
          <div className="dropdown-wrap">
            <button
              type="button"
              className="filter-trigger"
              onClick={() => setActiveFilterMenu((current) => (current === "role" ? "" : "role"))}
            >
              <Filter size={14} />
              {roleFilter ? formatRoleLabel(roleFilter) : "All roles"}
              <span className="select-caret" />
            </button>
            {activeFilterMenu === "role" ? (
              <div className="filter-menu">
                <button
                  type="button"
                  className="filter-item"
                  onClick={() => {
                    setRoleFilter("");
                    setPage(1);
                    setActiveFilterMenu("");
                  }}
                >
                  All roles
                </button>
                <button
                  type="button"
                  className="filter-item"
                  onClick={() => {
                    setRoleFilter("ADMIN");
                    setPage(1);
                    setActiveFilterMenu("");
                  }}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className="filter-item"
                  onClick={() => {
                    setRoleFilter("EDITOR");
                    setPage(1);
                    setActiveFilterMenu("");
                  }}
                >
                  Editor
                </button>
                <button
                  type="button"
                  className="filter-item"
                  onClick={() => {
                    setRoleFilter("VIEWER");
                    setPage(1);
                    setActiveFilterMenu("");
                  }}
                >
                  Viewer
                </button>
              </div>
            ) : null}
          </div>

          <div className="dropdown-wrap">
            <button
              type="button"
              className="filter-trigger"
              onClick={() => setActiveFilterMenu((current) => (current === "sort" ? "" : "sort"))}
            >
              <Settings2 size={14} />
              {sortLabel[sort]}
              <span className="select-caret" />
            </button>
            {activeFilterMenu === "sort" ? (
              <div className="filter-menu">
                {(
                  ["created_desc", "created_asc", "name_asc", "name_desc", "videos_desc", "videos_asc"] as SortOption[]
                ).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="filter-item"
                    onClick={() => {
                      setSort(option);
                      setPage(1);
                      setActiveFilterMenu("");
                    }}
                  >
                    {sortLabel[option]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="dropdown-wrap">
            <button
              type="button"
              className="filter-trigger"
              onClick={() => setActiveFilterMenu((current) => (current === "perPage" ? "" : "perPage"))}
            >
              <Settings2 size={14} />
              {perPage} per page
              <span className="select-caret" />
            </button>
            {activeFilterMenu === "perPage" ? (
              <div className="filter-menu">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className="filter-item"
                    onClick={() => {
                      setPerPage(size);
                      setPage(1);
                      setActiveFilterMenu("");
                    }}
                  >
                    {size} per page
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin-actions">
          <button type="button" onClick={handleReset} disabled={!hasActiveFilters}>
            Reset Filters
          </button>
          <button type="button" onClick={() => void loadData()}>
            <RefreshCcw size={15} />
            Refresh
          </button>
        </div>
      </div>

      <div className="panel table-panel">
        {loading ? (
          <div className="table-skeleton-wrap">
            <div className="table-skeleton-head">
              <span className="skeleton skeleton-line" />
            </div>
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="table-skeleton-row" key={index}>
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-chip" />
                <span className="skeleton skeleton-line small" />
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-chip" />
              </div>
            ))}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Videos</th>
                  <th>Created</th>
                  <th>Profile</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>
                      <div className="role-cell role-menu-wrap">
                        <button
                          type="button"
                          className={`chip role-${item.role.toLowerCase()} role-chip-button`}
                          onClick={() =>
                            setActiveRoleMenuUserId((current) => (current === item._id ? "" : item._id))
                          }
                          disabled={updatingUserId === item._id || item._id === user?.id}
                        >
                          {item._id === user?.id ? "You" : formatRoleLabel(item.role)}
                        </button>

                        {activeRoleMenuUserId === item._id ? (
                          <div className="role-menu">
                            {roleOptions(item.role).map((roleOption) => (
                              <button
                                key={roleOption}
                                type="button"
                                className="role-option"
                                onClick={() => {
                                  setActiveRoleMenuUserId("");
                                  setRoleDraft({ user: item, nextRole: roleOption });
                                }}
                              >
                                Set as {formatRoleLabel(roleOption)}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td>{videoCountByUserId[item._id] ?? 0}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <Link to={`/dashboard/users/${item._id}`} className="table-link" title="View user profile">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && paginated.length === 0 ? <p className="alert alert-info">No users found for selected filters.</p> : null}

        {rows.length > perPage ? (
          <div className="pagination-row">
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
      </div>

      {roleDraft ? (
        <div className="modal-overlay" onClick={() => setRoleDraft(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm Role Change</h3>
            <p>
              Change <strong>{roleDraft.user.name}</strong> from <strong>{roleDraft.user.role}</strong> to{" "}
              <strong>{roleDraft.nextRole}</strong>?
            </p>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setRoleDraft(null)}>
                Cancel
              </button>
              <button type="button" onClick={() => void confirmRoleChange()}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
