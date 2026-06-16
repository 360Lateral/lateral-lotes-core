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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Clock, Edit, Loader2, Search, ShieldPlus, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import InvitarClienteDialog from "@/components/usuarios/InvitarClienteDialog";
import CambiarNivelDialog, { NIVEL_BADGE_CLASS } from "@/components/usuarios/CambiarNivelDialog";
import HistorialNivelDialog from "@/components/usuarios/HistorialNivelDialog";
import type { NivelSuscripcion } from "@/hooks/useNivelSuscripcion";

const ALL_ROLES = ["super_admin", "admin", "experto", "comisionista", "propietario", "desarrollador"] as const;

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", admin: "Administrador", experto: "Experto",
  comisionista: "Comisionista", propietario: "Propietario", desarrollador: "Desarrollador",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-destructive text-destructive-foreground",
  admin: "bg-primary text-primary-foreground",
  experto: "bg-accent text-accent-foreground",
  comisionista: "bg-accent/80 text-accent-foreground",
  propietario: "bg-muted text-muted-foreground",
  desarrollador: "bg-secondary text-secondary-foreground",
};

const USER_TYPES = [
  { value: "propietario", label: "Propietario" },
  { value: "comisionista", label: "Comisionista" },
  { value: "desarrollador", label: "Desarrollador" },
];

interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  activo: boolean;
  nivel_suscripcion: NivelSuscripcion;
  roles: string[];
  comisionista_doc_estado: string | null;
  owner_ids: string[];
  created_at: string;
  last_sign_in_at: string | null;
}

