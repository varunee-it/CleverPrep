import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import authService from "../../../services/authService";
import toast from "react-hot-toast";
import { Camera, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { getUserDisplayName, getUserInitials } from "../../../utils/userUtils";

const AvatarUpload = ({ isGoogleUser }) => {
  const { user, updateUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef(null);

  const getInitials = () => {
    return getUserInitials(user);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, JPG, PNG, and WEBP image files are allowed.");
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file size cannot exceed 2 MB.");
      return;
    }

    // Optimistic UI preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await authService.uploadAvatar(formData);
      updateUser({ profileImage: res.profileImage });
      toast.success("Avatar uploaded successfully");
    } catch (err) {
      // Revert preview on failure
      setPreviewUrl(null);
      toast.error(err.message || err.error || "Failed to upload avatar.");
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const triggerFileInput = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await authService.deleteAvatar();
      updateUser({ profileImage: null });
      toast.success("Avatar removed successfully");
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(err.message || err.error || "Failed to remove avatar.");
    } finally {
      setIsDeleting(false);
    }
  };

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user, previewUrl]);

  const getAvatarUrl = () => {
    if (previewUrl) return previewUrl;
    const rawSrc = user?.profileImage || user?.avatar;
    if (!rawSrc) return null;
    if (rawSrc.startsWith("http://") || rawSrc.startsWith("https://")) {
      return rawSrc;
    }
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5050";
    const cleanPath = rawSrc.startsWith("/") ? rawSrc : `/${rawSrc}`;
    return `${baseUrl}${cleanPath}`;
  };

  const avatarSrc = !imgError ? getAvatarUrl() : null;
  const showRemoveButton = !isGoogleUser && (user?.profileImage || previewUrl);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-1">
      {/* Avatar Container */}
      <div className="relative group shrink-0">
        <div 
          onClick={isGoogleUser ? undefined : triggerFileInput}
          className={`w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center font-bold text-3xl select-none transition-all duration-300 ${
            isGoogleUser ? "" : "cursor-pointer hover:opacity-90 hover:scale-102"
          } ${
            !avatarSrc ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/20" : ""
          }`}
        >
          {avatarSrc ? (
            <img 
              src={avatarSrc} 
              alt="Avatar preview" 
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{getInitials()}</span>
          )}

          {/* Loader Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center text-white">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          {/* Camera Overlay Hover (Non-Google) */}
          {!isGoogleUser && !isUploading && (
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-200 flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Info details / Action Buttons */}
      <div className="text-center sm:text-left flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <h2 className="text-xl font-bold text-slate-900 leading-tight">
            {getUserDisplayName(user)}
          </h2>
          {user?.isEmailVerified && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100/50">
              Verified Student <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
            </span>
          )}
        </div>
        <p className="text-slate-400 font-semibold text-sm">{user?.email}</p>

        {/* Action Controls */}
        {!isGoogleUser && (
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1.5">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/jpeg,image/jpg,image/png,image/webp" 
              className="hidden"
            />
            <button
              onClick={triggerFileInput}
              disabled={isUploading}
              className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              Upload Photo
            </button>
            {showRemoveButton && (
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={isUploading || isDeleting}
                className="h-9 w-9 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                title="Remove photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove avatar image?"
        message="Are you sure you want to remove your avatar? This will restore the default initials icon."
        confirmText="Remove"
        loading={isDeleting}
        loadingText="Removing..."
        variant="danger"
      />
    </div>
  );
};

export default AvatarUpload;
