"use client";

import { useState } from "react";
import {
  Sparkles,
  Plus,
  X,
  Search,
  CheckCircle,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";
import {
  useAddGymAmenity,
  useAmenityCatalog,
  useCreateAndAddAmenity,
  useGymAmenities,
  useRemoveGymAmenity,
  useUpdateAmenity,
} from "@/lib/hooks/use-amenities";
import type { AmenityResponse } from "@/types/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Add Amenity Dialog ────────────────────────────────────────────────────────

function AddAmenityDialog({
  catalog,
  gymAmenityIds,
  onClose,
  onAddExisting,
  onCreateNew,
  isPending,
}: {
  catalog: AmenityResponse[];
  gymAmenityIds: Set<string>;
  onClose: () => void;
  onAddExisting: (id: string) => Promise<void>;
  onCreateNew: (name: string) => Promise<void>;
  isPending: boolean;
}) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const available = catalog.filter((a) => !gymAmenityIds.has(a.id) && a.is_active);
  const suggestions = trimmed
    ? available.filter((a) => a.name.toLowerCase().includes(trimmed.toLowerCase()))
    : available;

  const exactMatch = catalog.some((a) => a.name.toLowerCase() === trimmed.toLowerCase());
  const alreadyAdded = catalog.find(
    (a) => a.name.toLowerCase() === trimmed.toLowerCase() && gymAmenityIds.has(a.id)
  );
  const showCreate = trimmed.length > 0 && !exactMatch;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.15)" }}
            >
              <Plus className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Add Amenity</h3>
              <p className="text-[10px] text-muted-foreground">Search catalog or create new</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or type a new amenity name…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-[12px] outline-none text-foreground placeholder:text-muted-foreground"
              style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))" }}
            />
          </div>
        </div>

        {/* Create new option */}
        {showCreate && (
          <div className="px-4 pt-2">
            <button
              onClick={() => onCreateNew(trimmed)}
              disabled={isPending}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/5 disabled:opacity-40"
              style={{ border: "1px dashed rgba(139,92,246,0.4)" }}
            >
              <div
                className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(139,92,246,0.12)" }}
              >
                <Plus className="h-3 w-3" style={{ color: "#8b5cf6" }} />
              </div>
              <div>
                <p className="text-[11px] font-bold" style={{ color: "#8b5cf6" }}>
                  Create &quot;{trimmed}&quot;
                </p>
                <p className="text-[10px] text-muted-foreground">Add to catalog and this gym</p>
              </div>
            </button>
          </div>
        )}

        {/* Already added notice */}
        {alreadyAdded && (
          <div className="px-4 pt-2">
            <p className="text-[11px] text-muted-foreground px-1">
              &quot;{alreadyAdded.name}&quot; is already added to this gym.
            </p>
          </div>
        )}

        {/* Catalog list */}
        <div className="p-4 pt-2 max-h-64 overflow-y-auto space-y-0.5">
          {suggestions.length === 0 && !showCreate ? (
            <div className="py-6 text-center">
              <p className="text-[11px] text-muted-foreground">
                {trimmed ? "No matching amenities found." : "All catalog amenities are already added."}
              </p>
            </div>
          ) : (
            suggestions.map((a) => (
              <button
                key={a.id}
                onClick={() => onAddExisting(a.id)}
                disabled={isPending}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors hover:bg-white/5 disabled:opacity-40"
              >
                <div
                  className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(139,92,246,0.08)" }}
                >
                  <Sparkles className="h-3 w-3" style={{ color: "#8b5cf6" }} />
                </div>
                <span className="text-[12px] font-medium text-foreground">{a.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

function EditAmenityDialog({
  amenity,
  onClose,
  onSave,
  isPending,
}: {
  amenity: AmenityResponse;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState(amenity.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === amenity.name) { onClose(); return; }
    await onSave(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.15)" }}
            >
              <Pencil className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Rename Amenity</h3>
              <p className="text-[10px] text-muted-foreground">Updates the global catalog name</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Amenity Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground"
              style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))" }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ background: "hsl(var(--muted)/0.4)", color: "hsl(var(--muted-foreground))" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim() || name.trim() === amenity.name}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Amenity Row ───────────────────────────────────────────────────────────────

function AmenityRow({
  amenity,
  onEdit,
  onRemove,
}: {
  amenity: AmenityResponse;
  onEdit: (a: AmenityResponse) => void;
  onRemove: (a: AmenityResponse) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] group"
      style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}
    >
      {/* Icon */}
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(139,92,246,0.1)" }}
      >
        <Sparkles className="h-4 w-4" style={{ color: "#8b5cf6" }} />
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{amenity.name}</p>
        {amenity.description && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{amenity.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(amenity)}
          className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          title="Rename"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => onRemove(amenity)}
          className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
          title="Remove from gym"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
        </button>
      </div>

    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AmenitiesPage() {
  const { data: gymAmenities, isLoading } = useGymAmenities();
  const { data: catalog } = useAmenityCatalog();
  const addAmenity = useAddGymAmenity();
  const removeAmenity = useRemoveGymAmenity();
  const createAndAdd = useCreateAndAddAmenity();
  const updateAmenity = useUpdateAmenity();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<AmenityResponse | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AmenityResponse | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const allGym = gymAmenities ?? [];
  const catalogItems = catalog?.items ?? [];
  const gymAmenityIds = new Set(allGym.map((a) => a.id));

  const filtered = search.trim()
    ? allGym.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : allGym;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const handleAddExisting = async (amenityId: string) => {
    await addAmenity.mutateAsync(amenityId);
    setShowAdd(false);
    showToast("Amenity added to gym.");
  };

  const handleCreateNew = async (name: string) => {
    await createAndAdd.mutateAsync(name);
    setShowAdd(false);
    showToast(`"${name}" created and added.`);
  };

  const handleSaveEdit = async (name: string) => {
    if (!editTarget) return;
    await updateAmenity.mutateAsync({ id: editTarget.id, name });
    setEditTarget(null);
    showToast("Amenity renamed.");
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    await removeAmenity.mutateAsync(removeTarget.id);
    setRemoveTarget(null);
    showToast(`"${removeTarget.name}" removed from gym.`);
  };

  const totalInCatalog = catalogItems.length;
  const totalInGym = allGym.length;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">Amenities</h1>
          <p className="text-[11px] text-muted-foreground">
            {totalInGym} amenit{totalInGym !== 1 ? "ies" : "y"} at your gym
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
        >
          <Plus className="h-4 w-4" />
          Add Amenity
        </button>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl px-4 py-3.5"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.12)" }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">At This Gym</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalInGym}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">amenities available</p>
        </div>

        <div
          className="rounded-2xl px-4 py-3.5"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.1)" }}
            >
              <BookOpen className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Global Catalog</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalInCatalog}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">total amenity types</p>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search this gym's amenities…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-[12px] outline-none text-foreground placeholder:text-muted-foreground"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ── Amenities list ──────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(139,92,246,0.08)" }}
            >
              <Sparkles className="h-7 w-7" style={{ color: "#8b5cf6" }} />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {search ? "No matching amenities" : "No amenities yet"}
            </p>
            <p className="text-[11px] text-muted-foreground mb-4">
              {search
                ? "Try a different search term."
                : "Click 'Add Amenity' to showcase your gym's features."}
            </p>
            {!search && (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white mx-auto transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
              >
                <Plus className="h-4 w-4" />
                Add Amenity
              </button>
            )}
          </div>
        ) : (
          filtered.map((amenity) => (
            <AmenityRow
              key={amenity.id}
              amenity={amenity}
              onEdit={setEditTarget}
              onRemove={setRemoveTarget}
            />
          ))
        )}
      </div>

      {/* ── Add Dialog ──────────────────────────────────────────────── */}
      {showAdd && (
        <AddAmenityDialog
          catalog={catalogItems}
          gymAmenityIds={gymAmenityIds}
          onClose={() => setShowAdd(false)}
          onAddExisting={handleAddExisting}
          onCreateNew={handleCreateNew}
          isPending={addAmenity.isPending || createAndAdd.isPending}
        />
      )}

      {/* ── Edit Dialog ─────────────────────────────────────────────── */}
      {editTarget && (
        <EditAmenityDialog
          amenity={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
          isPending={updateAmenity.isPending}
        />
      )}

      {/* ── Remove Confirm ──────────────────────────────────────────── */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Amenity</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{removeTarget?.name}&quot; from this gym? It will stay in the global catalog and can be re-added later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeAmenity.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-semibold text-white max-w-[calc(100vw-3rem)]"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
        >
          <CheckCircle className="h-4 w-4" />
          {toast}
        </div>
      )}
    </div>
  );
}
