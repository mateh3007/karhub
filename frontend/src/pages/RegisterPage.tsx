import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/karhub-logo.png";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { RegisterPayload } from "../types";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const emptyForm: RegisterPayload = {
  corporateName: "",
  tradeName: "",
  cnpj: "",
  phone: "",
  contactEmail: "",
  adminName: "",
  adminPassword: "",
};

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterPayload>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof RegisterPayload>(
    key: K,
    value: RegisterPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível cadastrar",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src={logo} alt="KarHub" className="h-16 w-16 object-contain" />
          <h1 className="text-xl font-semibold text-karhub-navy">
            Cadastre sua empresa
          </h1>
          <p className="text-center text-sm text-gray-500">
            Cria a empresa e o usuário ADMIN responsável por ela
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Razão social"
              value={form.corporateName}
              onChange={(e) => updateField("corporateName", e.target.value)}
              required
            />
            <Input
              label="Nome fantasia"
              value={form.tradeName}
              onChange={(e) => updateField("tradeName", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="CNPJ (14 dígitos)"
              value={form.cnpj}
              onChange={(e) => updateField("cnpj", e.target.value)}
              minLength={14}
              maxLength={14}
              required
            />
            <Input
              label="Telefone"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              required
            />
          </div>

          <Input
            label="Email da empresa (também será o login do ADMIN)"
            type="email"
            value={form.contactEmail}
            onChange={(e) => updateField("contactEmail", e.target.value)}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nome do ADMIN"
              value={form.adminName}
              onChange={(e) => updateField("adminName", e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              value={form.adminPassword}
              onChange={(e) => updateField("adminPassword", e.target.value)}
              minLength={8}
              required
            />
          </div>

          {error && <Alert>{error}</Alert>}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem uma conta?{" "}
          <Link
            to="/login"
            className="font-medium text-karhub-orange hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
