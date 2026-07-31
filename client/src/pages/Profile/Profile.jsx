import React, { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "../../services/userService";
import "./Profile.css";

function Profile() {
  const { user: authUser, setUser: setAuthUser } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    avatar: "",
    createdAt: "",
  });

  const [editData, setEditData] = useState({
    name: "",
    bio: "",
    avatar: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      if (data && data.success) {
        setProfile(data.user);
        setEditData({
          name: data.user.name || "",
          bio: data.user.bio || "",
          avatar:
            data.user.avatar ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.name}`,
        });
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });

    if (!editData.name.trim()) {
      setProfileMsg({ type: "error", text: "Name cannot be empty." });
      return;
    }

    try {
      setUpdatingProfile(true);
      const data = await updateUserProfile(editData);
      if (data && data.success) {
        setProfile(data.user);
        if (setAuthUser) {
          setAuthUser((prev) => ({ ...prev, ...data.user }));
        }
        setProfileMsg({
          type: "success",
          text: "Profile updated successfully!",
        });
      }
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordMsg({
        type: "error",
        text: "Please fill in all password fields.",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    try {
      setUpdatingPassword(true);
      const data = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (data && data.success) {
        setPasswordMsg({
          type: "success",
          text: "Password updated successfully!",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password.",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const defaultAvatars = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=Alex",
    "https://api.dicebear.com/7.x/bottts/svg?seed=CodeMaster",
    "https://api.dicebear.com/7.x/bottts/svg?seed=DevRunner",
    "https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja",
  ];

  return (
    <MainLayout>
      <div className="profile-container">
        <header className="profile-header">
          <h1 className="profile-title">Account & Profile Settings</h1>
          <p className="profile-subtitle">
            Manage your personal profile details, bio, avatar, and security settings.
          </p>
        </header>

        {loading ? (
          <div className="profile-state-card">
            <div className="spinner"></div>
            <p>Loading profile details...</p>
          </div>
        ) : (
          <div className="profile-grid">
            {/* Profile Overview Card */}
            <div className="profile-card user-overview-card">
              <div className="avatar-wrapper">
                <img
                  src={
                    profile.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.name}`
                  }
                  alt={profile.name}
                  className="profile-avatar"
                />
              </div>
              <h2 className="user-name">{profile.name}</h2>
              <p className="user-email">✉️ {profile.email}</p>
              <p className="user-bio">"{profile.bio || "No bio provided yet."}"</p>
              <div className="user-meta">
                <span>
                  🗓️ Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="profile-forms-column">
              {/* Edit Profile Form */}
              <div className="profile-card">
                <h3>Edit Profile Information</h3>
                {profileMsg.text && (
                  <div className={`alert-box alert-${profileMsg.type}`}>
                    {profileMsg.text}
                  </div>
                )}
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address (Read-only)</label>
                    <input type="email" value={profile.email} disabled />
                  </div>

                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      rows="3"
                      value={editData.bio}
                      onChange={(e) =>
                        setEditData({ ...editData, bio: e.target.value })
                      }
                      placeholder="Tell us about yourself..."
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Avatar URL</label>
                    <input
                      type="url"
                      value={editData.avatar}
                      onChange={(e) =>
                        setEditData({ ...editData, avatar: e.target.value })
                      }
                      placeholder="https://..."
                    />
                    <div className="avatar-preset-row">
                      <span className="preset-label">Preset Avatars:</span>
                      {defaultAvatars.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="Preset"
                          className="preset-avatar"
                          onClick={() =>
                            setEditData({ ...editData, avatar: url })
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updatingProfile}
                  >
                    {updatingProfile ? "Saving Changes..." : "Save Profile"}
                  </button>
                </form>
              </div>

              {/* Change Password Form */}
              <div className="profile-card">
                <h3>Security & Password</h3>
                {passwordMsg.text && (
                  <div className={`alert-box alert-${passwordMsg.type}`}>
                    {passwordMsg.text}
                  </div>
                )}
                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Profile;