const DashboardUsuarios = () => {
  const { roles: myRoles, user, session } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("todos");

  // Unified edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editUserType, setEditUserType] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [invitarOpen, setInvitarOpen] = useState(false);
  const [nivelDialogUser, setNivelDialogUser] = useState<UserRecord | null>(null);
  const [historialDialogUser, setHistorialDialogUser] = useState<UserRecord | null>(null);

  const isSuperAdmin = myRoles.includes("super_admin");
  const isAdmin = myRoles.includes("admin") || isSuperAdmin;

  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ["admin-users", user?.id],
    enabled: !!user && !!session && isAdmin,
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        return [];
      }
      const { data, error } = await supabase.functions.invoke("list-users");
      if (error) {
        const status = (error as any).context?.status;
        if (status === 401) {
          await supabase.auth.signOut({ scope: "local" });
          window.location.href = "/login";
          return [];
        }
        throw error;
      }
      return data as UserRecord[];
    },
    retry: false,
  });

  const owners = users.filter((u) => u.user_type === "propietario");

  const roleMutation = useMutation({
    mutationFn: async ({ user_id, role, action }: { user_id: string; role: string; action: "grant" | "revoke" }) => {
      const { data, error } = await supabase.functions.invoke("manage-user-role", {
        body: { user_id, role, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(vars.action === "grant" ? "Rol otorgado" : "Rol removido");
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

  const { data: lotesDelUsuario = [] } = useQuery({
    queryKey: ["user-lotes", editUser?.id],
    enabled: !!editUser && (editUser.user_type === "propietario" || editUser.user_type === "comisionista"),
    queryFn: async () => {
      const { data } = await supabase
        .from("lotes")
        .select("id, nombre_lote, ciudad, estado_disponibilidad, es_publico, has_resolutoria")
        .eq("owner_id", editUser!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const toggleLoteVisibility = async (loteId: string, esPublico: boolean) => {
    const { error } = await supabase
      .from("lotes")
      .update({ es_publico: !esPublico })
      .eq("id", loteId);
    if (error) {
      toast.error("Error al cambiar visibilidad");
    } else {
      queryClient.invalidateQueries({ queryKey: ["user-lotes", editUser?.id] });
      toast.success(esPublico ? "Lote ocultado" : "Lote publicado");
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.roles.some((r) => ROLE_LABELS[r]?.toLowerCase().includes(q));
    const matchType = filterType === "todos" || u.user_type === filterType || (filterType === "admin" && u.roles.some(r => ["admin", "super_admin", "experto"].includes(r)));
    return matchSearch && matchType;
  });

  const openEditDialog = (user: UserRecord) => {
    setEditUser(user);
    setEditUserType(user.user_type ?? "");
    setSelectedOwnerId("");
    setSelectedRole("");
    setEditOpen(true);
  };

  const handleSaveUserType = () => {
    if (!editUser || !editUserType) return;
    updateTypeMutation.mutate({ user_id: editUser.id, user_type: editUserType });
  };

  const handleGrantRole = () => {
    if (!editUser || !selectedRole) return;
    roleMutation.mutate({ user_id: editUser.id, role: selectedRole, action: "grant" });
    setSelectedRole("");
  };

  const handleRevokeRole = (role: string) => {
    if (!editUser) return;
    roleMutation.mutate({ user_id: editUser.id, role, action: "revoke" });
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

  const currentEditUser = editUser ? users.find((u) => u.id === editUser.id) ?? editUser : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-sm text-muted-foreground">{users.length} usuarios registrados</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button onClick={() => setInvitarOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Agregar cliente
            </Button>
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, email o rol..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="propietario">Propietarios</SelectItem>
                <SelectItem value="comisionista">Comisionistas</SelectItem>
                <SelectItem value="desarrollador">Desarrolladores</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <InvitarClienteDialog open={invitarOpen} onOpenChange={setInvitarOpen} />

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
                      <TableHead>Nivel</TableHead>
                      <TableHead>Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                          <Users className="mx-auto mb-2 h-8 w-8" />No se encontraron usuarios
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((u) => (
                        <TableRow
                          key={u.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openEditDialog(u)}
                        >
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
                            {(u.user_type === "propietario" || u.user_type === "comisionista") && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {u.owner_ids?.length ?? 0} lotes asociados
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {u.roles.length === 0 ? (
                                <span className="text-xs text-muted-foreground">Sin roles</span>
                              ) : u.roles.map((r) => (
                                <Badge key={r} variant="outline"
                                  className={`text-[10px] ${ROLE_COLORS[r] ?? ""}`}>
                                  {ROLE_LABELS[r] ?? r}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {u.roles.includes("desarrollador") ? (
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className={`text-[10px] ${NIVEL_BADGE_CLASS[u.nivel_suscripcion] ?? ""}`}>
                                  {u.nivel_suscripcion}
                                </Badge>
                                {isAdmin && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      title="Cambiar nivel"
                                      onClick={() => setNivelDialogUser(u)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      title="Historial de cambios"
                                      onClick={() => setHistorialDialogUser(u)}
                                    >
                                      <Clock className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString("es-CO")}
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

        {/* Unified edit dialog: user type + roles + owner associations */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar usuario</DialogTitle>
              <DialogDescription>
                {currentEditUser?.full_name || currentEditUser?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* User type */}
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

              {/* Roles */}
              <div className="space-y-2">
                <Label>Roles</Label>
                {currentEditUser && currentEditUser.roles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentEditUser.roles.map((r) => (
                      <Badge key={r} variant="outline" className={`gap-1 ${ROLE_COLORS[r] ?? ""}`}>
                        {ROLE_LABELS[r] ?? r}
                        <button type="button" onClick={() => handleRevokeRole(r)}
                          className="ml-1 rounded-full hover:bg-destructive/20">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {currentEditUser && availableRolesToGrant(currentEditUser).length > 0 && (
                  <div className="flex gap-2">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Agregar rol" /></SelectTrigger>
                      <SelectContent>
                        {availableRolesToGrant(currentEditUser).map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleGrantRole}
                      disabled={!selectedRole || roleMutation.isPending}>
                      {roleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldPlus className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>

              {/* Owner associations */}
              <div className="space-y-2">
                <Label>Propietarios asociados</Label>
                <p className="text-xs text-muted-foreground">
                  Este usuario podrá ver los lotes privados de los propietarios asociados.
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
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar propietario" /></SelectTrigger>
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

              {/* Lotes del propietario */}
              {(currentEditUser?.user_type === "propietario" || currentEditUser?.user_type === "comisionista") && (
                <div className="space-y-2">
                  <Label>Lotes del propietario ({lotesDelUsuario.length})</Label>
                  {lotesDelUsuario.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Este usuario no tiene lotes publicados.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {lotesDelUsuario.map((lote) => (
                        <div key={lote.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{lote.nombre_lote}</p>
                            <p className="text-xs text-muted-foreground">{lote.ciudad} · {lote.estado_disponibilidad}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {lote.has_resolutoria && (
                              <Badge variant="default" className="text-[10px]">360°</Badge>
                            )}
                            <Badge
                              variant={lote.es_publico ? "default" : "secondary"}
                              className="text-[10px] cursor-pointer"
                              onClick={() => toggleLoteVisibility(lote.id, lote.es_publico)}
                            >
                              {lote.es_publico ? "Público" : "Privado"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <CambiarNivelDialog
          open={!!nivelDialogUser}
          onOpenChange={(v) => !v && setNivelDialogUser(null)}
          usuario={nivelDialogUser ? {
            id: nivelDialogUser.id,
            nombre: nivelDialogUser.full_name,
            email: nivelDialogUser.email,
            nivel_suscripcion: nivelDialogUser.nivel_suscripcion,
          } : null}
        />

        <HistorialNivelDialog
          open={!!historialDialogUser}
          onOpenChange={(v) => !v && setHistorialDialogUser(null)}
          usuario={historialDialogUser ? {
            id: historialDialogUser.id,
            nombre: historialDialogUser.full_name,
            email: historialDialogUser.email,
          } : null}
        />
      </div>
    </DashboardLayout>
  );
};

export default DashboardUsuarios;
