import { Avatar, Card, Chip, ListBox } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { AdminUserDetail, AdminUserSummary } from '@dicha/shared';
import {
  AtSign,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Coins,
  Home,
  KeyRound,
  Link2,
  LogOut,
  MailCheck,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  adminUserDetailQueryOptions,
  adminUsersQueryOptions,
  revokeAdminUserSessions,
  type AdminUsersQueryInput,
  updateAdminUserStatus,
} from '@/api/admin';
import { HeroButton, HeroSelect, HeroTabs, HeroTextInput } from '@/components/HeroControls';
import { heroSelectionToValue } from '@/components/heroSelection';
import { PageHeader } from '@/components/PageHeader';

const PAGE_SIZE = 12;

export const Route = createFileRoute('/_admin/basic')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminUsersQueryOptions({ page: 1, pageSize: PAGE_SIZE })),
  component: BasicPage,
});

function BasicPage() {
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminUsersQueryInput['status'] | ''>('');
  const [emailVerified, setEmailVerified] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const usersQuery = useMemo<AdminUsersQueryInput>(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      status: status || undefined,
      emailVerified: emailVerified === 'all' ? undefined : emailVerified === 'true',
    }),
    [emailVerified, page, search, status],
  );
  const users = useQuery(adminUsersQueryOptions(usersQuery));
  const visibleUsers = users.data?.users ?? [];
  const effectiveSelectedUserId =
    selectedUserId && visibleUsers.some((user) => user.id === selectedUserId)
      ? selectedUserId
      : (visibleUsers[0]?.id ?? null);
  const hasFilters = Boolean(search || status || emailVerified !== 'all');

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchDraft.trim());
    setPage(1);
    setSelectedUserId(null);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchDraft('');
    setStatus('');
    setEmailVerified('all');
    setPage(1);
    setSelectedUserId(null);
  };

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow="用户目录"
        title="用户管理"
        description="从身份、认证方式和活跃会话三个角度理解一个账户，再执行必要的安全操作。"
        action={
          <div className="flex min-w-40 items-center gap-3 rounded-md border border-[color-mix(in_oklab,var(--sidebar-ink)_12%,transparent)] bg-sidebar-bg px-3.5 py-2.5 text-sidebar-ink shadow-raised">
            <span className="grid size-8 place-items-center rounded-md bg-[var(--sidebar-active)]">
              <UsersGlyph />
            </span>
            <span>
              <span className="block text-base font-semibold tabular-nums">
                {users.data ? formatNumber(users.data.total) : '—'}
              </span>
              <span className="block text-[10px] text-sidebar-ink-soft">目录内账户</span>
            </span>
          </div>
        }
      />

      <div className="grid items-start gap-6 px-5 pt-8 lg:px-8 xl:grid-cols-[380px_minmax(0,1fr)] xl:gap-8">
        <div className="relative min-w-0 xl:sticky xl:top-4 xl:mt-9">
          <div
            aria-hidden
            className="absolute inset-x-2 bottom-[-7px] top-2 rounded-md border border-hairline bg-surface-alt"
          />
          <Card className="basic-paper-panel relative min-w-0 rounded-md border border-hairline bg-surface shadow-none">
            <Card.Header className="block border-b border-hairline bg-surface-alt p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Card.Title className="text-sm font-semibold text-ink">账户目录</Card.Title>
                  <Card.Description className="mt-1 text-xs text-ink-soft">
                    {users.data
                      ? `第 ${users.data.page} 页，共 ${Math.max(users.data.totalPages, 1)} 页`
                      : '正在读取用户目录'}
                  </Card.Description>
                </div>
                {hasFilters ? (
                  <HeroButton
                    type="button"
                    tone="quiet"
                    onClick={clearFilters}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-ink-soft"
                  >
                    <X className="size-3.5" strokeWidth={1.8} />
                    清除筛选
                  </HeroButton>
                ) : null}
              </div>

              <form onSubmit={submitSearch} className="mt-5 space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-medium text-ink-soft">搜索用户</span>
                  <span className="flex gap-2">
                    <span className="relative min-w-0 flex-1">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 z-10 size-3.5 -translate-y-1/2 text-ink-faint"
                        strokeWidth={1.8}
                      />
                      <HeroTextInput
                        type="search"
                        aria-label="搜索用户"
                        value={searchDraft}
                        onChange={setSearchDraft}
                        placeholder="姓名、邮箱、城市或小屋名"
                        className="pl-9"
                      />
                    </span>
                    <HeroButton
                      type="submit"
                      tone="primary"
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-md px-4 text-sm"
                    >
                      搜索
                    </HeroButton>
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <HeroSelect
                    label="账户状态"
                    value={status ?? ''}
                    onChange={(nextStatus) => {
                      setStatus(nextStatus as AdminUsersQueryInput['status'] | '');
                      setPage(1);
                      setSelectedUserId(null);
                    }}
                    emptyLabel="全部状态"
                    options={[
                      { value: 'active', label: '正常' },
                      { value: 'disabled', label: '已禁用' },
                    ]}
                  />
                  <HeroSelect
                    label="邮箱认证"
                    value={emailVerified}
                    onChange={(nextVerified) => {
                      setEmailVerified(nextVerified as 'all' | 'true' | 'false');
                      setPage(1);
                      setSelectedUserId(null);
                    }}
                    options={[
                      { value: 'all', label: '全部邮箱' },
                      { value: 'true', label: '已验证' },
                      { value: 'false', label: '未验证' },
                    ]}
                  />
                </div>
              </form>
            </Card.Header>

            <Card.Content className="p-0">
              {users.isPending ? (
                <DirectoryMessage
                  icon={RefreshCw}
                  title="正在加载用户"
                  detail="正在读取账户和登录状态。"
                  animated
                />
              ) : users.isError ? (
                <DirectoryMessage
                  icon={CircleAlert}
                  title="用户目录加载失败"
                  detail="检查网络或 API 状态后重试。"
                  action={
                    <HeroButton
                      type="button"
                      tone="ghost"
                      onClick={() => void users.refetch()}
                      className="mt-3 h-8 rounded-md px-3 text-xs"
                    >
                      重新加载
                    </HeroButton>
                  }
                />
              ) : users.data.users.length === 0 ? (
                <DirectoryMessage
                  icon={Search}
                  title="没有找到匹配账户"
                  detail="尝试减少关键词，或清除状态筛选。"
                  action={
                    hasFilters ? (
                      <HeroButton
                        type="button"
                        tone="ghost"
                        onClick={clearFilters}
                        className="mt-3 h-8 rounded-md px-3 text-xs"
                      >
                        清除筛选
                      </HeroButton>
                    ) : null
                  }
                />
              ) : (
                <ListBox
                  aria-label="用户列表"
                  className="divide-y divide-hairline"
                  selectionMode="single"
                  selectedKeys={
                    effectiveSelectedUserId ? new Set([effectiveSelectedUserId]) : new Set()
                  }
                  onSelectionChange={(selection) => {
                    const userId = heroSelectionToValue(selection);
                    if (userId) setSelectedUserId(userId);
                  }}
                >
                  {users.data.users.map((user) => (
                    <UserDirectoryRow
                      key={user.id}
                      id={user.id}
                      user={user}
                      selected={user.id === effectiveSelectedUserId}
                    />
                  ))}
                </ListBox>
              )}
            </Card.Content>

            <Card.Footer className="flex items-center justify-between gap-3 border-t border-hairline p-3">
              <HeroButton
                type="button"
                tone="ghost"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-xs"
              >
                <ChevronLeft className="size-3.5" strokeWidth={1.8} />
                上一页
              </HeroButton>
              <p className="text-xs tabular-nums text-ink-soft">
                {users.data ? `${users.data.page} / ${Math.max(users.data.totalPages, 1)}` : '—'}
              </p>
              <HeroButton
                type="button"
                tone="ghost"
                disabled={!users.data || page >= users.data.totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-xs"
              >
                下一页
                <ChevronRight className="size-3.5" strokeWidth={1.8} />
              </HeroButton>
            </Card.Footer>
          </Card>
        </div>

        <div className="relative min-w-0 xl:-mt-3">
          <div
            aria-hidden
            className="absolute inset-x-3 bottom-[-11px] top-4 rounded-md border border-hairline bg-surface-alt"
          />
          <UserDetailPanel userId={effectiveSelectedUserId} />
        </div>
      </div>
    </div>
  );
}

