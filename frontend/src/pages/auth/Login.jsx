import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { login } from "../../api/axios";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAccessToken, setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(formData);
      setAccessToken(res.data.accessToken);

      const userData = res.data.data;
      const avatarUrl = userData?.image || userData?.avatar;
      setUser({
        ...userData,
        avatar: avatarUrl,
        image: avatarUrl,
      });
      navigate("/");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Login | Ramy";
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-100 px-4 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Glows anchored to screen width */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="w-full bg-zinc-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-zinc-800/80 space-y-5"
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-xs text-zinc-400">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex flex-col gap-1.5 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
              <span>{error}</span>
              {error === "Please verify your email first" && (
                <Link
                  to="/verify-otp"
                  state={{ email: formData.email }}
                  className="font-medium text-red-300 underline hover:text-red-200 transition-colors w-fit"
                >
                  Verify email address →
                </Link>
              )}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-300"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/60 text-white placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all duration-200"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-zinc-300"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/60 text-white placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all duration-200"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all duration-150 flex justify-center items-center"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Logging in...</span>
              </div>
            ) : (
              "Log in"
            )}
          </button>

          {/* Footer Link */}
          <div className="text-center pt-2 text-xs text-zinc-400">
            <span>Don't have an account? </span>
            <Link
              to="/register"
              className="text-indigo-400 font-medium hover:text-indigo-300 hover:underline transition-colors"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
