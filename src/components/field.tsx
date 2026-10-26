type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string[] };

export function Field({ label, error, id, ...props }: Props) {
  const fieldId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium">{label}</label>
      <input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className="rounded-xl border border-line bg-card px-4 py-3 outline-none focus:border-ink aria-[invalid=true]:border-accent"
        {...props}
      />
      {error && <p id={`${fieldId}-error`} className="text-sm text-accent">{error.join(" ")}</p>}
    </div>
  );
}
