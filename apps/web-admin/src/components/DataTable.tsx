import type { ReactNode } from "react";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
};

type DataTableProps<T extends object> = {
  rows: T[];
  columns?: Column<T>[];
  loading?: boolean;
  error?: string | undefined;
  emptyMessage?: string;
};

export function DataTable<T extends object>({
  rows,
  columns,
  loading = false,
  error,
  emptyMessage = "Nenhum registro encontrado."
}: DataTableProps<T>) {
  const inferred = Object.keys(rows[0] ?? {}).map((key) => ({ key, header: key })) as Column<T>[];
  const cols = columns?.length ? columns : inferred;

  if (loading) return <StateMessage title="Carregando dados..." />;
  if (error) return <StateMessage tone="danger" title="Nao foi possivel carregar" detail={error} />;
  if (!rows.length) return <StateMessage title={emptyMessage} />;

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>{cols.map((col) => <th key={String(col.key)}>{col.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey(row, index)}>
              {cols.map((col) => <td key={String(col.key)}>{col.render ? col.render(row) : format(row[col.key as keyof T])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StateMessage({ title, detail, tone = "muted" }: { title: string; detail?: string; tone?: "muted" | "danger" }) {
  return (
    <div className={`state ${tone}`}>
      <strong>{title}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  return <span className={`pill pill-${value}`}>{value}</span>;
}

function format(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleString("pt-BR");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getRowKey<T extends object>(row: T, index: number): string {
  if ("id" in row) return String(row.id ?? index);
  return String(index);
}
