import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, Image,
  Svg, Rect, Circle, Line, Polygon, G, Path,
} from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const PW = 595;   // A4 width pt
const PH = 842;   // A4 height pt
const ML = 52;    // margin left
const MR = 52;    // margin right
const CW = PW - ML - MR;  // content width = 491pt

/* ═══════════════════════════════════════════════════════════════
   FORMAT HELPERS
═══════════════════════════════════════════════════════════════ */
function fmt(v: number | undefined | null, dec = 0): string {
  if (v == null || isNaN(v as number)) return '—';
  return (v as number).toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}
function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}
function fmtDateShort(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
function fmtDur(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}
function hex2rgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const full = c.length === 3
    ? c.split('').map(x => x + x).join('')
    : c;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}
function withOpacity(hex: string, alpha: number): string {
  const [r, g, b] = hex2rgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hex2rgb(hex);
  const l = (v: number) => Math.min(255, Math.round(v + (255 - v) * amount));
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(l(r))}${toHex(l(g))}${toHex(l(b))}`;
}

type Delta = { pct: number; label: string; isPos: boolean; isNA: boolean };
function calcDelta(cur: number | undefined, prev: number | undefined): Delta {
  if (!cur || !prev || prev === 0) return { pct: 0, label: 'N/A', isPos: true, isNA: true };
  const pct = ((cur - prev) / prev) * 100;
  return {
    pct,
    label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
    isPos: pct >= 0,
    isNA: false,
  };
}

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS (computed from brand color at render time)
═══════════════════════════════════════════════════════════════ */
interface Tokens {
  primary: string;
  primaryLight: string;   // very light tint for backgrounds
  primaryMid: string;     // medium tint for borders/accents
  dark: string;
  mid: string;
  muted: string;
  border: string;
  surface: string;
  success: string;
  error: string;
}
function makeTokens(brandColor: string): Tokens {
  return {
    primary: brandColor,
    primaryLight: withOpacity(brandColor, 0.08),
    primaryMid: withOpacity(brandColor, 0.25),
    dark: '#0F172A',
    mid: '#475569',
    muted: '#94A3B8',
    border: '#E2E8F0',
    surface: '#F8FAFC',
    success: '#16A34A',
    error: '#DC2626',
  };
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */
const S = StyleSheet.create({
  /* ── Pages ── */
  coverPage:   { width: PW, height: PH, backgroundColor: '#ffffff', position: 'relative', padding: 0 },
  contentPage: { paddingHorizontal: ML, paddingTop: 0, paddingBottom: 0, backgroundColor: '#ffffff' },

  /* ── Running header ── */
  rHdr:        { marginBottom: 18 },
  rHdrBar:     { height: 4, marginBottom: 0 },
  rHdrRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 paddingTop: 8, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  rHdrL:       { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569',
                 textTransform: 'uppercase', letterSpacing: 1 },
  rHdrR:       { fontSize: 7, fontFamily: 'Helvetica', color: '#94A3B8' },

  /* ── Running footer ── */
  rFtr:        { marginTop: 12 },
  rFtrLine:    { height: 0.5, backgroundColor: '#E2E8F0', marginBottom: 6 },
  rFtrRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 },
  rFtrTxt:     { fontSize: 6.5, color: '#94A3B8', fontFamily: 'Helvetica' },

  /* ── Section heading ── */
  secWrap:     { marginTop: 22, marginBottom: 12 },
  secRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  secNum:      { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5,
                 textTransform: 'uppercase' },
  secTitle:    { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0F172A', letterSpacing: 0.2 },
  secRule:     { height: 1 },

  /* ── KPI card ── */
  kpiGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  kpiCard:     { backgroundColor: '#F8FAFC', borderRadius: 5, padding: 11,
                 borderTopWidth: 3, flexDirection: 'column', gap: 4 },
  kpiLbl:      { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#64748B',
                 textTransform: 'uppercase', letterSpacing: 1.2 },
  kpiVal:      { fontSize: 19, fontFamily: 'Helvetica-Bold', color: '#0F172A', lineHeight: 1 },
  kpiDeltaPos: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#16A34A' },
  kpiDeltaNeg: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#DC2626' },
  kpiDeltaNA:  { fontSize: 7, fontFamily: 'Helvetica', color: '#94A3B8' },

  /* ── Overview table ── */
  tblWrap:     { marginBottom: 20, borderRadius: 5, overflow: 'hidden',
                 borderWidth: 1, borderColor: '#E2E8F0' },
  tblHead:     { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 12 },
  tblHCell:    { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase',
                 letterSpacing: 0.8 },
  tblRow:      { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 12,
                 alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#F1F5F9' },
  tblPlatform: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 7 },
  tblPlatDot:  { width: 6, height: 6, borderRadius: 3 },
  tblPlatName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  tblCell:     { flex: 1.5, alignItems: 'flex-end' },
  tblVal:      { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  tblSub:      { fontSize: 6, fontFamily: 'Helvetica', color: '#94A3B8', marginTop: 1 },
  tblDPos:     { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16A34A',
                 flex: 1, textAlign: 'right' },
  tblDNeg:     { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#DC2626',
                 flex: 1, textAlign: 'right' },
  tblDNA:      { fontSize: 8, fontFamily: 'Helvetica', color: '#94A3B8',
                 flex: 1, textAlign: 'right' },

  /* ── Narrative ── */
  narrHdr:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                 borderRadius: 6, marginBottom: 14, borderWidth: 1 },
  narrBadge:   { width: 36, height: 36, borderRadius: 7,
                 alignItems: 'center', justifyContent: 'center' },
  narrBadgeTxt:{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  narrHdrTitle:{ fontSize: 11.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  narrHdrSub:  { fontSize: 7.5, fontFamily: 'Helvetica', color: '#64748B', marginTop: 3 },

  narrBlock:   { marginBottom: 13 },
  narrNumRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  narrNumBadge:{ width: 18, height: 18, borderRadius: 9,
                 alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 0.5 },
  narrNumTxt:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  narrContent: { flex: 1 },
  narrTitle:   { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#0F172A' },
  narrBody:    { fontSize: 8.5, color: '#334155', fontFamily: 'Helvetica', lineHeight: 1.8 },

  narrRecCard: { borderRadius: 5, padding: 12, marginBottom: 7, borderWidth: 1 },
  narrRecTitle:{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0F172A', marginBottom: 4 },
  narrRecBody: { fontSize: 8, color: '#475569', fontFamily: 'Helvetica', lineHeight: 1.7 },

  watermark:   { fontSize: 7, color: '#CBD5E1', textAlign: 'center',
                 marginTop: 20, fontFamily: 'Helvetica', letterSpacing: 0.5 },
});

/* ═══════════════════════════════════════════════════════════════
   COVER SVG BACKGROUND
═══════════════════════════════════════════════════════════════ */
function CoverBackground({ color }: { color: string }) {
  const light = lighten(color, 0.9);
  const mid   = lighten(color, 0.7);
  return React.createElement(Svg,
    { width: PW, height: PH, viewBox: `0 0 ${PW} ${PH}`,
      style: { position: 'absolute', top: 0, left: 0 } },

    // White base
    React.createElement(Rect, { x: 0, y: 0, width: PW, height: PH, fill: '#ffffff' }),

    // Deep navy left panel
    React.createElement(Rect, { x: 0, y: 0, width: 210, height: PH, fill: '#0F172A' }),

    // Brand color accent stripe on left panel right edge
    React.createElement(Rect, { x: 202, y: 0, width: 8, height: PH, fill: color }),

    // Subtle geometric circles in left panel
    React.createElement(Circle, { cx: 105, cy: 720, r: 200, fill: 'white', fillOpacity: 0.025 }),
    React.createElement(Circle, { cx: 105, cy: 720, r: 140, fill: 'white', fillOpacity: 0.03 }),
    React.createElement(Circle, { cx: 180, cy: 160, r: 120, fill: color, fillOpacity: 0.12 }),
    React.createElement(Circle, { cx: 20, cy: 400, r: 80, fill: 'white', fillOpacity: 0.03 }),

    // Top-right corner geometric accent on white side
    React.createElement(Circle, { cx: PW, cy: 0, r: 180, fill: light }),
    React.createElement(Circle, { cx: PW - 30, cy: 30, r: 90, fill: mid }),
    React.createElement(Circle, { cx: PW, cy: 0, r: 60, fill: withOpacity(color, 0.15) }),

    // Bottom-right subtle arc
    React.createElement(Circle, { cx: PW, cy: PH, r: 120, fill: light }),

    // Horizontal rule across white section at 60% down
    React.createElement(Rect, { x: 210, y: 530, width: PW - 210, height: 0.5,
      fill: '#E2E8F0' }),
  );
}

/* ═══════════════════════════════════════════════════════════════
   RUNNING HEADER & FOOTER
═══════════════════════════════════════════════════════════════ */
function RunningHeader({ agencyName, clientName, dateRange, color }: {
  agencyName: string; clientName: string; dateRange: string; color: string;
}) {
  return React.createElement(View, { style: S.rHdr, fixed: true },
    React.createElement(View, { style: [S.rHdrBar, { backgroundColor: color }] }),
    React.createElement(View, { style: S.rHdrRow },
      React.createElement(Text, { style: S.rHdrL }, agencyName),
      React.createElement(Text, { style: S.rHdrR }, `${clientName}  ·  ${dateRange}`),
    ),
  );
}

function RunningFooter({ agencyName, genDate }: { agencyName: string; genDate: string }) {
  return React.createElement(View, { style: S.rFtr, fixed: true },
    React.createElement(View, { style: S.rFtrLine }),
    React.createElement(View, { style: S.rFtrRow },
      React.createElement(Text, { style: S.rFtrTxt }, `${agencyName}  ·  Strictly Confidential`),
      React.createElement(Text, { style: S.rFtrTxt }, `Generated ${genDate}`),
      React.createElement(Text, {
        style: S.rFtrTxt,
        render: ({ pageNumber, totalPages }: any) =>
          `Page ${pageNumber - 1} of ${totalPages - 1}`,
      }),
    ),
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADING
═══════════════════════════════════════════════════════════════ */
function SectionHeading({ num, title, color }: { num: string; title: string; color: string }) {
  return React.createElement(View, { style: S.secWrap },
    React.createElement(View, { style: S.secRow },
      React.createElement(Text, { style: [S.secNum, { color }] }, num),
      React.createElement(View, { style: { width: 3, height: 12, backgroundColor: color, borderRadius: 2 } }),
      React.createElement(Text, { style: S.secTitle }, title),
    ),
    React.createElement(View, { style: [S.secRule, { backgroundColor: withOpacity(color, 0.2) }] }),
  );
}

/* ═══════════════════════════════════════════════════════════════
   MINI TREND BAR (SVG sparkline bar)
═══════════════════════════════════════════════════════════════ */
function TrendBar({ pct, isPos, isNA, color, error }: {
  pct: number; isPos: boolean; isNA: boolean; color: string; error: string;
}) {
  const W = 44, H = 4, R = 2;
  const clampedAbs = Math.min(Math.abs(pct), 100);
  const barW = Math.max(3, (clampedAbs / 100) * W);
  const barColor = isNA ? '#CBD5E1' : isPos ? '#16A34A' : error;
  return React.createElement(Svg,
    { width: W, height: H, viewBox: `0 0 ${W} ${H}` },
    // Track
    React.createElement(Rect, { x: 0, y: 0, width: W, height: H, rx: R, fill: '#E2E8F0' }),
    // Fill
    React.createElement(Rect, { x: 0, y: 0, width: barW, height: H, rx: R, fill: barColor }),
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI CARD
═══════════════════════════════════════════════════════════════ */
interface KpiProps {
  label: string;
  value: string;
  delta: Delta;
  invertGood?: boolean;
  color: string;
  errorColor: string;
  width: number;
}
function KpiCard({ label, value, delta, invertGood, color, errorColor, width }: KpiProps) {
  const good    = invertGood ? !delta.isPos : delta.isPos;
  const dStyle  = delta.isNA ? S.kpiDeltaNA : (good ? S.kpiDeltaPos : S.kpiDeltaNeg);
  const arrow   = delta.isNA ? '' : (delta.isPos ? '▲ ' : '▼ ');
  const dText   = delta.isNA ? 'No prior data' : arrow + delta.label.replace(/^[+-]/, '') + ' vs prior';
  const barColor = delta.isNA ? '#CBD5E1' : (good ? '#16A34A' : errorColor);

  return React.createElement(View, {
    style: [S.kpiCard, { borderTopColor: color, width }],
  },
    React.createElement(Text, { style: S.kpiLbl }, label),
    React.createElement(Text, { style: S.kpiVal }, value),
    // Trend bar
    React.createElement(Svg, { width: 50, height: 4, viewBox: '0 0 50 4' },
      React.createElement(Rect, { x: 0, y: 0, width: 50, height: 4, rx: 2, fill: '#E2E8F0' }),
      React.createElement(Rect, {
        x: 0, y: 0,
        width: Math.max(3, Math.min(50, (Math.abs(delta.pct) / 60) * 50)),
        height: 4, rx: 2, fill: barColor,
      }),
    ),
    React.createElement(Text, { style: dStyle }, dText),
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI GRID
═══════════════════════════════════════════════════════════════ */
interface KpiMetric { label: string; value: string; delta: Delta; invertGood?: boolean }
function KpiGrid({ metrics, color, errorColor, perRow = 4 }: {
  metrics: KpiMetric[]; color: string; errorColor: string; perRow?: number;
}) {
  const GAP = 7;
  const cardW = (CW - (perRow - 1) * GAP) / perRow;
  const rows: KpiMetric[][] = [];
  for (let i = 0; i < metrics.length; i += perRow) rows.push(metrics.slice(i, i + perRow));

  return React.createElement(View, { style: { marginBottom: 6 } },
    ...rows.map((row, ri) =>
      React.createElement(View, {
        key: ri,
        style: [S.kpiGrid, { marginBottom: ri < rows.length - 1 ? 0 : 6 }],
      },
        ...row.map(m =>
          React.createElement(KpiCard, { key: m.label, ...m, color, errorColor, width: cardW })
        ),
      )
    ),
  );
}

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW TABLE
═══════════════════════════════════════════════════════════════ */
type OvRow = {
  platform: string; dotColor: string;
  primary: string; primaryLbl: string;
  secondary: string; secondaryLbl: string;
  d: Delta; invertGood?: boolean;
};

function OverviewTable({ rawData, color }: { rawData: any; color: string }) {
  const rows: OvRow[] = [];
  if (rawData?.ga4) rows.push({
    platform: 'Google Analytics 4', dotColor: '#4285F4',
    primary: fmt(rawData.ga4.sessions),       primaryLbl: 'Sessions',
    secondary: `${fmt(rawData.ga4.conversionRate * 100, 2)}%`, secondaryLbl: 'Conv. Rate',
    d: calcDelta(rawData.ga4.sessions, rawData.ga4.sessionsPrev),
  });
  if (rawData?.googleAds) rows.push({
    platform: 'Google Ads', dotColor: '#FBBC05',
    primary: `$${fmt(rawData.googleAds.spend, 0)}`, primaryLbl: 'Total Spend',
    secondary: `${fmt(rawData.googleAds.roas, 2)}x`, secondaryLbl: 'ROAS',
    d: calcDelta(rawData.googleAds.roas, rawData.googleAds.roasPrev),
  });
  if (rawData?.meta) rows.push({
    platform: 'Meta Ads', dotColor: '#0866FF',
    primary: `$${fmt(rawData.meta.spend, 0)}`,    primaryLbl: 'Total Spend',
    secondary: `${fmt(rawData.meta.roas, 2)}x`,   secondaryLbl: 'ROAS',
    d: calcDelta(rawData.meta.roas, rawData.meta.roasPrev),
  });
  if (rawData?.linkedin) rows.push({
    platform: 'LinkedIn Ads', dotColor: '#0A66C2',
    primary: `$${fmt(rawData.linkedin.spend, 0)}`,         primaryLbl: 'Total Spend',
    secondary: fmt(rawData.linkedin.conversions),          secondaryLbl: 'Conversions',
    d: calcDelta(rawData.linkedin.clicks, rawData.linkedin.clicksPrev),
  });
  if (!rows.length) return null;

  return React.createElement(View, { style: S.tblWrap },
    // Header
    React.createElement(View, { style: [S.tblHead, { backgroundColor: withOpacity(color, 0.08) }] },
      React.createElement(Text, { style: [S.tblHCell, { flex: 2, color }] }, 'Data Source'),
      React.createElement(Text, { style: [S.tblHCell, { flex: 1.5, textAlign: 'right', color }] }, 'Primary KPI'),
      React.createElement(Text, { style: [S.tblHCell, { flex: 1.5, textAlign: 'right', color }] }, 'Secondary KPI'),
      React.createElement(Text, { style: [S.tblHCell, { flex: 1, textAlign: 'right', color }] }, 'Period Δ'),
    ),
    ...rows.map((r, i) => {
      const dStyle = r.d.isNA ? S.tblDNA : (r.d.isPos ? S.tblDPos : S.tblDNeg);
      const arrow  = r.d.isNA ? '' : (r.d.isPos ? '▲ ' : '▼ ');
      const dText  = r.d.isNA ? '—' : arrow + r.d.label.replace(/^[+-]/, '');
      return React.createElement(View, {
        key: i,
        style: [S.tblRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#FAFAFA' }],
      },
        React.createElement(View, { style: S.tblPlatform },
          React.createElement(View, { style: [S.tblPlatDot, { backgroundColor: r.dotColor }] }),
          React.createElement(Text, { style: S.tblPlatName }, r.platform),
        ),
        React.createElement(View, { style: S.tblCell },
          React.createElement(Text, { style: S.tblVal }, r.primary),
          React.createElement(Text, { style: S.tblSub }, r.primaryLbl),
        ),
        React.createElement(View, { style: S.tblCell },
          React.createElement(Text, { style: S.tblVal }, r.secondary),
          React.createElement(Text, { style: S.tblSub }, r.secondaryLbl),
        ),
        React.createElement(Text, { style: dStyle }, dText),
      );
    }),
  );
}

/* ═══════════════════════════════════════════════════════════════
   NARRATIVE BLOCK (numbered section)
═══════════════════════════════════════════════════════════════ */
function NarrBlock({ num, title, body, color, isRec }: {
  num: number; title: string; body: string; color: string; isRec?: boolean;
}) {
  if (isRec) {
    // Recommendations get a card-style treatment
    return React.createElement(View, {
      style: [S.narrRecCard, {
        backgroundColor: withOpacity(color, 0.05),
        borderColor: withOpacity(color, 0.25),
      }],
    },
      React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 } },
        React.createElement(View, {
          style: [S.narrNumBadge, { backgroundColor: color, width: 20, height: 20, borderRadius: 10 }],
        },
          React.createElement(Text, { style: S.narrNumTxt }, String(num)),
        ),
        React.createElement(Text, { style: [S.narrRecTitle, { color }] }, title),
      ),
      React.createElement(Text, { style: S.narrRecBody }, body),
    );
  }

  return React.createElement(View, { style: S.narrBlock },
    React.createElement(View, { style: S.narrNumRow },
      React.createElement(View, { style: [S.narrNumBadge, { backgroundColor: color }] },
        React.createElement(Text, { style: S.narrNumTxt }, String(num)),
      ),
      React.createElement(View, { style: S.narrContent },
        React.createElement(Text, { style: S.narrTitle }, title),
        React.createElement(Text, { style: S.narrBody }, body),
      ),
    ),
  );
}

/* ═══════════════════════════════════════════════════════════════
   COVER STAT BOX
═══════════════════════════════════════════════════════════════ */
function CoverStat({ label, value, color }: { label: string; value: string; color: string }) {
  return React.createElement(View, {
    style: { flexDirection: 'column', paddingRight: 20 },
  },
    React.createElement(Text, {
      style: { fontSize: 18, fontFamily: 'Helvetica-Bold', color, lineHeight: 1 },
    }, value),
    React.createElement(Text, {
      style: { fontSize: 7, fontFamily: 'Helvetica', color: '#64748B',
        textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 },
    }, label),
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export async function generatePDF(report: any, agency: any, client: any): Promise<Buffer> {
  const rawData    = report.rawData   as any;
  const narrative  = report.narrative as any;
  const brandColor = agency?.brandColor || '#6366F1';
  const T          = makeTokens(brandColor);
  const isAgency   = ['AGENCY', 'AGENCY_PRO'].includes(agency?.subscriptionTier);

  const agencyName = agency?.name  || 'ReportCraft AI';
  const clientName = client?.name  || 'Client';
  const startDate  = fmtDate(report.dateRangeStart);
  const endDate    = fmtDate(report.dateRangeEnd);
  const shortStart = fmtDateShort(report.dateRangeStart);
  const shortEnd   = fmtDateShort(report.dateRangeEnd);
  const dateRange  = `${shortStart} – ${shortEnd}`;
  const genDate    = fmtDate(new Date());
  const tone       = report.narrativeTone
    ? report.narrativeTone.charAt(0).toUpperCase() + report.narrativeTone.slice(1)
    : 'Professional';

  // Collect active platforms
  const platforms: string[] = [];
  if (rawData?.ga4)       platforms.push('Google Analytics 4');
  if (rawData?.googleAds) platforms.push('Google Ads');
  if (rawData?.meta)      platforms.push('Meta Ads');
  if (rawData?.linkedin)  platforms.push('LinkedIn Ads');

  // Quick cover stats
  const totalSpend = (rawData?.googleAds?.spend || 0) + (rawData?.meta?.spend || 0) + (rawData?.linkedin?.spend || 0);
  const totalConversions = (rawData?.googleAds?.conversions || 0) + (rawData?.linkedin?.conversions || 0);
  const avgRoas = rawData?.googleAds?.roas || rawData?.meta?.roas || null;

  /* ══════════════════════════════════════
     PAGE 1 — COVER
  ══════════════════════════════════════ */
  const coverPage = React.createElement(Page, { key: 'cover', size: 'A4', style: S.coverPage },

    // Background
    React.createElement(CoverBackground, { color: brandColor }),

    // LEFT PANEL CONTENT
    React.createElement(View, {
      style: { position: 'absolute', top: 0, left: 0, width: 202, height: PH,
        padding: 36, flexDirection: 'column', justifyContent: 'space-between' },
    },
      // Agency identity at top
      React.createElement(View, {},
        agency?.logoUrl
          ? React.createElement(Image, {
              src: agency.logoUrl,
              style: { height: 28, maxWidth: 130, objectFit: 'contain', marginBottom: 12 },
            })
          : React.createElement(View, {
              style: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
            },
              React.createElement(View, {
                style: { width: 8, height: 8, borderRadius: 4, backgroundColor: brandColor },
              }),
              React.createElement(Text, {
                style: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 0.3 },
              }, agencyName),
            ),

        // Divider
        React.createElement(View, { style: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 28 } }),

        // "PERFORMANCE REPORT" label
        React.createElement(Text, {
          style: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: brandColor,
            textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 14 },
        }, 'Performance Report'),

        // Client name (large)
        React.createElement(Text, {
          style: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#ffffff',
            lineHeight: 1.15, marginBottom: 10 },
        }, clientName),

        // Report period
        React.createElement(Text, {
          style: { fontSize: 9, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.5 },
        }, `${startDate}\n– ${endDate}`),
      ),

      // Bottom of left panel — navigation / TOC
      React.createElement(View, {},
        React.createElement(View, { style: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 16 } }),
        React.createElement(Text, {
          style: { fontSize: 5.5, fontFamily: 'Helvetica-Bold', color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
        }, 'Contents'),
        ...[
          'Platform Overview',
          ...(rawData?.ga4       ? ['Google Analytics 4'] : []),
          ...(rawData?.googleAds ? ['Google Ads']         : []),
          ...(rawData?.meta      ? ['Meta Ads']           : []),
          ...(rawData?.linkedin  ? ['LinkedIn Ads']       : []),
          ...(narrative          ? ['AI Insight Analysis'] : []),
        ].map((item, i) =>
          React.createElement(View, {
            key: i,
            style: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
          },
            React.createElement(View, {
              style: { width: 4, height: 4, borderRadius: 2, backgroundColor: brandColor },
            }),
            React.createElement(Text, {
              style: { fontSize: 7.5, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.65)' },
            }, item),
          )
        ),
        React.createElement(View, { style: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 10, marginBottom: 10 } }),
        React.createElement(Text, {
          style: { fontSize: 6, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.3)' },
        }, 'Strictly Confidential'),
      ),
    ),

    // RIGHT PANEL CONTENT (white area, x starts at 210 + 8 accent = 218)
    React.createElement(View, {
      style: { position: 'absolute', top: 0, left: 230, right: 0, height: PH,
        paddingTop: 52, paddingRight: 44, paddingBottom: 44, flexDirection: 'column',
        justifyContent: 'space-between' },
    },
      // Top section
      React.createElement(View, {},
        // Eyebrow
        React.createElement(Text, {
          style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: brandColor,
            textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 18 },
        }, 'AI-Powered Report'),

        // Big heading area
        React.createElement(Text, {
          style: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#0F172A',
            lineHeight: 1.12, marginBottom: 8, letterSpacing: -0.3 },
        }, 'Digital\nPerformance\nAnalysis'),

        React.createElement(View, { style: { height: 3, width: 40, backgroundColor: brandColor, borderRadius: 2, marginBottom: 18, marginTop: 4 } }),

        React.createElement(Text, {
          style: { fontSize: 8.5, fontFamily: 'Helvetica', color: '#64748B',
            lineHeight: 1.65, maxWidth: 280 },
        }, `A comprehensive cross-channel performance analysis combining ${platforms.length > 0 ? platforms.join(', ') : 'connected platforms'} — powered by AI-driven insights and strategic recommendations.`),
      ),

      // Stats row (middle section of white area)
      React.createElement(View, {},
        React.createElement(View, { style: { height: 0.5, backgroundColor: '#E2E8F0', marginBottom: 22 } }),
        React.createElement(View, { style: { flexDirection: 'row', marginBottom: 22 } },
          totalSpend > 0 && React.createElement(CoverStat, {
            label: 'Total Ad Spend',
            value: `$${fmt(totalSpend, 0)}`,
            color: brandColor,
          }),
          totalConversions > 0 && React.createElement(CoverStat, {
            label: 'Total Conversions',
            value: fmt(totalConversions),
            color: brandColor,
          }),
          avgRoas && React.createElement(CoverStat, {
            label: 'Best ROAS',
            value: `${fmt(avgRoas, 2)}x`,
            color: brandColor,
          }),
          platforms.length > 0 && React.createElement(CoverStat, {
            label: 'Data Sources',
            value: String(platforms.length),
            color: brandColor,
          }),
        ),
        React.createElement(View, { style: { height: 0.5, backgroundColor: '#E2E8F0', marginBottom: 22 } }),
      ),

      // Metadata + tags at bottom
      React.createElement(View, {},
        // Meta grid
        React.createElement(View, { style: { flexDirection: 'row', gap: 0 } },
          [
            { k: 'Prepared by', v: agencyName },
            { k: 'Report Period', v: dateRange },
            { k: 'Generated', v: genDate },
            { k: 'AI Tone', v: tone },
          ].map(({ k, v }, i) =>
            React.createElement(View, {
              key: i,
              style: { flex: 1, paddingRight: 10, borderRightWidth: i < 3 ? 0.5 : 0,
                borderRightColor: '#E2E8F0', paddingLeft: i > 0 ? 10 : 0, marginBottom: 16 },
            },
              React.createElement(Text, {
                style: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#94A3B8',
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
              }, k),
              React.createElement(Text, {
                style: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#334155' },
              }, v),
            )
          ),
        ),

        // Tags
        React.createElement(View, { style: { flexDirection: 'row', gap: 6 } },
          React.createElement(View, {
            style: { paddingHorizontal: 10, paddingVertical: 5,
              backgroundColor: withOpacity(brandColor, 0.1),
              borderWidth: 1, borderColor: withOpacity(brandColor, 0.3),
              borderRadius: 4 },
          },
            React.createElement(Text, {
              style: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: brandColor,
                textTransform: 'uppercase', letterSpacing: 1.2 },
            }, 'Confidential'),
          ),
          React.createElement(View, {
            style: { paddingHorizontal: 10, paddingVertical: 5,
              borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4 },
          },
            React.createElement(Text, {
              style: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#64748B',
                textTransform: 'uppercase', letterSpacing: 1.2 },
            }, 'AI-Powered Analysis'),
          ),
        ),
      ),
    ),
  );

  /* ══════════════════════════════════════
     PAGE 2+ — CONTENT
  ══════════════════════════════════════ */
  const header = React.createElement(RunningHeader, { agencyName, clientName, dateRange, color: brandColor });
  const footer = React.createElement(RunningFooter, { agencyName, genDate });

  // Section counter
  let secNum = 0;
  const nextSec = () => { secNum++; return String(secNum).padStart(2, '0'); };

  const contentPage = React.createElement(Page, { key: 'content', size: 'A4', style: S.contentPage },
    header,

    React.createElement(View, { style: { flex: 1, paddingBottom: 56 } },

      /* ── 01 Platform Overview ── */
      (rawData?.ga4 || rawData?.googleAds || rawData?.meta || rawData?.linkedin) &&
        React.createElement(View, {},
          React.createElement(SectionHeading, { num: nextSec(), title: 'Platform Overview', color: brandColor }),
          React.createElement(OverviewTable, { rawData, color: brandColor }),
        ),

      /* ── GA4 ── */
      rawData?.ga4 && React.createElement(View, {},
        React.createElement(SectionHeading, { num: nextSec(), title: 'Google Analytics 4  —  Website Performance', color: brandColor }),
        React.createElement(KpiGrid, {
          color: brandColor, errorColor: T.error, perRow: 3,
          metrics: [
            { label: 'Sessions',
              value: fmt(rawData.ga4.sessions),
              delta: calcDelta(rawData.ga4.sessions, rawData.ga4.sessionsPrev) },
            { label: 'Unique Users',
              value: fmt(rawData.ga4.users),
              delta: calcDelta(rawData.ga4.users, rawData.ga4.usersPrev) },
            { label: 'Pageviews',
              value: fmt(rawData.ga4.pageviews),
              delta: calcDelta(rawData.ga4.pageviews, rawData.ga4.pageviewsPrev) },
            { label: 'Bounce Rate',
              value: `${fmt(rawData.ga4.bounceRate * 100, 1)}%`,
              delta: calcDelta(rawData.ga4.bounceRate, rawData.ga4.bounceRatePrev),
              invertGood: true },
            { label: 'Conversion Rate',
              value: `${fmt(rawData.ga4.conversionRate * 100, 2)}%`,
              delta: calcDelta(rawData.ga4.conversionRate, rawData.ga4.conversionRatePrev) },
            { label: 'Avg. Session Duration',
              value: fmtDur(rawData.ga4.avgSessionDuration),
              delta: calcDelta(rawData.ga4.avgSessionDuration, rawData.ga4.avgSessionDurationPrev) },
          ],
        }),
      ),

      /* ── Google Ads ── */
      rawData?.googleAds && React.createElement(View, {},
        React.createElement(SectionHeading, { num: nextSec(), title: 'Google Ads  —  Paid Search Performance', color: brandColor }),
        React.createElement(KpiGrid, {
          color: brandColor, errorColor: T.error, perRow: 4,
          metrics: [
            { label: 'Total Spend',
              value: `$${fmt(rawData.googleAds.spend, 0)}`,
              delta: calcDelta(rawData.googleAds.spend, rawData.googleAds.spendPrev),
              invertGood: true },
            { label: 'Impressions',
              value: fmt(rawData.googleAds.impressions),
              delta: calcDelta(rawData.googleAds.impressions, rawData.googleAds.impressionsPrev) },
            { label: 'Clicks',
              value: fmt(rawData.googleAds.clicks),
              delta: calcDelta(rawData.googleAds.clicks, rawData.googleAds.clicksPrev) },
            { label: 'Click-Through Rate',
              value: `${fmt(rawData.googleAds.ctr * 100, 2)}%`,
              delta: calcDelta(rawData.googleAds.ctr, rawData.googleAds.ctrPrev) },
            { label: 'Cost per Click',
              value: `$${fmt(rawData.googleAds.cpc, 2)}`,
              delta: calcDelta(rawData.googleAds.cpc, rawData.googleAds.cpcPrev),
              invertGood: true },
            { label: 'ROAS',
              value: `${fmt(rawData.googleAds.roas, 2)}x`,
              delta: calcDelta(rawData.googleAds.roas, rawData.googleAds.roasPrev) },
            { label: 'Conversions',
              value: fmt(rawData.googleAds.conversions),
              delta: calcDelta(rawData.googleAds.conversions, rawData.googleAds.conversionsPrev) },
            { label: 'Conversion Rate',
              value: `${fmt((rawData.googleAds.conversionRate ?? 0) * 100, 2)}%`,
              delta: calcDelta(rawData.googleAds.conversionRate, rawData.googleAds.conversionRatePrev) },
          ],
        }),
      ),

      /* ── Meta Ads ── */
      rawData?.meta && React.createElement(View, {},
        React.createElement(SectionHeading, { num: nextSec(), title: 'Meta Ads  —  Social Advertising', color: brandColor }),
        React.createElement(KpiGrid, {
          color: brandColor, errorColor: T.error, perRow: 4,
          metrics: [
            { label: 'Total Spend',
              value: `$${fmt(rawData.meta.spend, 0)}`,
              delta: calcDelta(rawData.meta.spend, rawData.meta.spendPrev),
              invertGood: true },
            { label: 'Impressions',
              value: fmt(rawData.meta.impressions),
              delta: calcDelta(rawData.meta.impressions, rawData.meta.impressionsPrev) },
            { label: 'Reach',
              value: fmt(rawData.meta.reach),
              delta: calcDelta(rawData.meta.reach, rawData.meta.reachPrev) },
            { label: 'Clicks',
              value: fmt(rawData.meta.clicks),
              delta: calcDelta(rawData.meta.clicks, rawData.meta.clicksPrev) },
            { label: 'Click-Through Rate',
              value: `${fmt(rawData.meta.ctr * 100, 3)}%`,
              delta: calcDelta(rawData.meta.ctr, rawData.meta.ctrPrev) },
            { label: 'Cost per Mille (CPM)',
              value: `$${fmt(rawData.meta.cpm, 2)}`,
              delta: calcDelta(rawData.meta.cpm, rawData.meta.cpmPrev),
              invertGood: true },
            { label: 'ROAS',
              value: `${fmt(rawData.meta.roas, 2)}x`,
              delta: calcDelta(rawData.meta.roas, rawData.meta.roasPrev) },
            { label: 'Creative Frequency',
              value: fmt(rawData.meta.frequency, 2) || '—',
              delta: calcDelta(rawData.meta.frequency, rawData.meta.frequencyPrev),
              invertGood: true },
          ],
        }),
      ),

      /* ── LinkedIn Ads ── */
      rawData?.linkedin && React.createElement(View, {},
        React.createElement(SectionHeading, { num: nextSec(), title: 'LinkedIn Ads  —  B2B Advertising', color: brandColor }),
        React.createElement(KpiGrid, {
          color: brandColor, errorColor: T.error, perRow: 4,
          metrics: [
            { label: 'Total Spend',
              value: `$${fmt(rawData.linkedin.spend, 0)}`,
              delta: calcDelta(rawData.linkedin.spend, rawData.linkedin.spendPrev),
              invertGood: true },
            { label: 'Impressions',
              value: fmt(rawData.linkedin.impressions),
              delta: calcDelta(rawData.linkedin.impressions, rawData.linkedin.impressionsPrev) },
            { label: 'Clicks',
              value: fmt(rawData.linkedin.clicks),
              delta: calcDelta(rawData.linkedin.clicks, rawData.linkedin.clicksPrev) },
            { label: 'Click-Through Rate',
              value: `${fmt(rawData.linkedin.ctr * 100, 2)}%`,
              delta: calcDelta(rawData.linkedin.ctr, rawData.linkedin.ctrPrev) },
            { label: 'Cost per Click',
              value: `$${fmt(rawData.linkedin.cpc, 2)}`,
              delta: calcDelta(rawData.linkedin.cpc, rawData.linkedin.cpcPrev),
              invertGood: true },
            { label: 'CPM',
              value: `$${fmt(rawData.linkedin.cpm, 2)}`,
              delta: calcDelta(rawData.linkedin.cpm, rawData.linkedin.cpmPrev),
              invertGood: true },
            { label: 'Conversions',
              value: fmt(rawData.linkedin.conversions),
              delta: calcDelta(rawData.linkedin.conversions, rawData.linkedin.conversionsPrev) },
            { label: 'Lead Gen Forms',
              value: fmt(rawData.linkedin.leadGenFormCompletions),
              delta: calcDelta(rawData.linkedin.leadGenFormCompletions, rawData.linkedin.leadGenFormCompletionsPrev) },
          ],
        }),
      ),

      /* ── AI Narrative ── */
      narrative && React.createElement(View, {},
        React.createElement(SectionHeading, { num: nextSec(), title: 'AI Insight Analysis  —  Cross-Channel Intelligence', color: brandColor }),

        // AI header card
        React.createElement(View, {
          style: [S.narrHdr, {
            borderColor: withOpacity(brandColor, 0.2),
            backgroundColor: withOpacity(brandColor, 0.05),
          }],
        },
          React.createElement(View, { style: [S.narrBadge, { backgroundColor: brandColor }] },
            React.createElement(Text, { style: S.narrBadgeTxt }, 'AI'),
          ),
          React.createElement(View, { style: { flex: 1 } },
            React.createElement(Text, { style: S.narrHdrTitle },
              'Cross-Channel Performance Narrative'),
            React.createElement(Text, { style: S.narrHdrSub },
              `${tone} tone`
              + (narrative.wordCount ? `  ·  ${narrative.wordCount} words` : '')
              + (report.aiModel ? `  ·  Model: ${report.aiModel}` : ''),
            ),
          ),
          // Stars decoration
          React.createElement(Svg, { width: 48, height: 36, viewBox: '0 0 48 36' },
            ...[
              [24, 18, 12],
              [6, 8, 7],
              [42, 6, 6],
              [40, 26, 5],
              [8, 28, 4],
            ].map(([cx, cy, r], i) =>
              React.createElement(Circle, {
                key: i, cx, cy, r,
                fill: brandColor,
                fillOpacity: 0.15 + i * 0.04,
              })
            ),
          ),
        ),

        // Narrative sections 1-4
        ...[
          { title: 'Executive Summary',    body: narrative.executiveSummary,    isRec: false },
          { title: 'Campaign Performance', body: narrative.campaignPerformance, isRec: false },
          { title: 'Key Wins',             body: narrative.keyWins,             isRec: false },
          { title: 'Areas of Concern',     body: narrative.areasOfConcern,      isRec: false },
        ].filter(s => s.body).map((s, i) =>
          React.createElement(NarrBlock, {
            key: s.title,
            num: i + 1,
            title: s.title,
            body: s.body,
            color: brandColor,
            isRec: false,
          })
        ),

        // Recommendations in card style
        narrative.recommendations && React.createElement(View, { style: { marginTop: 6 } },
          React.createElement(Text, {
            style: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#94A3B8',
              textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
          }, 'Strategic Recommendations'),
          React.createElement(NarrBlock, {
            num: 5,
            title: 'Action Plan',
            body: narrative.recommendations,
            color: brandColor,
            isRec: true,
          }),
        ),

        // Watermark for non-Agency
        !isAgency && React.createElement(Text, { style: S.watermark },
          'Generated with ReportCraft AI  ·  reportcraft.ai',
        ),
      ),
    ),

    footer,
  );

  const doc = React.createElement(Document,
    {
      title:  `${clientName} — Performance Report — ${dateRange}`,
      author: agencyName,
      creator: 'ReportCraft AI',
      subject: 'Digital Marketing Performance Report',
    },
    coverPage,
    contentPage,
  );

  return await renderToBuffer(doc);
}
