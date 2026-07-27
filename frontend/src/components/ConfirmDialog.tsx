import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={loading}
          type="button"
        >
          {loading ? "Excluindo..." : "Excluir"}
        </Button>
      </div>
    </Modal>
  );
}
