import { forwardRef, useEffect, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import { cn, initials, isExternal } from "@/lib/utils";

/* ──────────────────────────── Button ──────────────────────────── */

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] rounded-[var(--radius)]",
    {
      primary: "bg-primary text-white hover:bg-primary-hover shadow-[0_0_0_0_transparent] hover:shadow-[0_0_16px_0px_color-mix(in_oklab,var(--primary)_30%,transparent)]",
      secondary: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100",
      outline: "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-[#1f1f1f] dark:bg-[#0a0a0a] dark:text-zinc-100 dark:hover:bg-[#111111] dark:hover:border-[#2a2a2a]",
      ghost: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#111111] dark:hover:text-zinc-200",
      danger: "bg-red-600 text-white hover:bg-red-700",
    }[variant],
    {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-5 text-sm",
      icon: "h-10 w-10",
    }[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClasses(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

interface LinkButtonProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function LinkButton({ to, variant = "primary", size = "md", className, children, onClick }: LinkButtonProps) {
  const cls = buttonClasses(variant, size, className);
  if (isExternal(to)) {
    return <a href={to} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>{children}</a>;
  }
  return <Link to={to} className={cls} onClick={onClick}>{children}</Link>;
}

/* ──────────────────────────── Form controls ──────────────────────────── */

const fieldBase =
  "w-full rounded-[var(--radius)] border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50 dark:border-[#1f1f1f] dark:bg-[#0a0a0a] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-primary/70 dark:focus:ring-primary/10";

interface FieldWrapProps {
  label?: string;
  hint?: string;
  error?: string;
  id: string;
  children: ReactNode;
  className?: string;
}

function FieldWrap({ label, hint, error, id, children, className }: FieldWrapProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-red-500">{error}</p> : hint ? <p className="text-xs text-zinc-500 dark:text-zinc-600">{hint}</p> : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, className, wrapperClassName, id, ...rest }, ref) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrap label={label} hint={hint} error={error} id={fieldId} className={wrapperClassName}>
      <input ref={ref} id={fieldId} className={cn(fieldBase, error && "border-red-500 dark:border-red-500/70", className)} {...rest} />
    </FieldWrap>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, error, className, id, rows = 4, ...rest }, ref) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrap label={label} hint={hint} error={error} id={fieldId}>
      <textarea ref={ref} id={fieldId} rows={rows} className={cn(fieldBase, "resize-y", error && "border-red-500 dark:border-red-500/70", className)} {...rest} />
    </FieldWrap>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, hint, error, className, id, options, ...rest }: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrap label={label} hint={hint} error={error} id={fieldId}>
      <select id={fieldId} className={cn(fieldBase, "cursor-pointer", className)} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldWrap>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, hint, disabled }: ToggleProps) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4 py-1", disabled && "opacity-50")}>
      {(label || hint) && (
        <span className="flex-1">
          {label && <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</span>}
          {hint && <span className="block text-xs text-zinc-500 dark:text-zinc-600">{hint}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          checked ? "bg-primary" : "bg-zinc-200 dark:bg-[#2a2a2a]",
        )}
      >
        <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

/* ──────────────────────────── Layout ──────────────────────────── */

export function Card({ className, children, onClick, glass = true }: { className?: string; children: ReactNode; onClick?: () => void; glass?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        glass
          ? "liquid-course-card rounded-[calc(var(--radius)+4px)]"
          : "rounded-[calc(var(--radius)+4px)] border border-zinc-200/80 bg-white dark:border-[#1a1a1a] dark:bg-[#0a0a0a]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({ children, className, color }: { children: ReactNode; className?: string; color?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        !color && "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-[#1f1f1f] dark:bg-[#111111] dark:text-zinc-400",
        className,
      )}
      style={color ? { backgroundColor: `${color}14`, borderColor: `${color}30`, color } : undefined}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-semibold tracking-widest text-primary/80 uppercase">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("flex gap-0.5 overflow-x-auto rounded-[var(--radius)] bg-zinc-100 p-1 dark:bg-[#0f0f0f]", className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "min-w-0 flex-1 whitespace-nowrap rounded-[calc(var(--radius)-4px)] px-3 py-2 text-sm font-medium transition-all",
            value === t.value
              ? "bg-white text-zinc-900 shadow-sm dark:bg-[#1a1a1a] dark:text-white"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300",
          )}
        >
          {t.label}
          {typeof t.count === "number" && <span className="ml-1.5 text-xs opacity-50">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name, src, size = "md", className }: { name: string; src?: string | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const sz = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" }[size];
  if (src) return <img src={src} alt={name} className={cn("rounded-full object-cover", sz, className)} />;
  return (
    <div className={cn("flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary dark:bg-primary/15", sz, className)}>
      {initials(name)}
    </div>
  );
}

/* ──────────────────────────── Feedback ──────────────────────────── */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-6 w-6 animate-spin text-primary", className)} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-7 w-7 opacity-60" />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-zinc-100 dark:bg-[#111111]", className)} />;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[calc(var(--radius)+4px)] border border-dashed border-zinc-200 px-6 py-14 text-center dark:border-[#1f1f1f]">
      {icon && <div className="mb-3 text-zinc-300 dark:text-zinc-700">{icon}</div>}
      <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-400 dark:text-zinc-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ──────────────────────────── Modal ──────────────────────────── */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 my-auto flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-up border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800",
          { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" }[size],
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/90 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/90">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", danger = true, loading, onConfirm, onClose }: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description ?? "This action cannot be undone."}</p>
    </Modal>
  );
}