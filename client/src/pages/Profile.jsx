import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, CircleUserRound, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/state/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const { session, updateUser } = useAuth();
  const [name, setName] = useState(session.user.name);
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setName(session.user.name), [session.user.name]);
  useEffect(() => {
    if (!photo) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function selectPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error("Choose a JPG, PNG, or WebP image under 2 MB");
      event.target.value = "";
      return;
    }
    setPhoto(file);
  }

  async function save(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 80) { toast.error("Name must be between 2 and 80 characters"); return; }
    setSaving(true);
    try {
      const body = new FormData();
      body.append("name", trimmedName);
      if (photo) body.append("photo", photo);
      const { user } = await api("/auth/profile", { token: session.token, method: "PATCH", body });
      updateUser(user);
      setPhoto(null);
      toast.success("Profile updated");
    } catch (error) { toast.error(error.message); }
    finally { setSaving(false); }
  }

  const image = previewUrl || session.user.photoUrl;
  return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} className="mx-auto max-w-3xl">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-accent"><span className="h-px w-4 bg-[var(--accent)]" /> Your account</div>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">Your profile</h1>
    <p className="mt-2 text-sm text-subtle">Keep your identity current across your workspace.</p>

    <Card className="mt-8 overflow-hidden">
      <div className="profile-banner relative h-28 border-b border-theme sm:h-36"><div className="absolute bottom-4 left-6 flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--glass-strong)] px-3 py-1.5 text-xs font-medium text-accent backdrop-blur-xl"><ShieldCheck size={14} /> Private account</div></div>
      <form onSubmit={save} className="space-y-7 p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[var(--accent-border)] bg-accent-soft text-4xl font-bold text-accent">{image ? <img src={image} alt="Profile" className="size-full object-cover" /> : session.user.name[0]?.toUpperCase()}</div>
          <div className="min-w-0"><h2 className="text-lg font-semibold">Profile photo</h2><p className="mt-1 text-sm text-subtle">JPG, PNG or WebP, up to 2 MB.</p><label htmlFor="profile-photo" className="btn-secondary mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl px-3 text-xs font-semibold"><Camera size={15} /> Choose photo</label><input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectPhoto} />{photo && <p className="mt-2 max-w-xs truncate text-xs text-accent">Ready to upload: {photo.name}</p>}</div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><Label htmlFor="profile-name" className="flex items-center gap-2"><UserRound size={14} /> Full name</Label><Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="name" required /></div>
          <div><Label htmlFor="profile-email" className="flex items-center gap-2"><Mail size={14} /> Email address</Label><Input id="profile-email" value={session.user.email} readOnly aria-readonly="true" className="cursor-not-allowed text-subtle" /><p className="mt-1.5 text-xs text-faint">Email is linked to your sign-in.</p></div>
        </div>
        <div className="flex justify-end border-t border-theme pt-6"><Button type="submit" disabled={saving || !name.trim()}><Save size={16} /> {saving ? "Saving…" : "Save changes"}</Button></div>
      </form>
    </Card>
    <div className="mt-5 flex items-center gap-2 text-xs text-subtle"><CircleUserRound size={14} className="text-accent" /> Changes to your name and photo are saved to your account.</div>
  </motion.div>;
}
