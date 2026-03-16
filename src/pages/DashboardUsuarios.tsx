import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Search, ShieldPlus, ShieldMinus, Users } from "lucide-react";
import { toast } from "sonner";

const ALL_ROLES = ["super_admin", "admin", "asesor", "dueno", "comisionista", "inversor", "developer"] as const;

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  asesor: "Asesor",
  dueno: "Dueño",
  comisionista: "Comisionista",
  inversor: "Inversor",
  developer: "Developer",
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

interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  activo: boolean;
  roles: string[];
  comisionista_doc_estado: string | null;
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

  const isSuperAdmin = myRoles.includes("super_admin");

  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-users");
      if (error) throw error;
      return data as UserRecord[];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({
      user_id,
      role,
      action,
    }: {
      user_id: string;
      role: string;
      action: "grant" | "revoke";
    }) => {
      const { data, error } = await supabase.functions.invoke("manage-user-role", {
        body: { user_id, role, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(
        dialogAction === "grant" ? "Rol otorgado correctamente" : "Rol removido correctamente"
      );
      setDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.roles.some((r) => ROLE_LABELS[r]?.toLowerCase().includes(q))
    );
  });

  const openGrantDialog = (user: UserRecord) => {
    setSelectedUser(user);
    setDialogAction("grant");
    setSelectedRole("");
    setDialogOpen(true);
  };

  const openRevokeDialog = (user: UserRecord, role: string) => {
    setSelectedUser(user);
    setDialogAction("revoke");
    setSelectedRole(role);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedUser || !selectedRole) return;
    mutation.mutate({
      user_id: selectedUser.id,
      role: selectedRole,
      action: dialogAction,
    });
  };

  const availableRolesToGrant = (user: UserRecord) =>
    ALL_ROLES.filter(
      (r) => !user.roles.includes(r) && (isSuperAdmin || r !== "super_admin")
    );

  const userTypeLabel = (t: string | null) => {
    if (t === "dueno") return "Dueño";
    if (t === "comisionista") return "Comisionista";
    if (t === "developer") return "Developer";
    return t ?? "—";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-muted-foreground">
              {users.length} usuarios registrados
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
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
                      <TableHead>Registro</TableHead>
                      <TableHead>Último acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                          <Users className="mx-auto mb-2 h-8 w-8" />
                          No se encontraron usuarios
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {u.full_name || "Sin nombre"}
                              </p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="text-sm text-muted-foreground">
                                {userTypeLabel(u.user_type)}
                              </span>
                              {u.user_type === "comisionista" && (
                                <div className="mt-0.5">
                                  <Badge variant="outline" className={`text-[10px] ${
                                    u.comisionista_doc_estado === "aprobado"
                                      ? "border-green-500 text-green-600"
                                      : u.comisionista_doc_estado === "pendiente"
                                      ? "border-yellow-500 text-yellow-600"
                                      : u.comisionista_doc_estado === "rechazado"
                                      ? "border-destructive text-destructive"
                                      : "border-muted text-muted-foreground"
                                  }`}>
                                    {u.comisionista_doc_estado === "aprobado"
                                      ? "Doc. aprobado"
                                      : u.comisionista_doc_estado === "pendiente"
                                      ? "Doc. pendiente"
                                      : u.comisionista_doc_estado === "rechazado"
                                      ? "Doc. rechazado"
                                      : "Sin documento"}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {u.roles.length === 0 ? (
                                <span className="text-xs text-muted-foreground">Sin roles</span>
                              ) : (
                                u.roles.map((r) => (
                                  <Badge
                                    key={r}
                                    variant="outline"
                                    className={`cursor-pointer text-[10px] ${ROLE_COLORS[r] ?? ""}`}
                                    onClick={() => openRevokeDialog(u, r)}
                                    title={`Clic para remover rol ${ROLE_LABELS[r]}`}
                                  >
                                    {ROLE_LABELS[r] ?? r}
                                    <ShieldMinus className="ml-1 h-3 w-3" />
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString("es-CO")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {u.last_sign_in_at
                              ? new Date(u.last_sign_in_at).toLocaleDateString("es-CO")
                              : "Nunca"}
                          </TableCell>
                          <TableCell className="text-right">
                            {availableRolesToGrant(u).length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openGrantDialog(u)}
                                title="Otorgar rol"
                              >
                                <ShieldPlus className="h-4 w-4 text-primary" />
                              </Button>
                            )}
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

        {/* Confirm dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogAction === "grant" ? "Otorgar rol" : "Remover rol"}
              </DialogTitle>
              <DialogDescription>
                {dialogAction === "grant"
                  ? `Selecciona el rol que deseas otorgar a ${selectedUser?.full_name || selectedUser?.email}`
                  : `¿Estás seguro de remover el rol "${ROLE_LABELS[selectedRole]}" de ${selectedUser?.full_name || selectedUser?.email}?`}
              </DialogDescription>
            </DialogHeader>

            {dialogAction === "grant" && (
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {selectedUser &&
                    availableRolesToGrant(selectedUser).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedRole || mutation.isPending}
                variant={dialogAction === "revoke" ? "destructive" : "default"}
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dialogAction === "grant" ? "Otorgar" : "Remover"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardUsuarios;
