export function ConfirmDialog({
  title,
  body,
  warn,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  warn?: boolean;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="panel modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <p>{body}</p>
        {warn && <p className="warning">Hay roles o votos que todavía no cumplieron su función.</p>}
        <div className="row">
          <button className="primary" onClick={onConfirm}>{confirmLabel}</button>
          <button onClick={onCancel}>Seguir en esta fase</button>
        </div>
      </div>
    </div>
  );
}
