/**
 * Renders trusted HTML body_content from the brief. Content is authored by the
 * site owner (not user input), so dangerouslySetInnerHTML is acceptable here.
 * Inline editor artefacts (caret-color/color styles, ca:// helper buttons) are
 * stripped so the brand theme controls colour and spacing.
 */
export default function RichText({ html, className = '' }: { html: string; className?: string }) {
  const cleaned = html
    // remove inline color / caret-color styles that fight the theme
    .replace(/\s*(caret-color|color)\s*:\s*[^;"]+;?/gi, '')
    // remove leftover empty style attributes
    .replace(/\sstyle="\s*"/gi, '')
    // strip the editor's "Refine this / Adjust this" helper spans
    .replace(/<span[^>]*data-url="ca:\/\/[^"]*"[^>]*>.*?<\/span>/gi, '')
    .replace(/\b(Refine|Adjust|Improve)\s+\.?\s*(this[^.]*)?\./gi, '');

  return (
    <div
      className={`prose-pickle ${className}`}
      dangerouslySetInnerHTML={{ __html: cleaned }}
    />
  );
}
