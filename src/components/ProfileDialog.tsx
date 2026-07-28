import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/hooks/useAuth";

export function ProfileDialog({
  profile,
  open,
  onOpenChange,
  onSaved,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [department, setDepartment] = useState(profile.department ?? "");
  const [organisation, setOrganisation] = useState(profile.organisation ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFullName(profile.full_name);
    setDepartment(profile.department ?? "");
    setOrganisation(profile.organisation ?? "");
    setPhone(profile.phone ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim().slice(0, 100),
        department: department.trim().slice(0, 100) || null,
        organisation: organisation.trim().slice(0, 100) || null,
        phone: phone.trim().slice(0, 20) || null,
        bio: bio.trim().slice(0, 500) || null,
      })
      .eq("id", profile.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My profile</DialogTitle>
          <DialogDescription>
            {profile.email} · <span className="capitalize">{profile.role}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
          </div>
          {profile.role === "ngo" ? (
            <div className="space-y-1.5">
              <Label htmlFor="p-org">Organisation</Label>
              <Input id="p-org" value={organisation} onChange={(e) => setOrganisation(e.target.value)} maxLength={100} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="p-dep">Department</Label>
              <Input id="p-dep" value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={100} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="p-phone">Phone</Label>
            <Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-bio">About</Label>
            <Textarea id="p-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={3} />
          </div>
          <Button onClick={() => void save()} disabled={busy} className="w-full">
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
