import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type LegalSection = {
    heading: string;
    paragraphs: string[];
};

type LegalDocumentProps = {
    /** Namespace key under legal.<doc> */
    doc: 'privacy' | 'terms' | 'returns' | 'cookies' | 'complaints';
    children?: ReactNode;
};

/**
 * Plantilla tipografica para documentos legales.
 * El copy vive en lang/{locale}/legal.json.
 */
export function LegalDocument({ doc, children }: LegalDocumentProps) {
    const { t, i18n } = useTranslation('legal');
    const title = t(`${doc}.title`);
    const updated = t(`${doc}.updated`);
    const intro = t(`${doc}.intro`, { defaultValue: '' });
    const sections = t(`${doc}.sections`, {
        returnObjects: true,
        defaultValue: [],
    }) as LegalSection[];

    return (
        <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16 lg:px-8">
            <header className="border-b border-border/60 pb-8">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t('meta.legal_label')}
                </p>
                <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                    {title}
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    {t('meta.updated_prefix')}: {updated}
                </p>
                {intro ? (
                    <p className="mt-6 text-base leading-relaxed text-foreground/90">
                        {intro}
                    </p>
                ) : null}
            </header>

            <div className="prose-legal mt-10 space-y-10">
                {Array.isArray(sections)
                    ? sections.map((section, index) => (
                          <section key={`${doc}-${index}`}>
                              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                                  {section.heading}
                              </h2>
                              <div className="mt-3 space-y-3">
                                  {(section.paragraphs ?? []).map((p, i) => (
                                      <p
                                          key={i}
                                          className="text-sm leading-relaxed text-muted-foreground md:text-[15px]"
                                      >
                                          {p}
                                      </p>
                                  ))}
                              </div>
                          </section>
                      ))
                    : null}
                {children}
            </div>

            <p className="mt-12 text-xs text-muted-foreground" lang={i18n.language}>
                {t('meta.disclaimer')}
            </p>
        </article>
    );
}
