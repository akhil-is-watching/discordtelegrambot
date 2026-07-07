// ---- Auth ----

export interface AuthUser {
  id: string;
  email: string;
  orgId: string;
  onboardingCompleted?: boolean;
}

// ---- Bots ----

export type BotType = "moderator" | "secretary";

export interface PublishedBotSnapshot {
  version: number;
  publishedAt: string;
  name: string;
  description?: string;
  selectedModel: string;
  botType: BotType;
  systemPrompt?: string;
  avatarUrl?: string;
  avatarKey?: string;
  datasetIds: string[];
}

export interface BotResponseDto {
  _id: string;
  orgId: string;
  name: string;
  description?: string;
  selectedModel: string;
  botType: BotType;
  systemPrompt?: string;
  avatarUrl?: string;
  avatarKey?: string;
  published?: PublishedBotSnapshot;
  hasUnpublishedChanges: boolean;
  publishedVersion?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedBotsDto {
  data: BotResponseDto[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface CreateBotInput {
  name: string;
  selectedModel: string;
  botType: BotType;
  description?: string;
  systemPrompt?: string;
}

export type UpdateBotInput = Partial<CreateBotInput>;

// ---- Integrations ----

export type Platform = "telegram" | "discord";
export type WebhookStatus = "pending" | "active" | "failed";

export interface HandoffConfigInput {
  enabled?: boolean;
  categories?: ("partnerships" | "investments" | "support")[];
  notifyInstructions?: string;
  handoffMessage?: string;
}

export interface CreateIntegrationInput {
  platform: Platform;
  botToken: string;
  discordPublicKey?: string;
  discordGuildId?: string;
  discordCommand?: string;
  handoffConfig?: HandoffConfigInput;
}

export interface SafeIntegration {
  _id: string;
  botId: string;
  platform: Platform;
  webhookId: string;
  webhookUrl: string;
  webhookStatus: WebhookStatus;
  webhookError?: string;
  webhookRegisteredAt?: string;
  platformBotId?: string;
  platformUsername?: string;
  botType?: BotType;
  discordCommand?: string;
  handoffConfig?: HandoffConfigInput;
  botToken: string; // masked preview, e.g. "••••1234"
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationResponseDto extends SafeIntegration {
  webhookSecret: string; // one-time, only present on create
  discordPublicKey?: string;
  discordInviteUrl?: string;
  discordApplicationId?: string;
}

// ---- LLM models ----

export interface LlmModelOptionDto {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
}

// ---- Moderator: config ----

export type BotTone = "chill" | "professional" | "degen" | "minimal";

export interface TeamMember {
  username: string;
  role?: string;
  topics?: string;
  ignoreForReplies?: boolean;
  /** Free-text routing notes for handoffs to this specific person. */
  handoffInstructions?: string;
}

export interface CustomModerationRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface ModeratorConfig {
  botName: string;
  communityName: string;
  tone: BotTone;
  /** Flattened for whichever platform was requested (see `getModeratorHome`'s `platform` param) —
   * read-only here. Edit via `handoff`/`updatePlatformHandoff`, not `updateConfig`. */
  teamMembers: TeamMember[];
  handoffInstructions: string;
  escalationUsername: string;
  engagementMode: boolean;
  maxWarnings: number;
  banUsersEnabled: boolean;
  enabledModerationRules: string[];
  customModerationRules: CustomModerationRule[];
  allowedLinks: string;
}

export type UpdateModeratorConfigInput = Partial<
  Omit<ModeratorConfig, "botName" | "teamMembers" | "handoffInstructions" | "escalationUsername">
>;

/** Team roster + handoff routing text + fallback DM contact for one platform —
 * independent per channel, since Telegram usernames and Discord user IDs are
 * different formats. */
export interface PlatformHandoffConfig {
  teamMembers: TeamMember[];
  handoffInstructions: string;
  escalationUsername: string;
}

export type UpdatePlatformHandoffInput = Partial<PlatformHandoffConfig>;

export interface ModerationRuleDef {
  id: string;
  label: string;
  promptLine: string;
}

export interface CompanyDocState {
  content: string;
  updatedAt: string | null;
  maxLength: number;
}

export interface ModeratorHomeResponse {
  botName: string;
  config: ModeratorConfig;
  handoff: { telegram: PlatformHandoffConfig; discord: PlatformHandoffConfig };
  rulesCatalog: ModerationRuleDef[];
  companyDoc: { length: number; maxLength: number; updatedAt: string | null };
  promptStudio: PromptStudioState;
}

// ---- Moderator: prompt studio ----

export interface PromptStudioState {
  pointers: string[];
  useCustomPrompt: boolean;
  hasDraft: boolean;
  hasSavedCustom: boolean;
  savedAt: string | null;
  draftUpdatedAt: string | null;
  lockedSettings: string[];
  studioModel: string;
  llmEnabled: boolean;
  usingDefault: boolean;
}

export interface PromptGenerateResult {
  draftPrompt: string;
  pointers: string[];
  summary: string;
  blockedNote?: string;
}

// ---- Moderator: prompt test sandbox ----

export interface TestUser {
  id: string;
  displayName: string;
  username?: string;
}

export type AgentAction = "reply" | "react" | "skip" | "handoff" | "moderate";

export interface AgentDecision {
  action: AgentAction;
  message?: string;
  reaction?: string;
  handoffSummary?: string;
  handoffTo?: string;
  notifyTeam?: boolean;
  moderationReason?: string;
  moderationSeverity?: "warn" | "ban";
}

export interface TestMessageMeta {
  action?: string;
  decision?: AgentDecision;
  textModeration?: { flagged: boolean; reason?: string; severity?: string };
  sideEffects?: string[];
}

export interface TestMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  at: string;
  meta?: TestMessageMeta;
}

export interface PendingTestEscalation {
  lastQuestion: string;
  userNotified: boolean;
}

export interface PromptTestSettingsSummary {
  botName: string;
  communityName: string;
  tone: BotTone;
  engagementMode: boolean;
  teamMembers: number;
  escalationUsername: string;
  llmEnabled: boolean;
}

export interface PromptTestData {
  users: TestUser[];
  threads: Record<string, TestMessage[]>;
  pendingEscalations: Record<string, PendingTestEscalation>;
  testWarnings: Record<string, number>;
}

export interface PromptTestState extends PromptTestData {
  settings: PromptTestSettingsSummary;
}

export interface SendMessageResult {
  userMessage: TestMessage;
  botMessages: TestMessage[];
  thread: TestMessage[];
}
