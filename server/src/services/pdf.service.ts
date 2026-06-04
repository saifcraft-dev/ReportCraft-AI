import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, Image,
  Svg, Rect, Circle, G,
} from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';

/* ═══════════════════════════════════════════════════
   DIMENSIONS & HELPERS
═══════════════════════════════════════════════════ */
const A4_W       = 595;
const A4_H       = 842;
const BAND_H     = 400;          // coloured top band on cover
const H_PAD      = 44;           // horizontal content padding
const CONTENT_W  = A4_W - H_PAD * 2; // 507pt
const KPI_GAP    = 7;

function fmt(v: number | undefined | null, dec = 0): string {
  if (v == null || isNaN(v as number)) return '—';
  return (v as number).toLocaleString('en-US', {
    minimumFractionDigits: dec, maximumFractionDigits: dec,
  });
}
function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
function fmtDur(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}
type Delta = { label: string; isPos: boolean; isNA: boolean };
function calcDelta(cur: number, prev: number): Delta {
  if (!prev) return { label: 'N/A', isPos: true, isNA: true };
  const pct = ((cur - prev) / prev) * 100;
  return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, isPos: pct >= 0, isNA: false };
}

/* ═══════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════ */
const S = StyleSheet.create({
  /* ── Cover ─────────────────────────────────── */
  coverPage:        { padding: 0, backgroundColor: '#ffffff' },
  coverBand:        { width: A4_W, height: BAND_H, position: 'relative', overflow: 'hidden' },
  coverBandInner:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      padding: 48, paddingTop: 42, flexDirection: 'column', justifyContent: 'space-between' },
  coverAgencyName:  { fontSize: 12, color: '#ffffff', fontFamily: 'Helvetica-Bold', letterSpacing: 0.3 },
  coverLogo:        { height: 26, maxWidth: 130, objectFit: 'contain' },
  coverLabel:       { fontSize: 8, color: 'rgba(255,255,255,0.5)', fontFamily: 'Helvetica',
                      letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 },
  coverClient:      { fontSize: 34, color: '#ffffff', fontFamily: 'Helvetica-Bold', lineHeight: 1.06 },
  coverDate:        { fontSize: 10.5, color: 'rgba(255,255,255,0.65)', fontFamily: 'Helvetica', marginTop: 10 },

  /* Cover — white meta area */
  coverMeta:        { flex: 1, paddingHorizontal: 48, paddingTop: 30, paddingBottom: 32,
                      flexDirection: 'column' },
  coverDivider:     { height: 1.5, marginBottom: 22 },
  coverSectionLbl:  { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase',
                      letterSpacing: 1.5, marginBottom: 10 },
  coverMetaRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9 },
  coverMetaKey:     { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#94A3B8',
                      textTransform: 'uppercase', letterSpacing: 0.8, width: 96 },
  coverMetaVal:     { fontSize: 9.5, fontFamily: 'Helvetica', color: '#1E293B', flex: 1 },
  coverPlatformRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  coverPlatformPill:{ flex: 1, borderWidth: 1, borderRadius: 6, padding: 10,
                      flexDirection: 'column', gap: 5 },
  coverPillDot:     { width: 7, height: 7, borderRadius: 4 },
  coverPillName:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#334155' },
  coverPillStatus:  { fontSize: 6.5, fontFamily: 'Helvetica', color: '#22C55E' },
  coverSpacer:      { flex: 1 },
  coverTagRow:      { flexDirection: 'row', gap: 8, paddingTop: 16 },
  coverTag:         { borderWidth: 1, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 4 },
  coverTagText:     { fontSize: 7, fontFamily: 'Helvetica-Bold',
                      textTransform: 'uppercase', letterSpacing: 1.2 },
  coverBottomBar:   { height: 5, position: 'absolute', bottom: 0, left: 0, right: 0 },

  /* ── Content page ────────────────────────── */
  contentPage:      { paddingHorizontal: H_PAD, paddingTop: 0, paddingBottom: 0,
                      backgroundColor: '#ffffff' },

  /* Running header */
  runHeader:        { marginBottom: 10 },
  runHeaderBar:     { height: 3 },
  runHeaderRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  runHeaderLeft:    { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#475569',
                      textTransform: 'uppercase', letterSpacing: 0.6 },
  runHeaderRight:   { fontSize: 7.5, fontFamily: 'Helvetica', color: '#94A3B8' },

  /* Content body wrapper */
  contentBody:      { flex: 1, paddingBottom: 50 },

  /* Running footer */
  runFooter:        { marginTop: 10 },
  runFooterLine:    { height: 0.5, backgroundColor: '#E2E8F0', marginBottom: 7 },
  runFooterRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      paddingBottom: 14 },
  runFooterText:    { fontSize: 7, color: '#94A3B8', fontFamily: 'Helvetica' },

  /* Section heading */
  sectionWrap:      { marginTop: 20, marginBottom: 10 },
  sectionRow:       { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  sectionDot:       { width: 8, height: 8, borderRadius: 4 },
  sectionTitle:     { fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase',
                      letterSpacing: 0.5 },
  sectionRule:      { height: 1 },

  /* Platform overview table */
  tableWrap:        { marginBottom: 18 },
  tableHead:        { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10,
                      borderRadius: 4, marginBottom: 2 },
  tableHeadCell:    { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase',
                      letterSpacing: 0.6 },
  tableRow:         { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10,
                      borderBottomWidth: 0.5, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  tablePlatform:    { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0F172A', flex: 2 },
  tableMetric:      { fontSize: 8.5, fontFamily: 'Helvetica', color: '#334155',
                      flex: 1.5, textAlign: 'right' },
  tableMetricSub:   { fontSize: 6, fontFamily: 'Helvetica', color: '#94A3B8', textAlign: 'right' },
  tableDeltaPos:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16A34A',
                      flex: 1, textAlign: 'right' },
  tableDeltaNeg:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#DC2626',
                      flex: 1, textAlign: 'right' },
  tableDeltaNA:     { fontSize: 8, fontFamily: 'Helvetica', color: '#94A3B8',
                      flex: 1, textAlign: 'right' },

  /* KPI card */
  kpiRow:           { flexDirection: 'row', gap: KPI_GAP },
  kpiCard:          { backgroundColor: '#F8FAFC', borderRadius: 6, borderLeftWidth: 3,
                      paddingTop: 9, paddingBottom: 9, paddingRight: 9, paddingLeft: 10 },
  kpiLabel:         { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#64748B',
                      textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 4 },
  kpiValue:         { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#0F172A',
                      lineHeight: 1.1, marginBottom: 3 },
  kpiDeltaPos:      { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#16A34A' },
  kpiDeltaNeg:      { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#DC2626' },
  kpiDeltaNA:       { fontSize: 7.5, fontFamily: 'Helvetica', color: '#94A3B8' },

  /* AI narrative */
  aiHeaderRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
                      borderRadius: 6, marginBottom: 10, borderWidth: 1 },
  aiBadge:          { width: 30, height: 30, borderRadius: 5,
                      alignItems: 'center', justifyContent: 'center' },
  aiBadgeText:      { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  aiTitle:          { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  aiSub:            { fontSize: 8, fontFamily: 'Helvetica', color: '#64748B', marginTop: 2 },
  narrBlock:        { marginBottom: 10, paddingLeft: 12, borderLeftWidth: 3 },
  narrTitle:        { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  narrBody:         { fontSize: 9, color: '#334155', fontFamily: 'Helvetica', lineHeight: 1.75 },

  watermark:        { fontSize: 6.5, color: '#CBD5E1', textAlign: 'center',
                      marginTop: 24, fontFamily: 'Helvetica' },
});

/* ═══════════════════════════════════════════════════
   COVER BAND SVG
═══════════════════════════════════════════════════ */
function CoverSvg({ color }: { color: string }) {
  return React.createElement(Svg,
    { viewBox: `0 0 ${A4_W} ${BAND_H}`, width: A4_W, height: BAND_H,
      style: { position: 'absolute', top: 0, left: 0 } },
    React.createElement(Rect, { x: 0, y: 0, width: A4_W, height: BAND_H, fill: color }),
    // Layered decorative circles
    React.createElement(Circle, { cx: 530, cy: -20, r: 230, fill: 'white', fillOpacity: 0.055 }),
    React.createElement(Circle, { cx: 555, cy: BAND_H + 30, r: 180, fill: 'white', fillOpacity: 0.04 }),
    React.createElement(Circle, { cx: -30, cy: 230, r: 155, fill: 'white', fillOpacity: 0.04 }),
    React.createElement(Circle, { cx: 300, cy: BAND_H + 10, r: 110, fill: 'white', fillOpacity: 0.03 }),
    // Diagonal accent stripes
    React.createElement(G, { opacity: 0.04 },
      React.createElement(Rect, { x: 355, y: -60, width: 40, height: BAND_H + 120,
        fill: 'white', transform: 'rotate(-17 355 0)' }),
      React.createElement(Rect, { x: 450, y: -60, width: 22, height: BAND_H + 120,
        fill: 'white', transform: 'rotate(-17 450 0)' }),
    ),
    // Bottom edge highlight
    React.createElement(Rect, { x: 0, y: BAND_H - 3, width: A4_W, height: 3,
      fill: 'white', fillOpacity: 0.15 }),
  );
}

/* ═══════════════════════════════════════════════════
   PLATFORM PILL  (cover page connected sources)
═══════════════════════════════════════════════════ */
function PlatformPill({ name, color }: { name: string; color: string }) {
  return React.createElement(View,
    { style: [S.coverPlatformPill, { borderColor: color + '35', backgroundColor: color + '07' }] },
    React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 5 } },
      React.createElement(View, { style: [S.coverPillDot, { backgroundColor: color }] }),
      React.createElement(Text, { style: S.coverPillName }, name),
    ),
    React.createElement(Text, { style: S.coverPillStatus }, '✓  Connected'),
  );
}

