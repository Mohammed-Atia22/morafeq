import { useRef, useState } from "react";

export function ImageUploader({
  images = [],
  onImagesChange,
  onRemove,
  maxImages = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  title = "صور",
  helperText = "يمكنك إضافة حتى 10 صور، ويجب ألا تتجاوز كل صورة 5 ميغابايت.",
  uploadText = "إضافة صورة",
  required = false,
  disabled = false,
  error = null,
  className = "",
}) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = "";
  };

  const processFiles = (files) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const validFiles = imageFiles.filter((file) => file.size <= maxSize);

    if (imageFiles.length !== validFiles.length) {
      onImagesChange?.(
        [...images, ...validFiles].slice(0, maxImages),
        "يجب ألا يتجاوز حجم كل صورة 5 ميغابايت"
      );
    } else {
      onImagesChange?.([...images, ...validFiles].slice(0, maxImages));
    }
  };

  const handleRemove = (index) => {
    onRemove?.(index);
  };

  const handleReplace = (index) => {
    inputRef.current?.click();
    // Store the index being replaced
    inputRef.current.dataset.replaceIndex = index;
  };

  const handleFileChangeForReplace = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const replaceIndex = parseInt(inputRef.current?.dataset.replaceIndex || "-1");
    if (replaceIndex >= 0) {
      const file = files[0];
      if (file.size > maxSize) {
        onImagesChange?.(images, "يجب ألا يتجاوز حجم الصورة 5 ميغابايت");
        e.target.value = "";
        return;
      }

      const newImages = [...images];
      newImages[replaceIndex] = file;
      onImagesChange?.(newImages);
    } else {
      handleFileChange(e);
    }
    e.target.value = "";
    delete inputRef.current.dataset.replaceIndex;
  };

  const getImageUrl = (image) => {
    if (typeof image === "string") return image;
    if (image instanceof File) return URL.createObjectURL(image);
    return image.url || "";
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={className} dir="rtl">
      <div className="mb-3">
        <h3 className="text-base font-bold text-[#12213f]">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      </div>

      {error && (
        <div className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Upload slot */}
      {canAddMore && (
        <div
          className={`relative mb-3 flex h-40 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed transition ${
            dragActive
              ? "border-[#1752F0] bg-blue-50"
              : "border-slate-300 bg-slate-50 hover:border-[#1752F0] hover:bg-blue-50"
          } ${disabled ? "pointer-events-none opacity-50" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="text-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto h-10 w-10 text-slate-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="mt-2 text-sm font-semibold text-slate-600">{uploadText}</p>
            <p className="text-xs text-slate-400">أو اسحب وأفلت الصور هنا</p>
          </div>
        </div>
      )}

      {/* Image count */}
      {maxImages > 0 && (
        <p className="mb-3 text-xs text-slate-500">
          {images.length} / {maxImages} صور
        </p>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={typeof image === "string" ? image : `${image.name}-${image.lastModified || index}`}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <img
                src={getImageUrl(image)}
                alt={`${title} ${index + 1}`}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReplace(index);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow transition hover:bg-slate-100"
                  aria-label="استبدال"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white shadow transition hover:bg-red-600"
                  aria-label="حذف"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={canAddMore}
        required={required && images.length === 0}
        disabled={disabled}
        className="hidden"
        onChange={handleFileChangeForReplace}
      />
    </div>
  );
}