function UsersGlyph() {
  return (
    <span className="flex -space-x-1" aria-hidden>
      <span className="size-2.5 rounded-full border border-surface-alt bg-mist" />
      <span className="size-2.5 rounded-full border border-surface-alt bg-sage" />
      <span className="size-2.5 rounded-full border border-surface-alt bg-peach" />
    </span>
  );
}

function DirectoryMessage({
  icon: Icon,
  title,
  detail,
  animated = false,
  action,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  animated?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="p-6">
      <Icon
        className={`size-4 text-ink-faint ${animated ? 'animate-spin' : ''}`}
        strokeWidth={1.8}
      />
      <p className="mt-4 text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 text-xs leading-5 text-ink-soft">{detail}</p>
      {action}
    </div>
  );
}

function UserDirectoryRow({
  id,
  user,
  selected,
}: {
  id: string;
  user: AdminUserSummary;
  selected: boolean;
}) {
  return (
    <ListBox.Item
      id={id}
      textValue={`${user.displayName || user.name} ${user.email}`}
      className={`w-full p-0 text-left outline-none transition-[background-color,transform] duration-150 data-[focused]:outline-none ${
        selected
          ? 'bg-sidebar-bg text-sidebar-ink'
          : 'bg-surface text-ink hover:bg-surface-alt data-[focused]:bg-surface-alt'
      }`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-4 py-4">
        <UserAvatar user={user} size="sm" />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p
              className={`truncate text-sm font-semibold ${selected ? 'text-sidebar-ink' : 'text-ink'}`}
            >
              {user.displayName || user.name || '未命名用户'}
            </p>
            <span
              className={`size-1.5 shrink-0 rounded-full ${
                user.status === 'active' ? 'bg-sage' : 'bg-pink'
              }`}
              aria-label={user.status === 'active' ? '账户正常' : '账户已禁用'}
            />
          </div>
          <p
            className={`mt-1 truncate text-xs ${selected ? 'text-sidebar-ink-soft' : 'text-ink-soft'}`}
          >
            {user.email}
          </p>
          <p
            className={`mt-2 truncate text-[11px] ${selected ? 'text-sidebar-ink-soft' : 'text-ink-faint'}`}
          >
            {user.activeSessionCount} 个活跃会话 · {user.counts.accounts} 个绑定 ·{' '}
            {user.counts.passkeys} 个 Passkey
          </p>
        </div>
        <div className="flex flex-col items-end justify-between gap-2">
          <span
            className={`text-[10px] font-medium ${
              selected ? 'text-sidebar-ink-soft' : user.emailVerified ? 'text-sage' : 'text-peach'
            }`}
          >
            {user.emailVerified ? '已验证' : '未验证'}
          </span>
          {selected ? (
            <ChevronRight className="size-3.5 text-sidebar-ink" strokeWidth={1.8} />
          ) : null}
        </div>
      </div>
    </ListBox.Item>
  );
}

function UserAvatar({
  user,
  size,
}: {
  user: Pick<AdminUserSummary, 'displayName' | 'name' | 'email' | 'image'>;
  size: 'sm' | 'lg';
}) {
  const displayName = user.displayName || user.name || user.email;
  const image = user.image && !user.image.startsWith('boring:') ? user.image : null;
  return (
    <Avatar
      className={`shrink-0 rounded-md bg-chip-mist font-semibold text-mist ${
        size === 'lg' ? 'size-14 text-base' : 'size-10 text-xs'
      }`}
    >
      {image ? <Avatar.Image src={image} alt={displayName} /> : null}
      <Avatar.Fallback>{avatarInitials(displayName)}</Avatar.Fallback>
    </Avatar>
  );
}

function UserDetailPanel({ userId }: { userId: string | null }) {
  if (!userId) {
    return (
      <Card className="basic-paper-panel relative z-10 min-h-[480px] rounded-md border border-hairline bg-surface shadow-none">
        <Card.Content className="grid min-h-[480px] place-items-center p-8 text-center">
          <div className="max-w-sm">
            <UserRound className="mx-auto size-6 text-ink-faint" strokeWidth={1.6} />
            <p className="mt-5 text-base font-semibold text-ink">选择一个账户开始查看</p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              账户资料、登录方式、会话和安全操作会集中显示在这里。
            </p>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return <LoadedUserDetailPanel key={userId} userId={userId} />;
}

type AccountAction = 'disable' | 'enable' | 'revoke' | null;

function LoadedUserDetailPanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const detail = useQuery(adminUserDetailQueryOptions(userId));
  const [detailTab, setDetailTab] = useState<'profile' | 'access' | 'sessions'>('profile');
  const [accountAction, setAccountAction] = useState<AccountAction>(null);
  const [disableReason, setDisableReason] = useState('');
  const invalidateUserData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
    ]);
  };
  const closeAction = () => {
    setAccountAction(null);
    setDisableReason('');
  };
  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: 'active' | 'disabled'; reason?: string }) =>
      updateAdminUserStatus(userId, { status, reason }),
    onSuccess: async () => {
      await invalidateUserData();
      closeAction();
    },
  });
  const revokeMutation = useMutation({
    mutationFn: () => revokeAdminUserSessions(userId),
    onSuccess: async () => {
      await invalidateUserData();
      closeAction();
    },
  });
  const actionPending = statusMutation.isPending || revokeMutation.isPending;
  const actionError = statusMutation.error ?? revokeMutation.error;

  if (detail.isPending) {
    return (
      <Card className="basic-paper-panel relative z-10 min-h-[480px] rounded-md border border-hairline bg-surface shadow-none">
        <Card.Content className="p-6">
          <RefreshCw className="size-4 animate-spin text-ink-faint" strokeWidth={1.8} />
          <p className="mt-4 text-sm font-medium text-ink">正在读取账户详情</p>
          <p className="mt-1 text-xs text-ink-soft">身份、登录方式和会话正在汇总。</p>
        </Card.Content>
      </Card>
    );
  }

  if (detail.isError) {
    return (
      <Card className="basic-paper-panel relative z-10 min-h-[480px] rounded-md border border-hairline bg-surface shadow-none">
        <Card.Content className="p-6">
          <CircleAlert className="size-4 text-pink" strokeWidth={1.8} />
          <p className="mt-4 text-sm font-medium text-ink">账户详情加载失败</p>
          <p className="mt-1 text-xs text-ink-soft">这个账户可能已不存在，或 API 暂时不可用。</p>
          <HeroButton
            type="button"
            tone="ghost"
            onClick={() => void detail.refetch()}
            className="mt-4 h-9 rounded-md px-3 text-xs"
          >
            重新加载
          </HeroButton>
        </Card.Content>
      </Card>
    );
  }

  return (
    <UserDetailContent
      user={detail.data}
      detailTab={detailTab}
      onDetailTabChange={setDetailTab}
      accountAction={accountAction}
      disableReason={disableReason}
      actionPending={actionPending}
      actionError={actionError}
      onActionChange={(action) => {
        statusMutation.reset();
        revokeMutation.reset();
        setAccountAction(action);
        if (action !== 'disable') setDisableReason('');
      }}
      onDisableReasonChange={setDisableReason}
      onCancelAction={closeAction}
      onConfirmAction={() => {
        if (accountAction === 'disable') {
          const reason = disableReason.trim();
          statusMutation.mutate({ status: 'disabled', reason: reason || undefined });
          return;
        }
        if (accountAction === 'enable') {
          statusMutation.mutate({ status: 'active' });
          return;
        }
        if (accountAction === 'revoke') revokeMutation.mutate();
      }}
    />
  );
}

