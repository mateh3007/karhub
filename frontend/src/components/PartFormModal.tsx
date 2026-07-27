import { useState, type FormEvent } from "react";
import type { Part, PartInput } from "../types";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";

interface Props {
  part?: Part | null;
  onClose: () => void;
  onSubmit: (input: PartInput) => Promise<void>;
}

const emptyForm: PartInput = {
  name: "",
  category: "",
  currentStock: 0,
  minimumStock: 0,
  averageDailySales: 0,
  leadTimeDays: 0,
  unitCost: 0,
  criticalityLevel: 1,
};

export function PartFormModal({ part, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<PartInput>(
    part
      ? {
          name: part.name,
          category: part.category,
          currentStock: part.currentStock,
          minimumStock: part.minimumStock,
          averageDailySales: part.averageDailySales,
          leadTimeDays: part.leadTimeDays,
          unitCost: part.unitCost,
          criticalityLevel: part.criticalityLevel,
        }
      : emptyForm,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof PartInput>(
    key: K,
    value: PartInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={part ? "Editar peça" : "Nova peça"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="part-name"
          label="Nome"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
        <Input
          id="part-category"
          label="Categoria"
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="part-current-stock"
            label="Estoque atual"
            type="number"
            min={0}
            value={form.currentStock}
            onChange={(e) => updateField("currentStock", Number(e.target.value))}
            required
          />
          <Input
            id="part-minimum-stock"
            label="Estoque mínimo"
            type="number"
            min={0}
            value={form.minimumStock}
            onChange={(e) => updateField("minimumStock", Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="part-average-daily-sales"
            label="Venda média/dia"
            type="number"
            min={0}
            step="0.01"
            value={form.averageDailySales}
            onChange={(e) =>
              updateField("averageDailySales", Number(e.target.value))
            }
            required
          />
          <Input
            id="part-lead-time"
            label="Lead time (dias)"
            type="number"
            min={0}
            value={form.leadTimeDays}
            onChange={(e) => updateField("leadTimeDays", Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="part-unit-cost"
            label="Custo unitário"
            type="number"
            min={0}
            step="0.01"
            value={form.unitCost}
            onChange={(e) => updateField("unitCost", Number(e.target.value))}
            required
          />
          <Input
            id="part-criticality"
            label="Criticidade (1-5)"
            type="number"
            min={1}
            max={5}
            value={form.criticalityLevel}
            onChange={(e) =>
              updateField("criticalityLevel", Number(e.target.value))
            }
            required
          />
        </div>

        {error && <Alert>{error}</Alert>}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
