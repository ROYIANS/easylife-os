import { Card, Chip, ProgressBar } from '@heroui/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { AdminSystemOperations } from '@dicha/shared';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  FileClock,
  Gauge,
  HardDrive,
  MemoryStick,
  Radio,
  Server,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { adminOverviewQueryOptions, adminSystemOperationsQueryOptions } from '@/api/admin';
import { PageHeader } from '@/components/PageHeader';

export const Route = createFileRoute('/_admin/')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(adminOverviewQueryOptions()),
      context.queryClient.ensureQueryData(adminSystemOperationsQueryOptions()),
    ]);
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { data } = useSuspenseQuery(adminOverviewQueryOptions());
  const { data: system } = useSuspenseQuery(adminSystemOperationsQueryOptions());
  const externalServices = system.externalServices;
  const healthyExternalServices = externalServices.filter(
    (service) => service.status === 'healthy',
  ).length;
  const unhealthyServices = externalServices.filter(
    (service) => service.status === 'down' || service.status === 'degraded',
  );
  const apiStatus = system.services.find((service) => service.id === 'api')?.status ?? 'unknown';
  const aiStatus =
    externalServices.find((service) => service.id === 'ai-gateway')?.status ?? 'unknown';
  const platformHealthy =
    unhealthyServices.length === 0 &&
    apiStatus === 'healthy' &&
    system.database.status === 'healthy';
  const verifiedRate = data.stats.totalUsers
    ? Math.round((data.stats.verifiedUsers / data.stats.totalUsers) * 100)
    : 0;

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow="运营态势"
        title="平台管理总览"
        description="把用户增长、运行负载和外部依赖放在同一张态势图里，先看异常，再决定今天处理什么。"
        action={
          <Chip
            className={
              platformHealthy ? 'w-fit bg-chip-sage text-sage' : 'w-fit bg-chip-peach text-peach'
            }
          >
            <span className="flex items-center gap-2 text-xs font-semibold">
              <span className="relative flex size-2">
                <span
                  className={`absolute inline-flex size-full rounded-full opacity-40 ${
                    platformHealthy ? 'bg-sage' : 'bg-peach'
                  }`}
                />
                <span
                  className={`relative inline-flex size-2 rounded-full ${
                    platformHealthy ? 'bg-sage' : 'bg-peach'
                  }`}
                />
              </span>
              {platformHealthy ? '系统平稳' : `${unhealthyServices.length} 项需关注`}
            </span>
          </Chip>
        }
      />

      <div className="grid gap-4 px-5 pt-5 lg:px-8 xl:grid-cols-12">
        <Card className="overflow-hidden rounded-md border border-hairline bg-surface shadow-none xl:col-span-8">
          <Card.Content className="grid p-0 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="flex min-h-[292px] flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="flex items-center gap-2 text-xs font-semibold text-ink-faint">
                    <Radio className="size-3.5" strokeWidth={1.8} />
                    当前运行判断
                  </p>
                  <h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
                    {platformHealthy ? '今天可以把注意力留给业务。' : '基础设施正在请求你的注意。'}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
                    API {statusLabel(apiStatus)}，数据库 {statusLabel(system.database.status)}，AI
                    Gateway {statusLabel(aiStatus)}。过去 24 小时记录到{' '}
                    {formatNumber(system.maintenance.recentFailures)} 条失败审计。
                  </p>
                </div>
                <span
                  className={`hidden size-11 shrink-0 place-items-center rounded-md sm:grid ${
                    platformHealthy ? 'bg-chip-sage text-sage' : 'bg-chip-peach text-peach'
                  }`}
                >
                  {platformHealthy ? (
                    <Gauge className="size-5" strokeWidth={1.8} />
                  ) : (
                    <AlertTriangle className="size-5" strokeWidth={1.8} />
                  )}
                </span>
              </div>

              <div className="mt-auto grid grid-cols-2 border-t border-hairline pt-5 sm:grid-cols-4">
                <SituationMetric
                  label="外部服务"
                  value={`${healthyExternalServices}/${externalServices.length}`}
                  detail="健康响应"
                />
                <SituationMetric
                  label="运行时长"
                  value={formatDuration(system.runtime.uptimeSeconds)}
                  detail="本次 API 进程"
                />
                <SituationMetric
                  label="CPU 负载"
                  value={`${system.host.cpu.loadPercent}%`}
                  detail={`${system.host.cpu.cores} 核主机`}
                />
                <SituationMetric
                  label="磁盘占用"
                  value={
                    system.host.disk.usedPercent === null
                      ? '未采集'
                      : `${system.host.disk.usedPercent}%`
                  }
                  detail="数据卷与运行文件"
                />
              </div>
            </div>

            <div className="flex flex-col bg-sidebar-bg p-5 text-sidebar-ink sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-sidebar-ink-soft">服务诊断</p>
                <ShieldCheck className="size-4 text-sidebar-ink-soft" strokeWidth={1.8} />
              </div>
              <div className="mt-5">
                <p className="text-4xl font-semibold tabular-nums tracking-[-0.04em]">
                  {healthyExternalServices}
                  <span className="ml-1 text-base font-medium text-sidebar-ink-soft">
                    / {externalServices.length}
                  </span>
                </p>
                <p className="mt-2 text-xs leading-5 text-sidebar-ink-soft">外部依赖当前健康</p>
              </div>
              <div className="mt-auto divide-y divide-sidebar-ink/10 border-y border-sidebar-ink/10">
                <DiagnosticLine label="API" status={apiStatus} />
                <DiagnosticLine label="PostgreSQL" status={system.database.status} />
                <DiagnosticLine label="AI Gateway" status={aiStatus} />
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="rounded-md border border-hairline bg-surface shadow-none xl:col-span-4">
          <Card.Header className="flex items-start justify-between gap-4 border-b border-hairline p-5">
            <div>
              <Card.Title className="text-sm font-semibold text-ink">此刻要处理</Card.Title>
              <Card.Description className="mt-1 text-xs text-ink-soft">
                从运行状态自动整理
              </Card.Description>
            </div>
            <FileClock className="size-4 text-mist" strokeWidth={1.8} />
          </Card.Header>
          <Card.Content className="divide-y divide-hairline p-0">
            <AttentionRow
              title={
                system.maintenance.expiredSessions > 0
                  ? `清理 ${formatNumber(system.maintenance.expiredSessions)} 个过期会话`
                  : '会话池无需清理'
              }
              detail="减少无效会话在数据库中的占用"
              tone={system.maintenance.expiredSessions > 0 ? 'peach' : 'sage'}
            />
            <AttentionRow
              title={
                system.maintenance.recentFailures > 0
                  ? `复核 ${formatNumber(system.maintenance.recentFailures)} 条失败审计`
                  : '最近没有失败审计'
              }
              detail="核对后台操作是否需要补偿"
              tone={system.maintenance.recentFailures > 0 ? 'peach' : 'sage'}
            />
            <AttentionRow
              title={system.cache.detail}
              detail="缓存能力会影响高频读取的响应"
              tone={system.cache.status === 'not_configured' ? 'peach' : 'mist'}
            />
            <AttentionRow
              title={system.logs.detail}
              detail="确保故障发生时有足够上下文"
              tone={system.logs.status === 'ready' ? 'sage' : 'mist'}
            />
          </Card.Content>
        </Card>

        <Card className="rounded-md border border-hairline bg-surface shadow-none xl:col-span-7">
          <Card.Header className="flex items-start justify-between gap-4 border-b border-hairline p-5">
            <div>
              <Card.Title className="text-sm font-semibold text-ink">业务信号</Card.Title>
              <Card.Description className="mt-1 text-xs text-ink-soft">
                账号、内容与活跃度的当前截面
              </Card.Description>
            </div>
            <Activity className="size-4 text-peach" strokeWidth={1.8} />
          </Card.Header>
          <Card.Content className="grid p-0 md:grid-cols-[minmax(230px,0.9fr)_minmax(0,1.5fr)]">
            <div className="flex flex-col border-b border-hairline p-5 md:border-b-0 md:border-r sm:p-6">
              <span className="flex size-9 items-center justify-center rounded-md bg-chip-mist text-mist">
                <Users className="size-4" strokeWidth={1.8} />
              </span>
              <p className="mt-8 text-4xl font-semibold tabular-nums tracking-[-0.04em] text-ink">
                {formatNumber(data.stats.totalUsers)}
              </p>
              <p className="mt-1 text-sm font-medium text-ink">注册用户</p>
              <p className="mt-2 text-xs leading-5 text-ink-soft">
                其中 {formatNumber(data.stats.verifiedUsers)} 人已经完成邮箱验证。
              </p>
              <ProgressBar
                aria-label={`邮箱验证率 ${verifiedRate}%`}
                value={verifiedRate}
                className="mt-6"
              >
                <div className="mb-2 flex items-center justify-between text-[11px] text-ink-soft">
                  <span>邮箱验证率</span>
                  <ProgressBar.Output className="font-semibold tabular-nums text-ink" />
                </div>
                <ProgressBar.Track className="h-1.5 overflow-hidden rounded-full bg-canvas">
                  <ProgressBar.Fill className="h-full rounded-full bg-mist" />
                </ProgressBar.Track>
              </ProgressBar>
            </div>

            <div className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-3">
              <SignalMetric
                label="7 日新增"
                value={formatNumber(data.stats.usersCreatedLast7Days)}
                detail="新注册用户"
                icon={UserCheck}
              />
              <SignalMetric
                label="活跃会话"
                value={formatNumber(data.stats.activeSessions)}
                detail="未过期 session"
                icon={ShieldCheck}
              />
              <SignalMetric
                label="物品记录"
                value={formatNumber(data.stats.totalItems)}
                detail="平台内容总量"
                icon={Database}
              />
              <SignalMetric
                label="互动事件"
                value={formatNumber(data.stats.totalEvents)}
                detail="用户行为事件"
                icon={Activity}
              />
              <SignalMetric
                label="数据库延迟"
                value={
                  system.database.latencyMs === null ? '未采集' : `${system.database.latencyMs} ms`
                }
                detail={statusLabel(system.database.status)}
                icon={Server}
              />
              <SignalMetric
                label="API 内存"
                value={`${system.runtime.memory.heapUsedMb} MB`}
                detail={`RSS ${system.runtime.memory.rssMb} MB`}
                icon={MemoryStick}
              />
            </div>
          </Card.Content>
        </Card>

        <Card className="rounded-md border border-hairline bg-surface shadow-none xl:col-span-5">
          <Card.Header className="flex items-start justify-between gap-4 border-b border-hairline p-5">
            <div>
              <Card.Title className="text-sm font-semibold text-ink">系统负载</Card.Title>
              <Card.Description className="mt-1 text-xs text-ink-soft">
                进程与宿主机资源水位
              </Card.Description>
            </div>
            <Cpu className="size-4 text-sage" strokeWidth={1.8} />
          </Card.Header>
          <Card.Content className="space-y-6 p-5 sm:p-6">
            <ResourceLine
              icon={Cpu}
              label="CPU"
              value={`${system.host.cpu.loadPercent}%`}
              detail={`${system.host.cpu.cores} 核 · ${system.host.cpu.model}`}
              percent={Math.min(system.host.cpu.loadPercent, 100)}
              tone="sage"
            />
            <ResourceLine
              icon={MemoryStick}
              label="Heap"
              value={`${system.runtime.memory.heapUsedMb} MB`}
              detail={`总堆内存 ${system.runtime.memory.heapTotalMb} MB`}
              percent={memoryPercent(system)}
              tone="mist"
            />
            <ResourceLine
              icon={HardDrive}
              label="磁盘"
              value={
                system.host.disk.usedPercent === null
                  ? '未采集'
                  : `${system.host.disk.usedPercent}%`
              }
              detail={system.host.disk.detail}
              percent={system.host.disk.usedPercent ?? 0}
              tone="peach"
            />
          </Card.Content>
        </Card>

        <Card className="rounded-md border border-hairline bg-surface shadow-none xl:col-span-8">
          <Card.Header className="flex items-start justify-between gap-4 border-b border-hairline p-5">
            <div>
              <Card.Title className="text-sm font-semibold text-ink">外部服务</Card.Title>
              <Card.Description className="mt-1 text-xs text-ink-soft">
                数据库、存储、邮件、缓存、AI 与分析依赖
              </Card.Description>
            </div>
            <Chip className="w-fit bg-surface-alt text-ink-soft">
              <span className="text-[11px] font-medium tabular-nums">
                {healthyExternalServices} / {externalServices.length} 健康
              </span>
            </Chip>
          </Card.Header>
          <Card.Content className="divide-y divide-hairline p-0">
            {externalServices.map((service) => (
              <ServiceRow key={service.id} service={service} />
            ))}
          </Card.Content>
        </Card>

        <Card className="rounded-md border border-hairline bg-surface shadow-none xl:col-span-4">
          <Card.Header className="flex items-start justify-between gap-4 border-b border-hairline p-5">
            <div>
              <Card.Title className="text-sm font-semibold text-ink">最近后台操作</Card.Title>
              <Card.Description className="mt-1 text-xs text-ink-soft">
                审计记录，不包含系统运行日志
              </Card.Description>
            </div>
            <Clock3 className="size-4 text-mist" strokeWidth={1.8} />
          </Card.Header>
          <Card.Content className="p-0">
            {system.recentAuditLogs.length === 0 ? (
              <div className="p-6">
                <p className="text-sm font-medium text-ink">还没有后台操作记录</p>
                <p className="mt-2 text-xs leading-5 text-ink-soft">
                  当管理员执行配置、授权或运维动作后，审计摘要会出现在这里。
                </p>
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {system.recentAuditLogs.slice(0, 5).map((log, index) => (
                  <div key={log.id} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 p-4">
                    <span className="mt-1 flex flex-col items-center">
                      <span className="size-2 rounded-full bg-mist" />
                      {index < Math.min(system.recentAuditLogs.length, 5) - 1 ? (
                        <span className="mt-1 h-full w-px bg-hairline" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">
                        {log.summary}
                      </span>
                      <span className="mt-1 block truncate text-xs text-ink-soft">
                        {log.actorEmail ?? '未知管理员'} · {formatDateTime(log.createdAt)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

function SituationMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 border-hairline px-3 first:pl-0 odd:border-r sm:border-r sm:last:border-r-0 sm:last:pr-0">
      <p className="text-[11px] font-medium text-ink-faint">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold tabular-nums text-ink">{value}</p>
      <p className="mt-1 hidden truncate text-[11px] text-ink-soft sm:block">{detail}</p>
    </div>
  );
}

function DiagnosticLine({ label, status }: { label: string; status: string }) {
  const healthy = status === 'healthy';
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-xs">
      <span className="text-sidebar-ink-soft">{label}</span>
      <span className="flex items-center gap-2 font-medium">
        <span className={`size-1.5 rounded-full ${healthy ? 'bg-sage' : 'bg-peach'}`} />
        {statusLabel(status)}
      </span>
    </div>
  );
}

type Tone = 'sage' | 'mist' | 'peach' | 'pink';

function AttentionRow({ title, detail, tone }: { title: string; detail: string; tone: Tone }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 transition-colors hover:bg-surface-alt">
      <ToneIcon tone={tone} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-ink">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-ink-soft">{detail}</span>
      </span>
    </div>
  );
}

function ToneIcon({ tone }: { tone: Tone }) {
  const toneClass = {
    sage: 'bg-chip-sage text-sage',
    mist: 'bg-chip-mist text-mist',
    peach: 'bg-chip-peach text-peach',
    pink: 'bg-chip-pink text-pink',
  }[tone];
  return (
    <span className={`mt-0.5 grid size-7 place-items-center rounded-md ${toneClass}`}>
      {tone === 'sage' ? (
        <CheckCircle2 className="size-3.5" strokeWidth={1.8} />
      ) : (
        <AlertTriangle className="size-3.5" strokeWidth={1.8} />
      )}
    </span>
  );
}

function SignalMetric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="min-w-0 bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium text-ink-faint">{label}</p>
        <Icon className="size-3.5 text-ink-faint" strokeWidth={1.8} />
      </div>
      <p className="mt-4 truncate text-xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
        {value}
      </p>
      <p className="mt-1 truncate text-[11px] text-ink-soft">{detail}</p>
    </div>
  );
}

function ResourceLine({
  icon: Icon,
  label,
  value,
  detail,
  percent,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  percent: number;
  tone: 'sage' | 'mist' | 'peach';
}) {
  const normalized = Math.max(0, Math.min(percent, 100));
  const fillClass = {
    sage: 'bg-sage',
    mist: 'bg-mist',
    peach: 'bg-peach',
  }[tone];
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Icon className="mt-0.5 size-4 shrink-0 text-ink-faint" strokeWidth={1.8} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{label}</p>
            <p className="mt-1 truncate text-xs text-ink-soft">{detail}</p>
          </div>
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">{value}</p>
      </div>
      <ProgressBar
        aria-label={`${label} 使用率 ${normalized}%`}
        value={normalized}
        className="mt-3"
      >
        <ProgressBar.Track className="h-1.5 overflow-hidden rounded-full bg-canvas">
          <ProgressBar.Fill className={`h-full rounded-full ${fillClass}`} />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}

function ServiceRow({ service }: { service: AdminSystemOperations['externalServices'][number] }) {
  return (
    <div className="grid gap-3 p-4 transition-colors hover:bg-surface-alt md:grid-cols-[minmax(150px,0.7fr)_110px_minmax(0,1.4fr)_100px] md:items-center md:px-5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{service.name}</p>
        <p className="mt-1 text-[11px] text-ink-soft">{serviceCategoryLabel(service.category)}</p>
      </div>
      <StatusChip status={service.status} configured={service.configured} />
      <p className="min-w-0 text-xs leading-5 text-ink-soft">{service.detail}</p>
      <p className="text-xs tabular-nums text-ink-soft md:text-right">
        {service.latencyMs === null ? '未采集延迟' : `${service.latencyMs} ms`}
      </p>
    </div>
  );
}

function StatusChip({
  status,
  configured,
}: {
  status: AdminSystemOperations['externalServices'][number]['status'];
  configured: boolean;
}) {
  const className =
    status === 'healthy'
      ? 'bg-chip-sage text-sage'
      : status === 'down'
        ? 'bg-chip-pink text-pink'
        : status === 'degraded'
          ? 'bg-chip-peach text-peach'
          : 'bg-chip-mist text-mist';
  return (
    <Chip className={`w-fit ${className}`}>
      <span className="flex items-center gap-1.5 text-[11px] font-semibold">
        <span className="size-1.5 rounded-full bg-current" />
        {configured ? statusLabel(status) : '未配置'}
      </span>
    </Chip>
  );
}

function memoryPercent(system: AdminSystemOperations): number {
  if (system.runtime.memory.heapTotalMb <= 0) return 0;
  return (
    Math.round((system.runtime.memory.heapUsedMb / system.runtime.memory.heapTotalMb) * 1000) / 10
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    healthy: '正常',
    degraded: '降级',
    down: '不可用',
    unknown: '未知',
  };
  return labels[status] ?? status;
}

function serviceCategoryLabel(
  category: AdminSystemOperations['externalServices'][number]['category'],
) {
  const labels: Record<AdminSystemOperations['externalServices'][number]['category'], string> = {
    runtime: '运行时',
    database: '数据库',
    cache: '缓存',
    storage: '存储',
    mail: '邮件',
    ai: 'AI 服务',
    analytics: '分析服务',
  };
  return labels[category];
}
