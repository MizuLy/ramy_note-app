import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await forgotPassword({ email });
      setMessage(res.data.message);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-xl font-semibold text-white mb-1">
        Forgot your password?
      </h2>
      <p className="text-sm text-zinc-400 mb-6">
        Enter your email and we'll send you a link to reset it.
      </p>

      {submitted ? (
        <div className="text-sm text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md px-4 py-3">
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-zinc-500"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-300 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="text-sm text-zinc-400 mt-4">
        Remembered your password?{" "}
        <Link to="/login" className="text-zinc-200 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
