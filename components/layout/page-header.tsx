interface PageHeaderProps {
  label: string;
  title: string;
}

export function PageHeader({ label, title }: PageHeaderProps) {
  return (
    <div className="hidden border-b border-border/60 px-6 py-4 md:block">
      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <h1 className="mt-1 text-xl font-semibold text-foreground">{title}</h1>
    </div>
  );
}
