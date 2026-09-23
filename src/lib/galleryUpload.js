const IMAGE_UPLOAD_MAX_DIMENSION = 1920;
const IMAGE_FEED_MAX_DIMENSION = 1280;
const IMAGE_THUMB_MAX_DIMENSION = 360;
const IMAGE_UPLOAD_QUALITY = 0.82;
const IMAGE_FEED_QUALITY = 0.78;
const IMAGE_THUMB_QUALITY = 0.7;
const IMAGE_UPLOAD_MAX_BYTES = 1200 * 1024;

function isImageType(type) { return type?.startsWith("image/"); }
function shouldOptimizeImage(file) {
  return (
    isImageType(file.type) &&
    !["image/gif", "image/svg+xml"].includes(file.type)
  );
}

function getScaledDimensions(image, maxDimension) {
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
  );

  return {
    width: Math.max(1, Math.round(image.naturalWidth * scale)),
    height: Math.max(1, Math.round(image.naturalHeight * scale)),
  };
}

async function loadImageFromFile(file) {
  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });

    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function createImageVariant(image, fileName, maxDimension, quality) {
  const { width, height } = getScaledDimensions(image, maxDimension);
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );

  if (!blob) return null;

  return new File([blob], fileName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function prepareFilesForUpload(file) {
  if (!shouldOptimizeImage(file)) {
    return {
      original: file,
      feed: null,
      thumb: null,
    };
  }

  try {
    const image = await loadImageFromFile(file);
    const optimizedOriginal = await createImageVariant(
      image,
      "original.jpg",
      IMAGE_UPLOAD_MAX_DIMENSION,
      IMAGE_UPLOAD_QUALITY,
    );
    const feed = await createImageVariant(
      image,
      "feed.jpg",
      IMAGE_FEED_MAX_DIMENSION,
      IMAGE_FEED_QUALITY,
    );
    const thumb = await createImageVariant(
      image,
      "thumb.jpg",
      IMAGE_THUMB_MAX_DIMENSION,
      IMAGE_THUMB_QUALITY,
    );

    return {
      original:
        optimizedOriginal &&
        (file.size > IMAGE_UPLOAD_MAX_BYTES || optimizedOriginal.size < file.size)
          ? optimizedOriginal
          : file,
      feed,
      thumb,
    };
  } catch (error) {
    console.error(error);
    return {
      original: file,
      feed: null,
      thumb: null,
    };
  }
}

