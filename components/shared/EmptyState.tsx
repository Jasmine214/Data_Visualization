interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-[8px] border border-dashed border-[#535353] bg-[#121212] p-6 text-center">
      <div>
        <p className="text-base font-bold text-white">{title}</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#b3b3b3]">{message}</p>
      </div>
    </div>
  );
}
