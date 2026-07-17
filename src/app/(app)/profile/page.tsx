"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Avatar } from "@/components/ui/avatar";
import { Loader2, Save, Shield, Calendar, UserCheck, Lock, KeyRound } from "lucide-react";
import { formatDate } from "@/lib/utils";

type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  auth_provider: string;
  profile_picture_url: string | null;
  created_at: string;
  last_login: string | null;
  hasPassword: boolean;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    profile_picture_url: "",
    oldPassword: "",
    newPassword: "",
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok) {
        setProfile(data.data);
        setForm({
          name: data.data.name ?? "",
          profile_picture_url: data.data.profile_picture_url ?? "",
          oldPassword: "",
          newPassword: "",
        });
      }
    } catch {
      toast({ title: "Failed to load profile", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        profile_picture_url: form.profile_picture_url.trim() || undefined,
      };

      if (form.newPassword.trim()) {
        payload.newPassword = form.newPassword.trim();
        if (profile?.hasPassword) {
          payload.oldPassword = form.oldPassword.trim();
        }
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "Profile updated successfully", variant: "success" });
        setProfile((prev) => prev ? { ...prev, ...data.data } : prev);
        setForm((f) => ({
          ...f,
          oldPassword: "",
          newPassword: "",
        }));
      } else {
        toast({ title: data.error ?? "Failed to update profile", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-500">
        Profile not found
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your user profile details and security roles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar/Role card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center shadow-sm h-fit">
          <Avatar
            src={profile.profile_picture_url}
            name={profile.name ?? profile.email ?? "User"}
            size="xl"
            className="w-20 h-20 text-2xl font-semibold mb-4"
          />
          <h2 className="font-semibold text-slate-900 text-lg">{profile.name ?? "User"}</h2>
          <p className="text-sm text-slate-400 mt-1">{profile.email}</p>

          <div className="mt-6 w-full space-y-3 pt-6 border-t border-slate-100 text-left">
            <div className="flex items-center gap-2.5 text-slate-500 text-sm">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="capitalize">Role: {profile.role.replace("_", " ")}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-500 text-sm">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span className="capitalize">Status: {profile.status}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-500 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Joined: {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Profile Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm md:col-span-2 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Profile Details</h3>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Profile Image URL</Label>
                <Input
                  id="avatar"
                  placeholder="https://example.com/avatar.jpg"
                  value={form.profile_picture_url}
                  onChange={(e) => setForm((f) => ({ ...f, profile_picture_url: e.target.value }))}
                />
                <p className="text-xs text-slate-400">Leave empty to use automatic name initials.</p>
              </div>

              <div className="space-y-2">
                <Label>Authentication Provider</Label>
                <Input
                  value={profile.auth_provider.toUpperCase()}
                  disabled
                  className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed capitalize animate-none"
                />
              </div>

              {/* Password Section */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <KeyRound className="w-5 h-5 text-blue-500" />
                  <h4>Password Management</h4>
                </div>

                {profile.hasPassword ? (
                  <p className="text-xs text-slate-500">
                    Your account has a password set. You can change your password below.
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    You signed up via Google or Microsoft. You can set a password below to allow email & password login.
                  </p>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {profile.hasPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">Current Password</Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        placeholder="••••••••"
                        value={form.oldPassword}
                        onChange={(e) => setForm((f) => ({ ...f, oldPassword: e.target.value }))}
                        required={!!form.newPassword}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      {profile.hasPassword ? "New Password" : "Set Password"}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={form.newPassword}
                      onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button type="submit" loading={saving} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