/* ═══════════════════════════════════════════════════
   SECTION HEADING
═══════════════════════════════════════════════════ */
function SectionHeading({ title, color }: { title: string; color: string }) {
  return React.createElement(View, { style: S.sectionWrap },
    React.createElement(View, { style: S.sectionRow },
      React.createElement(View, { style: [S.sectionDot, { backgroundColor: color }] }),
      React.createElement(Text, { style: [S.sectionTitle, { color }] }, title),
    ),
    React.createElement(View, { style: [S.sectionRule, { backgroundColor: color + '28' }] }),
  );
}

/* ═══════════════════════════════════════════════════
   KPI CARD
═══════════════════════════════════════════════════ */
interface KpiProps {
  label: string; value: string; delta: Delta;
  invertGood?: boolean; color: string; width: number;
}
function KpiCard({ label, value, delta, invertGood, color, width }: KpiProps) {
  const good   = invertGood ? !delta.isPos : delta.isPos;
  const dStyle = delta.isNA ? S.kpiDeltaNA : (good ? S.kpiDeltaPos : S.kpiDeltaNeg);
  const arrow  = delta.isNA ? '' : (delta.isPos ? '↑ ' : '↓ ');
  const dText  = delta.isNA ? 'N/A' : arrow + delta.label.replace(/^[+-]/, '');
  return React.createElement(View, { style: [S.kpiCard, { borderLeftColor: color, width }] },
    React.createElement(Text, { style: S.kpiLabel }, label),
    React.createElement(Text, { style: S.kpiValue }, value),
    React.createElement(Text, { style: dStyle }, dText),
  );
}

