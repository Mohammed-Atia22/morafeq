import { ImageUploader } from "../../../shared/components/ImageUploader";

export function PhotoUploader({
  fieldStyles,
  selectedPhotos,
  handlePhotoChange,
  removeSelectedPhoto,
  required = false,
}) {
  // Adapt ImageUploader's onImagesChange to match handlePhotoChange's expected event format
  const handleImagesChange = (newImages) => {
    // Create a mock event object with target.files property
    const mockEvent = {
      target: {
        files: newImages,
        value: "",
      },
    };
    handlePhotoChange(mockEvent);
  };

  return (
    <div
      style={{
        marginTop: "22px",
        padding: "18px",
        borderRadius: "16px",
        border: "1px solid #d8dde8",
        background: "#f8fafc",
      }}
    >
      <ImageUploader
        images={selectedPhotos}
        onImagesChange={handleImagesChange}
        onRemove={removeSelectedPhoto}
        maxImages={10}
        maxSize={5 * 1024 * 1024}
        title="صور الشقة"
        helperText="يمكنك إضافة حتى 10 صور، ويجب ألا تتجاوز كل صورة 5 ميغابايت."
        uploadText="إضافة صورة"
        required={required}
      />
    </div>
  );
}
