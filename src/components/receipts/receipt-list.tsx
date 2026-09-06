import { ReceiptDeleteButton } from "./receipt-delete-button";

export type ReceiptItem = { byteSize: number; createdAt: string; fileName: string; id: string; mimeType: string };

export function ReceiptList({ attachments, expenseId }: { attachments: ReceiptItem[]; expenseId: string }) {
  if (attachments.length === 0) return <p className="mt-4 text-secondary text-foreground-muted">No receipts attached.</p>;
  return (
    <ul className="mt-4">
      {attachments.map((attachment) => (
        <li className="flex flex-col gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between" key={attachment.id}>
          <div className="min-w-0">
            <a className="inline-flex min-h-11 items-center break-words text-label text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={`/expenses/${expenseId}/receipts/${attachment.id}`} target="_blank" rel="noreferrer">{attachment.fileName}</a>
            <p className="mt-1 text-caption text-foreground-muted">{Math.ceil(attachment.byteSize / 1024)} KB</p>
          </div>
          <ReceiptDeleteButton attachmentId={attachment.id} expenseId={expenseId} />
        </li>
      ))}
    </ul>
  );
}