/* ═══════════════════════════════════════════════════
   KPI GRID  — fixed-width cards, no filler views
═══════════════════════════════════════════════════ */
interface KpiMetric { label: string; value: string; delta: Delta; invertGood?: boolean }
function KpiGrid({ metrics, color, perRow = 4 }: {
  metrics: KpiMetric[]; color: string; perRow?: number;
}) {
  // Compute card width to be consistent regardless of row length
  const cardW = (CONTENT_W - (perRow - 1) * KPI_GAP) / perRow;
  const rows: KpiMetric[][] = [];
  for (let i = 0; i < metrics.length; i += perRow) rows.push(metrics.slice(i, i + perRow));

  return React.createElement(View, { style: { marginBottom: 16 } },
    ...rows.map((row, ri) =>
      React.createElement(View, {
        key: ri,
        style: [S.kpiRow, { marginBottom: ri < rows.length - 1 ? KPI_GAP : 0 }],
      },
        ...row.map(m =>
          React.createElement(KpiCard, { key: m.label, ...m, color, width: cardW })
        ),
      )
    ),
  );
}

/* ═══════════════════════════════════════════════════
   PLATFORM OVERVIEW TABLE
═══════════════════════════════════════════════════ */
function OverviewTable({ rawData, color }: { rawData: any; color: string }) {
  type Row = { platform: string; primary: string; primaryLbl: string;
               secondary: string; secondaryLbl: string; d: Delta };
  const rows: Row[] = [];
  if (rawData?.ga4) rows.push({
    platform: 'Google Analytics 4',
    primary: fmt(rawData.ga4.sessions), primaryLbl: 'Sessions',
    secondary: fmt(rawData.ga4.users),  secondaryLbl: 'Users',
    d: calcDelta(rawData.ga4.sessions, rawData.ga4.sessionsPrev),
  });
  if (rawData?.googleAds) rows.push({
    platform: 'Google Ads',
    primary: `$${fmt(rawData.googleAds.spend, 0)}`, primaryLbl: 'Spend',
    secondary: `${fmt(rawData.googleAds.roas, 2)}x`, secondaryLbl: 'ROAS',
    d: calcDelta(rawData.googleAds.roas, rawData.googleAds.roasPrev),
  });
  if (rawData?.meta) rows.push({
    platform: 'Meta Ads',
    primary: `$${fmt(rawData.meta.spend, 0)}`, primaryLbl: 'Spend',
    secondary: `${fmt(rawData.meta.roas, 2)}x`, secondaryLbl: 'ROAS',
    d: calcDelta(rawData.meta.roas, rawData.meta.roasPrev),
  });
  if (!rows.length) return null;

  return React.createElement(View, { style: S.tableWrap },
    React.createElement(View, { style: [S.tableHead, { backgroundColor: color + '12' }] },
      React.createElement(Text, { style: [S.tableHeadCell, { flex: 2, color }] }, 'Platform'),
      React.createElement(Text, { style: [S.tableHeadCell, { flex: 1.5, textAlign: 'right', color }] }, 'Primary'),
      React.createElement(Text, { style: [S.tableHeadCell, { flex: 1.5, textAlign: 'right', color }] }, 'Secondary'),
      React.createElement(Text, { style: [S.tableHeadCell, { flex: 1, textAlign: 'right', color }] }, 'vs Prev'),
    ),
    ...rows.map((r, i) => {
      const dStyle = r.d.isNA ? S.tableDeltaNA : (r.d.isPos ? S.tableDeltaPos : S.tableDeltaNeg);
      const dText  = r.d.isNA ? 'N/A' : (r.d.isPos ? '↑ ' : '↓ ') + r.d.label.replace(/^[+-]/, '');
      return React.createElement(View, {
        key: i,
        style: [S.tableRow, { backgroundColor: i % 2 === 0 ? '#FAFAFA' : '#ffffff' }],
      },
        React.createElement(Text, { style: S.tablePlatform }, r.platform),
        React.createElement(View, { style: { flex: 1.5, alignItems: 'flex-end' } },
          React.createElement(Text, { style: S.tableMetric }, r.primary),
          React.createElement(Text, { style: S.tableMetricSub }, r.primaryLbl),
        ),
        React.createElement(View, { style: { flex: 1.5, alignItems: 'flex-end' } },
          React.createElement(Text, { style: S.tableMetric }, r.secondary),
          React.createElement(Text, { style: S.tableMetricSub }, r.secondaryLbl),
        ),
        React.createElement(Text, { style: dStyle }, dText),
      );
    }),
  );
}

