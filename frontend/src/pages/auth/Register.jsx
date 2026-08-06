import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { register } from "../../api/axios";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAccessToken, setUser, user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await register(formData);
      setAccessToken(res.data.accessToken);
      setUser(res.data.data);
      navigate("/verify-otp", { state: { email: formData.email } });
    } catch (err) {
      setError(
        err.response?.data?.error || "Register failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Register | Ramy";
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-zinc-800 p-6 rounded-xl shadow-lg border border-zinc-700 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          Welcome
        </h1>

        {/* Error Alert */}
        {error && (
          <div className="p-3 text-xs bg-red-500/10 border border-red-500/50 text-red-400 rounded-md">
            {error}
          </div>
        )}

        {/* Name Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-zinc-300">
            Username
          </label>
          <input
            id="name"
            type="name"
            name="name"
            required
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md bg-zinc-700 text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />
        </div>

        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            placeholder="JohnDoe@gmail.com"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md bg-zinc-700 text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-zinc-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            required
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md bg-zinc-700 text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex gap-1 text-zinc-400">
            <span>Already have an account?</span>
            <Link
              to="/login"
              className="text-blue-400 font-medium hover:underline"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-medium rounded-md transition-colors duration-200 flex justify-center items-center"
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs">
              Signing up...
            </span>
          ) : (
            "Sign up"
          )}
        </button>
      </form>
    </div>
  );
}