function UserDetailContent({
  user,
  detailTab,
  onDetailTabChange,
  accountAction,
  disableReason,
  actionPending,
  actionError,
  onActionChange,
  onDisableReasonChange,
  onCancelAction,
  onConfirmAction,
}: {
  user: AdminUserDetail;
  detailTab: 'profile' | 'access' | 'sessions';
  onDetailTabChange: (tab: 'profile' | 'access' | 'sessions') => void;
  accountAction: AccountAction;
  disableReason: string;
  actionPending: boolean;
  actionError: Error | null;
  onActionChange: (action: AccountAction) => void;
  onDisableReasonChange: (reason: string) => void;
  onCancelAction: () => void;
  onConfirmAction: () => void;
}) {
  const userName = user.displayName || user.name || '未命名用户';
  return (
    <Card className="basic-paper-panel relative z-10 min-w-0 overflow-hidden rounded-md border border-hairline bg-surface shadow-none">
      <Card.Header className="block border-b border-hairline bg-surface p-0">
        <div className="basic-identity-cover relative isolate overflow-hidden bg-sidebar-bg p-5 pb-12 sm:p-6 sm:pb-14">
          <div className="basic-identity-grid" aria-hidden />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative shrink-0">
                <span
                  aria-hidden
                  className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-md border border-[color-mix(in_oklab,var(--sidebar-ink)_16%,transparent)] bg-[var(--sidebar-active)]"
                />
                <div className="relative rounded-md border border-hairline bg-surface p-1.5 shadow-raised">
                  <UserAvatar user={user} size="lg" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-[10px] font-medium tracking-[0.14em] text-sidebar-ink-soft">
                  当前账户档案
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Card.Title className="truncate text-2xl font-semibold tracking-[-0.025em] text-sidebar-ink">
                    {userName}
                  </Card.Title>
                  <AccountStatusChip status={user.status} />
                  <EmailStatusChip verified={user.emailVerified} />
                </div>
                <Card.Description className="mt-2 flex min-w-0 items-center gap-2 text-sm text-sidebar-ink-soft">
                  <AtSign className="size-3.5 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{user.email}</span>
                </Card.Description>
                <p className="mt-2 max-w-xl text-xs leading-5 text-sidebar-ink-soft">
                  注册于 {formatDateTime(user.createdAt)} · 最近会话{' '}
                  {user.lastSessionAt ? formatDateTime(user.lastSessionAt) : '暂无'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:max-w-[280px] lg:justify-end">
              <HeroButton
                type="button"
                tone="quiet"
                disabled={actionPending}
                onClick={() => onActionChange(user.status === 'active' ? 'disable' : 'enable')}
                className="basic-cover-action inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs text-sidebar-ink"
              >
                {user.status === 'active' ? (
                  <Ban className="size-3.5" strokeWidth={1.8} />
                ) : (
                  <RotateCcw className="size-3.5" strokeWidth={1.8} />
                )}
                {user.status === 'active' ? '禁用账户' : '重新启用'}
              </HeroButton>
              <HeroButton
                type="button"
                tone="quiet"
                disabled={actionPending || user.activeSessionCount === 0}
                onClick={() => onActionChange('revoke')}
                className="basic-cover-action inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs text-sidebar-ink"
              >
                <LogOut className="size-3.5" strokeWidth={1.8} />
                退出全部会话
              </HeroButton>
            </div>
          </div>
        </div>

        <div className="relative z-20 mx-4 -mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-hairline bg-hairline shadow-raised sm:mx-6">
          <IdentityStat icon={MonitorSmartphone} label="活跃会话" value={user.activeSessionCount} />
          <IdentityStat icon={Link2} label="绑定账号" value={user.counts.accounts} />
          <IdentityStat icon={KeyRound} label="Passkey" value={user.counts.passkeys} />
        </div>
      </Card.Header>

      {accountAction ? (
        <AccountActionPanel
          action={accountAction}
          userName={userName}
          activeSessionCount={user.activeSessionCount}
          disableReason={disableReason}
          pending={actionPending}
          error={actionError}
          onDisableReasonChange={onDisableReasonChange}
          onCancel={onCancelAction}
          onConfirm={onConfirmAction}
        />
      ) : null}

      <Card.Content className="p-0">
        <HeroTabs
          className="basic-dossier-tabs"
          value={detailTab}
          onChange={onDetailTabChange}
          ariaLabel="用户详情"
          items={[
            {
              value: 'profile',
              label: '账户资料',
              icon: <UserRound className="size-3.5" strokeWidth={1.8} />,
              panel: <ProfilePanel user={user} />,
            },
            {
              value: 'access',
              label: '登录方式',
              icon: <KeyRound className="size-3.5" strokeWidth={1.8} />,
              panel: <AccessPanel user={user} />,
            },
            {
              value: 'sessions',
              label: `会话 ${user.sessions.length}`,
              icon: <MonitorSmartphone className="size-3.5" strokeWidth={1.8} />,
              panel: <SessionsPanel sessions={user.sessions} />,
            },
          ]}
        />
      </Card.Content>
    </Card>
  );
}

function AccountActionPanel({
  action,
  userName,
  activeSessionCount,
  disableReason,
  pending,
  error,
  onDisableReasonChange,
  onCancel,
  onConfirm,
}: {
  action: Exclude<AccountAction, null>;
  userName: string;
  activeSessionCount: number;
  disableReason: string;
  pending: boolean;
  error: Error | null;
  onDisableReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const content = {
    disable: {
      title: `禁用 ${userName}？`,
      detail: '该账户将无法建立新会话；已有会话不会在这一步自动撤销。',
      confirm: '确认禁用账户',
      tone: 'danger' as const,
    },
    enable: {
      title: `重新启用 ${userName}？`,
      detail: '账户恢复后可以再次登录，原有身份与绑定方式保持不变。',
      confirm: '确认重新启用',
      tone: 'primary' as const,
    },
    revoke: {
      title: `退出 ${activeSessionCount} 个活跃会话？`,
      detail: '所有设备上的现有登录都会失效，用户需要重新完成身份验证。',
      confirm: '确认退出全部会话',
      tone: 'danger' as const,
    },
  }[action];
  return (
    <div className="border-b border-hairline bg-surface-alt p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] lg:items-end">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-peach" strokeWidth={1.8} />
            <p className="text-sm font-semibold text-ink">{content.title}</p>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-ink-soft">{content.detail}</p>
          {action === 'disable' ? (
            <label className="mt-4 block max-w-xl space-y-1.5">
              <span className="text-[11px] font-medium text-ink-soft">禁用原因，可选</span>
              <HeroTextInput
                value={disableReason}
                onChange={onDisableReasonChange}
                maxLength={240}
                placeholder="例如：账号异常，需要人工复核"
                disabled={pending}
              />
            </label>
          ) : null}
          {error ? (
            <div className="mt-4 flex gap-2 rounded-md border border-pink/30 bg-chip-pink p-3 text-xs text-ink">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-pink" strokeWidth={1.8} />
              <p>操作没有完成：{mutationErrorMessage(error)}</p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <HeroButton
            type="button"
            tone="ghost"
            disabled={pending}
            onClick={onCancel}
            className="h-9 rounded-md px-3 text-xs"
          >
            保持当前状态
          </HeroButton>
          <HeroButton
            type="button"
            tone={content.tone}
            disabled={pending}
            onClick={onConfirm}
            className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs"
          >
            {pending ? <RefreshCw className="size-3.5 animate-spin" strokeWidth={1.8} /> : null}
            {pending ? '正在处理' : content.confirm}
          </HeroButton>
        </div>
      </div>
    </div>
  );
}

function ProfilePanel({ user }: { user: AdminUserDetail }) {
  return (
    <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:p-8">
      <div className="min-w-0">
        <DetailGroup title="身份资料" description="用户主动填写的生活信息">
          <InfoRow
            icon={UserRound}
            label="显示名称"
            value={user.displayName || user.name || '未填写'}
          />
          <InfoRow icon={AtSign} label="邮箱" value={user.email} />
          <InfoRow icon={MapPin} label="城市" value={user.city ?? '未填写'} />
          <InfoRow icon={Home} label="小屋名" value={user.homeName ?? '未填写'} />
          <InfoRow icon={Coins} label="金币" value={formatNumber(user.coins)} />
        </DetailGroup>
      </div>

      <div className="min-w-0 lg:mt-9 lg:border-l lg:border-hairline lg:pl-10">
        <DetailGroup title="账户生命周期" description="认证、活跃与状态变化">
          <InfoRow
            icon={MailCheck}
            label="邮箱状态"
            value={user.emailVerified ? '已验证' : '未验证'}
          />
          <InfoRow icon={CalendarDays} label="注册时间" value={formatDateTime(user.createdAt)} />
          <InfoRow icon={Clock3} label="更新时间" value={formatDateTime(user.updatedAt)} />
          <InfoRow
            icon={MonitorSmartphone}
            label="最近会话"
            value={user.lastSessionAt ? formatDateTime(user.lastSessionAt) : '暂无'}
          />
          {user.disabledAt ? (
            <InfoRow icon={Ban} label="禁用时间" value={formatDateTime(user.disabledAt)} />
          ) : null}
          {user.disabledReason ? (
            <InfoRow icon={CircleAlert} label="禁用原因" value={user.disabledReason} multiline />
          ) : null}
        </DetailGroup>
      </div>
    </div>
  );
}

function AccessPanel({ user }: { user: AdminUserDetail }) {
  return (
    <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-2">
      <DetailGroup title="绑定账号" description={`${user.accounts.length} 个第三方或密码身份`}>
        {user.accounts.length === 0 ? (
          <EmptyDetail text="这个账户还没有绑定登录提供方。" />
        ) : (
          <div className="divide-y divide-hairline">
            {user.accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-start justify-between gap-4 py-3 first:pt-0"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-chip-mist text-mist">
                    <Link2 className="size-3.5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {providerLabel(account.providerId)}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      绑定于 {formatDateTime(account.createdAt)}
                    </p>
                  </div>
                </div>
                <Chip className="w-fit bg-surface-alt text-ink-soft">
                  <span className="text-[10px] font-medium">{account.providerId}</span>
                </Chip>
              </div>
            ))}
          </div>
        )}
      </DetailGroup>

      <DetailGroup title="Passkey" description={`${user.passkeys.length} 个无密码登录凭证`}>
        {user.passkeys.length === 0 ? (
          <EmptyDetail text="这个账户尚未创建 Passkey。" />
        ) : (
          <div className="divide-y divide-hairline">
            {user.passkeys.map((passkey) => (
              <div key={passkey.id} className="flex items-start gap-3 py-3 first:pt-0">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-chip-sage text-sage">
                  <KeyRound className="size-3.5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {passkey.name || passkey.deviceType || '未命名 Passkey'}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {passkey.deviceType} · {passkey.backedUp ? '已备份' : '未备份'}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    创建于 {formatDateTime(passkey.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailGroup>
    </div>
  );
}

function SessionsPanel({ sessions }: { sessions: AdminUserDetail['sessions'] }) {
  const [observedAt] = useState(() => Date.now());

  if (sessions.length === 0) {
    return (
      <div className="p-5 sm:p-6">
        <EmptyDetail text="这个账户当前没有可查看的会话。" />
      </div>
    );
  }
  return (
    <div className="divide-y divide-hairline">
      {sessions.map((session) => {
        const active = new Date(session.expiresAt).getTime() > observedAt;
        return (
          <div
            key={session.id}
            className="grid gap-3 p-4 sm:grid-cols-[minmax(150px,0.7fr)_minmax(0,1.3fr)_130px] sm:items-center sm:px-6"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-ink">
                  {session.ipAddress ?? '未知 IP'}
                </p>
                <span
                  className={`size-1.5 shrink-0 rounded-full ${active ? 'bg-sage' : 'bg-ink-faint'}`}
                />
              </div>
              <p className="mt-1 text-[11px] text-ink-soft">
                创建于 {formatDateTime(session.createdAt)}
              </p>
            </div>
            <p className="line-clamp-2 text-xs leading-5 text-ink-soft">
              {session.userAgent ?? '未记录设备信息'}
            </p>
            <div className="sm:text-right">
              <Chip
                className={
                  active ? 'w-fit bg-chip-sage text-sage' : 'w-fit bg-surface-alt text-ink-soft'
                }
              >
                <span className="text-[10px] font-medium">{active ? '有效会话' : '已过期'}</span>
              </Chip>
              <p className="mt-1 text-[10px] text-ink-faint">
                至 {formatDateTime(session.expiresAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IdentityStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 bg-surface px-4 py-3.5 sm:px-5">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-alt text-lp-brand">
        <Icon className="size-3.5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-none tabular-nums text-ink">
          {formatNumber(value)}
        </p>
        <p className="text-[10px] text-ink-soft">{label}</p>
      </div>
    </div>
  );
}

function DetailGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-xs text-ink-soft">{description}</p>
      <div className="mt-4 divide-y divide-hairline">{children}</div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  multiline = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="grid grid-cols-[18px_110px_minmax(0,1fr)] gap-2 py-3 first:pt-0">
      <Icon className="mt-0.5 size-3.5 text-ink-faint" strokeWidth={1.8} />
      <span className="text-xs text-ink-soft">{label}</span>
      <span
        className={`min-w-0 text-xs text-ink ${multiline ? 'leading-5' : 'truncate text-right'}`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyDetail({ text }: { text: string }) {
  return <p className="py-3 text-xs leading-5 text-ink-soft">{text}</p>;
}

function AccountStatusChip({ status }: { status: AdminUserDetail['status'] }) {
  return (
    <Chip
      className={
        status === 'active' ? 'w-fit bg-chip-sage text-sage' : 'w-fit bg-chip-pink text-pink'
      }
    >
      <span className="flex items-center gap-1.5 text-[10px] font-semibold">
        <span className="size-1.5 rounded-full bg-current" />
        {status === 'active' ? '账户正常' : '账户已禁用'}
      </span>
    </Chip>
  );
}

function EmailStatusChip({ verified }: { verified: boolean }) {
  return (
    <Chip
      className={verified ? 'w-fit bg-surface-alt text-ink-soft' : 'w-fit bg-chip-peach text-peach'}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-medium">
        {verified ? (
          <CheckCircle2 className="size-3" strokeWidth={1.8} />
        ) : (
          <CircleAlert className="size-3" strokeWidth={1.8} />
        )}
        {verified ? '邮箱已验证' : '邮箱未验证'}
      </span>
    </Chip>
  );
}

function avatarInitials(value: string): string {
  const normalized = value.trim();
  if (!normalized) return '旅';
  if (/^[\u3400-\u9fff]/u.test(normalized)) return normalized.slice(0, 2);
  const parts = normalized.split(/[\s@._-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function providerLabel(providerId: string): string {
  const labels: Record<string, string> = {
    credential: '邮箱与密码',
    email: '邮箱',
    github: 'GitHub',
  };
  return labels[providerId] ?? providerId;
}

function mutationErrorMessage(error: Error): string {
  return error.message || '服务暂时无法完成这个操作，请稍后重试。';
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
