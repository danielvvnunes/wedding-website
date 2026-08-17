import { useMemo, useRef, useState, useEffect } from "react";
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
`;

const STORY_PHOTO_DURATION = 5000;
const STORY_VIDEO_DURATION = 8000;
const VISITOR_ID_STORAGE_KEY = "fd-gallery-visitor-id";

function getOrCreateVisitorId() {
  const storedVisitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY);

  if (storedVisitorId) return storedVisitorId;

  const newVisitorId = crypto.randomUUID();
  localStorage.setItem(VISITOR_ID_STORAGE_KEY, newVisitorId);
  return newVisitorId;
}

export default function GalleryAppPage() {
  const [searchParams] = useSearchParams();
  const invitationPath = getGuestInvitationPath(searchParams);
  const fileInputRef = useRef(null);
  const storyCameraInputRef = useRef(null);
  const previewUrlsRef = useRef([]);
  const [name, setName] = useState("");
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploadedItems, setUploadedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [visitorId] = useState(getOrCreateVisitorId);
  const [likesByItem, setLikesByItem] = useState({});
  const [likedByVisitor, setLikedByVisitor] = useState({});
  const [pendingLikes, setPendingLikes] = useState({});
  const [likeErrors, setLikeErrors] = useState({});
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

  useEffect(() => {
    const convite = searchParams.get("convite");
    if (convite) saveGuestInvitationSlug(convite);
  }, [searchParams]);

  useEffect(() => {
    async function loadGallery() {
      const { data, error } = await supabase
        .from("wedding_gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setUploadedItems(
        data.map((item) => ({
          galleryId: String(item.file_path || item.id || item.file_url),
          url: item.file_url,
          type: item.file_type,
          uploadedBy: item.uploaded_by,
          createdAt: item.created_at,
          filePath: item.file_path,
          anonymousId: item.anonymous_id,
        })),
      );
    }

    loadGallery();
  }, []);

  useEffect(() => {
    async function loadInteractions() {
      if (!visitorId || !uploadedItems.length) return;

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
    setStatus(null);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();

        const safeName = name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        const filePath = `${safeName}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        const { error } = await supabase.storage
          .from("wedding-gallery")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from("wedding-gallery")
          .getPublicUrl(filePath);

        const publicUrl = data.publicUrl;

        const { error: dbError } = await supabase
          .from("wedding_gallery")
          .insert({
            uploaded_by: name,
          file_path: filePath,
          file_url: publicUrl,
          file_type: file.type,
          anonymous_id: visitorId,
        });

        if (dbError) throw dbError;

        return {
          galleryId: filePath,
          url: publicUrl,
          type: file.type,
          uploadedBy: name,
          createdAt: new Date().toISOString(),
          filePath,
          anonymousId: visitorId,
        };
      });

      const uploaded = await Promise.all(uploadPromises);

      setUploadedItems((current) => [...uploaded, ...current]);

      setFiles([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setName("");
      setStatus("success");
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (storyCameraInputRef.current) storyCameraInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setIsUploading(false);
    }
  }

  const sortedItems = [...uploadedItems].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
  });

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
        .from("wedding-gallery")
        .remove([item.filePath]);

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

  return (
    <main className="page-bg min-h-screen overflow-x-hidden text-[#64715f]">
      <style>{styles}</style>

      <header className="sticky top-0 z-40 border-b border-[#d8d0bd]/60 bg-[#fbfaf5]/92 px-4 py-3 backdrop-blur-xl">
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
            <Link
              to={invitationPath}
              className="rounded-full border border-[#cdb892]/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#b7975b]"
            >
              Convite
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-0 pb-14 pt-4 sm:px-5 md:pt-8">
        <div className="min-w-0 space-y-4">
          <section className="app-card border-y border-[#ddd4c0]/70 bg-white/70 py-4 sm:rounded-[1.2rem] sm:border sm:mx-0">
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

              {storyItems.length ? storyItems.map((item, index) => (
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
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt=""
                          className="h-full w-full object-cover"
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

          <form
            onSubmit={uploadPhotos}
            className="app-card border-y border-[#ddd4c0]/70 bg-white/75 p-4 sm:rounded-[1.2rem] sm:border"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#b7c4b0] text-sm font-extrabold text-white">
                F·D
              </div>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="O vosso nome"
                className="min-w-0 flex-1 rounded-full border border-[#d8d0bd]/80 bg-[#fbfaf5] px-4 py-3 text-sm text-[#64715f] outline-none focus:border-[#cdb892] focus:ring-4 focus:ring-[#cdb892]/15"
              />

            </div>

            <label
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[1rem] border border-dashed px-4 py-8 text-center transition ${
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
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#cdb892]/15 text-2xl text-[#b7975b]">
                +
              </span>
              <span className="mt-3 text-sm font-bold text-[#b7975b]">
                Criar post com fotos ou vídeos
              </span>
              <span className="mt-1 text-xs leading-5 text-[#8f9f8a]">
                Toquem aqui para escolher ficheiros.
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </label>

            {!!previewUrls.length && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-[#8f9f8a]">
                    Preview do post
                  </p>
                  <p className="text-xs font-semibold text-[#cdb892]">
                    {files.length} {files.length === 1 ? "ficheiro" : "ficheiros"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden rounded-[0.8rem] border border-[#d8d0bd]/70 bg-[#f8f5ee]"
                    >
                      {files[index]?.type?.startsWith("video/") ? (
                        <video
                          src={url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removePreview(index)}
                        className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-[#fbfaf5]/95 text-sm font-bold text-[#64715f]"
                        aria-label="Remover ficheiro"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status && (
              <p className="mt-8 text-center text-sm font-semibold text-[#8f9f8a]">
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

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={isUploading}
                className="cursor-pointer rounded-full bg-[#cdb892] px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:-translate-y-[1px] hover:shadow-[0_8px_30px_rgba(205,184,146,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "A publicar..." : "Publicar"}
              </button>
            </div>
          </form>

          <section className="space-y-4">
            <div className="flex items-center justify-between px-4 sm:px-0">
              <h1 className="text-xl font-extrabold text-[#b7c4b0]">
                Posts
              </h1>

              <div className="flex rounded-full border border-[#d8d0bd]/80 bg-white/60 p-1">
                <button
                  type="button"
                  onClick={() => setSortOrder("recent")}
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
                  onClick={() => setSortOrder("oldest")}
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

            {uploadedItems.length ? (
              <div className="space-y-4">
                {sortedItems.map((item, index) => (
                  <article
                    key={`${item.url}-${index}`}
                    className="app-card overflow-hidden border-y border-[#ddd4c0]/70 bg-white/78 sm:rounded-[1.2rem] sm:border"
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
                      className="block w-full cursor-zoom-in bg-[#f8f5ee]"
                    >
                      {item.type?.startsWith("video/") ? (
                        <video
                          src={item.url}
                          className="max-h-[70vh] w-full object-contain"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt=""
                          className="max-h-[70vh] w-full object-contain"
                          loading="lazy"
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

                      {deleteErrors[item.galleryId] && (
                        <p className="mt-2 text-xs font-semibold text-[#c76d70]">
                          {deleteErrors[item.galleryId]}
                        </p>
                      )}

                      <p className="mt-3 text-sm leading-6 text-[#64715f]">
                        <span className="font-extrabold">
                          {item.uploadedBy || "Convidado"}
                        </span>{" "}
                        partilhou uma memória do casamento.
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-0 backdrop-blur-sm sm:items-center sm:px-4"
          onClick={() => setCommentSheetItem(null)}
        >
          <div
            className="flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.6rem] bg-[#fbfaf5] shadow-[0_-18px_45px_rgba(0,0,0,0.16)] sm:rounded-[1.4rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#ddd4c0]/80 px-4 py-4">
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
              className="space-y-3 border-t border-[#ddd4c0]/80 bg-white/70 px-4 py-3"
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
                className="w-full rounded-full border border-[#d8d0bd]/80 bg-[#fbfaf5] px-4 py-3 text-sm text-[#64715f] outline-none focus:border-[#cdb892] focus:ring-4 focus:ring-[#cdb892]/15"
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
                  className="min-w-0 flex-1 rounded-full border border-[#d8d0bd]/80 bg-[#fbfaf5] px-4 py-3 text-sm text-[#64715f] outline-none focus:border-[#cdb892] focus:ring-4 focus:ring-[#cdb892]/15"
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
              <p className="bg-white/70 px-4 pb-3 text-xs font-semibold text-[#c76d70]">
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
                  src={activeStory.url}
                  alt=""
                  className="h-full w-full object-contain"
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
                partilhou uma memória.
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
                src={selectedItem.url}
                alt=""
                className="max-h-[82vh] w-full rounded-[1.5rem] object-contain"
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
