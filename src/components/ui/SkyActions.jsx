/**
 * SkyActions — the two pill actions on a generated sky: Save (the keepsake
 * image) and Edit (back to the form). Plum Voltage stays the single filled
 * action; Edit is a ghost pill.
 */
export default function SkyActions({ onSave, onEdit, saving }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" className="btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save this sky'}
      </button>
      <button type="button" className="btn-ghost" onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}
