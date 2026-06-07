export function highlightMatch(text: string, query: string) {
  if (!query) return <span>{text}</span>;
  const lowerText = text.toLowerCase();
  const lowerQ = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQ);
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <span class="text-[var(--color-accent)] font-semibold">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </span>
  );
}
