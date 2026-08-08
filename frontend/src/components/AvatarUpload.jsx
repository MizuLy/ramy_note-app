import React, { useState } from "react";

export default function AvatarUpload({ currentAvatar, onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0]; // ⚠️ Extract single file object
    if (!file) return;

    // Local instant preview
    setPreview(URL.createObjectURL(file));

    // Auto-upload on selection
    uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("image", file); // Must match backend upload.single("image")

    try {
      const token = localStorage.getItem("token"); // Retrieve your auth token

      const response = await fetch(
        "http://localhost:6969/api/auth/change-avatar",
        {
          method: "PATCH",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            // DO NOT manually set Content-Type header here
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload avatar");
      }

      console.log("Upload success:", data);

      // Notify parent component with updated user or image URL
      if (onUploadSuccess) {
        onUploadSuccess(data.user || data);
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      alert(err.message || "Something went wrong uploading avatar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        alignItems: "center",
      }}
    >
      {/* Avatar Display */}
      <img
        src={preview || currentAvatar || "/default-avatar.png"}
        alt="Avatar"
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #ccc",
        }}
      />

      {/* File Input Button */}
      <label style={{ cursor: loading ? "not-allowed" : "pointer" }}>
        <span
          style={{
            padding: "8px 16px",
            background: "#333",
            color: "#fff",
            borderRadius: "6px",
          }}
        >
          {loading ? "Uploading..." : "Change Avatar"}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          style={{ display: "none" }} // Hide default input, styled via label
        />
      </label>
    </div>
  );
}
