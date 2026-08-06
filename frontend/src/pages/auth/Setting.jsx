import { useState } from "react";
import {
  LuSun,
  LuMoon,
  LuMonitor,
  LuLogOut,
  LuTrash2,
  LuKeyRound,
  LuUserRound,
} from "react-icons/lu";
import { MdColorLens } from "react-icons/md";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { useTheme } from "../../context/ThemeProvider";
import {
  changeName,
  changeEmail,
  changePassword,
  logout,
} from "../../api/axios";
import { useEffect } from "react";

export default function Settings() {
  const { user, setUser, setAccessToken, accessToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [nameStatus, setNameStatus] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const [email, setEmail] = useState(user?.email || "");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    document.title = "Settings | Ramy";
  });

  const handleSaveName = async () => {
    setNameSaving(true);
    setNameStatus("");
    try {
      await changeName({ name }, accessToken);
      setUser((prev) => ({ ...prev, name }));
      setNameStatus("Saved");
    } catch (err) {
      setNameStatus(err.response?.data?.error || "Failed to update name");
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailStatus("");
    setEmailSaving(true);
    try {
      await changeEmail(
        { newEmail: email, password: emailPassword },
        accessToken,
      );
      setUser((prev) => ({ ...prev, email }));
      setEmailStatus("Email updated");
      setEmailPassword("");
    } catch (err) {
      setEmailStatus(err.response?.data?.error || "Failed to update email");
    } finally {
      setEmailSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordStatus("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({ currentPassword, newPassword }, accessToken);
      setPasswordStatus("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err.response?.data?.error || "Failed to update password",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      setAccessToken(null);
      setUser(null);
      navigate("/login");
    }
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: LuSun },
    { value: "dark", label: "Dark", icon: LuMoon },
    { value: "system", label: "System", icon: LuMonitor },
  ];

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Settings</h1>
          <p className="text-sm text-zinc-500">
            Manage your profile, security, and workspace preferences.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <span className="text-sm">
                <LuUserRound size={20} />
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Profile</h2>
              <p className="text-xs text-zinc-500">
                How you appear in the app.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                Display name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
                />
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving || name === user?.name}
                  className="px-3 py-2 rounded-md bg-zinc-100 text-zinc-900 text-xs font-medium hover:bg-zinc-300 disabled:opacity-50 transition-colors shrink-0"
                >
                  {nameSaving ? "..." : "Save"}
                </button>
              </div>
              {nameStatus && (
                <p className="text-xs text-zinc-400 mt-1.5">{nameStatus}</p>
              )}
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {email !== user?.email && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                Confirm password to update email
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Current password"
                  className="flex-1 px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
                />
                <button
                  onClick={handleChangeEmail}
                  disabled={emailSaving || !emailPassword}
                  className="px-4 py-2 rounded-md bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-zinc-300 disabled:opacity-50 transition-colors shrink-0"
                >
                  {emailSaving ? "Saving..." : "Update email"}
                </button>
              </div>
              {emailStatus && (
                <p className="text-xs text-zinc-400 mt-1.5">{emailStatus}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <span className="text-sm">
                <LuKeyRound size={20} />
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Security</h2>
              <p className="text-xs text-zinc-500">
                Change the password used to sign in.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {passwordError && (
            <p className="text-xs text-red-400 mt-3">{passwordError}</p>
          )}
          {passwordStatus && (
            <p className="text-xs text-green-400 mt-3">{passwordStatus}</p>
          )}

          <button
            onClick={handleChangePassword}
            disabled={passwordSaving || !currentPassword || !newPassword}
            className="mt-4 px-4 py-2 rounded-md bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-zinc-300 disabled:opacity-50 transition-colors"
          >
            {passwordSaving ? "Updating..." : "Update password"}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <span className="text-sm">
                <MdColorLens size={20} />
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Appearance</h2>
              <p className="text-xs text-zinc-500">
                Customize the look and feel of your workspace.
              </p>
            </div>
          </div>

          <p className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`relative flex flex-col items-center gap-2 py-5 rounded-lg border transition-colors ${
                  theme === value
                    ? "border-zinc-400 bg-zinc-800"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {theme === value && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                    ✓
                  </span>
                )}
                <Icon size={18} />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-red-900/40 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-red-950/40 flex items-center justify-center shrink-0">
              <LuLogOut size={16} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-red-400">Account</h2>
              <p className="text-xs text-zinc-500">
                Sign out or permanently delete your account.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-zinc-800">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-zinc-500">
                End your current session on this device.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
            >
              <LuLogOut size={14} />
              Sign out
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-zinc-800">
            <div>
              <p className="text-sm font-medium text-red-400">Delete account</p>
              <p className="text-xs text-zinc-500">
                Permanently remove your account and all notes. This cannot be
                undone.
              </p>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
              <LuTrash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
