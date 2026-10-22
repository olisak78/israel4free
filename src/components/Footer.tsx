import { useT } from '../i18n/useLanguage'

/**
 * Centered site footer — attribution and project note.
 * The source name is isolated with <bdi> so it never reorders in RTL.
 */
export default function Footer() {
  const t = useT()

  return (
    <footer className="mt-12 flex flex-col items-center gap-1.5 border-t border-edge pt-6 text-center text-xs text-muted">
      <span>
        {t.footer.line1Lead}{' '}
        <bdi className="text-content">data.gov.il</bdi> {t.footer.line1Tail}
      </span>
      <span>{t.footer.line2}</span>
    </footer>
  )
}
