import cron from 'node-cron';
import { Prisma } from '@prisma/client';
import prisma from '../lib/db';
import { config } from '../config';
import { generateNarrative, generateMockNarrative, NarrativeData } from '../services/ai.service';

// ── Prisma payload types ──────────────────────────────────────────────────────

type SchedulerClient = Prisma.ClientGetPayload<{
  include: { agency: true };
}>;
type SchedulerAgency = SchedulerClient['agency'];
type ConnectorWithToken = Prisma.ClientConnectorGetPayload<{
  include: { oauthToken: true };
}>;
type ReportWithClient = Prisma.ReportGetPayload<{
  include: { client: true };
}>;

// ─────────────────────────────────────────────────────────────────────────────

async function processScheduledReports() {
  const now = new Date();

  const clients = await prisma.client.findMany({
    where:   { archivedAt: null, reportSchedule: { not: null } },
    include: { agency: true },
  });

  for (const client of clients) {
    if (!client.reportSchedule) continue;

    try {
      const shouldRun = checkCronMatch(client.reportSchedule, now);
      if (!shouldRun) continue;

      const agency = client.agency;

      if (['cancelled', 'past_due'].includes(agency.subscriptionStatus)) {
        console.log(`[scheduler] Skipping ${client.name} — agency ${agency.id} status: ${agency.subscriptionStatus}`);
        continue;
      }

      const connectors = await prisma.clientConnector.findMany({
        where:   { clientId: client.id },
        include: { oauthToken: true },
      });

      const expiredConnectors = connectors.filter(cc => cc.oauthToken.status !== 'active');
      if (expiredConnectors.length > 0 && connectors.length > 0) {
        console.warn(`[scheduler] ${client.name} has expired connectors, skipping automated send`);
        await notifyExpiredConnectors(agency, client, expiredConnectors);
        continue;
      }

      const endDate = new Date();
      endDate.setUTCHours(0, 0, 0, 0);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - config.scheduler.reportRangeDays);

      const existing = await prisma.report.findFirst({
        where: {
          clientId:       client.id,
          dateRangeStart: startDate,
          dateRangeEnd:   endDate,
          status:         'generating',
        },
      });
      if (existing) continue;

      const report = await prisma.report.create({
        data: {
          agencyId:      agency.id,
          clientId:      client.id,
          dateRangeStart: startDate,
          dateRangeEnd:   endDate,
          narrativeTone:  agency.narrativeTone,
          status:         'generating',
        },
      });

      console.log(`[scheduler] Created report ${report.id} for client ${client.name}`);

      generateAndSendReport(report.id, client, agency).catch(e =>
        console.error(`[scheduler] Failed for ${client.name}:`, e)
      );
    } catch (e) {
      console.error(`[scheduler] Error processing client ${client.id}:`, e);
    }
  }
}

function checkCronMatch(cronExpr: string, date: Date): boolean {
  try {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpr.split(' ');
    const matchField = (field: string, value: number): boolean =>
      field === '*' ? true : parseInt(field) === value;

    return (
      matchField(minute,     date.getUTCMinutes()) &&
      matchField(hour,       date.getUTCHours())   &&
      matchField(dayOfMonth, date.getUTCDate())     &&
      matchField(month,      date.getUTCMonth() + 1) &&
      matchField(dayOfWeek,  date.getUTCDay())
    );
  } catch {
    return false;
  }
}

async function notifyExpiredConnectors(
  agency:           SchedulerAgency,
  client:           SchedulerClient,
  expiredConnectors: ConnectorWithToken[],
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { Resend } = await import('resend');
    const resend    = new Resend(process.env.RESEND_API_KEY);
    const platforms = expiredConnectors
      .map(cc => cc.oauthToken.platform.replace(/_/g, ' '))
      .join(', ');

    await resend.emails.send({
      from:    'ReportCraft AI <noreply@reportcraft.ai>',
      to:      [`${agency.slug ?? agency.id}@reportcraft.ai`],
      subject: `Action required: ${client.name} automated report not sent`,
      html:    `
        <p>Hi,</p>
        <p>The automated report for <strong>${client.name}</strong> was not sent because the following connection(s) have expired:</p>
        <p><strong>${platforms}</strong></p>
        <p>Please <a href="${process.env.FRONTEND_URL || 'https://app.reportcraft.ai'}/connectors">reconnect these accounts</a> and send the report manually.</p>
        <p>— ReportCraft AI</p>
      `,
    });
  } catch (e) {
    console.error('[scheduler] Failed to send expired-connector notification:', e);
  }
}

