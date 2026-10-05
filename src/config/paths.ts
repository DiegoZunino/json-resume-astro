/** File names and routes shared by the pages, the build integration and the config. */
import type { ResumeConfig } from './define';

/** Routes that exist only to produce artifacts; they are removed from the published site. */
export const ARTIFACT_ROUTES = ['print', 'og'] as const;

export const pdfFile = (config: Pick<ResumeConfig, 'pdfName'>, locale: string): string =>
  `${config.pdfName}-${locale}.pdf`;
export const ogFile = (locale: string): string => `og-${locale}.png`;
