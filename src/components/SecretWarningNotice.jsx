export default function SecretWarningNotice({ warnings, acknowledged, onAcknowledge }) {
  if (!warnings?.length) return null;

  return (
    <aside className="secret-warning" role="alert">
      <div>
        <strong>Potential sensitive information detected</strong>
        <p>These patterns may contain credentials: {warnings.join(", ")}. Remove real secrets before saving or sharing code. This check is an advisory safeguard, not a security guarantee.</p>
      </div>
      <label>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => onAcknowledge(event.target.checked)}
        />
        I reviewed this warning and checked the content.
      </label>
    </aside>
  );
}