function generateMockData(): NarrativeData {
  const rand = (base: number, variance: number) => base + (Math.random() - 0.5) * variance;
  return {
    ga4: {
      sessions:              Math.round(rand(12400, 2000)),
      sessionsPrev:          Math.round(rand(11000, 2000)),
      bounceRate:            rand(0.42, 0.1),
      bounceRatePrev:        rand(0.45, 0.1),
      users:                 Math.round(rand(9800, 1500)),
      usersPrev:             Math.round(rand(8900, 1500)),
      pageviews:             Math.round(rand(34000, 5000)),
      pageviewsPrev:         Math.round(rand(31000, 5000)),
      avgSessionDuration:    rand(145, 30),
      avgSessionDurationPrev: rand(132, 30),
      conversionRate:        rand(0.038, 0.01),
      conversionRatePrev:    rand(0.034, 0.01),
    },
  };
}

async function generateAndSendReport(
  reportId: string,
  client:   SchedulerClient,
  agency:   SchedulerAgency,
): Promise<void> {
  const startTime = Date.now();

  try {
    const rawData: NarrativeData = generateMockData();
    let narrativeResult;
    let aiModel = 'mock';

    const hasAI = process.env.OPENAI_API_KEY
      || process.env.AI_INTEGRATIONS_OPENAI_API_KEY
      || process.env.ANTHROPIC_API_KEY;

    if (hasAI) {
      try {
        const result = await generateNarrative(rawData, agency.narrativeTone ?? 'professional', client.name, client.goals);
        narrativeResult = result.result;
        aiModel         = result.model;
      } catch {
        narrativeResult = generateMockNarrative(client.name);
        aiModel         = 'mock_fallback';
      }
    } else {
      narrativeResult = generateMockNarrative(client.name);
    }

    const report: ReportWithClient = await prisma.report.update({
      where: { id: reportId },
      data:  {
        status:               'ready',
        rawData:              rawData         as Prisma.InputJsonValue,
        narrative:            narrativeResult as unknown as Prisma.InputJsonValue,
        aiModel,
        generationDurationMs: Date.now() - startTime,
      },
      include: { client: true },
    });

    await prisma.client.update({ where: { id: client.id }, data: { lastReportAt: new Date() } });

    if (report.client.contactEmail) {
      await sendScheduledReport(report, agency);
    }
  } catch (e) {
    console.error('[scheduler] Generation failed:', e);
    await prisma.report.update({ where: { id: reportId }, data: { status: 'error' } });
  }
}

async function sendScheduledReport(
  report: ReportWithClient,
  agency: SchedulerAgency,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const client = report.client;

  const delivery = await prisma.reportDelivery.create({
    data: {
      reportId: report.id,
      agencyId: agency.id,
      clientId: client.id,
      status:   'sending',
    },
  });

  try {
    const { Resend } = await import('resend');
    const resend    = new Resend(process.env.RESEND_API_KEY);

    const dateRange = `${new Date(report.dateRangeStart).toLocaleDateString()} - ${new Date(report.dateRangeEnd).toLocaleDateString()}`;

    const { data, error } = await resend.emails.send({
      from:    `${agency.name || 'ReportCraft AI'} <reports@reportcraft.ai>`,
      to:      [client.contactEmail!],
      subject: client.emailSubjectTemplate
        ?.replace('{client}', client.name)
        .replace('{date}', dateRange)
        ?? `${client.name} — Performance Report — ${dateRange}`,
      html: `<p>Hi ${client.contactName ?? client.name},</p><p>Please find your performance report for ${dateRange} attached.</p><p>Best regards,<br>${agency.name}</p>`,
    });

    await prisma.reportDelivery.update({
      where: { id: delivery.id },
      data:  {
        status:        error ? 'failed' : 'sent',
        sentAt:        error ? null : new Date(),
        resendEmailId: data?.id,
        failureReason: error ? String(error) : null,
      },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    await prisma.reportDelivery.update({
      where: { id: delivery.id },
      data:  { status: 'failed', failureReason: err.message ?? 'Unknown error' },
    });
  }
}

export function startReportSchedulerJob() {
  cron.schedule('* * * * *', () => {
    processScheduledReports().catch(e =>
      console.error('[scheduler] processScheduledReports error:', e)
    );
  }, { timezone: 'UTC' });
  console.log('[scheduler] Report scheduler job started (runs every minute)');
}
