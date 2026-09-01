import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { Link, useSearchParams } from "react-router-dom";
import {
  getGuestInvitationPath,
  saveGuestInvitationSlug,
} from "./lib/guestInvitation";

const styles = `
@import url("https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap");

* {
  font-family: "Urbanist", Arial, Helvetica, sans-serif;
}

.page-bg {
  background:
    radial-gradient(circle at 20% 8%, rgba(183,196,176,.18), transparent 28%),
    radial-gradient(circle at 86% 38%, rgba(183,196,176,.12), transparent 26%),
    #fbfaf5;
}

.section-cream {
  background:
    radial-gradient(circle at 82% 18%, rgba(205,184,146,.16), transparent 28%),
    #f8f5ee;
}

.gold-line {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(205, 184, 146, 0.35),
    rgba(244, 227, 189, 0.95),
    rgba(205, 184, 146, 0.35),
    transparent
  );
}

.gold-accent {
  display: inline-block;
  background: linear-gradient(
    105deg,
    #b7975b 0%,
    #cdb892 28%,
    #f4e3bd 48%,
    #cdb892 68%,
    #a9874f 100%
  );
  background-size: 230% 230%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.upload-box {
  border: 1px dashed rgba(205,184,146,.65);
  background: rgba(255,255,255,.42);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.phone-shell {
  box-shadow:
    0 28px 80px rgba(93, 109, 86, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

	.app-card {
	  box-shadow: 0 14px 38px rgba(143,159,138,0.12);
	}

	.story-strip {
	  backface-visibility: hidden;
	  contain: layout paint;
	  transform: translateZ(0);
	}

	.feed-post {
	  content-visibility: auto;
	  contain-intrinsic-size: 760px;
	}

	.media-placeholder {
	  background:
	    linear-gradient(90deg, rgba(248,245,238,0), rgba(255,255,255,.64), rgba(248,245,238,0)),
	    #f8f5ee;
	  background-size: 220% 100%;
	  animation: media-shimmer 1.25s ease-in-out infinite;
	}

	@keyframes media-shimmer {
	  0% {
	    background-position: 120% 0;
	  }
	  100% {
	    background-position: -120% 0;
	  }
	}
	`;
	
const STORY_PHOTO_DURATION = 5000;
const STORY_VIDEO_DURATION = 8000;
const POST_PAGE_SIZE = 10;
const POST_RENDER_BATCH = 6;
const VISITOR_ID_STORAGE_KEY = "fd-gallery-visitor-id";
const SUPABASE_IMAGE_BUCKET = "wedding-gallery";
const IMAGE_UPLOAD_MAX_DIMENSION = 1920;
const IMAGE_FEED_MAX_DIMENSION = 1280;
const IMAGE_THUMB_MAX_DIMENSION = 360;
const IMAGE_UPLOAD_QUALITY = 0.82;
const IMAGE_FEED_QUALITY = 0.78;
const IMAGE_THUMB_QUALITY = 0.7;
const IMAGE_UPLOAD_MAX_BYTES = 1200 * 1024;
const GALLERY_COLUMNS =
  "id, file_url, file_type, file_path, uploaded_by, caption, anonymous_id, created_at";
const GALLERY_COLUMNS_WITHOUT_CAPTION =
  "id, file_url, file_type, file_path, uploaded_by, anonymous_id, created_at";

function getOrCreateVisitorId() {
  const storedVisitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY);

  if (storedVisitorId) return storedVisitorId;

  const newVisitorId = crypto.randomUUID();
  localStorage.setItem(VISITOR_ID_STORAGE_KEY, newVisitorId);
  return newVisitorId;
}

function mapGalleryItem(item) {
  const type = item.file_type;
  const filePath = item.file_path;
  const originalUrl = item.file_url;
  const variantUrls = getStoredVariantUrls({ filePath, type });

  return {
    galleryId: String(filePath || item.id || originalUrl),
    url: originalUrl,
    thumbUrl:
      variantUrls?.thumb ||
      getGalleryImageUrl({ filePath, type, originalUrl }, 220, 70),
    feedUrl:
      variantUrls?.feed ||
      getGalleryImageUrl({ filePath, type, originalUrl }, 1100, 78),
    storyUrl:
      variantUrls?.feed ||
      getGalleryImageUrl({ filePath, type, originalUrl }, 900, 78),
    type,
    uploadedBy: item.uploaded_by,
    caption: item.caption,
    createdAt: item.created_at,
    filePath,
    anonymousId: item.anonymous_id,
  };
}

function isImageType(type) {
  return type?.startsWith("image/");
}

function shouldOptimizeImage(file) {
  return (
    isImageType(file.type) &&
    !["image/gif", "image/svg+xml"].includes(file.type)
  );
}

function getStoredVariantUrls(item) {
  if (!isImageType(item.type) || !item.filePath) return null;

  const match = item.filePath.match(/^(.*\/)?([^/]+)\/original\.[^/.]+$/);
  if (!match) return null;

  const basePath = `${match[1] || ""}${match[2]}`;
  const { data: feedData } = supabase.storage
    .from(SUPABASE_IMAGE_BUCKET)
    .getPublicUrl(`${basePath}/feed.webp`);
  const { data: thumbData } = supabase.storage
    .from(SUPABASE_IMAGE_BUCKET)
    .getPublicUrl(`${basePath}/thumb.webp`);

  return {
    feed: feedData.publicUrl,
    thumb: thumbData.publicUrl,
  };
}

function getStoredVariantPaths(filePath, type) {
  if (!isImageType(type) || !filePath) return [filePath].filter(Boolean);

  const match = filePath.match(/^(.*\/)?([^/]+)\/original\.[^/.]+$/);
  if (!match) return [filePath];

  const basePath = `${match[1] || ""}${match[2]}`;
  return [filePath, `${basePath}/feed.webp`, `${basePath}/thumb.webp`];
}

