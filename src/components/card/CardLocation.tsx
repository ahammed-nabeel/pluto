"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { MapPin, Navigation, ExternalLink, Pencil, Check, X } from "lucide-react";
import { getGoogleMapsLink } from "@/lib/utils";
import type { CardDetail } from "@/types";

interface CardLocationProps {
  card: CardDetail;
  boardId: string;
  onUpdate: (updates: Partial<CardDetail>) => void;
}

export function CardLocation({ card, boardId, onUpdate }: CardLocationProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [form, setForm] = useState({
    location_address: card.location_address ?? "",
    location_lat: card.location_lat?.toString() ?? "",
    location_lng: card.location_lng?.toString() ?? "",
  });

  const hasLocation = card.location_lat && card.location_lng;
  const mapsUrl = hasLocation
    ? getGoogleMapsLink(card.location_lat!, card.location_lng!)
    : null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm((f) => ({
          ...f,
          location_lat: lat.toString(),
          location_lng: lng.toString(),
        }));

        // Try Nominatim reverse geocoding (free, no API key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          if (data.display_name) {
            setForm((f) => ({ ...f, location_address: data.display_name }));
          }
        } catch {
          // Silently fail — coordinates still captured
        }
        setGettingLocation(false);
      },
      (err) => {
        toast({ title: "Could not get location: " + err.message, variant: "destructive" });
        setGettingLocation(false);
      }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_address: form.location_address || null,
          location_lat: form.location_lat ? parseFloat(form.location_lat) : null,
          location_lng: form.location_lng ? parseFloat(form.location_lng) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.data);
        setEditing(false);
        toast({ title: "Location saved", variant: "success" });
      }
    } catch {
      toast({ title: "Failed to save location", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="px-6 py-5 group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Location</h3>
        {!editing && (
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
        {editing && (
          <div className="flex gap-1">
            <Button size="icon-sm" variant="ghost" onClick={handleSave} loading={saving}>
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {!editing ? (
        <div onClick={() => setEditing(true)} className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors space-y-3">
          {card.location_address || hasLocation ? (
            <div className="space-y-3">
              {card.location_address ? (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-700">{card.location_address}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Click to add address...</p>
              )}

              {hasLocation ? (
                <p className="text-xs text-slate-400 ml-6">
                  {card.location_lat?.toFixed(6)}, {card.location_lng?.toFixed(6)}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic ml-6">Click to add GPS coordinates...</p>
              )}

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 ml-6 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Google Maps
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Click to add location details...</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-slate-500">Address</Label>
            <Input
              value={form.location_address}
              onChange={(e) => setForm((f) => ({ ...f, location_address: e.target.value }))}
              className="mt-1"
              placeholder="Enter address manually..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-slate-500">Latitude</Label>
              <Input
                type="number"
                step="any"
                value={form.location_lat}
                onChange={(e) => setForm((f) => ({ ...f, location_lat: e.target.value }))}
                className="mt-1"
                placeholder="12.9716"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Longitude</Label>
              <Input
                type="number"
                step="any"
                value={form.location_lng}
                onChange={(e) => setForm((f) => ({ ...f, location_lng: e.target.value }))}
                className="mt-1"
                placeholder="77.5946"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            loading={gettingLocation}
            className="w-full"
          >
            <Navigation className="w-4 h-4 mr-2" />
            {gettingLocation ? "Getting location..." : "Use Current Location"}
          </Button>
        </div>
      )}
    </div>
  );
}