/* ═══════════════════════════════════════════════════
   NARRATIVE BLOCK
═══════════════════════════════════════════════════ */
function NarrBlock({ title, body, color }: { title: string; body: string; color: string }) {
  const clean = title.replace(/^[\p{Emoji}\s]+/u, '').trim();
  return React.createElement(View, { style: [S.narrBlock, { borderLeftColor: color + 'aa' }] },
    React.createElement(Text, { style: [S.narrTitle, { color }] }, clean),
    React.createElement(Text, { style: S.narrBody }, body),
  );
}

/* ═══════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════ */
export async function generatePDF(report: any, agency: any, client: any): Promise<Buffer> {
  const rawData   = report.rawData   as any;
  const narrative = report.narrative as any;
  const color     = agency?.brandColor || '#6366F1';
  const isAgency  = ['AGENCY', 'AGENCY_PRO'].includes(agency?.subscriptionTier);

  const agencyName = agency?.name || 'ReportCraft AI';
  const clientName = client?.name  || 'Client';
  const startDate  = fmtDate(report.dateRangeStart);
  const endDate    = fmtDate(report.dateRangeEnd);
  const dateRange  = `${startDate} – ${endDate}`;
  const genDate    = fmtDate(new Date());
  const tone       = report.narrativeTone
    ? report.narrativeTone.charAt(0).toUpperCase() + report.narrativeTone.slice(1)
    : 'Professional';

  /* ── connected platform pills ── */
  const platformPills: React.ReactElement[] = [];
  if (rawData?.ga4)        platformPills.push(React.createElement(PlatformPill, { key: 'ga4',  name: 'Google Analytics 4', color }));
  if (rawData?.googleAds)  platformPills.push(React.createElement(PlatformPill, { key: 'gads', name: 'Google Ads',         color }));
  if (rawData?.meta)       platformPills.push(React.createElement(PlatformPill, { key: 'meta', name: 'Meta Ads',           color }));

  /* ══════════════════════════════════════════
     PAGE 1  —  COVER
  ══════════════════════════════════════════ */
  const coverPage = React.createElement(Page, { key: 'cover', size: 'A4', style: S.coverPage },

    /* Coloured band */
    React.createElement(View, { style: S.coverBand },
      React.createElement(CoverSvg, { color }),
      React.createElement(View, { style: S.coverBandInner },
        /* Agency mark — top of band */
        React.createElement(View, {},
          agency?.logoUrl
            ? React.createElement(Image, { src: agency.logoUrl, style: S.coverLogo })
            : React.createElement(Text, { style: S.coverAgencyName }, agencyName),
        ),
        /* Client identity — bottom of band */
        React.createElement(View, {},
          React.createElement(Text, { style: S.coverLabel }, 'Performance Report'),
          React.createElement(Text, { style: S.coverClient }, clientName),
          React.createElement(Text, { style: S.coverDate }, dateRange),
        ),
      ),
    ),

    /* White metadata section */
    React.createElement(View, { style: S.coverMeta },

      /* Thin brand divider */
      React.createElement(View, { style: [S.coverDivider, { backgroundColor: color }] }),

      /* "REPORT DETAILS" heading */
      React.createElement(Text, { style: [S.coverSectionLbl, { color: color }] }, 'Report Details'),

      /* Metadata rows */
      React.createElement(View, { style: { marginBottom: 4 } },
        React.createElement(View, { style: S.coverMetaRow },
          React.createElement(Text, { style: S.coverMetaKey }, 'Prepared by'),
          React.createElement(Text, { style: S.coverMetaVal }, agencyName),
        ),
        React.createElement(View, { style: S.coverMetaRow },
          React.createElement(Text, { style: S.coverMetaKey }, 'Report period'),
          React.createElement(Text, { style: S.coverMetaVal }, dateRange),
        ),
        React.createElement(View, { style: S.coverMetaRow },
          React.createElement(Text, { style: S.coverMetaKey }, 'Generated on'),
          React.createElement(Text, { style: S.coverMetaVal }, genDate),
        ),
        React.createElement(View, { style: S.coverMetaRow },
          React.createElement(Text, { style: S.coverMetaKey }, 'Narrative tone'),
          React.createElement(Text, { style: S.coverMetaVal }, tone),
        ),
        narrative?.wordCount && React.createElement(View, { style: S.coverMetaRow },
          React.createElement(Text, { style: S.coverMetaKey }, 'AI analysis'),
          React.createElement(Text, { style: S.coverMetaVal }, `${narrative.wordCount} words`),
        ),
      ),

      /* "DATA SOURCES" + platform pills */
      platformPills.length > 0 && React.createElement(View, {},
        React.createElement(Text, { style: [S.coverSectionLbl, { color, marginTop: 16 }] }, 'Data Sources'),
        React.createElement(View, { style: S.coverPlatformRow },
          ...platformPills,
        ),
      ),

      /* Spacer */
      React.createElement(View, { style: S.coverSpacer }),

      /* Confidential tags */
      React.createElement(View, { style: S.coverTagRow },
        React.createElement(View, { style: [S.coverTag, { borderColor: color + '50', backgroundColor: color + '10' }] },
          React.createElement(Text, { style: [S.coverTagText, { color }] }, 'Confidential'),
        ),
        React.createElement(View, { style: [S.coverTag, { borderColor: '#E2E8F0' }] },
          React.createElement(Text, { style: [S.coverTagText, { color: '#64748B' }] }, 'AI-Generated Insights'),
        ),
      ),
    ),

    /* Thin bottom accent bar */
    React.createElement(View, { style: [S.coverBottomBar, { backgroundColor: color }] }),
  );

  /* ══════════════════════════════════════════
     PAGE 2+  —  CONTENT
     Layout: header (fixed) | body | footer (fixed)
     Using fixed: true in normal page flow to avoid
     the absolute-positioning "ghost text" bug.
  ══════════════════════════════════════════ */

  /* Running header (fixed — repeats on every physical page) */
  const runningHeader = React.createElement(View, { style: S.runHeader, fixed: true },
    React.createElement(View, { style: [S.runHeaderBar, { backgroundColor: color }] }),
    React.createElement(View, { style: S.runHeaderRow },
      React.createElement(Text, { style: S.runHeaderLeft }, agencyName),
      React.createElement(Text, { style: S.runHeaderRight },
        `${clientName}  ·  ${dateRange}`,
      ),
    ),
  );

  /* Running footer (fixed — repeats on every physical page) */
  const runningFooter = React.createElement(View, { style: S.runFooter, fixed: true },
    React.createElement(View, { style: S.runFooterLine }),
    React.createElement(View, { style: S.runFooterRow },
      React.createElement(Text, { style: S.runFooterText }, `${agencyName}  ·  Confidential`),
      React.createElement(Text, { style: S.runFooterText }, genDate),
      React.createElement(Text, {
        style: S.runFooterText,
        render: ({ pageNumber, totalPages }: any) =>
          `Page ${pageNumber - 1} of ${totalPages - 1}`,
      }),
    ),
  );

  const contentPage = React.createElement(Page, { key: 'content', size: 'A4', style: S.contentPage },
    runningHeader,

    React.createElement(View, { style: S.contentBody },

      /* ── Platform Overview ── */
      (rawData?.ga4 || rawData?.googleAds || rawData?.meta) && React.createElement(View, {},
        React.createElement(SectionHeading, { title: 'Platform Overview', color }),
        React.createElement(OverviewTable, { rawData, color }),
      ),

      /* ── GA4 ── */
      rawData?.ga4 && React.createElement(View, {},
        React.createElement(SectionHeading, { title: 'Google Analytics 4', color }),
        React.createElement(KpiGrid, {
          color, perRow: 3,
          metrics: [
            { label: 'Sessions',      value: fmt(rawData.ga4.sessions),
              delta: calcDelta(rawData.ga4.sessions, rawData.ga4.sessionsPrev) },
            { label: 'Users',         value: fmt(rawData.ga4.users),
              delta: calcDelta(rawData.ga4.users, rawData.ga4.usersPrev) },
            { label: 'Pageviews',     value: fmt(rawData.ga4.pageviews),
              delta: calcDelta(rawData.ga4.pageviews, rawData.ga4.pageviewsPrev) },
            { label: 'Bounce Rate',   value: `${fmt(rawData.ga4.bounceRate * 100, 1)}%`,
              delta: calcDelta(rawData.ga4.bounceRate, rawData.ga4.bounceRatePrev), invertGood: true },
            { label: 'Conv. Rate',    value: `${fmt(rawData.ga4.conversionRate * 100, 2)}%`,
              delta: calcDelta(rawData.ga4.conversionRate, rawData.ga4.conversionRatePrev) },
            { label: 'Avg. Session',  value: fmtDur(rawData.ga4.avgSessionDuration),
              delta: calcDelta(rawData.ga4.avgSessionDuration, rawData.ga4.avgSessionDurationPrev) },
          ],
        }),
      ),

      /* ── Google Ads ── */
      rawData?.googleAds && React.createElement(View, {},
        React.createElement(SectionHeading, { title: 'Google Ads', color }),
        React.createElement(KpiGrid, {
          color, perRow: 4,
          metrics: [
            { label: 'Spend',        value: `$${fmt(rawData.googleAds.spend, 0)}`,
              delta: calcDelta(rawData.googleAds.spend, rawData.googleAds.spendPrev), invertGood: true },
            { label: 'Impressions',  value: fmt(rawData.googleAds.impressions),
              delta: calcDelta(rawData.googleAds.impressions, rawData.googleAds.impressionsPrev) },
            { label: 'Clicks',       value: fmt(rawData.googleAds.clicks),
              delta: calcDelta(rawData.googleAds.clicks, rawData.googleAds.clicksPrev) },
            { label: 'CTR',          value: `${fmt(rawData.googleAds.ctr * 100, 2)}%`,
              delta: calcDelta(rawData.googleAds.ctr, rawData.googleAds.ctrPrev) },
            { label: 'CPC',          value: `$${fmt(rawData.googleAds.cpc, 2)}`,
              delta: calcDelta(rawData.googleAds.cpc, rawData.googleAds.cpcPrev), invertGood: true },
            { label: 'ROAS',         value: `${fmt(rawData.googleAds.roas, 2)}x`,
              delta: calcDelta(rawData.googleAds.roas, rawData.googleAds.roasPrev) },
            { label: 'Conversions',  value: fmt(rawData.googleAds.conversions),
              delta: calcDelta(rawData.googleAds.conversions, rawData.googleAds.conversionsPrev) },
            { label: 'Conv. Rate',   value: `${fmt((rawData.googleAds.conversionRate ?? 0) * 100, 2)}%`,
              delta: calcDelta(rawData.googleAds.conversionRate, rawData.googleAds.conversionRatePrev) },
          ],
        }),
      ),

      /* ── Meta Ads ── */
      rawData?.meta && React.createElement(View, {},
        React.createElement(SectionHeading, { title: 'Meta Ads', color }),
        React.createElement(KpiGrid, {
          color, perRow: 4,
          metrics: [
            { label: 'Spend',        value: `$${fmt(rawData.meta.spend, 0)}`,
              delta: calcDelta(rawData.meta.spend, rawData.meta.spendPrev), invertGood: true },
            { label: 'Impressions',  value: fmt(rawData.meta.impressions),
              delta: calcDelta(rawData.meta.impressions, rawData.meta.impressionsPrev) },
            { label: 'Reach',        value: fmt(rawData.meta.reach),
              delta: calcDelta(rawData.meta.reach, rawData.meta.reachPrev) },
            { label: 'Clicks',       value: fmt(rawData.meta.clicks),
              delta: calcDelta(rawData.meta.clicks, rawData.meta.clicksPrev) },
            { label: 'CTR',          value: `${fmt(rawData.meta.ctr * 100, 3)}%`,
              delta: calcDelta(rawData.meta.ctr, rawData.meta.ctrPrev) },
            { label: 'CPM',          value: `$${fmt(rawData.meta.cpm, 2)}`,
              delta: calcDelta(rawData.meta.cpm, rawData.meta.cpmPrev), invertGood: true },
            { label: 'ROAS',         value: `${fmt(rawData.meta.roas, 2)}x`,
              delta: calcDelta(rawData.meta.roas, rawData.meta.roasPrev) },
            { label: 'Frequency',    value: fmt(rawData.meta.frequency, 2),
              delta: calcDelta(rawData.meta.frequency, rawData.meta.frequencyPrev), invertGood: true },
          ],
        }),
      ),

      /* ── AI Narrative ── */
      narrative && React.createElement(View, {},
        React.createElement(SectionHeading, { title: 'AI Insight Analysis', color }),

        React.createElement(View, {
          style: [S.aiHeaderRow, { borderColor: color + '28', backgroundColor: color + '08' }],
        },
          React.createElement(View, { style: [S.aiBadge, { backgroundColor: color }] },
            React.createElement(Text, { style: S.aiBadgeText }, 'AI'),
          ),
          React.createElement(View, {},
            React.createElement(Text, { style: S.aiTitle }, 'AI Insight Write — Cross-Channel Analysis'),
            React.createElement(Text, { style: S.aiSub },
              `${tone} tone`
              + (narrative.wordCount ? `  ·  ${narrative.wordCount} words` : '')
              + (report.aiModel      ? `  ·  ${report.aiModel}`            : ''),
            ),
          ),
        ),

        ...[
          { title: '📊 Executive Summary',    body: narrative.executiveSummary },
          { title: '📈 Campaign Performance', body: narrative.campaignPerformance },
          { title: '🏆 Key Wins',             body: narrative.keyWins },
          { title: '⚠️ Areas of Concern',     body: narrative.areasOfConcern },
          { title: '🎯 Recommendations',      body: narrative.recommendations },
        ].filter(s => s.body).map(s =>
          React.createElement(NarrBlock, { key: s.title, title: s.title, body: s.body, color })
        ),

        !isAgency && React.createElement(Text, { style: S.watermark },
          'Generated with ReportCraft AI  ·  reportcraft.ai',
        ),
      ),
    ),

    runningFooter,
  );

  const doc = React.createElement(
    Document,
    { title: `${clientName} — Performance Report — ${dateRange}`, author: agencyName },
    coverPage,
    contentPage,
  );

  return await renderToBuffer(doc);
}