function getGalleryImageUrl(item, width, quality) {
  if (!isImageType(item.type) || !item.filePath) {
    return item.originalUrl;
  }

  try {
    const { data } = supabase.storage
      .from(SUPABASE_IMAGE_BUCKET)
      .getPublicUrl(item.filePath, {
        transform: {
          width,
          quality,
          resize: "contain",
        },
      });

    return data.publicUrl || item.originalUrl;
  } catch (error) {
    console.error(error);
    return item.originalUrl;
  }
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

async function createWebpVariant(image, fileName, maxDimension, quality) {
  const { width, height } = getScaledDimensions(image, maxDimension);
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );

  if (!blob) return null;

  return new File([blob], fileName, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

async function prepareFilesForUpload(file) {
  if (!shouldOptimizeImage(file)) {
    return {
      original: file,
      feed: null,
      thumb: null,
    };
  }

  try {
    const image = await loadImageFromFile(file);
    const optimizedOriginal = await createWebpVariant(
      image,
      "original.webp",
      IMAGE_UPLOAD_MAX_DIMENSION,
      IMAGE_UPLOAD_QUALITY,
    );
    const feed = await createWebpVariant(
      image,
      "feed.webp",
      IMAGE_FEED_MAX_DIMENSION,
      IMAGE_FEED_QUALITY,
    );
    const thumb = await createWebpVariant(
      image,
      "thumb.webp",
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

function LazyVideo({
  src,
  className,
  autoPlay = false,
  controls = false,
  muted = false,
  playsInline = true,
}) {
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(autoPlay);

  useEffect(() => {
    if (shouldLoad || !containerRef.current) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "700px 0px" },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={containerRef} className={`media-placeholder ${className}`}>
      {shouldLoad && (
        <video
          src={src}
          className={className}
          preload={autoPlay ? "auto" : "metadata"}
          autoPlay={autoPlay}
          controls={controls}
          muted={muted}
          playsInline={playsInline}
        />
      )}
    </div>
  );
}

async function fetchGalleryPage(from = 0, to = POST_PAGE_SIZE - 1) {
  let response = await supabase
    .from("wedding_gallery")
    .select(GALLERY_COLUMNS)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (response.error?.message?.includes("caption")) {
    response = await supabase
      .from("wedding_gallery")
      .select(GALLERY_COLUMNS_WITHOUT_CAPTION)
      .order("created_at", { ascending: false })
      .range(from, to);
  }

  return response;
}

export default function GalleryAppPage() {
  const [searchParams] = useSearchParams();
  const invitationPath = getGuestInvitationPath(searchParams);
  const fileInputRef = useRef(null);
  const storyCameraInputRef = useRef(null);
  const postLoadTriggerRef = useRef(null);
  const previewUrlsRef = useRef([]);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [status, setStatus] = useState(null);
  const [uploadedItems, setUploadedItems] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [renderedPostCount, setRenderedPostCount] = useState(POST_PAGE_SIZE);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [visitorId] = useState(getOrCreateVisitorId);
  const [likesByItem, setLikesByItem] = useState({});
  const [likedByVisitor, setLikedByVisitor] = useState({});
  const [pendingLikes, setPendingLikes] = useState({});
  const [likeErrors, setLikeErrors] = useState({});
  const [shareErrors, setShareErrors] = useState({});
  const [commentsByItem, setCommentsByItem] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentNameDrafts, setCommentNameDrafts] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [commentSheetItem, setCommentSheetItem] = useState(null);
  const [deleteErrors, setDeleteErrors] = useState({});
  const [storyViewerIndex, setStoryViewerIndex] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [sortOrder, setSortOrder] = useState("recent");
  const [isDragging, setIsDragging] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  useEffect(() => {
    const convite = searchParams.get("convite");
    if (convite) saveGuestInvitationSlug(convite);
  }, [searchParams]);

  useEffect(() => {
    async function loadGallery() {
      setIsGalleryLoading(true);
      const { data, error } = await fetchGalleryPage();

      if (error) {
        console.error(error);
        setIsGalleryLoading(false);
        return;
      }

      const galleryItems = data ?? [];
      setUploadedItems(galleryItems.map(mapGalleryItem));
      setHasMorePosts(galleryItems.length === POST_PAGE_SIZE);
      setIsGalleryLoading(false);
    }

    loadGallery();
  }, []);

  useEffect(() => {
    async function loadInteractions() {
      if (!visitorId || !uploadedItems.length) {
        setLikesByItem({});
        setLikedByVisitor({});
        setCommentsByItem({});
        return;
      }

      const galleryIds = uploadedItems.map((item) => item.galleryId);

      const [
        { data: likes, error: likesError },
        { data: comments, error: commentsError },
      ] = await Promise.all([
        supabase
          .from("wedding_gallery_likes")
          .select("gallery_item_id, anonymous_id")
          .in("gallery_item_id", galleryIds),
        supabase
          .from("wedding_gallery_comments")
          .select(
            "id, gallery_item_id, commenter_name, comment_text, anonymous_id, created_at",
          )
          .in("gallery_item_id", galleryIds)
          .order("created_at", { ascending: true }),
      ]);

      if (likesError) {
        console.error(likesError);
      } else {
        const likeCounts = {};
        const visitorLikes = {};

        likes.forEach((like) => {
          likeCounts[like.gallery_item_id] =
            (likeCounts[like.gallery_item_id] || 0) + 1;

          if (like.anonymous_id === visitorId) {
            visitorLikes[like.gallery_item_id] = true;
          }
        });

        setLikesByItem(likeCounts);
        setLikedByVisitor(visitorLikes);
      }

      if (commentsError) {
        console.error(commentsError);
      } else {
        const groupedComments = {};

        comments.forEach((comment) => {
          groupedComments[comment.gallery_item_id] = [
            ...(groupedComments[comment.gallery_item_id] || []),
            comment,
          ];
        });

        setCommentsByItem(groupedComments);
      }
    }

    loadInteractions();
  }, [uploadedItems, visitorId]);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function updateSelectedFiles(selectedFiles) {
    setFiles(selectedFiles);
    setStatus(null);

    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    const previews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
    if (selectedFiles.length) setIsComposerOpen(true);
  }

  function handleFiles(event) {
    const selectedFiles = Array.from(event.target.files || []);

    updateSelectedFiles(selectedFiles);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files || []).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/"),
    );

    if (droppedFiles.length) updateSelectedFiles(droppedFiles);
  }

  function removePreview(indexToRemove) {
    URL.revokeObjectURL(previewUrls[indexToRemove]);
    setFiles((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );
    setPreviewUrls((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );
  }

  async function uploadPhotos(event) {
    event.preventDefault();

    if (!name.trim()) {
      setStatus("missing-name");
      return;
    }

    if (!files.length) {
      setStatus("missing-files");
      return;
    }

    setIsUploading(true);
    setUploadProgress("A preparar as imagens...");
    setStatus(null);

    try {
      const uploaded = [];

      for (const [index, selectedFile] of files.entries()) {
        setUploadProgress(
          `A preparar ${index + 1} de ${files.length}...`,
        );

        const preparedFiles = await prepareFilesForUpload(selectedFile);
        const originalFile = preparedFiles.original;
        const originalExt = originalFile.name.split(".").pop() || "jpg";

        const safeName = name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "convidado";

        const mediaId = `${Date.now()}-${crypto.randomUUID()}`;
        const filePath = isImageType(originalFile.type)
          ? `${safeName}/${mediaId}/original.${originalExt}`
          : `${safeName}/${mediaId}.${originalExt}`;
        const uploadQueue = [
          {
            path: filePath,
            file: originalFile,
          },
        ];

        if (preparedFiles.feed && preparedFiles.thumb) {
          uploadQueue.push(
            {
              path: `${safeName}/${mediaId}/feed.webp`,
              file: preparedFiles.feed,
            },
            {
              path: `${safeName}/${mediaId}/thumb.webp`,
              file: preparedFiles.thumb,
            },
          );
        }

        setUploadProgress(
          `A publicar ${index + 1} de ${files.length}...`,
        );

        for (const uploadItem of uploadQueue) {
          const { error } = await supabase.storage
            .from(SUPABASE_IMAGE_BUCKET)
            .upload(uploadItem.path, uploadItem.file, {
              cacheControl: "31536000",
              upsert: false,
              contentType: uploadItem.file.type,
            });

          if (error) throw error;
        }

        const { data } = supabase.storage
          .from(SUPABASE_IMAGE_BUCKET)
          .getPublicUrl(filePath);

        const publicUrl = data.publicUrl;

        let insertResponse = await supabase
          .from("wedding_gallery")
          .insert({
            uploaded_by: name,
            caption: caption.trim() || null,
            file_path: filePath,
            file_url: publicUrl,
            file_type: originalFile.type,
            anonymous_id: visitorId,
          });

        if (insertResponse.error?.message?.includes("caption")) {
          insertResponse = await supabase.from("wedding_gallery").insert({
            uploaded_by: name,
            file_path: filePath,
            file_url: publicUrl,
            file_type: originalFile.type,
            anonymous_id: visitorId,
          });
        }

        if (insertResponse.error) throw insertResponse.error;

        setUploadProgress(
          index + 1 === files.length
            ? "A atualizar a galeria..."
            : `A preparar ${index + 2} de ${files.length}...`,
        );

        uploaded.push(mapGalleryItem({
          file_path: filePath,
          file_url: publicUrl,
          file_type: originalFile.type,
          uploaded_by: name,
          caption: caption.trim() || null,
          created_at: new Date().toISOString(),
          anonymous_id: visitorId,
        }));
      }

      setUploadedItems((current) => [...uploaded, ...current]);

      setFiles([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setName("");
      setCaption("");
      setStatus("success");
      setIsComposerOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (storyCameraInputRef.current) storyCameraInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  }

  const loadMorePosts = useCallback(async function loadMorePosts() {
    if (isLoadingMorePosts || !hasMorePosts) return;

    setIsLoadingMorePosts(true);

    const from = uploadedItems.length;
    const to = from + POST_PAGE_SIZE - 1;
    const { data, error } = await fetchGalleryPage(from, to);

    if (error) {
      console.error(error);
      setIsLoadingMorePosts(false);
      return;
    }

    const galleryItems = data ?? [];
    setUploadedItems((current) => [
      ...current,
      ...galleryItems.map(mapGalleryItem),
    ]);
    setHasMorePosts(galleryItems.length === POST_PAGE_SIZE);
    setIsLoadingMorePosts(false);
  }, [hasMorePosts, isLoadingMorePosts, uploadedItems.length]);

  const sortedItems = useMemo(() => {
    return [...uploadedItems].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
    });
  }, [sortOrder, uploadedItems]);
  const visiblePosts = useMemo(
    () => sortedItems.slice(0, renderedPostCount),
    [renderedPostCount, sortedItems],
  );
  const hasHiddenLoadedPosts = renderedPostCount < sortedItems.length;

  useEffect(() => {
    const trigger = postLoadTriggerRef.current;
    if (!trigger || isGalleryLoading) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        if (hasHiddenLoadedPosts) {
          setRenderedPostCount((current) =>
            Math.min(current + POST_RENDER_BATCH, sortedItems.length),
          );
          return;
        }

        if (hasMorePosts && !isLoadingMorePosts) {
          loadMorePosts();
        }
      },
      { rootMargin: "1000px 0px" },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [
    hasHiddenLoadedPosts,
    hasMorePosts,
    isGalleryLoading,
    isLoadingMorePosts,
    sortedItems.length,
    loadMorePosts,
    uploadedItems.length,
  ]);

  useEffect(() => {
    const imagesToPrefetch = visiblePosts
      .filter((item) => isImageType(item.type))
      .slice(1, 4);
    const preloadedImages = imagesToPrefetch.map((item) => {
      const image = new Image();
      image.decoding = "async";
      image.src = item.feedUrl;
      return image;
    });

    return () => {
      preloadedImages.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [visiblePosts]);

  const storyItems = useMemo(() => {
    return [...uploadedItems]
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 12);
  }, [uploadedItems]);

  const activeStory =
    storyViewerIndex === null ? null : storyItems[storyViewerIndex];

  useEffect(() => {
    if (storyViewerIndex === null || !storyItems.length) return undefined;

    if (!storyItems[storyViewerIndex]) return undefined;

    const activeItem = storyItems[storyViewerIndex];
    const duration = activeItem.type?.startsWith("video/")
      ? STORY_VIDEO_DURATION
      : STORY_PHOTO_DURATION;
    const tick = 50;
    const increment = 100 / (duration / tick);

    const timer = window.setInterval(() => {
      setStoryProgress((currentProgress) => {
        if (currentProgress + increment >= 100) {
          setStoryViewerIndex((currentIndex) => {
            if (currentIndex === null) return null;
            const nextIndex = currentIndex + 1;
            return nextIndex < storyItems.length ? nextIndex : null;
          });
          return 0;
        }

        return currentProgress + increment;
      });
    }, tick);

    return () => window.clearInterval(timer);
  }, [storyViewerIndex, storyItems]);

  function openStory(index) {
    if (!storyItems[index]) return;

    setSelectedItem(null);
    setStoryViewerIndex(index);
    setStoryProgress(0);
  }

  function closeStory() {
    setStoryViewerIndex(null);
    setStoryProgress(0);
  }

  function showNextStory() {
    setStoryProgress(0);
    setStoryViewerIndex((currentIndex) => {
      if (currentIndex === null) return null;
      const nextIndex = currentIndex + 1;
      return nextIndex < storyItems.length ? nextIndex : null;
    });
  }

  function showPreviousStory() {
    setStoryProgress(0);
    setStoryViewerIndex((currentIndex) => {
      if (currentIndex === null) return null;
      return currentIndex > 0 ? currentIndex - 1 : 0;
    });
  }

  function openComments(item) {
    setCommentSheetItem(item);
    setCommentNameDrafts((current) => ({
      ...current,
      [item.galleryId]: current[item.galleryId] ?? name,
    }));
  }

  function formatPostDate(date) {
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  async function toggleLike(item) {
    if (!visitorId) return;

    const itemId = item.galleryId;
    if (pendingLikes[itemId]) return;

    const isLiked = Boolean(likedByVisitor[itemId]);

    setPendingLikes((current) => ({ ...current, [itemId]: true }));
    setLikeErrors((current) => ({ ...current, [itemId]: "" }));

    const response = isLiked
      ? await supabase
          .from("wedding_gallery_likes")
          .delete()
          .eq("gallery_item_id", itemId)
          .eq("anonymous_id", visitorId)
      : await supabase.from("wedding_gallery_likes").insert({
          gallery_item_id: itemId,
          anonymous_id: visitorId,
        });

    if (response.error) {
      console.error(response.error);
      setLikeErrors((current) => ({
        ...current,
        [itemId]: "Não foi possível guardar o gosto.",
      }));
      setPendingLikes((current) => ({ ...current, [itemId]: false }));
      return;
    }

    setLikedByVisitor((current) => ({
      ...current,
      [itemId]: !isLiked,
    }));
    setLikesByItem((current) => ({
      ...current,
      [itemId]: Math.max((current[itemId] || 0) + (isLiked ? -1 : 1), 0),
    }));
    setPendingLikes((current) => ({ ...current, [itemId]: false }));
  }

  async function submitComment(event, item) {
    event.preventDefault();

    const itemId = item.galleryId;
    const commentText = (commentDrafts[itemId] || "").trim();
    const commenterName = (commentNameDrafts[itemId] || "").trim();

    setCommentErrors((current) => ({ ...current, [itemId]: "" }));

    if (!commenterName) {
      setCommentErrors((current) => ({
        ...current,
        [itemId]: "Indica o teu nome para comentar.",
      }));
      return;
    }

    if (!commentText) return;

    const { data, error } = await supabase
      .from("wedding_gallery_comments")
      .insert({
        gallery_item_id: itemId,
        commenter_name: commenterName,
        comment_text: commentText,
        anonymous_id: visitorId || null,
      })
      .select(
        "id, gallery_item_id, commenter_name, comment_text, anonymous_id, created_at",
      )
      .single();

    if (error) {
      console.error(error);
      setCommentErrors((current) => ({
        ...current,
        [itemId]: "Não foi possível comentar. Tenta novamente.",
      }));
      return;
    }

    setCommentsByItem((current) => ({
      ...current,
      [itemId]: [...(current[itemId] || []), data],
    }));
    setCommentDrafts((current) => ({ ...current, [itemId]: "" }));
  }

  async function deleteComment(comment) {
    if (comment.anonymous_id !== visitorId) return;

    const confirmed = window.confirm("Queres apagar este comentário?");
    if (!confirmed) return;

    setDeleteErrors((current) => ({ ...current, [comment.id]: "" }));

    const { data, error } = await supabase
      .from("wedding_gallery_comments")
      .delete()
      .eq("id", comment.id)
      .eq("anonymous_id", visitorId)
      .select("id, gallery_item_id")
      .maybeSingle();

    if (error) {
      console.error(error);
      setDeleteErrors((current) => ({
        ...current,
        [comment.id]: "Não foi possível apagar o comentário.",
      }));
      return;
    }

    if (!data) {
      setDeleteErrors((current) => ({
        ...current,
        [comment.id]:
          "Não foi possível apagar na base de dados. Verifica o SQL de permissões.",
      }));
      return;
    }

    setCommentsByItem((current) => ({
      ...current,
      [comment.gallery_item_id]: (current[comment.gallery_item_id] || []).filter(
        (itemComment) => itemComment.id !== comment.id,
      ),
    }));
  }

  async function deletePost(item) {
    if (item.anonymousId !== visitorId) return;

    const confirmed = window.confirm("Queres apagar este post?");
    if (!confirmed) return;

    setDeleteErrors((current) => ({ ...current, [item.galleryId]: "" }));

    const { error: commentsError } = await supabase
      .from("wedding_gallery_comments")
      .delete()
      .eq("gallery_item_id", item.galleryId);

    if (commentsError) {
      console.error(commentsError);
      setDeleteErrors((current) => ({
        ...current,
        [item.galleryId]: "Não foi possível apagar os comentários do post.",
      }));
      return;
    }

    const { error: likesError } = await supabase
      .from("wedding_gallery_likes")
      .delete()
      .eq("gallery_item_id", item.galleryId);

    if (likesError) {
      console.error(likesError);
      setDeleteErrors((current) => ({
        ...current,
        [item.galleryId]: "Não foi possível apagar os gostos do post.",
      }));
      return;
    }

    const { error: postError } = await supabase
      .from("wedding_gallery")
      .delete()
      .eq("file_path", item.filePath)
      .eq("anonymous_id", visitorId);

    if (postError) {
      console.error(postError);
      setDeleteErrors((current) => ({
        ...current,
        [item.galleryId]: "Não foi possível apagar o post.",
      }));
      return;
    }

    if (item.filePath) {
      const { error: storageError } = await supabase.storage
        .from(SUPABASE_IMAGE_BUCKET)
        .remove(getStoredVariantPaths(item.filePath, item.type));

      if (storageError) console.error(storageError);
    }

    setUploadedItems((current) =>
      current.filter((galleryItem) => galleryItem.galleryId !== item.galleryId),
    );
    setCommentsByItem((current) => {
      const nextComments = { ...current };
      delete nextComments[item.galleryId];
      return nextComments;
    });
    setLikesByItem((current) => {
      const nextLikes = { ...current };
      delete nextLikes[item.galleryId];
      return nextLikes;
    });
    setLikedByVisitor((current) => {
      const nextLikes = { ...current };
      delete nextLikes[item.galleryId];
      return nextLikes;
    });
    setSelectedItem((current) =>
      current?.galleryId === item.galleryId ? null : current,
    );
    setCommentSheetItem((current) =>
      current?.galleryId === item.galleryId ? null : current,
    );
    closeStory();
  }

  function downloadImage(url, index) {
    const link = document.createElement("a");
    link.href = url;
    link.download = `memoria-francisca-daniel-${index + 1}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function shareMedia(item, index) {
    const itemId = item.galleryId;
    const title = "Memória do casamento da Francisca e do Daniel";
    const text = item.caption || `${item.uploadedBy || "Um convidado"} partilhou uma memória.`;

    setShareErrors((current) => ({ ...current, [itemId]: "" }));

    try {
      if (navigator.share) {
        if (!item.type?.startsWith("video/")) {
          try {
            const response = await fetch(item.url);
            const blob = await response.blob();
            const extension =
              item.filePath?.split(".").pop() ||
              item.url.split(".").pop()?.split("?")[0] ||
              "jpg";
            const file = new File(
              [blob],
              `memoria-francisca-daniel-${index + 1}.${extension}`,
              { type: blob.type || item.type || "image/jpeg" },
            );

            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({ title, text, files: [file] });
              return;
            }
          } catch (error) {
            console.error(error);
          }
        }

        await navigator.share({ title, text, url: item.url });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(item.url);
        setShareErrors((current) => ({
          ...current,
          [itemId]: "Link copiado para partilhar.",
        }));
        return;
      }

      window.open(item.url, "_blank", "noreferrer");
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error(error);
      setShareErrors((current) => ({
        ...current,
        [itemId]: "Não foi possível abrir a partilha.",
      }));
    }
  }

  return (
    <main className="page-bg min-h-screen overflow-x-hidden text-[#64715f]">
      <style>{styles}</style>

      <header className="sticky top-0 z-40 border-b border-[#d8d0bd]/60 bg-[#fbfaf5] px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xl font-extrabold leading-none tracking-normal text-[#b7c4b0]">
              F · D
            </p>
            <p className="mt-1 truncate text-[11px] font-semibold text-[#8f9f8a]">
              Galeria dos convidados
            </p>
          </div>

	          <div className="flex shrink-0 items-center gap-2">
	            <button
	              type="button"
	              onClick={() => {
	                setStatus(null);
	                setIsComposerOpen(true);
	              }}
	              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#cdb892]/80 bg-white/55 px-3 text-xs font-extrabold text-[#b7975b]"
	              aria-label="Criar novo post"
	            >
	              <span className="text-lg leading-none">+</span>
	              <span>Novo post</span>
	            </button>
	            <Link
	              to={invitationPath}
	              className="rounded-full border border-[#cdb892]/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#b7975b]"
            >
              Convite
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-0 pb-14 pt-0 sm:px-5 md:pt-0">
        <div className="min-w-0 space-y-4">
          <section className="story-strip app-card border-y border-[#ddd4c0]/70 bg-white py-4 sm:mx-0 sm:rounded-[1.2rem] sm:border">
            <div className="no-scrollbar flex max-w-full gap-4 overflow-x-auto px-4">
              <button
                type="button"
                onClick={() => storyCameraInputRef.current?.click()}
                className="w-[74px] shrink-0 text-center"
                aria-label="Adicionar story"
              >
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-dashed border-[#cdb892] bg-[#f8f5ee] text-2xl text-[#cdb892]">
                  +
                </span>
                <span className="mt-2 block truncate text-xs font-semibold text-[#7f8f78]">
                  Story
                </span>
              </button>

              {isGalleryLoading ? (
                [0, 1, 2, 3].map((item) => (
                  <div key={`loading-story-${item}`} className="w-[74px] shrink-0">
                    <div className="media-placeholder mx-auto h-16 w-16 rounded-full" />
                    <div className="media-placeholder mx-auto mt-2 h-3 w-12 rounded-full" />
                  </div>
                ))
              ) : storyItems.length ? storyItems.map((item, index) => (
                <button
                  type="button"
                  key={`${item.url}-story-${index}`}
                  onClick={() => openStory(index)}
                  className="w-[74px] shrink-0 text-center"
                >
                  <span className="mx-auto block h-16 w-16 rounded-full bg-gradient-to-tr from-[#b7c4b0] via-[#f4e3bd] to-[#cdb892] p-[2px]">
                    <span className="block h-full w-full overflow-hidden rounded-full border-2 border-[#fbfaf5] bg-[#f8f5ee]">
	                      {item.type?.startsWith("video/") ? (
	                        <video
	                          src={item.url}
	                          className="h-full w-full object-cover"
	                          preload="metadata"
	                          muted
	                          playsInline
	                        />
	                      ) : (
	                        <img
	                          src={item.thumbUrl}
	                          alt=""
	                          className="h-full w-full object-cover"
	                          loading={index < 4 ? "eager" : "lazy"}
	                          decoding="async"
	                          fetchPriority={index < 2 ? "high" : "low"}
	                          onError={(event) => {
	                            if (event.currentTarget.src !== item.url) {
	                              event.currentTarget.src = item.url;
	                            }
	                          }}
	                        />
	                      )}
                    </span>
                  </span>
                  <span className="mt-2 block truncate text-xs font-semibold text-[#7f8f78]">
                    {item.uploadedBy || "Convidado"}
                  </span>
                </button>
              )) : (
                <div className="flex min-h-20 min-w-56 flex-1 items-center justify-center text-center text-sm font-semibold text-[#8f9f8a]">
                  As stories aparecem aqui quando houver posts.
                </div>
              )}
            </div>
          </section>

          <input
            ref={storyCameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFiles}
            className="hidden"
          />

	          {isComposerOpen && (
	            <div
	              className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-0 backdrop-blur-sm sm:items-center sm:px-4"
	              onClick={() => setIsComposerOpen(false)}
	            >
	          <form
	            onSubmit={uploadPhotos}
	            className="app-card flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.6rem] border-y border-[#ddd4c0]/70 bg-white sm:rounded-[1.2rem] sm:border"
	            onClick={(event) => event.stopPropagation()}
	          >
	            <div className="flex items-center justify-between gap-3 border-b border-[#ddd4c0]/70 px-4 py-3">
	              <div className="flex min-w-0 items-center gap-3">
	                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#b7c4b0] to-[#cdb892] text-sm font-extrabold text-white">
                  F·D
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-[#64715f]">Novo post</p>
                  <p className="text-xs font-semibold text-[#9aa792]">
                    {files.length
                      ? `${files.length} ${files.length === 1 ? "ficheiro" : "ficheiros"}`
                      : "Foto ou vídeo"}
                  </p>
                </div>
              </div>

	              <div className="flex shrink-0 items-center gap-3">
	                <button
	                  type="button"
	                  onClick={() => setIsComposerOpen(false)}
	                  className="grid h-8 w-8 place-items-center rounded-full bg-[#f8f5ee] text-xl leading-none text-[#64715f]"
	                  aria-label="Fechar novo post"
	                >
	                  ×
	                </button>
	                <button
	                  type="submit"
	                  disabled={isUploading}
	                  className="text-sm font-extrabold text-[#b7975b] disabled:opacity-50"
	                >
	                  {isUploading ? "A publicar..." : "Publicar"}
	                </button>
	              </div>
	            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />

	            <div className="min-h-0 space-y-4 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {previewUrls.length ? (
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {previewUrls.map((url, index) => (
                    <div
                      key={url}
                      className="relative h-44 w-32 shrink-0 overflow-hidden rounded-[0.9rem] border border-[#d8d0bd]/70 bg-[#f8f5ee]"
                    >
                      {files[index]?.type?.startsWith("video/") ? (
                        <video
                          src={url}
                          className="h-full w-full object-cover"
                          preload="metadata"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                          decoding="async"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removePreview(index)}
                        className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-[#fbfaf5]/95 text-sm font-bold text-[#64715f] shadow-sm"
                        aria-label="Remover ficheiro"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="grid h-44 w-24 shrink-0 place-items-center rounded-[0.9rem] border border-dashed border-[#cdb892]/80 bg-[#f8f5ee]/80 text-2xl font-semibold text-[#b7975b]"
                    aria-label="Adicionar mais ficheiros"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex aspect-[4/3] w-full flex-col items-center justify-center rounded-[1rem] border border-dashed text-center transition ${
                    isDragging
                      ? "border-[#cdb892] bg-[#f8f5ee] ring-4 ring-[#cdb892]/15"
                      : "border-[#d1c5ac] bg-[#fbfaf5]/70"
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-[#cdb892]/15 text-3xl text-[#b7975b]">
                    +
                  </span>
                  <span className="mt-3 text-sm font-extrabold text-[#b7975b]">
                    Adicionar fotos ou vídeos
                  </span>
                </button>
              )}

              <div className="flex items-start gap-3 border-t border-[#eee6d6] pt-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#b7c4b0] text-xs font-extrabold text-white">
                  {(name.trim() || "C").slice(0, 1).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="O vosso nome"
                    className="w-full border-0 bg-transparent py-1 text-base font-extrabold text-[#64715f] outline-none placeholder:font-semibold placeholder:text-[#9aa792] sm:text-sm"
                  />

                  <textarea
                    value={caption}
                    onChange={(event) =>
                      setCaption(event.target.value.slice(0, 120))
                    }
                    rows={2}
                    placeholder="Escrever legenda..."
                    className="mt-1 w-full resize-none border-0 bg-transparent py-1 text-base leading-6 text-[#64715f] outline-none placeholder:text-[#9aa792] sm:text-sm"
                  />

                  <p className="text-right text-[11px] font-semibold text-[#9aa792]">
                    {caption.length}/120
                  </p>
                </div>
              </div>

              {isUploading && uploadProgress && (
                <div className="rounded-[0.9rem] border border-[#d8d0bd]/70 bg-[#f8f5ee] px-4 py-3 text-center text-sm font-semibold text-[#8f9f8a]">
                  {uploadProgress}
                </div>
              )}

              {status && (
                <p className="text-center text-sm font-semibold text-[#8f9f8a]">
                  {status === "success" &&
                    "Obrigada! As fotografias foram enviadas com sucesso."}
                  {status === "missing-name" &&
                    "Indica o teu nome antes de enviar."}
                  {status === "missing-files" &&
                    "Escolhe pelo menos uma fotografia ou vídeo."}
                  {status === "error" &&
                    "Não foi possível enviar. Tenta novamente."}
                </p>
              )}
	            </div>
	          </form>
	            </div>
	          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between px-4 sm:px-0">
              <h1 className="text-xl font-extrabold text-[#b7c4b0]">
                Posts
              </h1>

              <div className="flex rounded-full border border-[#d8d0bd]/80 bg-white/60 p-1">
	                <button
	                  type="button"
	                  onClick={() => {
	                    setSortOrder("recent");
	                    setRenderedPostCount(POST_PAGE_SIZE);
	                  }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    sortOrder === "recent"
                      ? "bg-[#cdb892] text-white"
                      : "text-[#8f9f8a]"
                  }`}
                >
                  Recentes
                </button>
	                <button
	                  type="button"
	                  onClick={() => {
	                    setSortOrder("oldest");
	                    setRenderedPostCount(POST_PAGE_SIZE);
	                  }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    sortOrder === "oldest"
                      ? "bg-[#cdb892] text-white"
                      : "text-[#8f9f8a]"
                  }`}
                >
                  Antigos
                </button>
              </div>
            </div>

            {isGalleryLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <article
                    key={`loading-post-${item}`}
                    className="app-card overflow-hidden border-y border-[#ddd4c0]/70 bg-white/78 sm:rounded-[1.2rem] sm:border"
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="media-placeholder h-10 w-10 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="media-placeholder h-3 w-32 rounded-full" />
                        <div className="media-placeholder h-2.5 w-20 rounded-full" />
                      </div>
                    </div>
                    <div className="media-placeholder aspect-[4/5] w-full" />
                    <div className="space-y-3 px-4 py-4">
                      <div className="media-placeholder h-3 w-24 rounded-full" />
                      <div className="media-placeholder h-3 w-3/4 rounded-full" />
                    </div>
                  </article>
                ))}
              </div>
            ) : uploadedItems.length ? (
              <div className="space-y-4">
	                {visiblePosts.map((item, index) => (
	                  <article
	                    key={`${item.url}-${index}`}
	                    className={`app-card overflow-hidden border-y border-[#ddd4c0]/70 bg-white/78 sm:rounded-[1.2rem] sm:border ${
	                      index > 1 ? "feed-post" : ""
	                    }`}
	                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#b7c4b0] to-[#cdb892] text-sm font-extrabold text-white">
                          {(item.uploadedBy || "C").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[#64715f]">
                            {item.uploadedBy || "Convidado"}
                          </p>
                          <p className="text-xs text-[#9aa792]">
                            {formatPostDate(item.createdAt)}
                          </p>
                        </div>
                      </div>

                      {item.anonymousId === visitorId && (
                        <button
                          type="button"
                          onClick={() => deletePost(item)}
                          className="shrink-0 rounded-full px-3 py-2 text-xs font-extrabold text-[#c76d70]"
                        >
                          Apagar
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="media-placeholder flex aspect-[4/5] w-full cursor-zoom-in items-center justify-center bg-[#f8f5ee]"
                    >
	                      {item.type?.startsWith("video/") ? (
	                        <LazyVideo
	                          src={item.url}
	                          className="h-full w-full object-contain"
	                          muted
	                          playsInline
	                        />
	                      ) : (
	                        <img
	                          src={item.feedUrl}
	                          alt=""
	                          className="h-full w-full object-contain"
	                          loading={index === 0 ? "eager" : "lazy"}
	                          decoding="async"
	                          fetchPriority={index === 0 ? "high" : "low"}
	                          onError={(event) => {
	                            if (event.currentTarget.src !== item.url) {
	                              event.currentTarget.src = item.url;
	                            }
	                          }}
	                        />
	                      )}
                    </button>

                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-2xl text-[#64715f]">
                          <button
                            type="button"
                            onClick={() => toggleLike(item)}
                            disabled={pendingLikes[item.galleryId]}
                            className={`grid h-8 w-8 place-items-center ${
                              likedByVisitor[item.galleryId] ? "text-[#c76d70]" : ""
                            }`}
                            aria-label="Gostar"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              className="h-7 w-7"
                              fill={
                                likedByVisitor[item.galleryId]
                                  ? "currentColor"
                                  : "none"
                              }
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.9"
                            >
                              <path d="M20.8 5.8a5.4 5.4 0 0 0-7.7 0L12 6.9l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 22l8.8-8.5a5.4 5.4 0 0 0 0-7.7Z" />
                            </svg>
                          </button>
	                          <button
	                            type="button"
	                            onClick={() => openComments(item)}
                            aria-label="Comentar"
                            className="grid h-8 w-8 place-items-center"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              className="h-7 w-7"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.9"
                            >
	                              <path d="M20.2 11.7a7.8 7.8 0 0 1-8.1 7.6 8.8 8.8 0 0 1-3.1-.6l-4.6 1.1 1.2-4.1a7.3 7.3 0 0 1-1.1-4 7.8 7.8 0 0 1 8.1-7.6 7.8 7.8 0 0 1 7.6 7.6Z" />
	                            </svg>
	                          </button>
	                          <button
	                            type="button"
	                            onClick={() => shareMedia(item, index)}
	                            aria-label="Partilhar"
	                            className="grid h-8 w-8 place-items-center"
	                          >
	                            <svg
	                              viewBox="0 0 24 24"
	                              aria-hidden="true"
	                              className="h-7 w-7"
	                              fill="none"
	                              stroke="currentColor"
	                              strokeLinecap="round"
	                              strokeLinejoin="round"
	                              strokeWidth="1.9"
	                            >
	                              <path d="m21 3-7.2 18-4.1-8.7L1 8.2 21 3Z" />
	                              <path d="M21 3 9.7 12.3" />
	                            </svg>
	                          </button>
	                        </div>
	
	                        {!item.type?.startsWith("video/") && (
	                          <button
	                            type="button"
	                            onClick={() => downloadImage(item.url, index)}
	                            className="grid h-9 w-9 place-items-center rounded-full border border-[#cdb892]/60 text-base text-[#b7975b]"
	                            aria-label="Download"
	                          >
	                            ↓
	                          </button>
	                        )}
	                      </div>

                      <p className="mt-3 text-sm font-extrabold text-[#64715f]">
                        {likesByItem[item.galleryId] || 0}{" "}
                        {(likesByItem[item.galleryId] || 0) === 1
                          ? "gosto"
                          : "gostos"}
                      </p>

	                      {likeErrors[item.galleryId] && (
	                        <p className="mt-2 text-xs font-semibold text-[#c76d70]">
	                          {likeErrors[item.galleryId]}
	                        </p>
	                      )}

	                      {shareErrors[item.galleryId] && (
	                        <p className="mt-2 text-xs font-semibold text-[#8f9f8a]">
	                          {shareErrors[item.galleryId]}
	                        </p>
	                      )}

                      {deleteErrors[item.galleryId] && (
                        <p className="mt-2 text-xs font-semibold text-[#c76d70]">
                          {deleteErrors[item.galleryId]}
                        </p>
                      )}

                      <p className="mt-3 text-sm leading-6 text-[#64715f]">
                        <span className="font-extrabold">
                          {item.uploadedBy || "Convidado"}
                        </span>{" "}
                        {item.caption || "partilhou uma memória do casamento."}
                      </p>

                      {!!commentsByItem[item.galleryId]?.length && (
                        <div className="mt-3 space-y-2">
                          <button
                            type="button"
                            onClick={() => openComments(item)}
                            className="text-left text-sm font-semibold text-[#8f9f8a]"
                          >
                            Ver todos os {commentsByItem[item.galleryId].length}{" "}
                            {commentsByItem[item.galleryId].length === 1
                              ? "comentário"
                              : "comentários"}
                          </button>

                          {commentsByItem[item.galleryId]
                            .slice(-2)
                            .map((comment) => (
                              <div
                                key={comment.id}
                                className="flex items-start justify-between gap-3 text-sm leading-6 text-[#64715f]"
                              >
                                <p className="min-w-0">
                                  <span className="font-extrabold">
                                    {comment.commenter_name || "Convidado"}
                                  </span>{" "}
                                  {comment.comment_text}
                                </p>

                                {comment.anonymous_id === visitorId && (
                                  <button
                                    type="button"
                                    onClick={() => deleteComment(comment)}
                                    className="shrink-0 text-xs font-extrabold text-[#c76d70]"
                                  >
                                    Apagar
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {commentErrors[item.galleryId] && (
                        <p className="mt-2 text-xs font-semibold text-[#c76d70]">
                          {commentErrors[item.galleryId]}
                        </p>
                      )}
	                    </div>
	                  </article>
	                ))}
	                {(hasMorePosts || hasHiddenLoadedPosts) && (
	                  <div className="px-4 text-center sm:px-0">
	                    <div ref={postLoadTriggerRef} className="h-1 w-full" />
	                    <button
	                      type="button"
	                      onClick={() => {
	                        if (hasHiddenLoadedPosts) {
	                          setRenderedPostCount((current) =>
	                            Math.min(
	                              current + POST_RENDER_BATCH,
	                              sortedItems.length,
	                            ),
	                          );
	                          return;
	                        }

	                        loadMorePosts();
	                      }}
	                      disabled={isLoadingMorePosts}
	                      className="rounded-full border border-[#cdb892]/70 bg-white/70 px-5 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-[#b7975b] disabled:opacity-55"
	                    >
	                      {isLoadingMorePosts
	                        ? "A carregar..."
	                        : "Carregar mais memórias"}
	                    </button>
	                  </div>
	                )}
	              </div>
            ) : (
              <div className="app-card border-y border-dashed border-[#cdb892]/60 bg-white/60 px-6 py-16 text-center sm:rounded-[1.2rem] sm:border">
                <p className="text-4xl text-[#cdb892]">+</p>
                <h2 className="mt-5 text-2xl font-extrabold text-[#b7c4b0]">
                  Ainda não há posts
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#8f9f8a]">
                  A primeira pessoa a publicar inaugura a galeria dos
                  convidados.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <footer className="px-4 pb-12 pt-2 text-center text-sm text-[#8f9f8a]">
        <p>Francisca & Daniel · 26 de setembro de 2026</p>
        <p className="mt-2">casamento.franciscadaniel@gmail.com</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <span>Daniel: 918 947 632</span>
          <span>Francisca: 965 518 462</span>
        </div>
      </footer>

      {commentSheetItem && (
        <div
          className="fixed inset-x-0 bottom-0 top-0 z-50 flex items-end justify-center bg-black/45 px-0 backdrop-blur-sm sm:items-center sm:px-4"
          onClick={() => setCommentSheetItem(null)}
        >
          <div
            className="flex h-[82dvh] max-h-[720px] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.6rem] bg-[#fbfaf5] shadow-[0_-18px_45px_rgba(0,0,0,0.16)] sm:h-auto sm:max-h-[82vh] sm:rounded-[1.4rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 border-b border-[#ddd4c0]/80 px-4 py-4">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d8d0bd] sm:hidden" />

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold text-[#64715f]">
                    Comentários
                  </h2>
                  <p className="mt-1 truncate text-xs text-[#8f9f8a]">
                    {commentSheetItem.uploadedBy || "Convidado"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCommentSheetItem(null)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f8f5ee] text-xl text-[#64715f]"
                  aria-label="Fechar comentários"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {commentsByItem[commentSheetItem.galleryId]?.length ? (
                <div className="space-y-4">
                  {commentsByItem[commentSheetItem.galleryId].map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#b7c4b0] to-[#cdb892] text-xs font-extrabold text-white">
                        {(comment.commenter_name || "C").slice(0, 1).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 text-sm leading-6 text-[#64715f]">
                            <span className="font-extrabold">
                              {comment.commenter_name || "Convidado"}
                            </span>{" "}
                            {comment.comment_text}
                          </p>

                          {comment.anonymous_id === visitorId && (
                            <button
                              type="button"
                              onClick={() => deleteComment(comment)}
                              className="shrink-0 text-xs font-extrabold text-[#c76d70]"
                            >
                              Apagar
                            </button>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-[#9aa792]">
                          {formatPostDate(comment.created_at)}
                        </p>

                        {deleteErrors[comment.id] && (
                          <p className="mt-1 text-xs font-semibold text-[#c76d70]">
                            {deleteErrors[comment.id]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm font-semibold text-[#8f9f8a]">
                    Ainda não há comentários.
                  </p>
                </div>
              )}
            </div>

            <form
              onSubmit={(event) => submitComment(event, commentSheetItem)}
              className="shrink-0 space-y-3 border-t border-[#ddd4c0]/80 bg-white/85 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3"
            >
              <input
                value={commentNameDrafts[commentSheetItem.galleryId] || ""}
                onChange={(event) =>
                  setCommentNameDrafts((current) => ({
                    ...current,
                    [commentSheetItem.galleryId]: event.target.value,
                  }))
                }
                placeholder="O teu nome"
                className="w-full rounded-full border border-[#d8d0bd]/80 bg-[#fbfaf5] px-4 py-3 text-base text-[#64715f] outline-none focus:border-[#cdb892] focus:ring-4 focus:ring-[#cdb892]/15 sm:text-sm"
              />

              <div className="flex items-center gap-3">
                <input
                  value={commentDrafts[commentSheetItem.galleryId] || ""}
                  onChange={(event) =>
                    setCommentDrafts((current) => ({
                      ...current,
                      [commentSheetItem.galleryId]: event.target.value,
                    }))
                  }
                  placeholder="Adicionar comentário..."
                  className="min-w-0 flex-1 rounded-full border border-[#d8d0bd]/80 bg-[#fbfaf5] px-4 py-3 text-base text-[#64715f] outline-none focus:border-[#cdb892] focus:ring-4 focus:ring-[#cdb892]/15 sm:text-sm"
                />

                <button
                  type="submit"
                  className="shrink-0 text-sm font-extrabold text-[#b7975b]"
                >
                  Publicar
                </button>
              </div>
            </form>

            {commentErrors[commentSheetItem.galleryId] && (
              <p className="shrink-0 bg-white/85 px-4 pb-3 text-xs font-semibold text-[#c76d70]">
                {commentErrors[commentSheetItem.galleryId]}
              </p>
            )}
          </div>
        </div>
      )}

      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black text-white">
          <div className="mx-auto flex h-full max-w-md flex-col bg-black">
            <div className="absolute left-0 right-0 top-0 z-20 mx-auto max-w-md px-3 pt-3">
              <div className="flex gap-1.5">
                {storyItems.map((item, index) => (
                  <div
                    key={`${item.url}-progress-${index}`}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
                  >
                    <div
                      className="h-full rounded-full bg-white"
                      style={{
                        width:
                          index < storyViewerIndex
                            ? "100%"
                            : index === storyViewerIndex
                              ? `${storyProgress}%`
                              : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#b7c4b0] to-[#cdb892] text-sm font-extrabold">
                    {(activeStory.uploadedBy || "C").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">
                      {activeStory.uploadedBy || "Convidado"}
                    </p>
                    <p className="text-xs text-white/70">
                      {formatPostDate(activeStory.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeStory}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/35 text-2xl leading-none backdrop-blur"
                  aria-label="Fechar stories"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {activeStory.type?.startsWith("video/") ? (
                <video
                  key={activeStory.url}
                  src={activeStory.url}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-contain"
                />
              ) : (
                <img
                  key={activeStory.url}
                  src={activeStory.storyUrl}
                  alt=""
                  className="h-full w-full object-contain"
                  decoding="async"
                  onError={(event) => {
                    if (event.currentTarget.src !== activeStory.url) {
                      event.currentTarget.src = activeStory.url;
                    }
                  }}
                />
              )}

              <button
                type="button"
                onClick={showPreviousStory}
                className="absolute bottom-0 left-0 top-0 w-1/2"
                aria-label="Story anterior"
              />
              <button
                type="button"
                onClick={showNextStory}
                className="absolute bottom-0 right-0 top-0 w-1/2"
                aria-label="Story seguinte"
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-md bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-16">
              <p className="text-sm leading-6">
                <span className="font-extrabold">
                  {activeStory.uploadedBy || "Convidado"}
                </span>{" "}
                {activeStory.caption || "partilhou uma memória."}
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[#fbfaf5] p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute right-5 top-5 z-10 rounded-full bg-[#fbfaf5]/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8f9f8a] backdrop-blur-sm"
            >
              Fechar
            </button>

            {selectedItem.type?.startsWith("video/") ? (
              <video
                src={selectedItem.url}
                controls
                autoPlay
                className="max-h-[82vh] w-full rounded-[1.5rem] object-contain"
              />
            ) : (
              <img
                src={selectedItem.feedUrl}
                alt=""
                className="max-h-[82vh] w-full rounded-[1.5rem] object-contain"
                decoding="async"
                onError={(event) => {
                  if (event.currentTarget.src !== selectedItem.url) {
                    event.currentTarget.src = selectedItem.url;
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
