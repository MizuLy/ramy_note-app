import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp, requestOtp } from "../../api/axios";
import { useEffect } from "react";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/login"); // no email in state = shouldn't be here
    }
  }, [email, navigate]);

  if (!email) return null; // avoid flashing content before redirect

  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // only allow single digit

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-focus next box
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 4; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setDigits(newDigits);
    inputRefs.current[Math.min(pasted.length, 3)]?.focus();
  };

  const otp = digits.join("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await verifyOtp({ email, otp });
      setMessage("Email verified! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setResending(true);

    try {
      await requestOtp({ email });
      setMessage("A new code has been sent to your email.");
      setDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-xl font-semibold text-white mb-1">
        Verify your email
      </h2>
      <p className="text-sm text-zinc-400 mb-6">
        Enter the 4-digit code sent to{" "}
        <span className="text-zinc-200">{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              autoFocus={index === 0}
              className="w-14 h-16 text-center text-2xl font-semibold rounded-md bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-zinc-500"
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        {message && (
          <p className="text-sm text-green-400 text-center">{message}</p>
        )}

        <button
          type="submit"
          disabled={loading || otp.length !== 4}
          className="w-full py-2 rounded-md bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      <button
        onClick={handleResend}
        disabled={resending}
        className="w-full mt-4 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
      >
        {resending ? "Sending..." : "Resend code"}
      </button>
    </div>
  );
}
