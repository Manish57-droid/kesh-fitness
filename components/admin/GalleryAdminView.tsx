"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Images, Loader2, Trash2 } from "lucide-react";
import Photo from "../Photo";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/image";
import type { GalleryPhoto } from "@/lib/types";

const BUCKET = "gallery";
/** Storage path for photos uploaded here; built-in /images/… photos return null. */
const storagePath = (url: string) => url.split(`/object/public/${BUCKET}/`)[1] ?? null;
const byOrder = (a: GalleryPhoto, b: GalleryPhoto) => a.sort_order - b.sort_order || a.id - b.id;

export default function GalleryAdminView({ initial, tableMissing }: { initial: GalleryPhoto[]; tableMissing: boolean }) {
  const [photos, setPhotos] = useState([...initial].sort(byOrder));

  // Fresh data from a background refresh (RefreshIfStale) replaces the list.
  useEffect(() => setPhotos([...initial].sort(byOrder)), [initial]);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  if (tableMissing) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-2xl tracking-wide">Gallery not set up yet</p>
        <p className="mt-2 text-sm text-fg/70">
          Run <code className="text-brand-red">supabase/migrations/004_orders_gallery.sql</code> in the Supabase SQL Editor, then refresh.
        </p>
      </div>
    );
  }

  const upload = async (files: FileList) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setError("");
    setUploading({ done: 0, total: list.length });
    const supabase = createClient();
    let nextOrder = photos.reduce((n, p) => Math.max(n, p.sort_order), 0) + 1;
    const added: GalleryPhoto[] = [];

    for (const file of list) {
      try {
        const blob = await resizeImage(file, 1600, 0.85);
        const ext = blob.type === "image/webp" ? "webp" : file.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
        if (upErr) throw upErr;
        const image_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const { data, error: insErr } = await supabase
          .from("gallery_photos")
          .insert({ image_url, sort_order: nextOrder++ })
          .select()
          .single();
        if (insErr) throw insErr;
        added.push(data as GalleryPhoto);
      } catch (err) {
        setError(`${file.name}: ${(err as Error).message}`);
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setPhotos((p) => [...p, ...added].sort(byOrder));
    setUploading(null);
  };

  const patch = async (id: number, changes: Partial<GalleryPhoto>) => {
    setError("");
    setPhotos((list) => list.map((p) => (p.id === id ? { ...p, ...changes } : p)).sort(byOrder));
    const { error } = await createClient().from("gallery_photos").update(changes).eq("id", id);
    if (error) setError(error.message);
  };

  // Swap display order with the neighbour.
  const move = async (index: number, dir: -1 | 1) => {
    const a = photos[index];
    const b = photos[index + dir];
    if (!a || !b) return;
    const aOrder = a.sort_order === b.sort_order ? b.sort_order + dir : b.sort_order;
    setPhotos((list) =>
      list.map((p) => (p.id === a.id ? { ...p, sort_order: aOrder } : p.id === b.id ? { ...p, sort_order: a.sort_order } : p)).sort(byOrder)
    );
    const supabase = createClient();
    const results = await Promise.all([
      supabase.from("gallery_photos").update({ sort_order: aOrder }).eq("id", a.id),
      supabase.from("gallery_photos").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    const failed = results.find((r) => r.error);
    if (failed?.error) setError(failed.error.message);
  };

  const remove = async (photo: GalleryPhoto) => {
    if (!confirm("Delete this photo from the gallery?")) return;
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("gallery_photos").delete().eq("id", photo.id);
    if (error) return setError(error.message);
    const path = storagePath(photo.image_url);
    if (path) await supabase.storage.from(BUCKET).remove([path]);
    setPhotos((list) => list.filter((p) => p.id !== photo.id));
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-fg/70">
          <Images className="h-4 w-4 text-brand-red" />
          {photos.filter((p) => p.is_active).length} photos showing in the website slideshow
        </p>
        <button onClick={() => fileInput.current?.click()} disabled={!!uploading} className="btn-primary">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? `Uploading ${uploading.done}/${uploading.total}…` : "Add Photos"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <p className="mt-2 text-xs text-brand-muted">You can select many photos at once. They are resized automatically.</p>
      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}

      {photos.length === 0 ? (
        <p className="mt-6 border border-dashed border-brand-line px-4 py-12 text-center text-sm text-brand-muted">
          No photos yet. Tap “Add Photos”.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((p, i) => (
            <li key={p.id} className={`flex flex-col border border-brand-line bg-brand-card ${p.is_active ? "" : "opacity-50"}`}>
              <div className="relative">
                <Photo src={p.image_url} alt={p.caption ?? "Gallery photo"} className="aspect-[4/5] w-full object-top" />
                <span className="absolute left-2 top-2 bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">#{i + 1}</span>
                {!p.is_active && (
                  <span className="absolute inset-x-0 bottom-0 bg-amber-500 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-black">
                    Hidden
                  </span>
                )}
              </div>
              <input
                className="border-0 border-b border-brand-line bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-red"
                placeholder="Add a caption"
                defaultValue={p.caption ?? ""}
                maxLength={100}
                onBlur={(e) => {
                  const caption = e.target.value.trim() || null;
                  if (caption !== p.caption) patch(p.id, { caption });
                }}
                aria-label="Caption"
              />
              <div className="grid grid-cols-4">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="flex h-10 items-center justify-center text-brand-muted hover:text-fg disabled:opacity-30" aria-label="Move earlier">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="flex h-10 items-center justify-center text-brand-muted hover:text-fg disabled:opacity-30" aria-label="Move later">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button onClick={() => patch(p.id, { is_active: !p.is_active })} className="flex h-10 items-center justify-center text-brand-muted hover:text-fg" aria-label={p.is_active ? "Hide photo" : "Show photo"}>
                  {p.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => remove(p)} className="flex h-10 items-center justify-center text-brand-muted hover:text-brand-red" aria-label="Delete photo">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
