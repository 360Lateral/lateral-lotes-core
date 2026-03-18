import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Search, ShieldPlus, ShieldMinus, Users, Pencil, X } from "lucide-react";
import { toast } from "sonner";

const ALL_ROLES = ["super_admin", "admin", "asesor", "dueno", "comisionista", "inversor", "developer"] as const;

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", admin: "Administrador", asesor: "Asesor",
  dueno: "Dueño", comisionista: "Comisionista", inversor: "Inversor", developer: "Developer",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-destructive text-destructive-foreground",
  admin: "bg-primary text-primary-foreground",
  asesor: "bg-accent text-accent-foreground",
  dueno: "bg-primary/80 text-primary-foreground",
  comisionista: "bg-accent/80 text-accent-foreground",
  inversor: "bg-muted text-muted-foreground",
  developer: "bg-secondary text-secondary-foreground",
};

const USER_TYPES = [
  { value: "dueno", label: "Dueño" },
  { value: "comisionista", label: "Comisionista" },
  { value: "developer", label: "Developer" },
  { value: "inversor", label: "Inversor" },
];

interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  activo: boolean;
  roles: string[];
  comisionista_doc_estado: string | null;
  owner_ids: string[];
  created_at: string;
  last_sign_in_at: string | null;
}

const DashboardUsuarios = () => {
  const { roles: myRoles } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [dialogAction, setDialogAction] = useState<"grant" | "revoke">("grant");

  // Edit user dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editUserType, setEditUserType] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");

  const isSuperAdmin = myRoles.includes("super_admin");

  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-users");
      if (error) throw error;
      return data as UserRecord[];
    },
  });

  // Get list of owners for association
  const owners = users.filter((u) => u.user_type === "dueno");

  const mutation = useMutation({
    mutationFn: async ({ user_id, role, action }: { user_id: string; role: string; action: "grant" | "revoke" }) => {
      const { data, error } = await supabase.functions.invoke("manage-user-role", {
        body: { user_id, role, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(dialogAction === "grant" ? "Rol otorgado correctamente" : "Rol removido correctamente");
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ user_id, user_type }: { user_id: string; user_type: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-user", {
        body: { action: "update_user_type", user_id, user_type },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Tipo de usuario actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const ownerAssocMutation = useMutation({
    mutationFn: async ({ user_id, owner_id, action }: { user_id: string; owner_id: string; action: "add_owner" | "remove_owner" }) => {
      const { data, error } = await supabase.functions.invoke("manage-user", {
        body: { action, user_id, owner_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Asociación actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.roles.some((r) => ROLE_LABELS[r]?.toLowerCase().includes(q));
  });

  const openGrantDialog = (user: UserRecord) => {
    setSelectedUser(user); setDialogAction("grant"); setSelectedRole(""); setDialogOpen(true);
  };
  const openRevokeDialog = (user: UserRecord, role: string) => {
    setSelectedUser(user); setDialogAction("revoke"); setSelectedRole(role); setDialogOpen(true);
  };
  const handleConfirm = () => {
    if (!selectedUser || !selectedRole) return;
    mutation.mutate({ user_id: selectedUser.id, role: selectedRole, action: dialogAction });
  };

  const openEditDialog = (user: UserRecord) => {
    setEditUser(user);
    setEditUserType(user.user_type ?? "");
    setSelectedOwnerId("");
    setEditOpen(true);
  };

  const handleSaveUserType = () => {
    if (!editUser || !editUserType) return;
    updateTypeMutation.mutate({ user_id: editUser.id, user_type: editUserType });
  };

  const handleAddOwner = () => {
    if (!editUser || !selectedOwnerId) return;
    ownerAssocMutation.mutate({ user_id: editUser.id, owner_id: selectedOwnerId, action: "add_owner" });
    setSelectedOwnerId("");
  };

  const handleRemoveOwner = (ownerId: string) => {
    if (!editUser) return;
    ownerAssocMutation.mutate({ user_id: editUser.id, owner_id: ownerId, action: "remove_owner" });
  };

  const availableRolesToGrant = (user: UserRecord) =>
    ALL_ROLES.filter((r) => !user.roles.includes(r) && (isSuperAdmin || r !== "super_admin"));

  const userTypeLabel = (t: string | null) => {
    const found = USER_TYPES.find((ut) => ut.value === t);
    return found?.label ?? t ?? "—";
  };

  const getOwnerName = (ownerId: string) => {
    const owner = users.find((u) => u.id === ownerId);
    return owner?.full_name || owner?.email || ownerId.slice(0, 8);
  };

  // Refresh editUser data when users list changes
  const currentEditUser = editUser ? users.find((u) => u.id === editUser.id) ?? editUser : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-sm text-muted-foreground">{users.length} usuarios registrados</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, email o rol..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Dueños asoc.</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                          <Users className="mx-auto mb-2 h-8 w-8" />No se encontraron usuarios
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">{u.full_name || "Sin nombre"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{userTypeLabel(u.user_type)}</span>
                            {u.user_type === "comisionista" && u.comisionista_doc_estado && (
                              <div className="mt-0.5">
                                <Badge variant="outline" className={`text-[10px] ${
                                  u.comisionista_doc_estado === "aprobado" ? "border-green-500 text-green-600"
                                    : u.comisionista_doc_estado === "pendiente" ? "border-yellow-500 text-yellow-600"
                                    : u.comisionista_doc_estado === "rechazado" ? "border-destructive text-destructive"
                                    : "border-muted text-muted-foreground"
                                }`}>
                                  {u.comisionista_doc_estado === "aprobado" ? "Doc. aprobado"
                                    : u.comisionista_doc_estado === "pendiente" ? "Doc. pendiente"
                                    : u.comisionista_doc_estado === "rechazado" ? "Doc. rechazado"
                                    : "Sin documento"}
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {u.roles.length === 0 ? (
                                <span className="text-xs text-muted-foreground">Sin roles</span>
                              ) : u.roles.map((r) => (
                                <Badge key={r} variant="outline"
                                  className={`cursor-pointer text-[10px] ${ROLE_COLORS[r] ?? ""}`}
                                  onClick={() => openRevokeDialog(u, r)}
                                  title={`Clic para remover rol ${ROLE_LABELS[r]}`}>
                                  {ROLE_LABELS[r] ?? r}<ShieldMinus className="ml-1 h-3 w-3" />
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {u.owner_ids.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {u.owner_ids.map((oid) => (
                                  <Badge key={oid} variant="outline" className="text-[10px]">
                                    {getOwnerName(oid)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString("es-CO")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(u)} title="Editar usuario">
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              {availableRolesToGrant(u).length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => openGrantDialog(u)} title="Otorgar rol">
                                  <ShieldPlus className="h-4 w-4 text-primary" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grant/Revoke role dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogAction === "grant" ? "Otorgar rol" : "Remover rol"}</DialogTitle>
              <DialogDescription>
                {dialogAction === "grant"
                  ? `Selecciona el rol que deseas otorgar a ${selectedUser?.full_name || selectedUser?.email}`
                  : `¿Estás seguro de remover el rol "${ROLE_LABELS[selectedRole]}" de ${selectedUser?.full_name || selectedUser?.email}?`}
              </DialogDescription>
            </DialogHeader>
            {dialogAction === "grant" && (
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                <SelectContent>
                  {selectedUser && availableRolesToGrant(selectedUser).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!selectedRole || mutation.isPending}
                variant={dialogAction === "revoke" ? "destructive" : "default"}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dialogAction === "grant" ? "Otorgar" : "Remover"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit user dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar usuario</DialogTitle>
              <DialogDescription>
                {currentEditUser?.full_name || currentEditUser?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de usuario</Label>
                <div className="flex gap-2">
                  <Select value={editUserType} onValueChange={setEditUserType}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                    <SelectContent>
                      {USER_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleSaveUserType}
                    disabled={updateTypeMutation.isPending || editUserType === currentEditUser?.user_type}>
                    {updateTypeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dueños asociados</Label>
                <p className="text-xs text-muted-foreground">
                  Este usuario podrá ver los lotes privados de los dueños asociados.
                </p>

                {currentEditUser && currentEditUser.owner_ids.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentEditUser.owner_ids.map((oid) => (
                      <Badge key={oid} variant="secondary" className="gap-1">
                        {getOwnerName(oid)}
                        <button type="button" onClick={() => handleRemoveOwner(oid)}
                          className="ml-1 rounded-full hover:bg-destructive/20">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar dueño" /></SelectTrigger>
                    <SelectContent>
                      {owners
                        .filter((o) => !currentEditUser?.owner_ids.includes(o.id))
                        .map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.full_name || o.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddOwner}
                    disabled={!selectedOwnerId || ownerAssocMutation.isPending}>
                    {ownerAssocMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardUsuarios;
